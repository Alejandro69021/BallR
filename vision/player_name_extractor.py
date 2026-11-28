#!/usr/bin/env python3
"""
BallR Player Name Extractor
---------------------------
Ekstraksi nama pemain asli secara otomatis dari:
1. Subtitle / auto-caption komentator YouTube via yt-dlp (bahasa Indonesia & Inggris).
2. Metadata judul dan deskripsi video YouTube (susunan pemain / Starting XI).
3. Transkrip audio lokal opsional bila faster-whisper atau openai-whisper terpasang.
4. OCR grafis layar / lineup opsional bila pytesseract atau easyocr terpasang.

Semua ekstraksi bersifat opsional dan aman: jika satu sumber tidak tersedia,
pipeline lanjut menggunakan sumber berikutnya tanpa gagal.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
from typing import Any, Dict, List, Optional, Tuple


# Kata umum non-nama dalam komentar sepak bola Indonesia & Inggris
STOPWORDS = {
    # Indonesia - umum & sepak bola
    "ada", "adalah", "akan", "akhir", "akhirnya", "aksi", "anak", "angka", "antara",
    "apa", "apakah", "arah", "area", "atas", "atau", "awal", "babak", "bagaimana",
    "bagian", "bagus", "bahkan", "baik", "balik", "banget", "banyak", "barisan",
    "baru", "bawah", "begitu", "bek", "belakang", "belum", "benar", "bendera",
    "berada", "berhasil", "berikut", "bermain", "bersama", "besar", "biasa", "bisa",
    "bola", "buah", "bukan", "cetak", "coba", "cukup", "dalam", "dan", "dapat",
    "dari", "datang", "dekat", "dengan", "depan", "detik", "di", "dia", "dibawa",
    "dicetak", "dikuasai", "dilepas", "diterima", "dua", "empat", "enam", "gagal",
    "gawang", "gelandang", "gol", "hampir", "hanya", "hari", "harus", "hasil",
    "hingga", "indah", "ini", "itu", "jadi", "jaga", "jalan", "jangan", "jauh",
    "jelas", "jersey", "jika", "juga", "kali", "kalau", "kami", "kanan", "kapten",
    "karena", "kartu", "kawasan", "ke", "kecil", "kedua", "keluar", "kembali",
    "kemudian", "kena", "kepada", "kepala", "keras", "ketiga", "kiper", "kiri",
    "kita", "klub", "kombinasi", "kotak", "kuat", "kuning", "lagi", "laga", "lain",
    "lalu", "lama", "langsung", "lapangan", "lawan", "lebar", "lepas", "lewat",
    "liga", "lima", "lini", "luar", "main", "maka", "mampu", "mana", "masih",
    "masuk", "mati", "mau", "melakukan", "melebar", "melepas", "melihat", "memang",
    "membawa", "memberi", "membuat", "memiliki", "menang", "mencetak", "mencoba",
    "mendapat", "menembak", "menerima", "mengambil", "mengatur", "menggiring",
    "menit", "menjadi", "menuju", "merah", "mereka", "meski", "mistar", "momen",
    "muda", "mulai", "mungkin", "naik", "namun", "nanti", "nomor", "oleh", "oper",
    "operan", "pada", "pagi", "paling", "panjang", "para", "pasti", "pelanggaran",
    "pelatih", "peluang", "pemain", "penalti", "pendek", "penjaga", "penonton",
    "penyerang", "permainan", "pertama", "pertandingan", "pertahanan", "peserta",
    "pihak", "pindah", "posisi", "poin", "punggung", "punya", "putaran", "resmi",
    "rupanya", "saat", "saja", "salah", "sama", "sambil", "sampai", "sana",
    "sangat", "satu", "sayap", "sebab", "sebagai", "sebelah", "sebelum", "sebuah",
    "secara", "sedang", "sedikit", "segera", "sehingga", "sejak", "sekali",
    "sekarang", "sekitar", "selain", "selalu", "selamat", "seluruh", "semakin",
    "sementara", "sempat", "semua", "sendiri", "sepak", "sepakan", "seperti",
    "serangan", "sering", "serta", "sesuai", "setelah", "setiap", "siap", "siapa",
    "sini", "sisi", "skor", "skuad", "stadion", "sudah", "sudut", "sukses",
    "sundulan", "suporter", "susunan", "tadi", "tahan", "tahun", "tajam", "tak",
    "tampak", "tanpa", "tapi", "tarik", "tekel", "tembakan", "tempat", "tendangan",
    "tengah", "tentu", "tepat", "terakhir", "terbaik", "terbuka", "terjadi",
    "terkena", "terlalu", "terlihat", "ternyata", "terobosan", "terus", "tetap",
    "tetapi", "tiang", "tidak", "tiga", "tim", "tinggi", "titik", "total",
    "transisi", "tujuh", "tujuan", "turun", "umpan", "untuk", "upaya", "utama",
    "waktu", "wasit", "ya", "yaitu", "yang", "yuk", "zonanya", "zona",
    # Inggris - umum & sepak bola
    "about", "after", "again", "against", "all", "also", "and", "another", "any",
    "are", "area", "around", "assist", "attack", "away", "back", "ball", "been",
    "before", "behind", "being", "best", "better", "between", "big", "both", "box",
    "but", "can", "captain", "card", "center", "centre", "chance", "clear", "club",
    "coach", "come", "comes", "coming", "corner", "could", "cross", "cup", "defend",
    "defender", "defense", "defence", "did", "does", "done", "down", "dribble",
    "each", "early", "end", "even", "every", "extra", "far", "fast", "field",
    "final", "find", "finds", "first", "five", "foot", "football", "for", "forward",
    "foul", "four", "free", "from", "front", "full", "game", "get", "gets", "give",
    "gives", "go", "goal", "goalkeeper", "goes", "going", "good", "got", "great",
    "had", "half", "hand", "has", "have", "head", "header", "here", "high", "him",
    "his", "hit", "hits", "home", "how", "in", "inside", "into", "is", "it", "its",
    "just", "keep", "keeper", "keeps", "kick", "kicks", "know", "last", "late",
    "league", "left", "let", "line", "lineup", "little", "live", "long", "look",
    "looking", "looks", "lost", "low", "made", "make", "makes", "man", "many",
    "match", "may", "midfield", "midfielder", "minute", "minutes", "miss", "missed",
    "more", "most", "move", "much", "must", "near", "net", "new", "next", "nice",
    "nine", "no", "not", "now", "number", "off", "offside", "oh", "okay", "old",
    "on", "once", "one", "only", "onto", "open", "or", "other", "our", "out",
    "outside", "over", "own", "pace", "pass", "passed", "passes", "passing",
    "penalty", "pitch", "play", "played", "player", "players", "playing", "plays",
    "point", "possession", "post", "press", "pressure", "put", "puts", "quick",
    "really", "red", "ref", "referee", "right", "run", "runs", "save", "saved",
    "saves", "say", "score", "scored", "scores", "scoring", "second", "see",
    "seven", "she", "shoot", "shooting", "shoots", "short", "shot", "shots",
    "should", "side", "six", "soccer", "some", "space", "squad", "stadium",
    "start", "starting", "starts", "still", "stop", "strike", "striker", "strong",
    "sub", "substitution", "such", "sure", "tackle", "take", "taken", "takes",
    "team", "ten", "than", "that", "the", "their", "them", "then", "there", "these",
    "they", "thing", "think", "third", "this", "those", "three", "through", "throw",
    "time", "to", "today", "too", "top", "touch", "touches", "toward", "towards",
    "try", "trying", "turn", "turns", "two", "under", "up", "us", "use", "very",
    "video", "vs", "want", "was", "watch", "way", "we", "well", "were", "what",
    "when", "where", "which", "while", "who", "wide", "will", "win", "wing",
    "winger", "wins", "with", "won", "would", "yard", "yards", "yeah", "yellow",
    "yes", "yet", "you", "young", "your", "youtube",
}

TIME_RE = re.compile(
    r"(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})"
)

# Pola eksplisit nomor + nama (lineup deskripsi atau komentar)
NUMBER_NAME_PATTERNS = [
    re.compile(
        r"(?:[Nn]omor(?:\s+[Pp]unggung)?|[Nn]o\.?|[Nn]umber|#)\s*(\d{1,2})\s*[:.\-]?\s*([A-Z][a-zA-Z'`\-]{2,}(?:\s+[A-Z][a-zA-Z'`\-]{2,}){0,2})"
    ),
    re.compile(
        r"(?:^|\n)\s*(\d{1,2})\s*[.\-:\)]\s*([A-Z][a-zA-Z'`\-]{2,}(?:\s+[A-Z][a-zA-Z'`\-]{2,}){0,2})"
    ),
]

# Pola penyebutan nama dalam kalimat komentar Indonesia & Inggris
COMMENTARY_PATTERNS = [
    # Indonesia: preposisi/aksi diikuti nama
    re.compile(
        r"\b(?:umpan(?:\s+dari|\s+ke|\s+kepada|\s+manis|\s+terobosan)?|operan(?:\s+dari|\s+ke)?|tembakan(?:\s+dari|\s+oleh)?|tendangan(?:\s+dari|\s+oleh)?|sundulan(?:\s+dari|\s+oleh)?|gol(?:\s+dari|\s+oleh)?|dicetak(?:\s+oleh)?|dikuasai(?:\s+oleh)?|dibawa(?:\s+oleh)?|diterima(?:\s+oleh)?|penyelamatan(?:\s+dari|\s+oleh)?|kiper|penjaga\s+gawang|kapten|bek|striker|penyerang|gelandang|sayap|bola\s+di\s+kaki|menggantikan)\s+([A-Za-z][a-zA-Z'`\-]{2,}(?:\s+[A-Za-z][a-zA-Z'`\-]{2,})?)",
        re.IGNORECASE,
    ),
    # Indonesia: nama diikuti kata kerja aksi
    re.compile(
        r"\b([A-Za-z][a-zA-Z'`\-]{2,}(?:\s+[A-Za-z][a-zA-Z'`\-]{2,})?)\s+(?:melepas|melepaskan|mengirim|mengirimkan|mengumpan|mengoper|menembak|menendang|menyundul|mencetak|menggiring|membawa\s+bola|menguasai\s+bola|memotong|merebut|menyelamatkan|melakukan\s+tekel|masuk\s+menggantikan)\b",
        re.IGNORECASE,
    ),
    # Inggris: aksi diikuti nama
    re.compile(
        r"\b(?:pass(?:ed)?\s+(?:from|by|to)|shot\s+by|goal\s+by|scored\s+by|saved\s+by|cross\s+(?:from|by)|tackle\s+by|header\s+by|goalkeeper|keeper|captain|striker)\s+([A-Za-z][a-zA-Z'`\-]{2,}(?:\s+[A-Za-z][a-zA-Z'`\-]{2,})?)",
        re.IGNORECASE,
    ),
    # Inggris: nama diikuti kata kerja aksi
    re.compile(
        r"\b([A-Za-z][a-zA-Z'`\-]{2,}(?:\s+[A-Za-z][a-zA-Z'`\-]{2,})?)\s+(?:shoots|scores|scored|passes|passed|crosses|crossed|dribbles|tackles|headers|clears|saves|with\s+the\s+ball|on\s+the\s+ball)\b",
        re.IGNORECASE,
    ),
]


def _to_seconds(h: Optional[str], m: str, s: str, ms: str) -> float:
    return int(h or 0) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0


def _clean_vtt_text(raw: str) -> str:
    txt = re.sub(r"<[^>]+>", " ", raw)
    txt = re.sub(r"&nbsp;|&amp;|&quot;|&#39;", " ", txt)
    txt = re.sub(r"\[[^\]]+\]", " ", txt)
    txt = re.sub(r"\s+", " ", txt)
    return txt.strip()


def parse_vtt_cues(vtt_text: str) -> List[Dict[str, Any]]:
    """Parse file subtitle WebVTT/SRT menjadi daftar cue {start_s, end_s, text}."""
    cues: List[Dict[str, Any]] = []
    lines = vtt_text.splitlines()
    i = 0
    while i < len(lines):
        m = TIME_RE.search(lines[i])
        if m:
            start_s = _to_seconds(m.group(1), m.group(2), m.group(3), m.group(4))
            end_s = _to_seconds(m.group(5), m.group(6), m.group(7), m.group(8))
            i += 1
            buf = []
            while i < len(lines) and lines[i].strip() != "":
                buf.append(lines[i])
                i += 1
            text = _clean_vtt_text(" ".join(buf))
            if text:
                if cues and cues[-1]["text"] == text and abs(cues[-1]["end_s"] - start_s) < 2.0:
                    cues[-1]["end_s"] = max(cues[-1]["end_s"], end_s)
                else:
                    cues.append({"start_s": round(start_s, 1), "end_s": round(end_s, 1), "text": text})
        else:
            i += 1
    return cues


def _build_team_stopwords(team_names: Optional[List[str]]) -> set:
    extra = set()
    for name in team_names or []:
        for tok in re.findall(r"[a-zA-Z]+", str(name or "").lower()):
            if len(tok) >= 2:
                extra.add(tok)
    return extra


def _normalize_candidate_name(raw: str, extra_stopwords: set) -> Optional[str]:
    cleaned = re.sub(r"[^a-zA-Z'`\-\s]", " ", raw or "").strip()
    tokens = [t for t in cleaned.split() if len(t) >= 2]
    if not tokens:
        return None
    # Potong token stopword di awal dan akhir kandidat
    while tokens and (tokens[0].lower() in STOPWORDS or tokens[0].lower() in extra_stopwords):
        tokens.pop(0)
    while tokens and (tokens[-1].lower() in STOPWORDS or tokens[-1].lower() in extra_stopwords):
        tokens.pop()
    if not tokens or len(tokens) > 3:
        return None
    # Pastikan tidak ada token di tengah yang murni stopword umum
    if any(t.lower() in STOPWORDS or t.lower() in extra_stopwords for t in tokens):
        return None
    # Tolak kata terlalu pendek (1-2 huruf) kalau sendirian
    if len(tokens) == 1 and len(tokens[0]) < 3:
        return None
    # Format Title Case bersih
    return " ".join(t[0].upper() + t[1:].lower() if t.isupper() or t.islower() else t for t in tokens)


def extract_names_from_cues(
    cues: List[Dict[str, Any]],
    team_names: Optional[List[str]] = None,
    source: str = "youtube_caption",
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Ekstrak kandidat pemain dan daftar mention ber-timestamp dari cue teks komentar.
    Returns: (players_list, mentions_list)
    """
    extra_sw = _build_team_stopwords(team_names)
    by_key: Dict[str, Dict[str, Any]] = {}
    mentions: List[Dict[str, Any]] = []

    def register(name: str, time_s: float, jersey: Optional[int], weight: float, src: str):
        key = name.lower()
        if key not in by_key:
            by_key[key] = {
                "name": name,
                "jersey_number": jersey,
                "mentions": 0,
                "score": 0.0,
                "first_seen_s": round(time_s, 1),
                "source": src,
            }
        entry = by_key[key]
        entry["mentions"] += 1
        entry["score"] += weight
        if jersey is not None and entry["jersey_number"] is None:
            entry["jersey_number"] = jersey
        if time_s < entry["first_seen_s"]:
            entry["first_seen_s"] = round(time_s, 1)
        mentions.append({"name": name, "jersey_number": jersey, "time_s": round(time_s, 1), "source": src})

    for cue in cues:
        text = cue.get("text") or ""
        t_s = float(cue.get("start_s") or 0.0)
        if not text:
            continue

        # 1. Pola nomor + nama eksplisit (bobot tertinggi)
        for pat in NUMBER_NAME_PATTERNS:
            for m in pat.finditer(text):
                num = int(m.group(1))
                if 1 <= num <= 99:
                    cand = _normalize_candidate_name(m.group(2), extra_sw)
                    if cand:
                        register(cand, t_s, num, 3.0, source)

        # 2. Pola komentar aksi sepak bola
        for pat in COMMENTARY_PATTERNS:
            for m in pat.finditer(text):
                cand = _normalize_candidate_name(m.group(1), extra_sw)
                if cand:
                    register(cand, t_s, None, 1.5, source)

    ranked = sorted(
        by_key.values(),
        key=lambda r: (1 if r["jersey_number"] is not None else 0, r["score"], r["mentions"]),
        reverse=True,
    )

    # Saring noise: kalau ada cukup banyak kandidat, prioritaskan yang disebut >=2 kali atau punya nomor
    filtered = [r for r in ranked if r["jersey_number"] is not None or r["mentions"] >= 2 or len(ranked) <= 8]
    return filtered[:22], mentions


def extract_names_from_metadata_text(
    title: str = "",
    description: str = "",
    team_names: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Ekstrak susunan pemain eksplisit dari judul dan deskripsi video."""
    extra_sw = _build_team_stopwords(team_names)
    combined = f"{title or ''}\n{description or ''}"
    found: Dict[str, Dict[str, Any]] = {}

    for pat in NUMBER_NAME_PATTERNS:
        for m in pat.finditer(combined):
            num = int(m.group(1))
            if 1 <= num <= 99:
                cand = _normalize_candidate_name(m.group(2), extra_sw)
                if cand:
                    key = cand.lower()
                    if key not in found:
                        found[key] = {
                            "name": cand,
                            "jersey_number": num,
                            "mentions": 1,
                            "score": 4.0,
                            "first_seen_s": 0.0,
                            "source": "youtube_metadata",
                        }

    return list(found.values())[:22]


def _fetch_youtube_metadata_and_captions(
    youtube_url: str,
    cookies_from_browser: str = "",
) -> Tuple[str, str, List[Dict[str, Any]], List[str]]:
    """
    Unduh metadata JSON dan subtitle/auto-caption YouTube tanpa mengunduh video.
    """
    notes: List[str] = []
    title = ""
    description = ""
    cues: List[Dict[str, Any]] = []

    with tempfile.TemporaryDirectory(prefix="ballr_subs_") as tmpdir:
        out_tmpl = os.path.join(tmpdir, "meta")
        cmd = [
            "yt-dlp",
            "--skip-download",
            "--no-playlist",
            "--write-info-json",
            "--write-sub",
            "--write-auto-sub",
            "--sub-lang",
            "id,en,id-orig,en-orig",
            "--sub-format",
            "vtt",
            "-o",
            out_tmpl,
        ]
        if cookies_from_browser:
            cmd.extend(["--cookies-from-browser", cookies_from_browser])
        cmd.append(youtube_url)

        try:
            subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=45,
                check=False,
            )
        except Exception as exc:
            notes.append(f"Metadata/subtitle YouTube dilewati: {exc}")
            return title, description, cues, notes

        # Baca info.json
        for fname in os.listdir(tmpdir):
            fpath = os.path.join(tmpdir, fname)
            if fname.endswith(".info.json"):
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        info = json.load(f)
                    title = str(info.get("title") or "")
                    description = str(info.get("description") or "")
                except Exception:
                    pass
            elif fname.endswith(".vtt"):
                try:
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        parsed = parse_vtt_cues(f.read())
                    if len(parsed) > len(cues):
                        cues = parsed
                except Exception:
                    pass

    return title, description, cues, notes


def _try_transcribe_local_audio(
    video_path: str,
    clip_start_s: float = 0.0,
) -> List[Dict[str, Any]]:
    """
    Fallback opsional: jika faster-whisper atau openai-whisper terpasang,
    transkripsikan audio komentator dari file video lokal.
    """
    if not video_path or not os.path.exists(video_path):
        return []

    # Coba faster-whisper terlebih dahulu
    try:
        from faster_whisper import WhisperModel  # type: ignore

        model = WhisperModel("tiny", device="cpu", compute_type="int8")
        segments, _ = model.transcribe(video_path, language="id")
        cues = []
        for seg in segments:
            text = (seg.text or "").strip()
            if text:
                cues.append({
                    "start_s": round(clip_start_s + float(seg.start), 1),
                    "end_s": round(clip_start_s + float(seg.end), 1),
                    "text": text,
                })
        return cues
    except Exception:
        pass

    # Coba openai-whisper bila tersedia
    try:
        import whisper  # type: ignore

        model = whisper.load_model("tiny")
        res = model.transcribe(video_path, fp16=False)
        cues = []
        for seg in res.get("segments") or []:
            text = str(seg.get("text") or "").strip()
            if text:
                cues.append({
                    "start_s": round(clip_start_s + float(seg.get("start") or 0.0), 1),
                    "end_s": round(clip_start_s + float(seg.get("end") or 0.0), 1),
                    "text": text,
                })
        return cues
    except Exception:
        return []


def _try_ocr_screen_overlay(
    video_path: str,
    team_names: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Fallback opsional: jika pytesseract terpasang, baca teks grafis overlay
    atau lineup pada beberapa frame awal video.
    """
    if not video_path or not os.path.exists(video_path):
        return []
    try:
        import cv2  # type: ignore
        import pytesseract  # type: ignore
    except Exception:
        return []

    extra_sw = _build_team_stopwords(team_names)
    found: Dict[str, Dict[str, Any]] = {}
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    try:
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 25.0)
        sample_indices = sorted({int(total * r) for r in (0.02, 0.08, 0.18, 0.35, 0.6)})
        for idx in sample_indices:
            if idx < 0 or idx >= total:
                continue
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ok, frame = cap.read()
            if not ok or frame is None:
                continue
            h, w = frame.shape[:2]
            # Fokus pada sepertiga bawah layar (lower-third nama pemain/pencetak gol)
            roi = frame[int(h * 0.65):h, 0:w]
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            txt = pytesseract.image_to_string(gray, config="--psm 6") or ""
            for pat in NUMBER_NAME_PATTERNS:
                for m in pat.finditer(txt):
                    num = int(m.group(1))
                    if 1 <= num <= 99:
                        cand = _normalize_candidate_name(m.group(2), extra_sw)
                        if cand and cand.lower() not in found:
                            found[cand.lower()] = {
                                "name": cand,
                                "jersey_number": num,
                                "mentions": 1,
                                "score": 3.5,
                                "first_seen_s": round(idx / max(1.0, fps), 1),
                                "source": "screen_ocr",
                            }
    except Exception:
        pass
    finally:
        cap.release()

    return list(found.values())[:22]


def extract_players_for_analysis(
    youtube_url: Optional[str] = None,
    video_path: Optional[str] = None,
    clip_start_s: float = 0.0,
    cookies_from_browser: str = "",
    team_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Jalankan pipeline multi-sumber ekstraksi nama pemain untuk YouTube dan video lokal.
    """
    merged: Dict[str, Dict[str, Any]] = {}
    all_mentions: List[Dict[str, Any]] = []
    sources_used: List[str] = []
    notes: List[str] = []

    def merge_players(items: List[Dict[str, Any]]):
        for p in items:
            key = p["name"].lower()
            if key not in merged:
                merged[key] = dict(p)
            else:
                merged[key]["mentions"] += p.get("mentions", 1)
                merged[key]["score"] += p.get("score", 1.0)
                if merged[key].get("jersey_number") is None and p.get("jersey_number") is not None:
                    merged[key]["jersey_number"] = p["jersey_number"]

    # 1 & 2. YouTube metadata + subtitle komentator
    if youtube_url:
        title, desc, cues, fetch_notes = _fetch_youtube_metadata_and_captions(
            youtube_url, cookies_from_browser=cookies_from_browser
        )
        notes.extend(fetch_notes)
        meta_players = extract_names_from_metadata_text(title, desc, team_names=team_names)
        if meta_players:
            sources_used.append("youtube_metadata")
            merge_players(meta_players)
        if cues:
            sources_used.append("youtube_caption")
            cap_players, cap_mentions = extract_names_from_cues(
                cues, team_names=team_names, source="youtube_caption"
            )
            merge_players(cap_players)
            all_mentions.extend(cap_mentions)

    # 3. Fallback transkrip audio lokal bila belum ada cue komentar dan Whisper terpasang
    if not all_mentions and video_path:
        audio_cues = _try_transcribe_local_audio(video_path, clip_start_s=clip_start_s)
        if audio_cues:
            sources_used.append("audio_transcript")
            aud_players, aud_mentions = extract_names_from_cues(
                audio_cues, team_names=team_names, source="audio_transcript"
            )
            merge_players(aud_players)
            all_mentions.extend(aud_mentions)

    # 4. Fallback OCR grafis layar bila pytesseract terpasang
    if video_path:
        ocr_players = _try_ocr_screen_overlay(video_path, team_names=team_names)
        if ocr_players:
            sources_used.append("screen_ocr")
            merge_players(ocr_players)

    ranked = sorted(
        merged.values(),
        key=lambda r: (1 if r.get("jersey_number") is not None else 0, r.get("score", 0.0), r.get("mentions", 0)),
        reverse=True,
    )

    # Tetapkan slot_number (prioritaskan jersey_number jika 1..11 atau gunakan slot tersedia 1..11)
    used_slots = set()
    detected_players: List[Dict[str, Any]] = []
    for p in ranked[:15]:
        jn = p.get("jersey_number")
        slot = None
        if isinstance(jn, int) and 1 <= jn <= 11 and jn not in used_slots:
            slot = jn
            used_slots.add(slot)
        detected_players.append({
            "slot_number": slot,
            "jersey_number": jn,
            "name": p["name"],
            "source": p.get("source", "youtube_caption"),
            "mentions": int(p.get("mentions", 1)),
            "confidence": round(min(0.95, 0.45 + 0.1 * min(5, int(p.get("mentions", 1)))), 2),
            "first_seen_s": p.get("first_seen_s", 0.0),
        })

    # Isi slot kosong 1..11 untuk pemain yang belum punya slot_number
    next_slot = 1
    for dp in detected_players:
        if dp["slot_number"] is None:
            while next_slot in used_slots and next_slot <= 11:
                next_slot += 1
            if next_slot <= 11:
                dp["slot_number"] = next_slot
                used_slots.add(next_slot)

    return {
        "detected_players": detected_players,
        "mentions": all_mentions,
        "meta": {
            "sources_used": sources_used,
            "detected_count": len(detected_players),
            "mention_count": len(all_mentions),
            "notes": notes,
        },
    }


def attach_player_names_to_events(
    events: List[Dict[str, Any]],
    detected_players: List[Dict[str, Any]],
    mentions: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Sematkan player_name ke setiap event tim sendiri berdasarkan:
    1. Kedekatan waktu penyebutan komentator (<= 8 detik dari video_time_s).
    2. Pemetaan nomor slot / jersey dari detected_players.
    """
    if not events or not detected_players:
        return events

    by_slot: Dict[int, str] = {}
    by_jersey: Dict[int, str] = {}
    for dp in detected_players:
        name = dp.get("name")
        if not name:
            continue
        if dp.get("slot_number") is not None:
            by_slot[int(dp["slot_number"])] = name
        if dp.get("jersey_number") is not None:
            by_jersey[int(dp["jersey_number"])] = name

    mention_list = mentions or []

    for evt in events:
        if evt.get("team") != "own":
            continue
        if evt.get("player_name"):
            continue

        matched_name = None
        vts = evt.get("video_time_s")
        if vts is not None and mention_list:
            try:
                t_val = float(vts)
                best_dt = 8.1
                for m in mention_list:
                    dt = abs(float(m.get("time_s", -999.0)) - t_val)
                    if dt < best_dt:
                        best_dt = dt
                        matched_name = m.get("name")
            except Exception:
                pass

        if not matched_name and evt.get("player_number") is not None:
            num = int(evt["player_number"])
            matched_name = by_jersey.get(num) or by_slot.get(num)

        if matched_name:
            evt["player_name"] = matched_name

    return events
