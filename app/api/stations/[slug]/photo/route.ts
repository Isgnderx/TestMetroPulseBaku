import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { latencyMsFromStart, withLatencyHeaders } from "@/lib/latency";

const DEFAULT_METRO_PHOTO = "28 may.jpg";

const LOCAL_PHOTO_BY_ALIAS: Record<string, string> = {
    // App slugs
    "20-yanvar": "20 yanvar.jpg",
    "28-may": "28 may.jpg",
    "icheri-sheher": "iceriseher.jpg",
    sahil: "sahil.jpg",
    ganjlik: "genclik.jpg",
    "nariman-narimanov": "nerimanov.jpg",
    bakmil: "bakmil.jpg",
    ulduz: "ulduz.jpg",
    koroglu: "koroglu.jpg",
    "hazi-aslanov": "hezi.jpg",
    darnagul: "dernegul.jpg",
    avtovagzal: "aftovagzal.jpg",
    "memar-ajami": "ecemi.jpg",
    nizami: "nizami-metro-stansiyasi.jpg",
    "elmler-akademiyasi": "elmler.jpg",
    inshaatchilar: "inshaatcilar.jpg",
    "khalglar-dostlugu": "xalqlar.jpg",
    ahmedli: "ehmedli.jpg",
    hojasan: "xocasen.jpg",
    khatai: "xetai.jpg",
    "heydar-aliyev": "_8_november__station.png",

    // Dataset/fallback slugs from map
    icherisheher: "iceriseher.jpg",
    "8-novabr": "_8_november__station.png",
    avtovaghzal: "aftovagzal.jpg",
    "azadliq-prospekti": "azadliq.jpg",
    "jafar-jabbarly": "28 may.jpg",
    neftchilar: "nefciler.jpg",
    nasimi: "nesimi.jpg",
    "gara-garayev": "qara.jpg",
    khojasan: "xocasen.jpg",
    insahatchilar: "inshaatcilar.jpg",
    "shah-ismail-khatai": "xetai.jpg",
    akhmedli: "ehmedli.jpg",
};

function localPhotoUrl(fileName: string): string {
    return `/metro-foto/${encodeURIComponent(fileName)}`;
}

function normalizeText(input: string): string {
    return input
        .toLowerCase()
        .replace(/ə/g, "e")
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ş/g, "s")
        .replace(/ç/g, "c")
        .replace(/ö/g, "o")
        .replace(/ü/g, "u")
        .replace(/x/g, "h")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

function resolvePhoto(slug: string, stationName: string, stationNameAz: string): {
    fileName: string;
    source: "local-alias" | "local-default";
    matchedBy: string;
} {
    const candidates = [
        slug,
        slug.replace(/-/g, " "),
        stationName,
        stationNameAz,
    ].map((value) => normalizeText(value).replace(/\s+/g, "-"));

    for (const candidate of candidates) {
        const fileName = LOCAL_PHOTO_BY_ALIAS[candidate];
        if (fileName) {
            return {
                fileName,
                source: "local-alias",
                matchedBy: candidate,
            };
        }
    }

    return {
        fileName: DEFAULT_METRO_PHOTO,
        source: "local-default",
        matchedBy: "default",
    };
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const startedAtMs = Date.now();
    const { slug } = await params;
    const supabase = createServiceClient();
    const { data: station } = await supabase
        .from("stations")
        .select("name, name_az")
        .eq("slug", slug)
        .maybeSingle();

    const resolved = resolvePhoto(
        slug,
        station?.name ?? slug.replace(/-/g, " "),
        station?.name_az ?? slug.replace(/-/g, " ")
    );

    const response = NextResponse.json({
        data: {
            imageUrl: localPhotoUrl(resolved.fileName),
            source: resolved.source,
            fileName: resolved.fileName,
            matchedBy: resolved.matchedBy,
        },
        meta: {
            latencyMs: latencyMsFromStart(startedAtMs),
        },
    });

    return withLatencyHeaders(response, startedAtMs);
}
