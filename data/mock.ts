/**
 * MetroPulse Baku - Mock Data Layer
 *
 * Realistic mock data for Baku Metro stations.
 * All demand figures are illustrative and designed to be replaced
 * with real data from Supabase once the ETL pipeline is live.
 *
 * Data reflects station-entry / validation counts only.
 * No origin-destination or journey path data is implied.
 */

import {
  Station,
  StationWithDemand,
  StationExit,
  WeatherObservation,
  IntradayProfile,
  StationForecast,
  StationBaseline,
  StationDailyDemand,
  getDemandLevel,
  getDemandLabel,
} from "@/types";

// ─── Stations ─────────────────────────────────────────────────────────────────

export const MOCK_STATIONS: Station[] = [
  {
    id: "st-001",
    slug: "icheri-sheher",
    name: "İçəri Şəhər",
    nameAz: "İçəri Şəhər",
    line: "red",
    lat: 40.3664,
    lon: 49.8373,
    stationType: "central",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-002",
    slug: "sahil",
    name: "Sahil",
    nameAz: "Sahil",
    line: "red",
    lat: 40.3703,
    lon: 49.8431,
    stationType: "central",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-003",
    slug: "28-may",
    name: "28 May",
    nameAz: "28 May",
    line: "red",
    lat: 40.3795,
    lon: 49.8519,
    stationType: "transfer",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-004",
    slug: "ganjlik",
    name: "Gənclik",
    nameAz: "Gənclik",
    line: "red",
    lat: 40.3912,
    lon: 49.8567,
    stationType: "mixed",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-005",
    slug: "nariman-narimanov",
    name: "Nəriman Nərimanov",
    nameAz: "Nəriman Nərimanov",
    line: "red",
    lat: 40.4012,
    lon: 49.8612,
    stationType: "commuter",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-006",
    slug: "bakmil",
    name: "Bakmil",
    nameAz: "Bakmil",
    line: "red",
    lat: 40.4112,
    lon: 49.8679,
    stationType: "residential",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-007",
    slug: "ulduz",
    name: "Ulduz",
    nameAz: "Ulduz",
    line: "red",
    lat: 40.4208,
    lon: 49.8731,
    stationType: "residential",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-008",
    slug: "koroglu",
    name: "Koroğlu",
    nameAz: "Koroğlu",
    line: "red",
    lat: 40.431,
    lon: 49.8795,
    stationType: "commuter",
    openedYear: 1976,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-009",
    slug: "hazi-aslanov",
    name: "Həzi Aslanov",
    nameAz: "Həzi Aslanov",
    line: "red",
    lat: 40.4156,
    lon: 49.9023,
    stationType: "commuter",
    openedYear: 1985,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  // Green Line
  {
    id: "st-010",
    slug: "darnagul",
    name: "Dərnəgül",
    nameAz: "Dərnəgül",
    line: "green",
    lat: 40.4423,
    lon: 49.8312,
    stationType: "residential",
    openedYear: 2016,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-011",
    slug: "avtovagzal",
    name: "Avtovağzal",
    nameAz: "Avtovağzal",
    line: "purple",
    lat: 40.4289,
    lon: 49.8231,
    stationType: "transfer",
    openedYear: 2016,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-012",
    slug: "memar-ajami",
    name: "Memar Əcəmi",
    nameAz: "Memar Əcəmi",
    line: "purple",
    lat: 40.4089,
    lon: 49.8173,
    stationType: "mixed",
    openedYear: 1985,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-013",
    slug: "nizami",
    name: "Nizami",
    nameAz: "Nizami",
    line: "green",
    lat: 40.3823,
    lon: 49.8456,
    stationType: "central",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-014",
    slug: "elmler-akademiyasi",
    name: "Elmlər Akademiyası",
    nameAz: "Elmlər Akademiyası",
    line: "green",
    lat: 40.3756,
    lon: 49.8512,
    stationType: "business",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-015",
    slug: "inshaatchilar",
    name: "İnşaatçılar",
    nameAz: "İnşaatçılar",
    line: "green",
    lat: 40.3678,
    lon: 49.8289,
    stationType: "residential",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-016",
    slug: "khalglar-dostlugu",
    name: "Xalqlar Dostluğu",
    nameAz: "Xalqlar Dostluğu",
    line: "green",
    lat: 40.3589,
    lon: 49.8167,
    stationType: "commuter",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-017",
    slug: "ahmedli",
    name: "Əhmədli",
    nameAz: "Əhmədli",
    line: "green",
    lat: 40.3489,
    lon: 49.8056,
    stationType: "residential",
    openedYear: 1976,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-018",
    slug: "hojasan",
    name: "Khojasan",
    nameAz: "Khojasan",
    line: "purple",
    lat: 40.3389,
    lon: 49.7956,
    stationType: "residential",
    openedYear: 1985,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-020",
    slug: "khatai",
    name: "Xətai",
    nameAz: "Xətai",
    line: "red",
    lat: 40.3934,
    lon: 49.8712,
    stationType: "mixed",
    openedYear: 1967,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-021",
    slug: "20-yanvar",
    name: "20 Yanvar",
    nameAz: "20 Yanvar",
    line: "red",
    lat: 40.4058,
    lon: 49.8093,
    stationType: "commuter",
    openedYear: 1981,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-022",
    slug: "8-noyabr",
    name: "8 Noyabr",
    nameAz: "8 Noyabr",
    line: "purple",
    lat: 40.3981,
    lon: 49.8474,
    stationType: "mixed",
    openedYear: 2022,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-023",
    slug: "azadliq-prospekti",
    name: "Azadlıq Prospekti",
    nameAz: "Azadlıq Prospekti",
    line: "red",
    lat: 40.4235,
    lon: 49.8244,
    stationType: "residential",
    openedYear: 2009,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-024",
    slug: "jafar-cabbarli",
    name: "Cəfər Cabbarlı",
    nameAz: "Cəfər Cabbarlı",
    line: "green",
    lat: 40.3791,
    lon: 49.8515,
    stationType: "transfer",
    openedYear: 1993,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-025",
    slug: "memar-ajami-2",
    name: "Memar Əcəmi-2",
    nameAz: "Memar Əcəmi-2",
    line: "red",
    lat: 40.4095,
    lon: 49.8182,
    stationType: "transfer",
    openedYear: 2016,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-026",
    slug: "nasimi",
    name: "Nəsimi",
    nameAz: "Nəsimi",
    line: "red",
    lat: 40.4138,
    lon: 49.8226,
    stationType: "residential",
    openedYear: 1985,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-027",
    slug: "neftchilar",
    name: "Neftçilər",
    nameAz: "Neftçilər",
    line: "green",
    lat: 40.4211,
    lon: 49.9446,
    stationType: "commuter",
    openedYear: 1972,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "st-028",
    slug: "qara-qarayev",
    name: "Qara Qarayev",
    nameAz: "Qara Qarayev",
    line: "green",
    lat: 40.4172,
    lon: 49.9381,
    stationType: "mixed",
    openedYear: 1972,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

// ─── Demand helpers ───────────────────────────────────────────────────────────

// Illustrative daily demand baselines per station (entries)
const STATION_BASELINES: Record<string, number> = {
  "st-001": 14200, // İçəri Şəhər – central tourist hub
  "st-002": 18500, // Sahil – high business/retail
  "st-003": 32000, // 28 May – major transfer node
  "st-004": 22000, // Gənclik – busy mixed
  "st-005": 17800, // Nəriman Nərimanov
  "st-006": 9800, // Bakmil – residential
  "st-007": 11200, // Ulduz – residential
  "st-008": 15600, // Koroğlu
  "st-009": 19300, // Həzi Aslanov – commuter
  "st-010": 8700, // Dərnəgül
  "st-011": 12400, // Avtovağzal
  "st-012": 16900, // Memar Əcəmi
  "st-013": 24100, // Nizami – central shopping
  "st-014": 13200, // Elmlər Akademiyası
  "st-015": 10300, // İnşaatçılar
  "st-016": 8900, // Xalqlar Dostluğu
  "st-017": 9400, // Əhmədli
  "st-018": 7800, // Khojasan
  "st-020": 12800, // Xətai
  "st-021": 50800, // 20 Yanvar
  "st-022": 25600, // 8 Noyabr
  "st-023": 22300, // Azadlıq Prospekti
  "st-024": 30100, // Cəfər Cabbarlı
  "st-025": 24800, // Memar Əcəmi-2
  "st-026": 21100, // Nəsimi
  "st-027": 23800, // Neftçilər
  "st-028": 23300, // Qara Qarayev
};

// Simulated today's delta %
const TODAY_DELTAS: Record<string, number> = {
  "st-001": 8,
  "st-002": 22,
  "st-003": 31,
  "st-004": 5,
  "st-005": -12,
  "st-006": -8,
  "st-007": 3,
  "st-008": 45,
  "st-009": 18,
  "st-010": -5,
  "st-011": 14,
  "st-012": 7,
  "st-013": 28,
  "st-014": 2,
  "st-015": -18,
  "st-016": -3,
  "st-017": 9,
  "st-018": -22,
  "st-020": 11,
  "st-021": 26,
  "st-022": 14,
  "st-023": 8,
  "st-024": 19,
  "st-025": 12,
  "st-026": 5,
  "st-027": 15,
  "st-028": 17,
};

export const MOCK_STATIONS_WITH_DEMAND: StationWithDemand[] = MOCK_STATIONS.map(
  (s) => {
    const baseline = STATION_BASELINES[s.id] ?? 10000;
    const delta = TODAY_DELTAS[s.id] ?? 0;
    const forecast = Math.round(baseline * (1 + delta / 100));
    return {
      ...s,
      todayEntries: forecast,
      forecastEntries: forecast,
      demandLevel: getDemandLevel(delta),
      demandDelta: delta,
      demandLabel: getDemandLabel(delta),
    };
  }
);

// ─── Station Exits ────────────────────────────────────────────────────────────

export const MOCK_EXITS: StationExit[] = [
  // 28 May (major transfer)
  {
    id: "ex-003-1",
    stationId: "st-003",
    exitNo: 1,
    exitLabel: "Exit 1 – 28 May Street",
    addressText: "28 May küçəsi, Bakı",
    lat: 40.3799,
    lon: 49.8523,
    isAccessible: true,
  },
  {
    id: "ex-003-2",
    stationId: "st-003",
    exitNo: 2,
    exitLabel: "Exit 2 – Hüseyn Cavid Avenue",
    addressText: "Hüseyn Cavid prospekti, Bakı",
    lat: 40.3791,
    lon: 49.8509,
    isAccessible: false,
  },
  {
    id: "ex-003-3",
    stationId: "st-003",
    exitNo: 3,
    exitLabel: "Exit 3 – Railway Station",
    addressText: "Bakı Dəmiryol Stansiyası",
    lat: 40.3806,
    lon: 49.8531,
    isAccessible: true,
  },
  // Nizami
  {
    id: "ex-013-1",
    stationId: "st-013",
    exitNo: 1,
    exitLabel: "Exit 1 – Nizami Street",
    addressText: "Nizami küçəsi, Bakı",
    lat: 40.3826,
    lon: 49.8459,
    isAccessible: true,
  },
  {
    id: "ex-013-2",
    stationId: "st-013",
    exitNo: 2,
    exitLabel: "Exit 2 – Fountains Square",
    addressText: "Fəvvarələr meydanı",
    lat: 40.3819,
    lon: 49.8448,
    isAccessible: true,
  },
  // Sahil
  {
    id: "ex-002-1",
    stationId: "st-002",
    exitNo: 1,
    exitLabel: "Exit 1 – Neftchilar Avenue",
    addressText: "Neftçilər prospekti, Bakı",
    lat: 40.3706,
    lon: 49.8435,
    isAccessible: true,
  },
  {
    id: "ex-002-2",
    stationId: "st-002",
    exitNo: 2,
    exitLabel: "Exit 2 – Seaside Boulevard",
    addressText: "Dəniz kənarı Bulvar",
    lat: 40.3698,
    lon: 49.8427,
    isAccessible: true,
  },
  // İçəri Şəhər
  {
    id: "ex-001-1",
    stationId: "st-001",
    exitNo: 1,
    exitLabel: "Exit 1 – Old City Gate",
    addressText: "Qosha Qalanın yanı",
    lat: 40.3667,
    lon: 49.8376,
    isAccessible: false,
  },
  {
    id: "ex-001-2",
    stationId: "st-001",
    exitNo: 2,
    exitLabel: "Exit 2 – Neftchilar Avenue",
    addressText: "Neftçilər prospekti",
    lat: 40.3660,
    lon: 49.8368,
    isAccessible: true,
  },
  // 20 Yanvar
  {
    id: "ex-021-1",
    stationId: "st-021",
    exitNo: 1,
    exitLabel: "Exit 1 – Tbilisi Avenue",
    addressText: "Tbilisi prospekti, Bakı",
    lat: 40.4059,
    lon: 49.8088,
    isAccessible: true,
  },
  {
    id: "ex-021-2",
    stationId: "st-021",
    exitNo: 2,
    exitLabel: "Exit 2 – 20 Yanvar Circle",
    addressText: "20 Yanvar dairəsi, Bakı",
    lat: 40.4053,
    lon: 49.8099,
    isAccessible: false,
  },
  // 8 Noyabr
  {
    id: "ex-022-1",
    stationId: "st-022",
    exitNo: 1,
    exitLabel: "Exit 1 – Jeyhun Hajibeyli Street",
    addressText: "Ceyhun Hacıbəyli küçəsi, Bakı",
    lat: 40.3983,
    lon: 49.8470,
    isAccessible: true,
  },
  {
    id: "ex-022-2",
    stationId: "st-022",
    exitNo: 2,
    exitLabel: "Exit 2 – Winter Park Side",
    addressText: "Qış Parkı istiqaməti",
    lat: 40.3978,
    lon: 49.8480,
    isAccessible: true,
  },
  // Azadliq Prospekti
  {
    id: "ex-023-1",
    stationId: "st-023",
    exitNo: 1,
    exitLabel: "Exit 1 – Azadliq Avenue",
    addressText: "Azadlıq prospekti, Bakı",
    lat: 40.4238,
    lon: 49.8240,
    isAccessible: true,
  },
  {
    id: "ex-023-2",
    stationId: "st-023",
    exitNo: 2,
    exitLabel: "Exit 2 – Residential Block",
    addressText: "Yaşayış məhəlləsi çıxışı",
    lat: 40.4231,
    lon: 49.8249,
    isAccessible: false,
  },
  // Jafar Cabbarli
  {
    id: "ex-024-1",
    stationId: "st-024",
    exitNo: 1,
    exitLabel: "Exit 1 – 28 Mall",
    addressText: "28 Mall tərəfi",
    lat: 40.3793,
    lon: 49.8518,
    isAccessible: true,
  },
  {
    id: "ex-024-2",
    stationId: "st-024",
    exitNo: 2,
    exitLabel: "Exit 2 – Railway Connection",
    addressText: "Dəmiryol stansiyası əlaqəsi",
    lat: 40.3802,
    lon: 49.8527,
    isAccessible: true,
  },
  // Memar Ajami-2
  {
    id: "ex-025-1",
    stationId: "st-025",
    exitNo: 1,
    exitLabel: "Exit 1 – Memar Ajami Circle",
    addressText: "Memar Əcəmi dairəsi",
    lat: 40.4098,
    lon: 49.8178,
    isAccessible: true,
  },
  {
    id: "ex-025-2",
    stationId: "st-025",
    exitNo: 2,
    exitLabel: "Exit 2 – Shopping Side",
    addressText: "Ticarət mərkəzi tərəfi",
    lat: 40.4092,
    lon: 49.8187,
    isAccessible: false,
  },
  // Nasimi
  {
    id: "ex-026-1",
    stationId: "st-026",
    exitNo: 1,
    exitLabel: "Exit 1 – Nasimi District",
    addressText: "Nəsimi rayonu istiqaməti",
    lat: 40.4141,
    lon: 49.8222,
    isAccessible: true,
  },
  {
    id: "ex-026-2",
    stationId: "st-026",
    exitNo: 2,
    exitLabel: "Exit 2 – Hospital Side",
    addressText: "Xəstəxana istiqaməti",
    lat: 40.4134,
    lon: 49.8230,
    isAccessible: true,
  },
  // Neftchilar
  {
    id: "ex-027-1",
    stationId: "st-027",
    exitNo: 1,
    exitLabel: "Exit 1 – Neftchilar Avenue",
    addressText: "Neftçilər prospekti",
    lat: 40.4214,
    lon: 49.9442,
    isAccessible: true,
  },
  {
    id: "ex-027-2",
    stationId: "st-027",
    exitNo: 2,
    exitLabel: "Exit 2 – Housing Complex",
    addressText: "Yaşayış kompleksi tərəfi",
    lat: 40.4207,
    lon: 49.9451,
    isAccessible: false,
  },
  // Qara Qarayev
  {
    id: "ex-028-1",
    stationId: "st-028",
    exitNo: 1,
    exitLabel: "Exit 1 – Qara Qarayev Avenue",
    addressText: "Qara Qarayev prospekti",
    lat: 40.4175,
    lon: 49.9377,
    isAccessible: true,
  },
  {
    id: "ex-028-2",
    stationId: "st-028",
    exitNo: 2,
    exitLabel: "Exit 2 – Commercial Block",
    addressText: "Kommersiya zonası çıxışı",
    lat: 40.4168,
    lon: 49.9385,
    isAccessible: true,
  },
];

// ─── Intraday Profiles ────────────────────────────────────────────────────────

// Metro operating hours: roughly 06:00–24:00
// These share distributions are modeled estimates, not observed hourly counts.

const COMMUTER_WEEKDAY_PATTERN = [
  { hour: 6, share: 0.02 },
  { hour: 7, share: 0.06 },
  { hour: 8, share: 0.13 },
  { hour: 9, share: 0.1 },
  { hour: 10, share: 0.05 },
  { hour: 11, share: 0.04 },
  { hour: 12, share: 0.05 },
  { hour: 13, share: 0.05 },
  { hour: 14, share: 0.04 },
  { hour: 15, share: 0.04 },
  { hour: 16, share: 0.05 },
  { hour: 17, share: 0.12 },
  { hour: 18, share: 0.13 },
  { hour: 19, share: 0.07 },
  { hour: 20, share: 0.03 },
  { hour: 21, share: 0.01 },
  { hour: 22, share: 0.01 },
];

const CENTRAL_WEEKDAY_PATTERN = [
  { hour: 6, share: 0.01 },
  { hour: 7, share: 0.03 },
  { hour: 8, share: 0.07 },
  { hour: 9, share: 0.08 },
  { hour: 10, share: 0.08 },
  { hour: 11, share: 0.08 },
  { hour: 12, share: 0.1 },
  { hour: 13, share: 0.1 },
  { hour: 14, share: 0.08 },
  { hour: 15, share: 0.07 },
  { hour: 16, share: 0.07 },
  { hour: 17, share: 0.1 },
  { hour: 18, share: 0.07 },
  { hour: 19, share: 0.04 },
  { hour: 20, share: 0.02 },
];

const WEEKEND_PATTERN = [
  { hour: 8, share: 0.03 },
  { hour: 9, share: 0.05 },
  { hour: 10, share: 0.08 },
  { hour: 11, share: 0.1 },
  { hour: 12, share: 0.12 },
  { hour: 13, share: 0.12 },
  { hour: 14, share: 0.1 },
  { hour: 15, share: 0.1 },
  { hour: 16, share: 0.09 },
  { hour: 17, share: 0.08 },
  { hour: 18, share: 0.07 },
  { hour: 19, share: 0.04 },
  { hour: 20, share: 0.02 },
];

export const MOCK_INTRADAY_PROFILES: IntradayProfile[] = MOCK_STATIONS.map(
  (s) => {
    const isCommuter =
      s.stationType === "commuter" || s.stationType === "residential";
    const profileType = isCommuter ? "commuter-heavy" : "central";
    return {
      id: `profile-${s.id}`,
      stationId: s.id,
      profileType,
      weekdayPattern: isCommuter
        ? COMMUTER_WEEKDAY_PATTERN
        : CENTRAL_WEEKDAY_PATTERN,
      weekendPattern: WEEKEND_PATTERN,
      confidenceNote:
        "Estimated from daily totals and station category patterns. Not observed hourly counts.",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };
  }
);

// ─── Weather ──────────────────────────────────────────────────────────────────

export const MOCK_WEATHER: WeatherObservation = {
  observedAt: new Date().toISOString(),
  tempC: 14,
  feelsLikeC: 12,
  humidity: 62,
  windSpeed: 18,
  precipitation: 0,
  pressure: 1013,
  condition: "partly_cloudy",
  createdAt: new Date().toISOString(),
};

// ─── Recent History (last 14 days for 28 May) ─────────────────────────────────

export function generateMockHistory(
  stationId: string,
  days = 14
): StationDailyDemand[] {
  const baseline = STATION_BASELINES[stationId] ?? 10000;
  const result: StationDailyDemand[] = [];
  for (let i = days; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const weekendMultiplier = isWeekend ? 0.75 : 1;
    const noise = 0.9 + Math.random() * 0.2;
    result.push({
      date: date.toISOString().split("T")[0],
      stationId,
      entries: Math.round(baseline * weekendMultiplier * noise),
      sourceYear: 2025,
      createdAt: new Date().toISOString(),
    });
  }
  return result;
}

// ─── Forecasts ────────────────────────────────────────────────────────────────

export function generateMockForecasts(
  stationId: string,
  days = 7
): StationForecast[] {
  const baseline = STATION_BASELINES[stationId] ?? 10000;
  const forecasts: StationForecast[] = [];

  const notes = [
    "Expected to be slightly busier than the recent station average",
    "Demand looks normal for this day of the week",
    "Rain may push demand slightly higher",
    "Quieter than a typical weekday",
    "Busier than a typical Tuesday",
    "Weekend pattern expected — lighter than weekdays",
    "Slightly elevated demand expected",
  ];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const weekendMult = isWeekend ? 0.75 : 1;
    const delta = (Math.random() - 0.4) * 0.3; // -0.12 to +0.18
    const predicted = Math.round(baseline * weekendMult * (1 + delta));
    const uncertainty = Math.round(predicted * 0.08);

    forecasts.push({
      id: `fc-${stationId}-${i}`,
      stationId,
      forecastDate: date.toISOString().split("T")[0],
      predictedEntries: predicted,
      lowerBound: predicted - uncertainty,
      upperBound: predicted + uncertainty,
      modelName: "lgbm-v1",
      modelVersion: "1.0.0",
      confidenceLevel: 0.75 + Math.random() * 0.15,
      weatherEffectScore: (Math.random() - 0.5) * 0.3,
      baselineEntries: Math.round(baseline * weekendMult),
      riderFacingNote: notes[i % notes.length],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return forecasts;
}

// ─── Baselines ────────────────────────────────────────────────────────────────

export const MOCK_BASELINES: StationBaseline[] = MOCK_STATIONS.map((s) => {
  const avg = STATION_BASELINES[s.id] ?? 10000;
  return {
    stationId: s.id,
    dow: 1,
    avgEntries: avg,
    medianEntries: Math.round(avg * 0.97),
    rollingAvg7: Math.round(avg * 1.02),
    rollingAvg30: avg,
    updatedAt: new Date().toISOString(),
  };
});
