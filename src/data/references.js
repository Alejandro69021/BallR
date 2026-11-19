/**
 * ==============================================================================
 * BallR Credible References Registry
 * Kepatuhan: Setiap klaim analitik, tolok ukur, & panduan wajib merujuk entri di sini.
 * ATURAN: Diisi HANYA dari berkas resmi docs/REFERENCES_SEED.md. Dilarang menambah atau mengubah entri.
 * ==============================================================================
 *
 * @typedef {Object} ReferenceEntry
 * @property {string} id
 * @property {string} title
 * @property {string} publisher
 * @property {number|string} year
 * @property {'curriculum'|'framework'|'paper'|'standard'|'law'} type
 * @property {string} url
 * @property {string} section
 * @property {string} verified_on
 * @property {'located'|'unverified'} status
 * @property {string} notes
 */

/**
 * Daftar rujukan resmi terverifikasi disemai persis dari docs/REFERENCES_SEED.md.
 * @type {ReferenceEntry[]}
 */
export const REFERENCES_REGISTRY = [
  {
    id: "pssi-kurikulum-filanesia",
    title: "Kurikulum Pembinaan Sepak Bola Indonesia (Filanesia)",
    publisher: "PSSI (Persatuan Sepakbola Seluruh Indonesia); Danurwindo et al.",
    year: "",
    type: "curriculum",
    url: "",
    section: "",
    verified_on: "",
    status: "unverified",
    notes: "Original PDF must be supplied in docs/source/. Secondary summary: https://www.goodnewsfromindonesia.id/2018/05/06/inilah-filosofi-sepak-bola-indonesia"
  },
  {
    id: "fifa-tcp-spiralling-up",
    title: "Spiralling up: The long-term development process",
    publisher: "FIFA Talent Coach Programme - Training Framework",
    year: 2024,
    type: "framework",
    url: "https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/training-framework/spiralling-up--the-long-term-development-process.php",
    section: "",
    verified_on: "",
    status: "located",
    notes: "Describes a spiral curriculum for long-term development."
  },
  {
    id: "fifa-tcp-scales-of-the-game",
    title: "Scales of the game: Using different lenses to improve player development",
    publisher: "FIFA Talent Coach Programme - Training Framework",
    year: 2024,
    type: "framework",
    url: "https://fifatrainingcentre.com/en/practice/talent-coach-programme/training-framework/scales-of-the-game.php",
    section: "",
    verified_on: "",
    status: "located",
    notes: "Player, unit and team scales."
  },
  {
    id: "fifa-grassroots-general-principles",
    title: "General Principles: Creating a fun, safe and effective playing environment (Principles 1-3)",
    publisher: "FIFA Grassroots Coaching Essentials",
    year: 2025,
    type: "framework",
    url: "https://fifatrainingcentre.com/en/practice/grassroots/grassroots-and-youth-football-essentials/grassroots-coaching-essentials/jene-general-principles-1.php",
    section: "Principles 1-3",
    verified_on: "",
    status: "located",
    notes: "Ages 6-15. Part 2 (principles 4-6): https://www.fifatrainingcentre.com/en/practice/grassroots/grassroots-and-youth-football-essentials/grassroots-coaching-essentials/jene-general-principles-2.php"
  },
  {
    id: "fifa-grassroots-play-practice-play",
    title: "Ages 4-8: An introduction to Play-Practice-Play",
    publisher: "FIFA Grassroots Coaching Essentials",
    year: 2025,
    type: "framework",
    url: "https://www.fifatrainingcentre.com/en/practice/grassroots/grassroots-and-youth-football-essentials/grassroots-coaching-essentials/an-introduction-to-play-practice-play.php",
    section: "",
    verified_on: "",
    status: "located",
    notes: "Written for ages 4-8; check age applicability before using for U-13."
  },
  {
    id: "fifa-grassroots-progressive-12-15",
    title: "Ages 12-15: Introduction to the progressive methodology",
    publisher: "FIFA Grassroots Coaching Essentials",
    year: 2025,
    type: "framework",
    url: "https://www.fifatrainingcentre.com/en/practice/grassroots/grassroots-and-youth-football-essentials/grassroots-coaching-essentials/introduction-to-the-progressive-methodology.php",
    section: "",
    verified_on: "",
    status: "located",
    notes: ""
  },
  {
    id: "biobanding-review",
    title: "Review of maturity-matching and bio-banding in youth sport",
    publisher: "",
    year: "",
    type: "paper",
    url: "https://core.ac.uk/download/334409909.pdf",
    section: "",
    verified_on: "",
    status: "located",
    notes: "States percentage of predicted adult height as the maturity estimate of choice."
  },
  {
    id: "sweeney-2023-maturation-position",
    title: "The selection advantages associated with advanced biological maturation vary according to playing position in national-level youth soccer",
    publisher: "Sweeney L, Cumming SP, MacNamara A, Horan D",
    year: 2023,
    type: "paper",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10286617",
    section: "",
    verified_on: "",
    status: "located",
    notes: "159 players U13-U16, Football Association of Ireland pathway; Khamis-Roche %PAH."
  },
  {
    id: "hill-2020-relative-age-maturation",
    title: "Relative age and maturation selection biases in academy football",
    publisher: "Hill M, Scott S, Malina RM, McGee D, Cumming SP. Journal of Sports Sciences 38(11-12)",
    year: 2020,
    type: "paper",
    url: "https://eprints.leedsbeckett.ac.uk/id/eprint/9001/7/RelativeAgeAndMaturationSelectionBiasesInAcademyFootballAM-HILL.pdf",
    section: "",
    verified_on: "",
    status: "located",
    notes: ""
  },
  {
    id: "somatic-maturity-method-comparison",
    title: "Estimating somatic maturity in adolescent soccer players: Methodological comparisons",
    publisher: "",
    year: "",
    type: "paper",
    url: "https://ray.yorksj.ac.uk/5319/1/Estimating%20somatic%20maturity%20in%20adolescent%20soccer%20players%20Methodlogical%20comparisons.pdf",
    section: "",
    verified_on: "",
    status: "located",
    notes: "Reports that maturity-offset and predicted-adult-height methods should not be used interchangeably; apply one consistently."
  },
  {
    id: "khamis-roche-1994",
    title: "Predicting adult stature without using skeletal age: the Khamis-Roche method",
    publisher: "Khamis HJ, Roche AF",
    year: 1994,
    type: "paper",
    url: "",
    section: "",
    verified_on: "",
    status: "unverified",
    notes: "Cited by the secondary sources above. Primary publication and coefficient tables must be supplied by the owner in docs/data/. Reported median error about 2.2 cm per Premier League Growth Study slides (Cumming, SPRINZ)."
  },
  {
    id: "vaep-decroos-2019",
    title: "Actions Speak Louder than Goals: Valuing Player Actions in Soccer",
    publisher: "Decroos T, Bransen L, Van Haaren J, Davis J. KDD 2019",
    year: 2019,
    type: "paper",
    url: "https://arxiv.org/abs/1802.07127",
    section: "",
    verified_on: "",
    status: "located",
    notes: "Not used as a displayed metric in this app; reference only."
  },
  {
    id: "socceraction-docs",
    title: "socceraction - VAEP documentation",
    publisher: "KU Leuven ML-KULeuven / socceraction",
    year: "",
    type: "standard",
    url: "https://socceraction.readthedocs.io/en/latest/documentation/valuing_actions/vaep.html",
    section: "",
    verified_on: "",
    status: "located",
    notes: "SPADL action language. Reference for future event-data export only."
  },
  {
    id: "fifa-epts-data-format",
    title: "EPTS Standard Data Format",
    publisher: "FIFA",
    year: "",
    type: "standard",
    url: "https://inside.fifa.com/innovation/standards/epts/research-development-epts-standard-data-format",
    section: "",
    verified_on: "",
    status: "located",
    notes: "Standard for tracking-data transfer."
  },
  {
    id: "cdf-2025",
    title: "Common Data Format (CDF): A Standardized Format for Match-Data in Football (Soccer)",
    publisher: "Anzer G, Arnsmeyer K, Bauer P, Bekkers J, Brefeld U, Davis J, et al.",
    year: 2025,
    type: "standard",
    url: "https://arxiv.org/pdf/2505.15820",
    section: "",
    verified_on: "",
    status: "located",
    notes: ""
  },
  {
    id: "uu-pdp-27-2022-pasal-25",
    title: "Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, Pasal 25",
    publisher: "Republik Indonesia",
    year: 2022,
    type: "law",
    url: "https://id.wikisource.org/wiki/Undang-Undang_Republik_Indonesia_Nomor_27_Tahun_2022",
    section: "Pasal 25 ayat (1)-(2): pemrosesan data pribadi anak wajib mendapat persetujuan orang tua dan/atau wali",
    verified_on: "",
    status: "located",
    notes: "Wikisource copy; confirm against the official gazette. Legal review required."
  },
  {
    id: "pp-33-2026",
    title: "Peraturan Pemerintah No. 33 Tahun 2026 (pelaksanaan UU PDP)",
    publisher: "Pemerintah Republik Indonesia",
    year: 2026,
    type: "law",
    url: "https://teknologi.bisnis.com/read/20260829/84/1999753/aturan-turunan-uu-pdp-persetujuan-data-konsumen-lebih-ketat",
    section: "",
    verified_on: "",
    status: "unverified",
    notes: "Only a news report was found; the regulation text has not been read. Do not cite specific articles until reviewed by legal counsel."
  }
];

/**
 * Mengambil entri referensi berdasarkan ID unik.
 * @param {string} id
 * @returns {ReferenceEntry|undefined}
 */
export function getReferenceById(id) {
  if (!id) return undefined;
  return REFERENCES_REGISTRY.find((ref) => ref.id === id);
}

/**
 * Mengambil kumpulan referensi berdasarkan array ID.
 * @param {string[]} ids
 * @returns {ReferenceEntry[]}
 */
export function getReferencesByIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  return REFERENCES_REGISTRY.filter((ref) => ids.includes(ref.id));
}

/**
 * Memvalidasi apakah sebuah klaim memiliki referensi yang sah.
 * @param {string|string[]} referenceIds
 * @throws {Error} Jika referensi kosong atau tidak terdaftar
 */
export function assertValidReference(referenceIds) {
  const ids = Array.isArray(referenceIds) ? referenceIds : [referenceIds];
  const validIds = ids.filter((id) => typeof id === 'string' && id.trim().length > 0);

  if (validIds.length === 0) {
    throw new Error(
      'Pelanggaran Prinsip Data Honesty: Komponen panduan/analitik tidak boleh dirender tanpa minimal satu referenceId terverifikasi.'
    );
  }

  const missing = validIds.filter((id) => !getReferenceById(id));
  if (missing.length > 0) {
    throw new Error(
      `Referensi tidak ditemukan dalam registry terverifikasi: ${missing.join(', ')}`
    );
  }

  return true;
}
