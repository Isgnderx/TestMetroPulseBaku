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
                    error: "Error fetching data from OpenData",
                    status: response.status,
                },
                { status: 502 }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json(
            {
                error: "Error fetching data from OpenData",
            },
            { status: 502 }
        );
    }
}
