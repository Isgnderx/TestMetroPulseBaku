from __future__ import annotations

import difflib
import re
import unicodedata
from dataclasses import dataclass

AZ_CHAR_MAP = {
    "ə": "e",
    "Ə": "e",
    "ı": "i",
    "İ": "i",
    "ğ": "g",
    "Ğ": "g",
    "ü": "u",
    "Ü": "u",
    "ö": "o",
    "Ö": "o",
    "ç": "c",
    "Ç": "c",
    "ş": "s",
    "Ş": "s",
}

KNOWN_ALIASES = {
    "icherisheher": "icheri-sheher",
    "icheri sheher": "icheri-sheher",
    "içəri şəhər": "icheri-sheher",
    "20 yanvar": "20-yanvar",
    "20-yanvar": "20-yanvar",
    "28 may": "28-may",
    "28may": "28-may",
    "8 noyabr": "8-noyabr",
    "8-noyabr": "8-noyabr",
    "azadliq prospekti": "azadliq-prospekti",
    "azadlıq prospekti": "azadliq-prospekti",
    "ganjlik": "ganjlik",
    "gənclik": "ganjlik",
    "jafar jabbarli": "jafar-cabbarli",
    "jafar jabbarly": "jafar-cabbarli",
    "cəfər cabbarlı": "jafar-cabbarli",
    "nariman narimanov": "nariman-narimanov",
    "nəriman nərimanov": "nariman-narimanov",
    "koroglu": "koroglu",
    "koroğlu": "koroglu",
    "hazi aslanov": "hazi-aslanov",
    "həzi aslanov": "hazi-aslanov",
    "darnagul": "darnagul",
    "dərnəgül": "darnagul",
    "avtovagzal": "avtovagzal",
    "avtovağzal": "avtovagzal",
    "memar ajami": "memar-ajami",
    "memar əcəmi": "memar-ajami",
    "elmler akademiyasi": "elmler-akademiyasi",
    "elmlər akademiyası": "elmler-akademiyasi",
    "inshaatchilar": "inshaatchilar",
    "inşaatçılar": "inshaatchilar",
    "khalglar dostlugu": "khalglar-dostlugu",
    "xalqlar dostluğu": "khalglar-dostlugu",
    "ahmedli": "ahmedli",
    "əhmədli": "ahmedli",
    "nasimi": "nasimi",
    "nəsimi": "nasimi",
    "neftchilar": "neftchilar",
    "neftçilər": "neftchilar",
    "qara qarayev": "qara-qarayev",
    "gara garayev": "qara-qarayev",
    "xətai": "khatai",
    "khatai": "khatai",
    "hojasan": "hojasan",
    "khojasan": "hojasan",
    "khocasen": "hojasan",
    "xocasan": "hojasan",
    "xocəsən": "hojasan",
}


@dataclass(frozen=True)
class StationReference:
    id: str
    slug: str
    name: str
    name_az: str


def _transliterate(text: str) -> str:
    out = text
    for key, value in AZ_CHAR_MAP.items():
        out = out.replace(key, value)
    out = unicodedata.normalize("NFKD", out)
    out = out.encode("ascii", "ignore").decode("ascii")
    return out


def normalize_text(value: str) -> str:
    normalized = _transliterate(value).lower().strip()
    normalized = re.sub(r"[^a-z0-9 ]+", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized


def slugify_station(value: str) -> str:
    return normalize_text(value).replace(" ", "-")


class StationNormalizer:
    def __init__(self, station_refs: list[StationReference]) -> None:
        self.station_by_slug = {item.slug: item for item in station_refs}
        self.normalized_lookup: dict[str, str] = {}

        for item in station_refs:
            self.normalized_lookup[normalize_text(item.name)] = item.slug
            self.normalized_lookup[normalize_text(item.name_az)] = item.slug
            self.normalized_lookup[normalize_text(item.slug)] = item.slug

        for alias, slug in KNOWN_ALIASES.items():
            self.normalized_lookup[normalize_text(alias)] = slug

    def resolve_slug(self, raw_name: str) -> str | None:
        if not raw_name:
            return None

        normalized = normalize_text(raw_name)
        if normalized in self.normalized_lookup:
            return self.normalized_lookup[normalized]

        candidate_slug = slugify_station(raw_name)
        if candidate_slug in self.station_by_slug:
            return candidate_slug

        choices = list(self.normalized_lookup.keys())
        closest = difflib.get_close_matches(normalized, choices, n=1, cutoff=0.85)
        if closest:
            return self.normalized_lookup[closest[0]]

        return None

    def resolve_station_id(self, raw_name: str) -> str | None:
        slug = self.resolve_slug(raw_name)
        if not slug:
            return None
        station = self.station_by_slug.get(slug)
        if not station:
            return None
        return station.id
