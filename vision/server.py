#!/usr/bin/env python3
"""
BallR Vision Standalone HTTP API Server
Menjalankan layanan analisis video YouTube terpisah dari Vite dev server
agar dapat di-deploy ke VPS / Railway / Render / Fly.io / Cloud Run / Docker.

Endpoints:
  GET  /api/vision/health
  GET  /api/vision/latest
  GET  /api/vision/youtube/status
  POST /api/vision/youtube
  POST /api/vision/youtube/cancel

Jalankan lokal:
  python vision/server.py
"""

import json
import os
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

VISION_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPT_PATH = os.path.join(VISION_DIR, "ballr_vision.py")
LATEST_PATH = os.path.join(VISION_DIR, "ballr_analysis.json")
ALLOWED_HOSTS = {"youtube.com", "m.youtube.com", "youtu.be"}
ALLOWED_ENGINES = {"auto", "pitch_cv", "yolox"}
ALLOWED_BROWSERS = {"chrome", "edge", "firefox", "brave", "opera"}

_state_lock = threading.Lock()
_active_run = False
_active_proc = None
_cancel_requested = False
_active_progress = None


def is_valid_youtube_url(raw_url: str) -> bool:
    if not raw_url or not isinstance(raw_url, str):
        return False
    try:
        parsed = urlparse(raw_url.strip())
        if parsed.scheme not in ("http", "https"):
            return False
        host = (parsed.hostname or "").lower().removeprefix("www.")
        return host in ALLOWED_HOSTS
    except Exception:
        return False


def normalize_segments(body: dict) -> list[dict]:
    def clamp(val, lo, hi):
        return max(lo, min(hi, val))

    max_seg_sec = 3600
    raw_segments = body.get("segments")
    if isinstance(raw_segments, list) and len(raw_segments) > 0:
        out = []
        for idx, seg in enumerate(raw_segments[:2]):
            seg = seg or {}
            period = 2 if int(seg.get("period") or (2 if idx == 1 else 1)) == 2 else 1
            start_sec = clamp(int(seg.get("startSec") or 0), 0, 21600)
            raw_end = int(seg.get("endSec") or (start_sec + 60))
            end_sec = max(start_sec + 10, min(start_sec + max_seg_sec, raw_end))
            default_min = 45 if period == 2 else 0
            start_min = clamp(float(seg.get("startMinute") if seg.get("startMinute") is not None else default_min), 0, 130)
            out.append({
                "period": period,
                "startSec": start_sec,
                "endSec": end_sec,
                "startMinute": start_min,
                "flipPitch": bool(seg.get("flipPitch")),
            })
        return out

    start_sec = clamp(int(body.get("startSec") or 900), 0, 21600)
    raw_end = int(body.get("endSec") or (start_sec + 60))
    end_sec = max(start_sec + 10, min(start_sec + max_seg_sec, raw_end))
    period = 2 if int(body.get("period") or 1) == 2 else 1
    default_min = 45 if period == 2 else 0
    start_min = clamp(float(body.get("startMinute") if body.get("startMinute") is not None else default_min), 0, 130)
    return [{
        "period": period,
        "startSec": start_sec,
        "endSec": end_sec,
        "startMinute": start_min,
        "flipPitch": bool(body.get("flipPitch")),
    }]


def run_segment(py_exec: str, raw_url: str, engine: str, fps: float, own_cluster: int, cookies_browser: str, seg: dict, seg_out: str, seg_idx: int, total_segs: int, started_at: float, team_a: str = "", team_b: str = ""):
    global _active_proc, _active_progress
    temp_clip = os.path.join(VISION_DIR, "match_clip.mp4")
    if os.path.exists(temp_clip):
        try:
            os.remove(temp_clip)
        except OSError:
            pass

    cmd = [
        py_exec,
        SCRIPT_PATH,
        "--youtube", raw_url,
        "--engine", engine,
        "--start", str(seg["startSec"]),
        "--end", str(seg["endSec"]),
        "--fps", str(fps),
        "--period", str(seg["period"]),
        "--start-minute", str(seg["startMinute"]),
        "--own-cluster", str(own_cluster),
        "--clip-start-s", str(seg["startSec"]),
        "--out", seg_out,
    ]
    if seg["flipPitch"]:
        cmd.append("--flip-pitch")
    if cookies_browser:
        cmd.extend(["--cookies-from-browser", cookies_browser])
    if team_a:
        cmd.extend(["--team-a", team_a])
    if team_b:
        cmd.extend(["--team-b", team_b])

    proc = subprocess.Popen(
        cmd,
        cwd=VISION_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )
    with _state_lock:
        _active_proc = proc

    stdout_lines = []
    assert proc.stdout is not None
    for line in proc.stdout:
        stdout_lines.append(line)
        prefix = "[ballr-progress] "
        if line.startswith(prefix):
            try:
                p = json.loads(line[len(prefix):].strip())
                base = (seg_idx / max(1, total_segs)) * 100.0
                span = 100.0 / max(1, total_segs)
                combined_pct = min(99, int(round(base + (float(p.get("pct") or 0) / 100.0) * span)))
                with _state_lock:
                    _active_progress = {
                        "stage": p.get("stage", "analyze"),
                        "pct": combined_pct,
                        "detail": f"Babak {seg['period']}: {p.get('detail', 'Memproses video...')}",
                        "processed": p.get("processed"),
                        "total": p.get("total"),
                        "period": seg["period"],
                        "segmentIndex": seg_idx + 1,
                        "totalSegments": total_segs,
                        "startedAt": started_at,
                    }
            except Exception:
                pass

    stderr_text = proc.stderr.read() if proc.stderr else ""
    code = proc.wait()
    with _state_lock:
        _active_proc = None

    if code != 0:
        tail = stderr_text[-1200:].strip()
        raise RuntimeError(json.dumps({
            "exit_code": code,
            "message": f"Unduh/analisis YouTube gagal pada Babak {seg['period']} (exit {code}).",
            "stderr_tail": tail,
            "error_detail": tail,
        }))

    with open(seg_out, "r", encoding="utf-8") as f:
        return json.load(f)


class VisionApiHandler(BaseHTTPRequestHandler):
    def _send_cors(self):
        origin = os.environ.get("BALLR_CORS_ORIGIN", "*")
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status_code: int, payload: dict):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self._send_cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/vision/health":
            self._send_json(200, {"ok": True, "service": "ballr-vision-api"})
            return

        if path == "/api/vision/youtube/status":
            with _state_lock:
                prog = dict(_active_progress) if _active_progress else None
                if prog and "startedAt" in prog:
                    prog["elapsedSec"] = max(0, int(time.time() - prog["startedAt"]))
                active = _active_run
            self._send_json(200, {"ok": True, "active": active, "progress": prog})
            return

        if path == "/api/vision/latest":
            if not os.path.exists(LATEST_PATH):
                self._send_json(404, {"ok": False, "error": "Belum ada berkas vision/ballr_analysis.json."})
                return
            with open(LATEST_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._send_json(200, {"ok": True, "source": "vision/ballr_analysis.json", "data": data})
            return

        self._send_json(404, {"ok": False, "error": "Endpoint tidak ditemukan."})

    def do_POST(self):
        global _active_run, _cancel_requested, _active_progress
        path = urlparse(self.path).path

        if path == "/api/vision/youtube/cancel":
            with _state_lock:
                if not _active_run:
                    self._send_json(200, {"ok": True, "cancelled": False})
                    return
                _cancel_requested = True
                proc = _active_proc
            if proc is not None and proc.poll() is None:
                try:
                    proc.terminate()
                except Exception:
                    pass
            self._send_json(200, {"ok": True, "cancelled": True})
            return

        if path != "/api/vision/youtube":
            self._send_json(404, {"ok": False, "error": "Endpoint tidak ditemukan."})
            return

        with _state_lock:
            if _active_run:
                self._send_json(409, {"ok": False, "error": "Proses analisis YouTube sebelumnya masih berjalan."})
                return
            _active_run = True
            _cancel_requested = False

        try:
            length = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(length).decode("utf-8")) if length > 0 else {}
            raw_url = str(body.get("url") or "").strip()
            if not is_valid_youtube_url(raw_url):
                self._send_json(400, {"ok": False, "error": "URL YouTube tidak valid."})
                return

            segments = normalize_segments(body)
            req_fps = max(0.25, min(4.0, float(body.get("fps") or 2.0)))
            own_cluster = 1 if int(body.get("ownCluster") or 0) == 1 else 0
            engine = body.get("engine") if body.get("engine") in ALLOWED_ENGINES else "pitch_cv"
            raw_browser = str(body.get("cookiesFromBrowser") or "").strip().lower()
            cookies_browser = raw_browser if raw_browser in ALLOWED_BROWSERS else ""
            team_a = str(body.get("teamA") or "").strip()[:80]
            team_b = str(body.get("teamB") or "").strip()[:80]
            py_exec = os.environ.get("BALLR_PYTHON") or sys.executable
            started_at = time.time()

            seg_outputs = []
            for idx, seg in enumerate(segments):
                with _state_lock:
                    if _cancel_requested:
                        self._send_json(499, {"ok": False, "cancelled": True, "error": "Analisis YouTube dibatalkan."})
                        return
                seg_dur = max(10, seg["endSec"] - seg["startSec"])
                seg_fps = min(req_fps, 0.35) if seg_dur > 1200 else (min(req_fps, 0.75) if seg_dur > 300 else req_fps)
                seg_out = LATEST_PATH if len(segments) == 1 else os.path.join(VISION_DIR, f"ballr_analysis_p{seg['period']}.json")
                data = run_segment(py_exec, raw_url, engine, seg_fps, own_cluster, cookies_browser, seg, seg_out, idx, len(segments), started_at, team_a=team_a, team_b=team_b)
                seg_outputs.append(data)

            final_data = seg_outputs[0]
            if len(seg_outputs) > 1:
                merged_events = []
                merged_players = {}
                counter = 1
                for d in seg_outputs:
                    for dp in d.get("detected_players") or []:
                        k = str(dp.get("name") or "").lower()
                        if k and k not in merged_players:
                            merged_players[k] = dp
                    for evt in d.get("events") or []:
                        new_id = f"vision-evt-{counter:04d}"
                        counter += 1
                        merged_events.append({**evt, "id": new_id, "client_event_id": new_id})
                final_data = {
                    **seg_outputs[0],
                    "detected_players": list(merged_players.values()),
                    "events": merged_events,
                }
                with open(LATEST_PATH, "w", encoding="utf-8") as f:
                    json.dump(final_data, f, indent=2, ensure_ascii=False)

            self._send_json(200, {"ok": True, "source": "vision/ballr_analysis.json", "segments": segments, "data": final_data})
        except RuntimeError as exc:
            try:
                err_info = json.loads(str(exc))
            except Exception:
                err_info = {"message": str(exc)}
            self._send_json(500, {
                "ok": False,
                "cancelled": _cancel_requested,
                "error": err_info.get("message", "Gagal menjalankan analisis YouTube."),
                "exit_code": err_info.get("exit_code"),
                "stderr_tail": err_info.get("stderr_tail"),
                "error_detail": err_info.get("error_detail"),
            })
        except Exception as exc:
            self._send_json(500, {"ok": False, "error": str(exc)})
        finally:
            with _state_lock:
                _active_run = False
                _cancel_requested = False
                _active_progress = None


def main():
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8787"))
    server = ThreadingHTTPServer((host, port), VisionApiHandler)
    print(f"[ballr-vision-api] Mendengarkan di http://{host}:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
