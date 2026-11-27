#!/usr/bin/env python3
"""
BallR Vision — Automated Football Match Video Analyzer
Engines:
  1. pitch_cv (Default, Fast CPU): Pitch-aware HSV grass segmentation + morphological
     player blob detection + 2-team Lab/RGB K-Means jersey clustering + motion-validated
     ball tracking. Works reliably on wide-angle football broadcasts (720p/1080p) on CPU.
  2. yolox: OpenCV DNN YOLOX-Nano (Apache 2.0) + IoU Tracker.
  3. rfdetr: RF-DETR (Apache 2.0) + Supervision ByteTrack (MIT) for GPU / Google Colab.

Outputs a BallR-compatible JSON file (`ballr_analysis.json`) that can be imported
directly into BallR's "Analisis Taktis" panel.
"""

import argparse
import json
import math
import os
import subprocess
import sys
import time
from datetime import datetime, timezone

import cv2
import numpy as np


DEFAULT_YOLOX_MODEL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "yolox_nano.onnx")


def _extract_ytdlp_error(stderr: str, stdout: str = "") -> str:
    """Extracts the most informative ERROR / warning lines from yt-dlp output."""
    combined = "\n".join(part for part in (stderr, stdout) if part).strip()
    if not combined:
        return "yt-dlp keluar tanpa pesan detail."
    lines = [line.strip() for line in combined.splitlines() if line.strip()]
    error_lines = [line for line in lines if "ERROR:" in line or "WARNING:" in line]
    selected = error_lines[-4:] if error_lines else lines[-4:]
    return "\n".join(selected)


def emit_progress(stage: str, pct: int, detail: str, processed: int | None = None, total: int | None = None) -> None:
    """Emits a structured progress line to stdout for live UI polling."""
    payload = {"stage": stage, "pct": max(0, min(100, int(pct))), "detail": detail}
    if processed is not None:
        payload["processed"] = int(processed)
    if total is not None:
        payload["total"] = int(total)
    print(f"[ballr-progress] {json.dumps(payload, ensure_ascii=False)}", flush=True)


def download_youtube_clip(
    url: str,
    output_path: str,
    start_sec: int,
    end_sec: int,
    cookies_from_browser: str | None = None,
) -> str:
    """Downloads a bounded clip from a YouTube / YouTube Live URL using yt-dlp with fallback strategies."""
    section = f"*{start_sec}-{end_sec}"
    duration_sec = max(1, int(end_sec) - int(start_sec))
    is_long_segment = duration_sec > 180
    cookie_browser = (cookies_from_browser or os.environ.get("BALLR_YTDLP_COOKIES_FROM_BROWSER") or "").strip()
    cookie_args = ["--cookies-from-browser", cookie_browser] if cookie_browser else []

    def _build_cmd(extra_args: list[str], fmt: str, use_cookies: bool) -> list[str]:
        cmd = [
            "yt-dlp",
            *extra_args,
            "-f",
            fmt,
            "--download-sections",
            section,
            "--no-playlist",
        ]
        # Untuk segmen panjang (>3 menit, mis. babak penuh 45 menit), hindari re-encode ulang agar unduhan stream-copy jauh lebih cepat
        if not is_long_segment:
            cmd.append("--force-keyframes-at-cuts")
        if use_cookies and cookie_args:
            cmd.extend(cookie_args)
        cmd.extend(["-o", output_path, url])
        return cmd

    fmt_prefer = (
        "best[height<=480][ext=mp4]/best[height<=480]/bestvideo[height<=480]+bestaudio/best[height<=720]/best"
        if is_long_segment
        else (
            "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/"
            "bestvideo[height<=720]+bestaudio/"
            "best[height<=720][ext=mp4]/best[height<=720]/best"
        )
    )
    attempts: list[tuple[str, list[str]]] = [
        (
            "player_client android (stream cepat)" if is_long_segment else "player_client android (<=720p)",
            _build_cmd(
                ["--extractor-args", "youtube:player_client=android"],
                fmt_prefer,
                use_cookies=bool(cookie_args),
            ),
        ),
    ]
    if cookie_args:
        # Windows Chrome/Edge/Brave App-Bound Encryption dapat memicu DPAPI error; fallback tanpa cookies
        attempts.append(
            (
                "player_client android tanpa cookies",
                _build_cmd(
                    ["--extractor-args", "youtube:player_client=android"],
                    fmt_prefer,
                    use_cookies=False,
                ),
            )
        )
    attempts.append(
        (
            "standar tanpa cookies",
            _build_cmd(
                [],
                fmt_prefer,
                use_cookies=False,
            ),
        )
    )

    last_error = ""
    for idx, (label, cmd) in enumerate(attempts, start=1):
        emit_progress(
            "download",
            8 if idx == 1 else 12,
            f"Mengunduh segmen YouTube ({duration_sec // 60}m {duration_sec % 60:02d}d)...",
        )
        print(f"[ballr-vision] Mengunduh potongan video ({start_sec}s - {end_sec}s) via {label}...", flush=True)
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True)
        except FileNotFoundError:
            print("[ballr-vision] ERROR: Perintah 'yt-dlp' tidak ditemukan di PATH.", file=sys.stderr)
            sys.exit(1)

        if proc.returncode == 0 and os.path.exists(output_path):
            emit_progress("download", 30, "Video selesai diunduh, memulai deteksi lapangan & pemain...")
            return output_path

        last_error = _extract_ytdlp_error(proc.stderr or "", proc.stdout or "")
        print(
            f"[ballr-vision] Percobaan {idx} ({label}) gagal (exit {proc.returncode}): {last_error}",
            file=sys.stderr,
        )
        # Clean up partial output before next fallback attempt
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except OSError:
                pass

    print(f"[ballr-vision] Unduh YouTube gagal setelah {len(attempts)} percobaan.\n{last_error}", file=sys.stderr)
    sys.exit(1)


def extract_audio_energy_envelope(video_path: str) -> tuple[dict[int, float], float]:
    """Extracts 1-second RMS audio energy envelope via ffmpeg + NumPy for goal crowd/commentator spike detection."""
    try:
        proc = subprocess.run(
            [
                "ffmpeg",
                "-v",
                "error",
                "-i",
                video_path,
                "-vn",
                "-ac",
                "1",
                "-ar",
                "8000",
                "-f",
                "s16le",
                "-",
            ],
            capture_output=True,
            timeout=45,
        )
        if proc.returncode != 0 or not proc.stdout:
            return {}, 0.0
        samples = np.frombuffer(proc.stdout, dtype=np.int16).astype(np.float32)
        if samples.size < 8000:
            return {}, 0.0
        n_secs = samples.size // 8000
        trimmed = samples[: n_secs * 8000].reshape(n_secs, 8000)
        rms = np.sqrt(np.mean(trimmed * trimmed, axis=1))
        median_rms = float(np.median(rms)) if rms.size > 0 else 0.0
        p85_rms = float(np.percentile(rms, 85)) if rms.size > 0 else 0.0
        spike_thresh = max(median_rms * 1.65, p85_rms * 1.15, 350.0)
        envelope = {sec: float(rms[sec]) for sec in range(n_secs)}
        return envelope, spike_thresh
    except Exception:
        return {}, 0.0


def extract_scoreboard_fingerprint(frame: np.ndarray) -> np.ndarray | None:
    """Extracts a lightweight 48x16 grayscale fingerprint of the top-left broadcast scoreboard strip."""
    h, w = frame.shape[:2]
    if h < 120 or w < 200:
        return None
    roi = frame[0 : max(16, int(h * 0.13)), 0 : max(48, int(w * 0.45))]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    small = cv2.resize(gray, (48, 16), interpolation=cv2.INTER_AREA)
    return small.astype(np.float32)


def extract_jersey_color(frame: np.ndarray, box: np.ndarray) -> np.ndarray | None:
    """Extracts representative RGB color of a player's jersey (ignoring green pitch turf)."""
    x1, y1, x2, y2 = [int(v) for v in box]
    h = max(1, y2 - y1)
    w = max(1, x2 - x1)
    top = max(0, y1 + int(h * 0.14))
    bottom = min(frame.shape[0], y1 + int(h * 0.56))
    left = max(0, x1 + int(w * 0.18))
    right = min(frame.shape[1], x2 - int(w * 0.18))
    crop = frame[top:bottom, left:right]
    if crop.size == 0:
        return None

    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    grass_mask = (hsv[:, :, 0] >= 30) & (hsv[:, :, 0] <= 88) & (hsv[:, :, 1] >= 40) & (hsv[:, :, 2] >= 35)
    non_grass = crop[~grass_mask]
    pixels = non_grass if len(non_grass) >= 6 else crop.reshape(-1, 3)
    rgb_pixels = pixels[:, ::-1].astype(np.float32)
    return np.median(rgb_pixels, axis=0)


def fit_kmeans_2(samples: np.ndarray, max_iter: int = 35) -> np.ndarray | None:
    """Deterministic pure-NumPy 2-cluster K-Means for team jersey separation."""
    if len(samples) < 10:
        return None
    pts = np.asarray(samples, dtype=np.float32)
    norms = np.linalg.norm(pts - pts.mean(axis=0), axis=1)
    c0 = pts[int(np.argmax(norms))].copy()
    dists_to_c0 = np.linalg.norm(pts - c0, axis=1)
    c1 = pts[int(np.argmax(dists_to_c0))].copy()
    centroids = np.stack([c0, c1], axis=0)

    for _ in range(max_iter):
        d0 = np.linalg.norm(pts - centroids[0], axis=1)
        d1 = np.linalg.norm(pts - centroids[1], axis=1)
        labels = (d1 < d0).astype(np.int32)
        new_centroids = centroids.copy()
        for k in (0, 1):
            mask = labels == k
            if np.any(mask):
                new_centroids[k] = pts[mask].mean(axis=0)
        if np.allclose(new_centroids, centroids, atol=1e-3):
            break
        centroids = new_centroids

    lum = centroids[:, 0] * 0.299 + centroids[:, 1] * 0.587 + centroids[:, 2] * 0.114
    order = np.argsort(lum)
    return centroids[order]


def predict_cluster(centroids: np.ndarray | None, color: np.ndarray | None) -> int:
    if centroids is None or color is None:
        return 0
    d0 = float(np.linalg.norm(color - centroids[0]))
    d1 = float(np.linalg.norm(color - centroids[1]))
    return 0 if d0 <= d1 else 1


def map_pixel_to_pitch(
    px: float,
    py: float,
    pitch_bbox: tuple[int, int, int, int],
    pitch_l: float,
    pitch_w: float,
):
    """Maps pixel coordinates relative to detected pitch bounding box into pitch meters."""
    bx1, by1, bx2, by2 = pitch_bbox
    pw = max(1.0, float(bx2 - bx1))
    ph = max(1.0, float(by2 - by1))
    nx = (px - bx1) / pw
    ny = (py - by1) / ph
    x_m = round(max(0.0, min(pitch_l, nx * pitch_l)), 1)
    y_m = round(max(0.0, min(pitch_w, ny * pitch_w)), 1)
    return x_m, y_m


class SimpleIoUTracker:
    """Lightweight IoU + centroid tracker for CPU mode without extra dependencies."""

    def __init__(self, max_lost: int = 8, iou_thresh: float = 0.15, max_dist_px: float = 65.0):
        self.next_id = 1
        self.tracks: dict[int, dict] = {}
        self.max_lost = max_lost
        self.iou_thresh = iou_thresh
        self.max_dist_px = max_dist_px

    @staticmethod
    def _iou(a: np.ndarray, b: np.ndarray) -> float:
        x1 = max(a[0], b[0])
        y1 = max(a[1], b[1])
        x2 = min(a[2], b[2])
        y2 = min(a[3], b[3])
        inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
        if inter <= 0.0:
            return 0.0
        area_a = max(1.0, (a[2] - a[0]) * (a[3] - a[1]))
        area_b = max(1.0, (b[2] - b[0]) * (b[3] - b[1]))
        return inter / (area_a + area_b - inter)

    def update(self, boxes: np.ndarray) -> list[tuple[int, np.ndarray]]:
        if len(boxes) == 0:
            for tid in list(self.tracks.keys()):
                self.tracks[tid]["lost"] += 1
                if self.tracks[tid]["lost"] > self.max_lost:
                    del self.tracks[tid]
            return []

        assigned_tracks = set()
        results: list[tuple[int, np.ndarray]] = []
        track_ids = list(self.tracks.keys())

        for box in boxes:
            best_tid = None
            best_score = -1.0
            cx = (box[0] + box[2]) * 0.5
            cy = (box[1] + box[3]) * 0.5

            for tid in track_ids:
                if tid in assigned_tracks:
                    continue
                tbox = self.tracks[tid]["box"]
                iou = self._iou(box, tbox)
                tcx = (tbox[0] + tbox[2]) * 0.5
                tcy = (tbox[1] + tbox[3]) * 0.5
                dist = math.hypot(cx - tcx, cy - tcy)
                if iou >= self.iou_thresh or dist <= self.max_dist_px:
                    score = iou + max(0.0, 1.0 - dist / max(1.0, self.max_dist_px)) * 0.5
                    if score > best_score:
                        best_score = score
                        best_tid = tid

            if best_tid is None:
                best_tid = self.next_id
                self.next_id += 1

            assigned_tracks.add(best_tid)
            self.tracks[best_tid] = {"box": box.copy(), "lost": 0}
            results.append((best_tid, box))

        for tid in list(self.tracks.keys()):
            if tid not in assigned_tracks:
                self.tracks[tid]["lost"] += 1
                if self.tracks[tid]["lost"] > self.max_lost:
                    del self.tracks[tid]

        return results


class PitchAwareCVDetector:
    """
    Fast CPU detector tailored for wide-angle football broadcasts.
    1. Segments green pitch turf via HSV + convex hull (eliminates crowd/scoreboards).
    2. Extracts non-grass player blobs inside the pitch with human geometry filtering.
    3. Tracks the ball using small bright/high-contrast moving blobs inside the pitch.
    """

    def __init__(self):
        self.prev_gray: np.ndarray | None = None
        self.last_ball: tuple[float, float] | None = None
        self.kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))
        self.kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        self.kernel_player = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 5))

    def _detect_pitch_mask(self, hsv: np.ndarray) -> tuple[np.ndarray, tuple[int, int, int, int]]:
        h, w = hsv.shape[:2]
        # Broad football turf green range (supports sunny/cloudy/yellowish grass)
        grass = cv2.inRange(hsv, (26, 32, 35), (90, 255, 255))
        # Ignore top 12% broadcast scoreboard/sky banner strip
        grass[: int(h * 0.12), :] = 0

        closed = cv2.morphologyEx(grass, cv2.MORPH_CLOSE, self.kernel_close)
        opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, self.kernel_open)

        contours, _ = cv2.findContours(opened, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        pitch_mask = np.zeros((h, w), dtype=np.uint8)
        if not contours:
            return pitch_mask, (0, int(h * 0.15), w, h)

        largest = max(contours, key=cv2.contourArea)
        if cv2.contourArea(largest) < (h * w * 0.08):
            return pitch_mask, (0, int(h * 0.15), w, h)

        hull = cv2.convexHull(largest)
        cv2.drawContours(pitch_mask, [hull], -1, 255, thickness=-1)
        # Slightly erode to avoid sideline ad-boards & photographers
        erode_k = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
        pitch_mask = cv2.erode(pitch_mask, erode_k, iterations=1)
        x, y, bw, bh = cv2.boundingRect(hull)
        return pitch_mask, (x, y, x + bw, y + bh)

    def detect(self, frame: np.ndarray):
        h, w = frame.shape[:2]
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        pitch_mask, pitch_bbox = self._detect_pitch_mask(hsv)
        if np.count_nonzero(pitch_mask) == 0:
            self.prev_gray = gray
            return np.empty((0, 4), dtype=np.float32), None, pitch_bbox

        # Non-grass pixels inside the pitch (players, referees, ball, white lines)
        grass_strict = cv2.inRange(hsv, (28, 36, 35), (88, 255, 255))
        non_grass = cv2.bitwise_and(cv2.bitwise_not(grass_strict), pitch_mask)

        # Suppress thin white pitch lines (high brightness, low saturation) when finding players
        white_lines = cv2.inRange(hsv, (0, 0, 175), (180, 48, 255))
        # Remove elongated line segments using horizontal/vertical morphological openings
        h_line = cv2.morphologyEx(white_lines, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1)))
        v_line = cv2.morphologyEx(white_lines, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (1, 25)))
        line_mask = cv2.bitwise_or(h_line, v_line)

        player_fg = cv2.bitwise_and(non_grass, cv2.bitwise_not(line_mask))
        player_fg = cv2.morphologyEx(player_fg, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
        player_fg = cv2.morphologyEx(player_fg, cv2.MORPH_CLOSE, self.kernel_player)

        num_labels, _, stats, _ = cv2.connectedComponentsWithStats(player_fg, connectivity=8)
        scale = w / 1280.0
        min_area = max(30, int(45 * scale * scale))
        max_area = int(4200 * scale * scale)
        min_h = max(10, int(13 * scale))
        max_h = int(115 * scale)
        min_w = max(5, int(6 * scale))
        max_w = int(68 * scale)

        player_boxes = []
        for idx in range(1, num_labels):
            x, y, bw, bh, area = stats[idx]
            if area < min_area or area > max_area:
                continue
            if bh < min_h or bh > max_h or bw < min_w or bw > max_w:
                continue
            aspect = bh / max(1.0, float(bw))
            if aspect < 0.85 or aspect > 4.2:
                continue
            player_boxes.append([float(x), float(y), float(x + bw), float(y + bh)])

        # Ball detection: small compact bright/high-contrast moving blob inside pitch
        ball_pos = None
        if self.prev_gray is not None:
            diff = cv2.absdiff(gray, self.prev_gray)
            _, motion = cv2.threshold(diff, 14, 255, cv2.THRESH_BINARY)
            motion_in_pitch = cv2.bitwise_and(motion, pitch_mask)
            bright_in_pitch = cv2.bitwise_and(cv2.inRange(hsv, (0, 0, 145), (180, 125, 255)), pitch_mask)

            min_ball_area = max(3, int(6 * scale * scale))
            max_ball_area = max(45, int(180 * scale * scale))
            min_ball_dim = max(2, int(3 * scale))
            max_ball_dim = max(10, int(20 * scale))

            def _find_best_ball(mask: np.ndarray) -> tuple[float, float] | None:
                cand = cv2.bitwise_and(mask, cv2.bitwise_not(line_mask))
                if scale >= 0.75:
                    cand = cv2.morphologyEx(
                        cand, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
                    )
                b_labels, _, b_stats, b_centroids = cv2.connectedComponentsWithStats(cand, connectivity=8)
                best_score = -1.0
                chosen = None
                for idx in range(1, b_labels):
                    bx, by, bw, bh, area = b_stats[idx]
                    if area < min_ball_area or area > max_ball_area:
                        continue
                    if bw < min_ball_dim or bh < min_ball_dim or bw > max_ball_dim or bh > max_ball_dim:
                        continue
                    ratio = max(bw, bh) / max(1.0, min(bw, bh))
                    if ratio > 2.1:
                        continue
                    cx, cy = float(b_centroids[idx][0]), float(b_centroids[idx][1])
                    score = 1.0 / (ratio + 0.1)
                    if self.last_ball is not None:
                        d_prev = math.hypot(cx - self.last_ball[0], cy - self.last_ball[1])
                        if d_prev < 160 * scale:
                            score += 2.0 * (1.0 - d_prev / (160 * scale))
                    if player_boxes:
                        d_player = min(
                            math.hypot(cx - (pb[0] + pb[2]) * 0.5, cy - pb[3]) for pb in player_boxes
                        )
                        if d_player < 110 * scale:
                            score += 1.5 * (1.0 - d_player / (110 * scale))
                    if score > best_score:
                        best_score = score
                        chosen = (cx, cy)
                return chosen

            ball_pos = _find_best_ball(cv2.bitwise_and(motion_in_pitch, bright_in_pitch))
            if ball_pos is None:
                # Fallback untuk bola berwarna/redup: blob non-rumput kecil yang bergerak di dalam lapangan
                ball_pos = _find_best_ball(cv2.bitwise_and(motion_in_pitch, non_grass))

        if ball_pos is not None:
            self.last_ball = ball_pos
        self.prev_gray = gray

        boxes_arr = np.array(player_boxes, dtype=np.float32) if player_boxes else np.empty((0, 4), dtype=np.float32)
        return boxes_arr, ball_pos, pitch_bbox


class OpenCVYoloxDetector:
    """Optional YOLOX-Nano detector using OpenCV DNN."""

    def __init__(
        self,
        model_path: str,
        input_size: int = 640,
        person_conf: float = 0.25,
        ball_conf: float = 0.15,
        nms_thresh: float = 0.45,
    ):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model YOLOX ONNX tidak ditemukan: {model_path}")
        self.net = cv2.dnn.readNetFromONNX(model_path)
        self.net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
        self.net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
        self.input_size = input_size
        self.person_conf = person_conf
        self.ball_conf = ball_conf
        self.nms_thresh = nms_thresh
        self.grids, self.expanded_strides = self._build_grids(input_size)

    @staticmethod
    def _build_grids(input_size: int, strides=(8, 16, 32)):
        grids = []
        expanded_strides = []
        for stride in strides:
            hsize = input_size // stride
            wsize = input_size // stride
            xv, yv = np.meshgrid(np.arange(wsize), np.arange(hsize))
            grid = np.stack((xv, yv), axis=2).reshape(1, -1, 2)
            grids.append(grid)
            expanded_strides.append(np.full((1, grid.shape[1], 1), stride, dtype=np.float32))
        return np.concatenate(grids, axis=1)[0].astype(np.float32), np.concatenate(expanded_strides, axis=1)[0]

    def detect(self, frame: np.ndarray):
        h, w = frame.shape[:2]
        ratio = min(self.input_size / h, self.input_size / w)
        new_w, new_h = int(w * ratio), int(h * ratio)
        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        padded = np.full((self.input_size, self.input_size, 3), 114, dtype=np.uint8)
        padded[:new_h, :new_w] = resized

        blob = cv2.dnn.blobFromImage(padded, scalefactor=1.0, size=(self.input_size, self.input_size), swapRB=False, crop=False)
        self.net.setInput(blob)
        out = self.net.forward()[0].copy()

        if out.shape[0] == self.grids.shape[0] and float(np.max(np.abs(out[:, :2]))) < 20.0:
            out[:, :2] = (out[:, :2] + self.grids) * self.expanded_strides
            out[:, 2:4] = np.exp(np.clip(out[:, 2:4], -10.0, 10.0)) * self.expanded_strides

        obj_conf = out[:, 4]
        cls_scores = out[:, 5:]
        cls_ids = np.argmax(cls_scores, axis=1)
        cls_conf = cls_scores[np.arange(len(cls_ids)), cls_ids]
        scores = obj_conf * cls_conf

        keep_person = (cls_ids == 0) & (scores >= self.person_conf)
        keep_ball = (cls_ids == 32) & (scores >= self.ball_conf)
        keep = keep_person | keep_ball
        if not np.any(keep):
            return np.empty((0, 4), dtype=np.float32), None, (0, 0, w, h)

        boxes_cxcywh = out[keep, :4]
        kept_scores = scores[keep]
        kept_cls = cls_ids[keep]

        x1 = np.clip((boxes_cxcywh[:, 0] - boxes_cxcywh[:, 2] * 0.5) / ratio, 0, w)
        y1 = np.clip((boxes_cxcywh[:, 1] - boxes_cxcywh[:, 3] * 0.5) / ratio, 0, h)
        x2 = np.clip((boxes_cxcywh[:, 0] + boxes_cxcywh[:, 2] * 0.5) / ratio, 0, w)
        y2 = np.clip((boxes_cxcywh[:, 1] + boxes_cxcywh[:, 3] * 0.5) / ratio, 0, h)

        p_idx = np.where(kept_cls == 0)[0]
        player_boxes = np.empty((0, 4), dtype=np.float32)
        if len(p_idx) > 0:
            rects = [[float(x1[i]), float(y1[i]), float(x2[i] - x1[i]), float(y2[i] - y1[i])] for i in p_idx]
            confs = [float(kept_scores[i]) for i in p_idx]
            nms_idx = cv2.dnn.NMSBoxes(rects, confs, self.person_conf, self.nms_thresh)
            if len(nms_idx) > 0:
                flat_idx = np.array(nms_idx).reshape(-1)
                sel = p_idx[flat_idx]
                player_boxes = np.stack([x1[sel], y1[sel], x2[sel], y2[sel]], axis=1).astype(np.float32)

        b_idx = np.where(kept_cls == 32)[0]
        ball_pos = None
        if len(b_idx) > 0:
            best_b = b_idx[int(np.argmax(kept_scores[b_idx]))]
            ball_pos = (float((x1[best_b] + x2[best_b]) * 0.5), float((y1[best_b] + y2[best_b]) * 0.5))

        return player_boxes, ball_pos, (0, 0, w, h)


def resolve_engine(requested: str) -> str:
    if requested != "auto":
        return requested
    return "pitch_cv"


def analyze_video(
    video_path: str,
    output_json: str,
    engine: str = "auto",
    model_path: str = DEFAULT_YOLOX_MODEL,
    pitch_length_m: float = 90.0,
    pitch_width_m: float = 60.0,
    sample_fps: float = 2.0,
    period: int = 1,
    start_minute: float = 0.0,
    own_cluster: int = 0,
    max_frames: int = 0,
    flip_pitch: bool = False,
    clip_start_s: float = 0.0,
):
    chosen_engine = resolve_engine(engine)
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Tidak dapat membuka berkas video: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    frame_step = max(1, int(round(fps / max(0.2, sample_fps))))
    expected_samples = max(1, int(math.ceil(total_frames / frame_step))) if total_frames > 0 else 0
    if max_frames > 0 and expected_samples > 0:
        expected_samples = min(expected_samples, max_frames)
    emit_progress(
        "analyze",
        32,
        f"Memulai deteksi frame (0 / {expected_samples or '?'})...",
        processed=0,
        total=expected_samples or None,
    )

    t0 = time.time()
    if chosen_engine == "pitch_cv":
        print(f"[ballr-vision] Engine: Pitch-Aware CV (CPU) | Video {width}x{height} @ {fps:.1f} fps (step={frame_step})")
        detector = PitchAwareCVDetector()
        tracker = SimpleIoUTracker()
        model_label = "BallR Pitch-Aware CV (OpenCV HSV Turf + Blob Tracker + K-Means Jersey + Motion Ball)"
    elif chosen_engine == "yolox":
        print(f"[ballr-vision] Engine: OpenCV DNN YOLOX-Nano (CPU) | Video {width}x{height} @ {fps:.1f} fps (step={frame_step})")
        detector = OpenCVYoloxDetector(model_path=model_path)
        tracker = SimpleIoUTracker()
        model_label = "OpenCV DNN YOLOX-Nano (Apache 2.0) + IoU Tracker + KMeans Jersey Clustering"
    else:
        from rfdetr import RFDETRBase
        import supervision as sv

        print(f"[ballr-vision] Engine: RF-DETR (Apache 2.0) | Video {width}x{height} @ {fps:.1f} fps (step={frame_step})")
        detector = RFDETRBase()
        tracker = sv.ByteTrack()
        model_label = "RF-DETR (Apache 2.0) + ByteTrack (MIT) + KMeans Jersey Clustering"

    jersey_samples = []
    frame_records = []
    frame_idx = 0
    processed = 0
    ball_hits = 0
    total_players = 0

    while True:
        if frame_idx % frame_step != 0:
            if not cap.grab():
                break
            frame_idx += 1
            continue
        ret, frame = cap.read()
        if not ret:
            break

        processed += 1
        rel_time_s = frame_idx / fps
        video_time_s = round(clip_start_s + rel_time_s, 1)
        minute = round(start_minute + (rel_time_s / 60.0), 1)

        ball_pos = None
        pitch_bbox = (0, 0, width, height)
        players_in_frame = []

        if chosen_engine in ("pitch_cv", "yolox"):
            player_boxes, ball_pos, pitch_bbox = detector.detect(frame)
            tracked = tracker.update(player_boxes)
            total_players += len(tracked)
            if ball_pos is not None:
                ball_hits += 1
            for tid, box in tracked:
                color = extract_jersey_color(frame, box)
                if color is not None:
                    jersey_samples.append(color)
                foot_x = float((box[0] + box[2]) * 0.5)
                foot_y = float(box[3])
                players_in_frame.append({"id": int(tid), "px": foot_x, "py": foot_y, "color": color})
        else:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            detections = detector.predict(rgb, threshold=0.35)
            if len(detections) > 0:
                person_mask = np.isin(detections.class_id, [0, 1])
                ball_mask = np.isin(detections.class_id, [32, 37])
                player_dets = tracker.update_with_detections(detections[person_mask])
                ball_dets = detections[ball_mask]

                total_players += len(player_dets)
                if len(ball_dets) > 0:
                    best_ball = int(np.argmax(ball_dets.confidence))
                    bx1, by1, bx2, by2 = ball_dets.xyxy[best_ball]
                    ball_pos = (float((bx1 + bx2) * 0.5), float((by1 + by2) * 0.5))
                    ball_hits += 1

                for i in range(len(player_dets)):
                    box = player_dets.xyxy[i]
                    tid = int(player_dets.tracker_id[i]) if player_dets.tracker_id is not None else i
                    color = extract_jersey_color(frame, box)
                    if color is not None:
                        jersey_samples.append(color)
                    foot_x = float((box[0] + box[2]) * 0.5)
                    foot_y = float(box[3])
                    players_in_frame.append({"id": tid, "px": foot_x, "py": foot_y, "color": color})

        frame_records.append(
            {
                "video_time_s": video_time_s,
                "rel_time_s": rel_time_s,
                "minute": minute,
                "ball": ball_pos,
                "pitch_bbox": pitch_bbox,
                "players": players_in_frame,
                "scoreboard_fp": extract_scoreboard_fingerprint(frame),
            }
        )
        frame_idx += 1
        if processed % 10 == 0 or (expected_samples > 0 and processed == expected_samples):
            frac = min(1.0, processed / max(1, expected_samples)) if expected_samples > 0 else 0.5
            pct = 32 + int(round(frac * 62))
            emit_progress(
                "analyze",
                pct,
                f"Menganalisis frame {processed} / {expected_samples or '?'}...",
                processed=processed,
                total=expected_samples or None,
            )
        if max_frames > 0 and processed >= max_frames:
            break

    cap.release()
    emit_progress("finalize", 96, "Menyusun kejadian taktis dan statistik pertandingan...")

    centroids = fit_kmeans_2(np.array(jersey_samples)) if len(jersey_samples) >= 20 else None

    # Infer events (pass, ball_recovery, ball_loss, shot) from ball & nearest-player sequence
    events = []
    prev_owner = None
    evt_counter = 1

    for rec in frame_records:
        if rec["ball"] is None or not rec["players"]:
            continue

        bx, by = rec["ball"]
        nearest = min(rec["players"], key=lambda p: math.hypot(p["px"] - bx, p["py"] - by))
        dist_px = math.hypot(nearest["px"] - bx, nearest["py"] - by)
        if dist_px > max(width, height) * 0.14:
            continue

        cluster = predict_cluster(centroids, nearest["color"])
        team = "own" if cluster == own_cluster else "opponent"
        x_m, y_m = map_pixel_to_pitch(bx, by, rec["pitch_bbox"], pitch_length_m, pitch_width_m)
        if flip_pitch:
            x_m = round(max(0.0, min(pitch_length_m, pitch_length_m - x_m)), 1)
            y_m = round(max(0.0, min(pitch_width_m, pitch_width_m - y_m)), 1)

        if prev_owner is not None:
            moved_m = math.hypot(x_m - prev_owner["x_m"], y_m - prev_owner["y_m"])
            dt = max(0.2, rec["video_time_s"] - prev_owner["video_time_s"])
            speed_mps = moved_m / dt

            # Detect shot when ball enters opponent box at high velocity
            in_own_target_box = team == "own" and x_m >= pitch_length_m * 0.82 and abs(y_m - pitch_width_m * 0.5) <= pitch_width_m * 0.30
            in_opp_target_box = team == "opponent" and x_m <= pitch_length_m * 0.18 and abs(y_m - pitch_width_m * 0.5) <= pitch_width_m * 0.30

            if (in_own_target_box or in_opp_target_box) and moved_m >= 6.0 and speed_mps >= 8.0:
                slot_num = (prev_owner["tid"] % 11) + 1
                is_on_frame = (
                    (team == "own" and x_m >= pitch_length_m * 0.87)
                    or (team == "opponent" and x_m <= pitch_length_m * 0.13)
                ) and abs(y_m - pitch_width_m * 0.5) <= pitch_width_m * 0.20
                events.append(
                    {
                        "id": f"vision-evt-{evt_counter:04d}",
                        "client_event_id": f"vision-evt-{evt_counter:04d}",
                        "period": period,
                        "minute": prev_owner["minute"],
                        "team": prev_owner["team"],
                        "player_id": None,
                        "player_number": slot_num,
                        "opponent_number": slot_num if prev_owner["team"] == "opponent" else None,
                        "event_type": "shot_on_target" if is_on_frame else "shot",
                        "outcome": "success" if is_on_frame else "off_target",
                        "x_m": prev_owner["x_m"],
                        "y_m": prev_owner["y_m"],
                        "end_x_m": x_m,
                        "end_y_m": y_m,
                        "video_time_s": prev_owner["video_time_s"],
                        "note": "Estimasi tembakan tepat sasaran" if is_on_frame else "Estimasi tembakan ke kotak penalti",
                    }
                )
                evt_counter += 1
            elif team == prev_owner["team"] and moved_m >= 4.0:
                slot_num = (nearest["id"] % 11) + 1
                events.append(
                    {
                        "id": f"vision-evt-{evt_counter:04d}",
                        "client_event_id": f"vision-evt-{evt_counter:04d}",
                        "period": period,
                        "minute": prev_owner["minute"],
                        "team": team,
                        "player_id": None,
                        "player_number": slot_num,
                        "opponent_number": slot_num if team == "opponent" else None,
                        "event_type": "pass",
                        "outcome": "success",
                        "x_m": prev_owner["x_m"],
                        "y_m": prev_owner["y_m"],
                        "end_x_m": x_m,
                        "end_y_m": y_m,
                        "video_time_s": prev_owner["video_time_s"],
                        "note": "Estimasi umpan antar pemain",
                    }
                )
                evt_counter += 1
            elif team != prev_owner["team"]:
                # Record ball_loss for previous team + ball_recovery for winning team
                prev_slot_num = (prev_owner["tid"] % 11) + 1
                curr_slot_num = (nearest["id"] % 11) + 1
                events.append(
                    {
                        "id": f"vision-evt-{evt_counter:04d}",
                        "client_event_id": f"vision-evt-{evt_counter:04d}",
                        "period": period,
                        "minute": prev_owner["minute"],
                        "team": prev_owner["team"],
                        "player_id": None,
                        "player_number": prev_slot_num,
                        "opponent_number": prev_slot_num if prev_owner["team"] == "opponent" else None,
                        "event_type": "ball_loss",
                        "outcome": "fail",
                        "x_m": prev_owner["x_m"],
                        "y_m": prev_owner["y_m"],
                        "end_x_m": None,
                        "end_y_m": None,
                        "video_time_s": prev_owner["video_time_s"],
                        "note": "Estimasi kehilangan penguasaan",
                    }
                )
                evt_counter += 1
                events.append(
                    {
                        "id": f"vision-evt-{evt_counter:04d}",
                        "client_event_id": f"vision-evt-{evt_counter:04d}",
                        "period": period,
                        "minute": rec["minute"],
                        "team": team,
                        "player_id": None,
                        "player_number": curr_slot_num,
                        "opponent_number": curr_slot_num if team == "opponent" else None,
                        "event_type": "ball_recovery",
                        "outcome": "success",
                        "x_m": x_m,
                        "y_m": y_m,
                        "end_x_m": None,
                        "end_y_m": None,
                        "video_time_s": rec["video_time_s"],
                        "note": "Estimasi perebutan bola",
                    }
                )
                evt_counter += 1

        prev_owner = {
            "team": team,
            "tid": nearest["id"],
            "x_m": x_m,
            "y_m": y_m,
            "minute": rec["minute"],
            "video_time_s": rec["video_time_s"],
        }

    # Deteksi otomatis estimasi GOL (Multi-Signal Fusion):
    # 1. Lonjakan energi audio (komentator / sorakan penonton) via ffmpeg RMS
    # 2. Perubahan area papan skor (scoreboard strip) pasca tembakan
    # 3. Jeda selebrasi / cut kamera + restart kick-off di lingkaran tengah
    audio_env, audio_spike_thresh = extract_audio_energy_envelope(video_path)
    last_goal_t = -999.0
    goals_detected = 0

    for idx, evt in enumerate(events):
        if evt.get("event_type") not in ("shot", "shot_on_target"):
            continue
        shot_t = float(evt.get("video_time_s") or 0.0)
        if shot_t - last_goal_t < 90.0:
            continue

        end_x = evt.get("end_x_m") if evt.get("end_x_m") is not None else evt.get("x_m")
        end_y = evt.get("end_y_m") if evt.get("end_y_m") is not None else evt.get("y_m")
        if end_x is None or end_y is None:
            continue

        rel_end_x = (pitch_length_m - float(end_x)) if evt.get("team") == "opponent" else float(end_x)
        near_goal_mouth = rel_end_x >= pitch_length_m * 0.85 and abs(float(end_y) - pitch_width_m * 0.5) <= pitch_width_m * 0.24
        if not near_goal_mouth:
            continue

        # Sinyal 1: Lonjakan audio dalam 1–12 detik setelah tembakan
        rel_shot_s = max(0, int(round(shot_t - clip_start_s)))
        has_audio_spike = False
        if audio_env and audio_spike_thresh > 0:
            window_rms = [audio_env[s] for s in range(rel_shot_s + 1, rel_shot_s + 13) if s in audio_env]
            if window_rms and max(window_rms) >= audio_spike_thresh:
                has_audio_spike = True

        # Sinyal 2: Perubahan papan skor (area pojok kiri atas) antara sebelum vs 8–35 detik sesudah tembakan
        before_fps = [
            fr["scoreboard_fp"]
            for fr in frame_records
            if fr.get("scoreboard_fp") is not None
            and -12.0 <= (float(fr.get("video_time_s") or 0.0) - shot_t) <= -2.0
        ]
        after_fps = [
            fr["scoreboard_fp"]
            for fr in frame_records
            if fr.get("scoreboard_fp") is not None
            and 8.0 <= (float(fr.get("video_time_s") or 0.0) - shot_t) <= 35.0
        ]
        scoreboard_changed = False
        if len(before_fps) >= 2 and len(after_fps) >= 2:
            mean_before = np.mean(before_fps, axis=0)
            mean_after = np.mean(after_fps, axis=0)
            sb_diff = float(np.mean(np.abs(mean_after - mean_before)))
            # Perubahan nyata pada digit papan skor (hindari fade hitam penuh / perubahan kamera total)
            if 4.5 <= sb_diff <= 28.0:
                scoreboard_changed = True

        # Sinyal 3: Jeda permainan, cut kamera selebrasi, & kick-off di lingkaran tengah
        later_events = [
            e for e in events[idx + 1 :]
            if 6.0 <= (float(e.get("video_time_s") or 0.0) - shot_t) <= 75.0
        ]
        next_evt = events[idx + 1] if idx + 1 < len(events) else None
        pause_gap_s = (float(next_evt.get("video_time_s") or 0.0) - shot_t) if next_evt else 0.0

        has_center_kickoff = any(
            abs(float(e.get("x_m") or -99) - pitch_length_m * 0.5) <= 10.0
            and abs(float(e.get("y_m") or -99) - pitch_width_m * 0.5) <= 10.0
            and (float(e.get("video_time_s") or 0.0) - shot_t) >= 10.0
            for e in later_events[:4]
        )

        post_frames = [
            fr for fr in frame_records
            if 3.0 <= (float(fr.get("video_time_s") or 0.0) - shot_t) <= 50.0
        ]
        low_pitch_streak = 0
        max_low_streak = 0
        for fr in post_frames:
            if len(fr.get("players") or []) <= 1 or fr.get("ball") is None:
                low_pitch_streak += 1
                max_low_streak = max(max_low_streak, low_pitch_streak)
            else:
                low_pitch_streak = 0

        signals = []
        if has_audio_spike:
            signals.append("lonjakan audio")
        if scoreboard_changed:
            signals.append("perubahan papan skor")
        if has_center_kickoff:
            signals.append("kick-off tengah")
        if max_low_streak >= 2:
            signals.append("jeda selebrasi")

        promoted = (
            (pause_gap_s >= 10.0 and has_center_kickoff)
            or (has_audio_spike and (has_center_kickoff or max_low_streak >= 2 or scoreboard_changed))
            or (scoreboard_changed and (evt.get("event_type") == "shot_on_target" or max_low_streak >= 2))
        )
        if promoted:
            evt["event_type"] = "goal"
            evt["outcome"] = "success"
            sig_text = " + ".join(signals) if signals else "tembakan ke gawang diikuti jeda"
            evt["note"] = f"Estimasi gol otomatis ({sig_text})"
            last_goal_t = shot_t
            goals_detected += 1

    elapsed_s = round(time.time() - t0, 2)
    payload = {
        "schema": "ballr-vision-v1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "vision_quality": {
            "frames_processed": processed,
            "total_video_frames": total_frames,
            "elapsed_s": elapsed_s,
            "ball_detection_rate_pct": round((ball_hits / max(1, processed)) * 100.0, 1),
            "avg_players_detected": round(total_players / max(1, processed), 1),
            "goals_detected": goals_detected,
            "audio_analyzed": bool(audio_env),
            "model": model_label,
            "disclaimer": "Hasil estimasi otomatis dari 1 kamera; wajib ditinjau pelatih sebelum dijadikan laporan resmi.",
        },
        "events": events,
    }

    os.makedirs(os.path.dirname(os.path.abspath(output_json)), exist_ok=True)
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(
        f"[ballr-vision] Selesai dalam {elapsed_s}s! "
        f"{processed} frame, rata-rata {payload['vision_quality']['avg_players_detected']} pemain, "
        f"bola {payload['vision_quality']['ball_detection_rate_pct']}%, "
        f"{len(events)} kejadian tersimpan di: {output_json}"
    )
    return payload


def main():
    parser = argparse.ArgumentParser(description="BallR Vision — Automated Football Video Analyzer")
    parser.add_argument("--youtube", type=str, help="URL YouTube / YouTube Live")
    parser.add_argument("--video", type=str, help="Path file video lokal (.mp4)")
    parser.add_argument("--engine", type=str, default="auto", choices=["auto", "pitch_cv", "yolox", "rfdetr"], help="Engine deteksi (default: auto -> pitch_cv)")
    parser.add_argument("--model", type=str, default=DEFAULT_YOLOX_MODEL, help="Path file model YOLOX ONNX")
    parser.add_argument("--start", type=int, default=900, help="Detik mulai potongan YouTube (default: 900)")
    parser.add_argument("--end", type=int, default=990, help="Detik akhir potongan YouTube (default: 990)")
    parser.add_argument("--out", type=str, default="ballr_analysis.json", help="Path output JSON")
    parser.add_argument("--fps", type=float, default=2.0, help="Frame per detik yang dianalisis (default: 2.0)")
    parser.add_argument("--period", type=int, default=1, help="Babak pertandingan (1 atau 2)")
    parser.add_argument("--start-minute", type=float, default=0.0, help="Menit awal klip (default: 0.0)")
    parser.add_argument("--own-cluster", type=int, default=0, choices=[0, 1], help="Klaster warna jersey tim kita (0 atau 1)")
    parser.add_argument("--max-frames", type=int, default=0, help="Batas jumlah frame yang diproses (0 = seluruh video)")
    parser.add_argument("--flip-pitch", action="store_true", help="Balik koordinat lapangan (x, y) untuk tukar sisi gawang di Babak 2")
    parser.add_argument("--clip-start-s", type=float, default=0.0, help="Offset detik awal klip terhadap video penuh")
    parser.add_argument(
        "--cookies-from-browser",
        type=str,
        default="",
        help="Opsional: nama browser untuk --cookies-from-browser yt-dlp (mis. chrome, edge, firefox)",
    )
    args = parser.parse_args()

    video_path = args.video
    clip_start_s = args.clip_start_s
    if args.youtube:
        video_path = download_youtube_clip(
            args.youtube,
            "match_clip.mp4",
            args.start,
            args.end,
            cookies_from_browser=args.cookies_from_browser,
        )
        if clip_start_s == 0.0 and args.start > 0:
            clip_start_s = float(args.start)
    if not video_path or not os.path.exists(video_path):
        print("Harap berikan --youtube <URL> atau --video <file.mp4>", file=sys.stderr)
        sys.exit(1)

    analyze_video(
        video_path=video_path,
        output_json=args.out,
        engine=args.engine,
        model_path=args.model,
        sample_fps=args.fps,
        period=args.period,
        start_minute=args.start_minute,
        own_cluster=args.own_cluster,
        max_frames=args.max_frames,
        flip_pitch=args.flip_pitch,
        clip_start_s=clip_start_s,
    )


if __name__ == "__main__":
    main()
