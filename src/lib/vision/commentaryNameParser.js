/**
 * Parser nama pemain asli dari komentar video, subtitle WebVTT/SRT,
 * transkrip suara browser, atau teks daftar susunan pemain.
 * Berjalan murni di browser untuk semua pengguna video lokal maupun YouTube.
 */

const STOPWORDS = new Set([
  // Indonesia
  'ada', 'adalah', 'akan', 'akhir', 'aksi', 'anak', 'antara', 'apa', 'arah', 'area',
  'atas', 'atau', 'awal', 'babak', 'bagian', 'bagus', 'baik', 'balik', 'banyak',
  'barisan', 'baru', 'bawah', 'bek', 'belakang', 'belum', 'benar', 'berada',
  'berhasil', 'bermain', 'bersama', 'besar', 'biasa', 'bisa', 'bola', 'bukan',
  'cetak', 'coba', 'cukup', 'dalam', 'dan', 'dapat', 'dari', 'dekat', 'dengan',
  'depan', 'detik', 'di', 'dia', 'dibawa', 'dicetak', 'dikuasai', 'dilepas',
  'diterima', 'dua', 'empat', 'enam', 'gagal', 'gawang', 'gelandang', 'gol',
  'hampir', 'hanya', 'harus', 'hasil', 'hingga', 'indah', 'ini', 'itu', 'jadi',
  'jaga', 'jalan', 'jauh', 'jelas', 'jersey', 'jika', 'juga', 'kali', 'kalau',
  'kami', 'kanan', 'kapten', 'karena', 'kartu', 'ke', 'kecil', 'kedua', 'keluar',
  'kembali', 'kemudian', 'kena', 'kepada', 'kepala', 'keras', 'ketiga', 'kiper',
  'kiri', 'kita', 'klub', 'kombinasi', 'kotak', 'kuat', 'kuning', 'lagi', 'laga',
  'lain', 'lalu', 'lama', 'langsung', 'lapangan', 'lawan', 'lebar', 'lepas',
  'lewat', 'liga', 'lima', 'lini', 'luar', 'main', 'maka', 'mampu', 'masih',
  'masuk', 'mati', 'mau', 'melakukan', 'melebar', 'melepas', 'melihat', 'memang',
  'membawa', 'memberi', 'membuat', 'menang', 'mencetak', 'mencoba', 'mendapat',
  'menembak', 'menerima', 'mengambil', 'menggiring', 'menit', 'menjadi', 'menuju',
  'merah', 'mereka', 'meski', 'mistar', 'momen', 'muda', 'mulai', 'naik', 'namun',
  'nomor', 'oleh', 'oper', 'operan', 'pada', 'paling', 'panjang', 'para',
  'pelanggaran', 'pelatih', 'peluang', 'pemain', 'penalti', 'pendek', 'penjaga',
  'penyerang', 'permainan', 'pertama', 'pertandingan', 'pertahanan', 'posisi',
  'punggung', 'punya', 'resmi', 'saat', 'saja', 'salah', 'sama', 'sampai', 'sana',
  'sangat', 'satu', 'sayap', 'sebagai', 'sebelah', 'sebelum', 'sebuah', 'sedang',
  'segera', 'sehingga', 'sekali', 'sekarang', 'sekitar', 'selain', 'selalu',
  'seluruh', 'semakin', 'sementara', 'sempat', 'semua', 'sendiri', 'sepak',
  'sepakan', 'seperti', 'serangan', 'sering', 'serta', 'setelah', 'setiap', 'siap',
  'sisi', 'skor', 'skuad', 'stadion', 'sudah', 'sudut', 'sukses', 'sundulan',
  'susunan', 'tadi', 'tahan', 'tajam', 'tak', 'tanpa', 'tapi', 'tekel', 'tembakan',
  'tempat', 'tendangan', 'tengah', 'tentu', 'tepat', 'terakhir', 'terbaik',
  'terbuka', 'terjadi', 'terkena', 'terlalu', 'terlihat', 'terobosan', 'terus',
  'tetap', 'tetapi', 'tiang', 'tidak', 'tiga', 'tim', 'tinggi', 'titik', 'total',
  'transisi', 'tujuh', 'turun', 'umpan', 'untuk', 'upaya', 'utama', 'waktu',
  'wasit', 'ya', 'yaitu', 'yang', 'zona',
  // Inggris
  'about', 'after', 'again', 'against', 'all', 'also', 'and', 'another', 'any',
  'are', 'area', 'around', 'assist', 'attack', 'away', 'back', 'ball', 'been',
  'before', 'behind', 'best', 'between', 'big', 'both', 'box', 'but', 'can',
  'captain', 'card', 'center', 'centre', 'chance', 'clear', 'club', 'coach',
  'come', 'comes', 'corner', 'could', 'cross', 'cup', 'defender', 'defense',
  'defence', 'did', 'does', 'done', 'down', 'dribble', 'each', 'early', 'end',
  'even', 'every', 'extra', 'far', 'fast', 'field', 'final', 'find', 'finds',
  'first', 'five', 'foot', 'football', 'for', 'forward', 'foul', 'four', 'free',
  'from', 'front', 'full', 'game', 'get', 'gets', 'give', 'gives', 'goal',
  'goalkeeper', 'goes', 'good', 'got', 'great', 'had', 'half', 'hand', 'has',
  'have', 'head', 'header', 'here', 'high', 'him', 'his', 'hit', 'hits', 'home',
  'how', 'inside', 'into', 'just', 'keep', 'keeper', 'kick', 'kicks', 'last',
  'late', 'league', 'left', 'let', 'line', 'lineup', 'little', 'live', 'long',
  'look', 'looks', 'lost', 'low', 'made', 'make', 'makes', 'man', 'many', 'match',
  'may', 'midfield', 'midfielder', 'minute', 'minutes', 'miss', 'missed', 'more',
  'most', 'move', 'much', 'must', 'near', 'net', 'new', 'next', 'nice', 'nine',
  'not', 'now', 'number', 'off', 'offside', 'okay', 'old', 'once', 'one', 'only',
  'onto', 'open', 'other', 'our', 'out', 'outside', 'over', 'own', 'pace', 'pass',
  'passed', 'passes', 'passing', 'penalty', 'pitch', 'play', 'played', 'player',
  'players', 'playing', 'plays', 'point', 'possession', 'post', 'press',
  'pressure', 'put', 'puts', 'quick', 'really', 'red', 'ref', 'referee', 'right',
  'run', 'runs', 'save', 'saved', 'saves', 'score', 'scored', 'scores', 'scoring',
  'second', 'see', 'seven', 'she', 'shoot', 'shooting', 'shoots', 'short', 'shot',
  'shots', 'should', 'side', 'six', 'soccer', 'some', 'space', 'squad', 'stadium',
  'start', 'starting', 'starts', 'still', 'stop', 'strike', 'striker', 'strong',
  'sub', 'substitution', 'such', 'sure', 'tackle', 'take', 'taken', 'takes',
  'team', 'ten', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
  'they', 'third', 'this', 'those', 'three', 'through', 'throw', 'time', 'today',
  'too', 'top', 'touch', 'touches', 'toward', 'towards', 'try', 'trying', 'turn',
  'turns', 'two', 'under', 'use', 'very', 'video', 'vs', 'want', 'was', 'watch',
  'way', 'well', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'wide',
  'will', 'win', 'wing', 'winger', 'wins', 'with', 'won', 'would', 'yard',
  'yards', 'yeah', 'yellow', 'yes', 'yet', 'you', 'young', 'your', 'youtube'
]);

const TIME_LINE_RE =
  /(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[.,](\d{3})/;

function toSeconds(h, m, s, ms) {
  return Number(h || 0) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000;
}

function buildTeamStopwords(teamNames = []) {
  const set = new Set();
  for (const name of teamNames) {
    const toks = String(name || '')
      .toLowerCase()
      .match(/[a-z]+/g);
    if (toks) {
      for (const t of toks) {
        if (t.length >= 2) set.add(t);
      }
    }
  }
  return set;
}

function normalizeCandidateName(raw, extraStopwords) {
  const cleaned = String(raw || '')
    .replace(/[^a-zA-Z'`\-\s]/g, ' ')
    .trim();
  const tokens = cleaned.split(/\s+/).filter((t) => t.length >= 2);
  while (tokens.length > 0 && (STOPWORDS.has(tokens[0].toLowerCase()) || extraStopwords.has(tokens[0].toLowerCase()))) {
    tokens.shift();
  }
  while (
    tokens.length > 0 &&
    (STOPWORDS.has(tokens[tokens.length - 1].toLowerCase()) ||
      extraStopwords.has(tokens[tokens.length - 1].toLowerCase()))
  ) {
    tokens.pop();
  }
  if (tokens.length === 0 || tokens.length > 3) return null;
  if (tokens.some((t) => STOPWORDS.has(t.toLowerCase()) || extraStopwords.has(t.toLowerCase()))) {
    return null;
  }
  if (tokens.length === 1 && tokens[0].length < 3) return null;
  return tokens
    .map((t) => (t === t.toUpperCase() || t === t.toLowerCase() ? t[0].toUpperCase() + t.slice(1).toLowerCase() : t))
    .join(' ');
}

/**
 * Parse berkas subtitle WebVTT atau SRT menjadi cue ber-timestamp.
 */
export function parseSubtitleTextToCues(rawText = '') {
  const lines = String(rawText || '').split(/\r?\n/);
  const cues = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(TIME_LINE_RE);
    if (m) {
      const start_s = Number(toSeconds(m[1], m[2], m[3], m[4]).toFixed(1));
      const end_s = Number(toSeconds(m[5], m[6], m[7], m[8]).toFixed(1));
      i += 1;
      const buf = [];
      while (i < lines.length && lines[i].trim() !== '') {
        buf.push(lines[i]);
        i += 1;
      }
      const text = buf
        .join(' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\[[^\]]+\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) {
        cues.push({ start_s, end_s, text });
      }
    } else {
      i += 1;
    }
  }
  return cues;
}

/**
 * Parse teks daftar susunan pemain, misal:
 * "#10 Marselino Ferdinan", "7. Pratama Arhan", atau satu nama per baris.
 */
export function parseLineupText(rawText = '', teamNames = []) {
  const extraStopwords = buildTeamStopwords(teamNames);
  const lines = String(rawText || '')
    .split(/\r?\n|,|;/)
    .map((l) => l.trim())
    .filter(Boolean);

  const detected = [];
  const seen = new Set();
  const usedSlots = new Set();

  for (const line of lines) {
    const numMatch = line.match(/^(?:#|no\.?|nomor(?:\s+punggung)?)?\s*(\d{1,2})\s*[:.\-)\s]+(.+)$/i);
    let jerseyNumber = null;
    let rawName = line;
    if (numMatch) {
      const n = Number(numMatch[1]);
      if (n >= 1 && n <= 99) {
        jerseyNumber = n;
        rawName = numMatch[2];
      }
    }
    const name = normalizeCandidateName(rawName, extraStopwords);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    let slot = null;
    if (jerseyNumber != null && jerseyNumber >= 1 && jerseyNumber <= 11 && !usedSlots.has(jerseyNumber)) {
      slot = jerseyNumber;
      usedSlots.add(slot);
    }
    detected.push({
      slot_number: slot,
      jersey_number: jerseyNumber,
      name,
      source: 'coach_lineup',
      mentions: 1,
      confidence: 0.95,
      first_seen_s: 0
    });
  }

  let nextSlot = 1;
  for (const dp of detected) {
    if (dp.slot_number == null) {
      while (usedSlots.has(nextSlot) && nextSlot <= 11) nextSlot += 1;
      if (nextSlot <= 11) {
        dp.slot_number = nextSlot;
        usedSlots.add(nextSlot);
      }
    }
  }

  return detected;
}

/**
 * Ekstrak nama pemain dari cue komentar (subtitle .vtt/.srt atau transkrip Web Speech).
 */
export function extractPlayerNamesFromCommentary(cuesOrText, options = {}) {
  const { teamNames = [], source = 'commentary_transcript' } = options;
  const extraStopwords = buildTeamStopwords(teamNames);

  const cues = Array.isArray(cuesOrText)
    ? cuesOrText
    : TIME_LINE_RE.test(String(cuesOrText || ''))
      ? parseSubtitleTextToCues(cuesOrText)
      : String(cuesOrText || '')
          .split(/\r?\n|[.!?]+/)
          .map((t, idx) => ({ start_s: idx * 5, end_s: idx * 5 + 4, text: t.trim() }))
          .filter((c) => c.text.length > 0);

  const numberNameRe =
    /(?:[Nn]omor(?:\s+[Pp]unggung)?|[Nn]o\.?|[Nn]umber|#)\s*(\d{1,2})\s*[:.\-]?\s*([A-Z][a-zA-Z'`\-]{2,}(?:\s+[A-Z][a-zA-Z'`\-]{2,}){0,2})/g;

  const commentaryPatterns = [
    /\b(?:umpan(?:\s+dari|\s+ke|\s+kepada)?|operan(?:\s+dari|\s+ke)?|tembakan(?:\s+dari|\s+oleh)?|tendangan(?:\s+dari|\s+oleh)?|sundulan(?:\s+dari|\s+oleh)?|gol(?:\s+dari|\s+oleh)?|dicetak(?:\s+oleh)?|dikuasai(?:\s+oleh)?|dibawa(?:\s+oleh)?|diterima(?:\s+oleh)?|penyelamatan(?:\s+dari|\s+oleh)?|kiper|kapten|bek|striker|penyerang|gelandang|sayap|bola\s+di\s+kaki)\s+([A-Za-z][a-zA-Z'`\-]{2,}(?:\s+[A-Za-z][a-zA-Z'`\-]{2,})?)/gi,
    /\b([A-Za-z][a-zA-Z'`\-]{2,}(?:\s+[A-Za-z][a-zA-Z'`\-]{2,})?)\s+(?:melepas|melepaskan|mengirim|mengumpan|mengoper|menembak|menendang|menyundul|mencetak|menggiring|memotong|merebut|menyelamatkan)\b/gi,
    /\b(?:pass(?:ed)?\s+(?:from|by|to)|shot\s+by|goal\s+by|scored\s+by|saved\s+by|cross\s+(?:from|by)|goalkeeper|keeper|captain|striker)\s+([A-Za-z][a-zA-Z'`\-]{2,}(?:\s+[A-Za-z][a-zA-Z'`\-]{2,})?)/gi,
    /\b([A-Za-z][a-zA-Z'`\-]{2,}(?:\s+[A-Za-z][a-zA-Z'`\-]{2,})?)\s+(?:shoots|scores|scored|passes|passed|crosses|dribbles|tackles|clears|saves|with\s+the\s+ball)\b/gi
  ];

  const byKey = new Map();
  const mentions = [];

  const register = (name, timeS, jersey, weight) => {
    const key = name.toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, {
        name,
        jersey_number: jersey,
        mentions: 0,
        score: 0,
        first_seen_s: timeS,
        source
      });
    }
    const entry = byKey.get(key);
    entry.mentions += 1;
    entry.score += weight;
    if (jersey != null && entry.jersey_number == null) {
      entry.jersey_number = jersey;
    }
    if (timeS < entry.first_seen_s) entry.first_seen_s = timeS;
    mentions.push({ name, jersey_number: jersey, time_s: timeS, source });
  };

  for (const cue of cues) {
    const text = String(cue?.text || '');
    const tS = Number(cue?.start_s || 0);
    if (!text) continue;

    for (const m of text.matchAll(numberNameRe)) {
      const num = Number(m[1]);
      if (num >= 1 && num <= 99) {
        const cand = normalizeCandidateName(m[2], extraStopwords);
        if (cand) register(cand, tS, num, 3.0);
      }
    }

    for (const pat of commentaryPatterns) {
      for (const m of text.matchAll(pat)) {
        const cand = normalizeCandidateName(m[1], extraStopwords);
        if (cand) register(cand, tS, null, 1.5);
      }
    }
  }

  const ranked = Array.from(byKey.values()).sort((a, b) => {
    const ja = a.jersey_number != null ? 1 : 0;
    const jb = b.jersey_number != null ? 1 : 0;
    if (jb !== ja) return jb - ja;
    if (b.score !== a.score) return b.score - a.score;
    return b.mentions - a.mentions;
  });

  const usedSlots = new Set();
  const detectedPlayers = ranked.slice(0, 15).map((r) => {
    let slot = null;
    if (r.jersey_number != null && r.jersey_number >= 1 && r.jersey_number <= 11 && !usedSlots.has(r.jersey_number)) {
      slot = r.jersey_number;
      usedSlots.add(slot);
    }
    return {
      slot_number: slot,
      jersey_number: r.jersey_number,
      name: r.name,
      source: r.source,
      mentions: r.mentions,
      confidence: Number(Math.min(0.95, 0.45 + 0.1 * Math.min(5, r.mentions)).toFixed(2)),
      first_seen_s: r.first_seen_s
    };
  });

  let nextSlot = 1;
  for (const dp of detectedPlayers) {
    if (dp.slot_number == null) {
      while (usedSlots.has(nextSlot) && nextSlot <= 11) nextSlot += 1;
      if (nextSlot <= 11) {
        dp.slot_number = nextSlot;
        usedSlots.add(nextSlot);
      }
    }
  }

  return { detectedPlayers, mentions };
}

/**
 * Terapkan nama pemain terdeteksi ke daftar event berdasarkan kedekatan waktu komentar
 * atau nomor slot pemain.
 */
export function attachDetectedNamesToEvents(events = [], detectedPlayers = [], mentions = []) {
  if (!Array.isArray(events) || events.length === 0 || !Array.isArray(detectedPlayers) || detectedPlayers.length === 0) {
    return events;
  }
  const bySlot = new Map();
  const byJersey = new Map();
  for (const dp of detectedPlayers) {
    if (!dp?.name) continue;
    if (dp.slot_number != null) bySlot.set(Number(dp.slot_number), dp.name);
    if (dp.jersey_number != null) byJersey.set(Number(dp.jersey_number), dp.name);
  }

  return events.map((evt) => {
    if (!evt || evt.team !== 'own') return evt;
    let matchedName = evt.player_name || null;

    if (!matchedName && evt.video_time_s != null && Array.isArray(mentions) && mentions.length > 0) {
      const tVal = Number(evt.video_time_s);
      let bestDt = 8.1;
      for (const m of mentions) {
        const dt = Math.abs(Number(m.time_s) - tVal);
        if (dt < bestDt) {
          bestDt = dt;
          matchedName = m.name;
        }
      }
    }

    if (!matchedName && evt.player_number != null) {
      const num = Number(evt.player_number);
      matchedName = byJersey.get(num) || bySlot.get(num) || null;
    }

    return matchedName ? { ...evt, player_name: matchedName } : evt;
  });
}
