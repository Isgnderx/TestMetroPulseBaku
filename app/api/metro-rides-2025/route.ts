import { NextResponse } from "next/server";

const OPENDATA_PACKAGE_URL =
    "https://admin.opendata.az/api/3/action/package_show?id=stansiyalar-uzre-gundelik-sernisin-gedislerinin-sayi";

export async function GET() {
    try {
        const response = await fetch(OPENDATA_PACKAGE_URL, {
            headers: {
                Accept: "application/json",
            },
            next: { revalidate: 60 * 60 * 12 },
        });

        if (!response.ok) {
            return NextResponse.json(
                {
                    error: "Failed to fetch metro rides package",
                    status: response.status,
                },
                { status: 502 }
            );
        }

        const payload = await response.json();

        return NextResponse.json({
            data: payload,
            meta: {
                source: "opendata.az",
                dataset: "stansiyalar-uzre-gundelik-sernisin-gedislerinin-sayi",
                fetchedAt: new Date().toISOString(),
            },
        });
    } catch {
        return NextResponse.json(
            {
                error: "Could not reach OpenData service",
            },
            { status: 502 }
        );
    }
}
