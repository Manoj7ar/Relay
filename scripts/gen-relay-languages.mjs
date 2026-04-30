#!/usr/bin/env node
/**
 * Generates src/lib/relayLanguages.generated.ts from FLORES-200 language codes.
 * Source: https://github.com/facebookresearch/flores/blob/main/flores200/README.md
 * ISO 639-3 → 639-1: scripts/iso6393-to-1.mjs (from iso-639-3 package, MIT).
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { iso6393To1 } from './iso6393-to-1.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/lib/relayLanguages.generated.ts');

/** Table body from "Languages in FLORES-200" (pipe-separated). */
const TABLE = `
| Acehnese (Arabic script) | ace_Arab |
| Acehnese (Latin script) | ace_Latn |
| Mesopotamian Arabic | acm_Arab |
| Ta'izzi-Adeni Arabic | acq_Arab |
| Tunisian Arabic | aeb_Arab |
| Afrikaans | afr_Latn |
| South Levantine Arabic | ajp_Arab |
| Akan | aka_Latn |
| Amharic | amh_Ethi |
| North Levantine Arabic | apc_Arab |
| Modern Standard Arabic | arb_Arab |
| Modern Standard Arabic (Romanized) | arb_Latn |
| Najdi Arabic | ars_Arab |
| Moroccan Arabic | ary_Arab |
| Egyptian Arabic | arz_Arab |
| Assamese | asm_Beng |
| Asturian | ast_Latn |
| Awadhi | awa_Deva |
| Central Aymara | ayr_Latn |
| South Azerbaijani | azb_Arab |
| North Azerbaijani | azj_Latn |
| Bashkir | bak_Cyrl |
| Bambara | bam_Latn |
| Balinese | ban_Latn |
| Belarusian | bel_Cyrl |
| Bemba | bem_Latn |
| Bengali | ben_Beng |
| Bhojpuri | bho_Deva |
| Banjar (Arabic script) | bjn_Arab |
| Banjar (Latin script) | bjn_Latn |
| Standard Tibetan | bod_Tibt |
| Bosnian | bos_Latn |
| Buginese | bug_Latn |
| Bulgarian | bul_Cyrl |
| Catalan | cat_Latn |
| Cebuano | ceb_Latn |
| Czech | ces_Latn |
| Chokwe | cjk_Latn |
| Central Kurdish | ckb_Arab |
| Crimean Tatar | crh_Latn |
| Welsh | cym_Latn |
| Danish | dan_Latn |
| German | deu_Latn |
| Southwestern Dinka | dik_Latn |
| Dyula | dyu_Latn |
| Dzongkha | dzo_Tibt |
| Greek | ell_Grek |
| English | eng_Latn |
| Esperanto | epo_Latn |
| Estonian | est_Latn |
| Basque | eus_Latn |
| Ewe | ewe_Latn |
| Faroese | fao_Latn |
| Fijian | fij_Latn |
| Finnish | fin_Latn |
| Fon | fon_Latn |
| French | fra_Latn |
| Friulian | fur_Latn |
| Nigerian Fulfulde | fuv_Latn |
| Scottish Gaelic | gla_Latn |
| Irish | gle_Latn |
| Galician | glg_Latn |
| Guarani | grn_Latn |
| Gujarati | guj_Gujr |
| Haitian Creole | hat_Latn |
| Hausa | hau_Latn |
| Hebrew | heb_Hebr |
| Hindi | hin_Deva |
| Chhattisgarhi | hne_Deva |
| Croatian | hrv_Latn |
| Hungarian | hun_Latn |
| Armenian | hye_Armn |
| Igbo | ibo_Latn |
| Ilocano | ilo_Latn |
| Indonesian | ind_Latn |
| Icelandic | isl_Latn |
| Italian | ita_Latn |
| Javanese | jav_Latn |
| Japanese | jpn_Jpan |
| Kabyle | kab_Latn |
| Jingpho | kac_Latn |
| Kamba | kam_Latn |
| Kannada | kan_Knda |
| Kashmiri (Arabic script) | kas_Arab |
| Kashmiri (Devanagari script) | kas_Deva |
| Georgian | kat_Geor |
| Central Kanuri (Arabic script) | knc_Arab |
| Central Kanuri (Latin script) | knc_Latn |
| Kazakh | kaz_Cyrl |
| Kabiyè | kbp_Latn |
| Kabuverdianu | kea_Latn |
| Khmer | khm_Khmr |
| Kikuyu | kik_Latn |
| Kinyarwanda | kin_Latn |
| Kyrgyz | kir_Cyrl |
| Kimbundu | kmb_Latn |
| Northern Kurdish | kmr_Latn |
| Kikongo | kon_Latn |
| Korean | kor_Hang |
| Lao | lao_Laoo |
| Ligurian | lij_Latn |
| Limburgish | lim_Latn |
| Lingala | lin_Latn |
| Lithuanian | lit_Latn |
| Lombard | lmo_Latn |
| Latgalian | ltg_Latn |
| Luxembourgish | ltz_Latn |
| Luba-Kasai | lua_Latn |
| Ganda | lug_Latn |
| Luo | luo_Latn |
| Mizo | lus_Latn |
| Standard Latvian | lvs_Latn |
| Magahi | mag_Deva |
| Maithili | mai_Deva |
| Malayalam | mal_Mlym |
| Marathi | mar_Deva |
| Minangkabau (Arabic script) | min_Arab |
| Minangkabau (Latin script) | min_Latn |
| Macedonian | mkd_Cyrl |
| Plateau Malagasy | plt_Latn |
| Maltese | mlt_Latn |
| Meitei (Bengali script) | mni_Beng |
| Halh Mongolian | khk_Cyrl |
| Mossi | mos_Latn |
| Maori | mri_Latn |
| Burmese | mya_Mymr |
| Dutch | nld_Latn |
| Norwegian Nynorsk | nno_Latn |
| Norwegian Bokmål | nob_Latn |
| Nepali | npi_Deva |
| Northern Sotho | nso_Latn |
| Nuer | nus_Latn |
| Nyanja | nya_Latn |
| Occitan | oci_Latn |
| West Central Oromo | gaz_Latn |
| Odia | ory_Orya |
| Pangasinan | pag_Latn |
| Eastern Panjabi | pan_Guru |
| Papiamento | pap_Latn |
| Western Persian | pes_Arab |
| Polish | pol_Latn |
| Portuguese | por_Latn |
| Dari | prs_Arab |
| Southern Pashto | pbt_Arab |
| Ayacucho Quechua | quy_Latn |
| Romanian | ron_Latn |
| Rundi | run_Latn |
| Russian | rus_Cyrl |
| Sango | sag_Latn |
| Sanskrit | san_Deva |
| Santali | sat_Olck |
| Sicilian | scn_Latn |
| Shan | shn_Mymr |
| Sinhala | sin_Sinh |
| Slovak | slk_Latn |
| Slovenian | slv_Latn |
| Samoan | smo_Latn |
| Shona | sna_Latn |
| Sindhi | snd_Arab |
| Somali | som_Latn |
| Southern Sotho | sot_Latn |
| Spanish | spa_Latn |
| Tosk Albanian | als_Latn |
| Sardinian | srd_Latn |
| Serbian | srp_Cyrl |
| Swati | ssw_Latn |
| Sundanese | sun_Latn |
| Swedish | swe_Latn |
| Swahili | swh_Latn |
| Silesian | szl_Latn |
| Tamil | tam_Taml |
| Tatar | tat_Cyrl |
| Telugu | tel_Telu |
| Tajik | tgk_Cyrl |
| Tagalog | tgl_Latn |
| Thai | tha_Thai |
| Tigrinya | tir_Ethi |
| Tamasheq (Latin script) | taq_Latn |
| Tamasheq (Tifinagh script) | taq_Tfng |
| Tok Pisin | tpi_Latn |
| Tswana | tsn_Latn |
| Tsonga | tso_Latn |
| Turkmen | tuk_Latn |
| Tumbuka | tum_Latn |
| Turkish | tur_Latn |
| Twi | twi_Latn |
| Central Atlas Tamazight | tzm_Tfng |
| Uyghur | uig_Arab |
| Ukrainian | ukr_Cyrl |
| Umbundu | umb_Latn |
| Urdu | urd_Arab |
| Northern Uzbek | uzn_Latn |
| Venetian | vec_Latn |
| Vietnamese | vie_Latn |
| Waray | war_Latn |
| Wolof | wol_Latn |
| Xhosa | xho_Latn |
| Eastern Yiddish | ydd_Hebr |
| Yoruba | yor_Latn |
| Yue Chinese | yue_Hant |
| Chinese (Simplified) | zho_Hans |
| Chinese (Traditional) | zho_Hant |
| Standard Malay | zsm_Latn |
| Zulu | zul_Latn |
`;

function parseTable() {
  const rows = [];
  for (const line of TABLE.split('\n')) {
    const m = line.match(/^\| ([^|]+) \| ([a-z]{3}_[A-Za-z0-9]+) \|$/);
    if (!m) continue;
    rows.push({ name: m[1].trim(), flores: m[2].trim() });
  }
  return rows;
}

/** ISO 639-1 → default ISO 15924 script tag used in FLORES when script can be omitted. */
const DEFAULT_SCRIPT_BY_ISO1 = {
  ar: 'Arab',
  fa: 'Arab',
  ur: 'Arab',
  ps: 'Arab',
  sd: 'Arab',
  ug: 'Arab',
  he: 'Hebr',
  yi: 'Hebr',
  hi: 'Deva',
  mr: 'Deva',
  ne: 'Deva',
  sa: 'Deva',
  bo: 'Tibt',
  dz: 'Tibt',
  ka: 'Geor',
  ko: 'Hang',
  ja: 'Jpan',
  si: 'Sinh',
  th: 'Thai',
  my: 'Mymr',
  km: 'Khmr',
  am: 'Ethi',
  ti: 'Ethi',
  ru: 'Cyrl',
  uk: 'Cyrl',
  bg: 'Cyrl',
  mk: 'Cyrl',
  sr: 'Cyrl',
  be: 'Cyrl',
  kk: 'Cyrl',
  ky: 'Cyrl',
  tt: 'Cyrl',
  tg: 'Cyrl',
  ba: 'Cyrl',
  mn: 'Cyrl',
  el: 'Grek',
  hy: 'Armn',
  ta: 'Taml',
  te: 'Telu',
  kn: 'Knda',
  ml: 'Mlym',
  or: 'Orya',
  as: 'Beng',
  bn: 'Beng',
  gu: 'Gujr',
  pa: 'Guru',
  lo: 'Laoo',
};

const FL_SCRIPT_TO_BCP_SUBTAG = {
  Latn: 'Latn',
  Arab: 'Arab',
  Cyrl: 'Cyrl',
  Deva: 'Deva',
  Ethi: 'Ethi',
  Geor: 'Geor',
  Grek: 'Grek',
  Hebr: 'Hebr',
  Jpan: 'Jpan',
  Hang: 'Hang',
  Khmr: 'Khmr',
  Knda: 'Knda',
  Laoo: 'Laoo',
  Mlym: 'Mlym',
  Mymr: 'Mymr',
  Orya: 'Orya',
  Sinh: 'Sinh',
  Taml: 'Taml',
  Telu: 'Telu',
  Thai: 'Thai',
  Tibt: 'Tibt',
  Tfng: 'Tfng',
  Beng: 'Beng',
  Gujr: 'Gujr',
  Guru: 'Guru',
  Olck: 'Olck',
  Armn: 'Armn',
};

/** ISO 639-3 → preferred BCP-47 primary when iso6393To1 omits the code. */
const ISO3_EXTRA = {
  ace: 'ace',
  acm: 'ar',
  acq: 'ar',
  aeb: 'ar',
  ajp: 'ar',
  als: 'sq',
  apc: 'ar',
  arb: 'ar',
  ars: 'ar',
  ary: 'ar',
  arz: 'ar',
  ast: 'ast',
  ayr: 'ay',
  azb: 'az',
  azj: 'az',
  ban: 'ban',
  bjn: 'bjn',
  bug: 'bug',
  ceb: 'ceb',
  cjk: 'cjk',
  ckb: 'ckb',
  crh: 'crh',
  dik: 'dik',
  dyu: 'dyu',
  fon: 'fon',
  fuv: 'ff',
  gaz: 'om',
  grn: 'gn',
  hne: 'hne',
  ibo: 'ig',
  ilo: 'ilo',
  jav: 'jv',
  kab: 'kab',
  kac: 'kac',
  kam: 'kam',
  kas: 'ks',
  kat: 'ka',
  kbp: 'kbp',
  kea: 'kea',
  khk: 'mn',
  kik: 'ki',
  kin: 'rw',
  kir: 'ky',
  kmb: 'kmb',
  kmr: 'ku',
  knc: 'knc',
  kon: 'kg',
  lim: 'li',
  lin: 'ln',
  lij: 'lij',
  lmo: 'lmo',
  ltg: 'ltg',
  lua: 'lua',
  lug: 'lg',
  luo: 'luo',
  lus: 'lus',
  lvs: 'lv',
  mag: 'mag',
  mai: 'mai',
  min: 'min',
  mos: 'mos',
  mni: 'mni',
  npi: 'ne',
  nus: 'nus',
  oci: 'oc',
  ory: 'or',
  pag: 'pag',
  pap: 'pap',
  pbt: 'ps',
  pes: 'fa',
  plt: 'mg',
  prs: 'fa',
  quy: 'qu',
  run: 'rn',
  sag: 'sg',
  sat: 'sat',
  scn: 'scn',
  sna: 'sn',
  sot: 'st',
  srd: 'sc',
  ssw: 'ss',
  sun: 'su',
  swh: 'sw',
  szl: 'szl',
  taq: 'taq',
  tum: 'tum',
  tzm: 'tzm',
  uig: 'ug',
  umb: 'umb',
  vec: 'vec',
  war: 'war',
  ydd: 'yi',
  yue: 'yue',
  zho: 'zh',
  zsm: 'ms',
};

const FORCE_FLORES = {
  zho_Hans: 'zh-Hans',
  zho_Hant: 'zh-Hant',
  yue_Hant: 'yue-Hant',
  nob_Latn: 'nb',
  nno_Latn: 'nn',
  eng_Latn: 'en-US',
  spa_Latn: 'es',
  por_Latn: 'pt',
  fra_Latn: 'fr',
  deu_Latn: 'de',
  nld_Latn: 'nl',
  ita_Latn: 'it',
  pol_Latn: 'pl',
  rus_Cyrl: 'ru',
  pes_Arab: 'fa',
  prs_Arab: 'fa-AF',
  pbt_Arab: 'ps',
  arb_Latn: 'ar-Latn',
  taq_Latn: 'taq-Latn',
  taq_Tfng: 'taq-Tfng',
};

const ARABIC_ARAB_SCRIPT = new Set([
  'acm_Arab',
  'acq_Arab',
  'aeb_Arab',
  'ajp_Arab',
  'apc_Arab',
  'arb_Arab',
  'ars_Arab',
  'ary_Arab',
  'arz_Arab',
]);

function primaryFromIso3(iso3) {
  return ISO3_EXTRA[iso3] ?? iso6393To1[iso3] ?? iso3;
}

function floresToBcp47(flores) {
  if (FORCE_FLORES[flores]) return FORCE_FLORES[flores];
  if (ARABIC_ARAB_SCRIPT.has(flores)) return 'ar';

  const [iso3, script] = flores.split('_');
  const p = primaryFromIso3(iso3);
  const sub = FL_SCRIPT_TO_BCP_SUBTAG[script];
  if (!sub) throw new Error(`Unknown script ${script} for ${flores}`);

  if (sub === 'Latn') {
    if (p.length === 2) return p;
    return p;
  }

  if (p.length === 2 && DEFAULT_SCRIPT_BY_ISO1[p] === sub) {
    return p;
  }

  if (p.length === 2) {
    return `${p}-${sub}`;
  }

  if (sub === 'Latn') return p;

  return `${p}-${sub}`;
}

function main() {
  const raw = parseTable();
  if (raw.length !== 204) {
    console.error('Expected 204 FLORES rows, got', raw.length);
    process.exit(1);
  }

  const byBcp = new Map();
  for (const { name, flores } of raw) {
    let bcp;
    try {
      bcp = floresToBcp47(flores);
    } catch (e) {
      console.error(flores, e);
      process.exit(1);
    }
    if (bcp === 'ar' && ARABIC_ARAB_SCRIPT.has(flores)) {
      if (!byBcp.has('ar')) {
        byBcp.set('ar', 'Arabic');
      }
      continue;
    }
    if (!byBcp.has(bcp)) {
      byBcp.set(bcp, name);
    } else {
      const prev = byBcp.get(bcp);
      if (name.length < prev.length) byBcp.set(bcp, name);
    }
  }

  const options = [...byBcp.entries()]
    .map(([code, label]) => ({ code, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'en'));

  const header = `/**
 * Generated by scripts/gen-relay-languages.mjs — do not edit by hand.
 * FLORES-200 language list → BCP-47 (Gemma docs cite 140+ pretrained langs without an official code table).
 */

`;

  const body = `export const PRIMARY_LANGUAGE_OPTIONS: readonly {
  readonly code: string;
  readonly label: string;
}[] = ${JSON.stringify(options, null, 2)} as const;
`;

  writeFileSync(OUT, header + body, 'utf8');
  console.log('Wrote', OUT, '—', options.length, 'locales');
}

main();
