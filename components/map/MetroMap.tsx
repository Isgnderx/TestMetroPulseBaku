"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { StationWithDemand } from "@/types";
import { demandColor } from "@/lib/utils";

interface MetroMapProps {
    stations: StationWithDemand[];
    selectedStationId?: string;
    onStationClick?: (station: StationWithDemand) => void;
    destinationPin?: { lat: number; lon: number } | null;
    layerMode?: "forecast" | "baseline" | "anomaly";
}

type MetroLineName = "red" | "green" | "purple";

type RawStation = {
    station_name_en: string;
    longitude: number;
    latitude: number;
};

interface ResolvedMapData {
    linesGeojson: GeoJSON.FeatureCollection<GeoJSON.LineString>;
    stationFeatures: GeoJSON.Feature<GeoJSON.Point>[];
    labelFeatures: GeoJSON.Feature<GeoJSON.Point>[];
    parsedStations: Array<{
        key: string;
        name: string;
        lon: number;
        lat: number;
        linkedStation: StationWithDemand;
        line: MetroLineName;
        secondaryLine: MetroLineName | null;
        isInterchange: boolean;
    }>;
    stationLookup: Map<string, StationWithDemand>;
}

const METRO_LINE_COLORS: Record<MetroLineName, string> = {
    red: "#E53935",
    green: "#2E7D32",
    purple: "#7E57C2",
};

const MAP_INITIAL_CAMERA = {
    center: [49.8671, 40.4093] as [number, number],
    zoom: 11.05,
    pitch: 34,
    bearing: -6,
};

const MAP_3D_CAMERA = {
    center: [49.8671, 40.4093] as [number, number],
    zoom: 11.35,
    pitch: 52,
    bearing: -18,
};

const BUILDING_TILEJSON_URL = "https://demotiles.maplibre.org/tiles/tiles.json";

interface TileJsonVectorLayer {
    id?: string;
}

interface TileJsonResponse {
    vector_layers?: TileJsonVectorLayer[];
}

async function detectBuildingSourceLayer(): Promise<string | null> {
    try {
        const response = await fetch(BUILDING_TILEJSON_URL, { cache: "force-cache" });
        if (!response.ok) return null;

        const payload = (await response.json()) as TileJsonResponse;
        const layerIds = (payload.vector_layers ?? [])
            .map((layer) => layer.id)
            .filter((id): id is string => Boolean(id));

        const preferredIds = ["building", "buildings", "building_part", "building:part"];
        const preferred = preferredIds.find((id) => layerIds.includes(id));
        if (preferred) return preferred;

        const byNameHint = layerIds.find((id) => /build/i.test(id));
        return byNameHint ?? null;
    } catch {
        return null;
    }
}

const STATION_DATA_JSON: RawStation[] = [
    { station_name_en: "20 Yanvar", longitude: 49.807572, latitude: 40.403653 },
    { station_name_en: "28 May", longitude: 49.847822, latitude: 40.381211 },
    { station_name_en: "8 Noyabr", longitude: 49.820576, latitude: 40.401999 },
    { station_name_en: "Avtovaghzal", longitude: 49.795642, latitude: 40.420967 },
    { station_name_en: "Azadliq prospekti", longitude: 49.841831, latitude: 40.425585 },
    { station_name_en: "Bakmil", longitude: 49.879007, latitude: 40.414152 },
    { station_name_en: "Jafar Jabbarly", longitude: 49.848969, latitude: 40.379596 },
    { station_name_en: "Darnagul", longitude: 49.861711, latitude: 40.425278 },
    { station_name_en: "Elmler Akademiyasi", longitude: 49.812743, latitude: 40.375192 },
    { station_name_en: "Ganjlik", longitude: 49.851419, latitude: 40.400407 },
    { station_name_en: "Hazi Aslanov", longitude: 49.953522, latitude: 40.37321 },
    { station_name_en: "Koroglu", longitude: 49.917811, latitude: 40.420514 },
    { station_name_en: "Memar Ajami", longitude: 49.814989, latitude: 40.411138 },
    { station_name_en: "Memar Ajami 2", longitude: 49.814989, latitude: 40.411138 },
    { station_name_en: "Neftchilar", longitude: 49.942929, latitude: 40.410669 },
    { station_name_en: "Nizami", longitude: 49.830063, latitude: 40.37919 },
    { station_name_en: "Nariman Narimanov", longitude: 49.870203, latitude: 40.402675 },
    { station_name_en: "Nasimi", longitude: 49.825327, latitude: 40.424457 },
    { station_name_en: "Gara Garayev", longitude: 49.933751, latitude: 40.417613 },
    { station_name_en: "Sahil", longitude: 49.844644, latitude: 40.371751 },
    { station_name_en: "Ulduz", longitude: 49.891472, latitude: 40.414786 },
    { station_name_en: "Khalglar Dostlughu", longitude: 49.952399, latitude: 40.397688 },
    { station_name_en: "Khojasan", longitude: 49.778066, latitude: 40.421499 },
    { station_name_en: "Insahatchilar", longitude: 49.802647, latitude: 40.390191 },
    { station_name_en: "Icherisheher", longitude: 49.831529, latitude: 40.365899 },
    { station_name_en: "Shah Ismail Khatai", longitude: 49.871971, latitude: 40.383066 },
    { station_name_en: "Akhmedli", longitude: 49.953978, latitude: 40.385155 },
];

const lineDefinitions = {
    red: [
        "Icherisheher",
        "Sahil",
        "28 May",
        "Ganjlik",
        "Nariman Narimanov",
        "Ulduz",
        "Koroglu",
        "Gara Garayev",
        "Neftchilar",
        "Khalglar Dostlughu",
        "Akhmedli",
        "Hazi Aslanov",
    ],
    green: [
        "Darnagul",
        "Azadliq prospekti",
        "Nasimi",
        "Memar Ajami",
        "20 Yanvar",
        "Insahatchilar",
        "Elmler Akademiyasi",
        "Nizami",
        "Jafar Jabbarly",
    ],
    greenBranch: ["Jafar Jabbarly", "Shah Ismail Khatai"],
    purple: ["Khojasan", "Avtovaghzal", "Memar Ajami 2", "8 Noyabr"],
    redBranch: ["Nariman Narimanov", "Bakmil"],
};

const INTERCHANGE_STATIONS = new Set([
    "28 May",
    "Jafar Jabbarly",
    "Memar Ajami",
    "Memar Ajami 2",
    "Nizami",
    "Avtovaghzal",
    "20 Yanvar",
]);

const LINE_KEY_TO_COLOR: Record<keyof typeof lineDefinitions, string> = {
    red: METRO_LINE_COLORS.red,
    green: METRO_LINE_COLORS.green,
    greenBranch: "#8BC34A",
    purple: METRO_LINE_COLORS.purple,
    redBranch: METRO_LINE_COLORS.red,
};

const LINE_KEY_TO_PRIMARY: Record<keyof typeof lineDefinitions, MetroLineName> = {
    red: "red",
    green: "green",
    greenBranch: "green",
    purple: "purple",
    redBranch: "red",
};

const DATASET_NAME_TO_APP_SLUG: Record<string, string> = {
    "20 Yanvar": "20-yanvar",
    "28 May": "28-may",
    "8 Noyabr": "8-noyabr",
    Avtovaghzal: "avtovagzal",
    "Azadliq prospekti": "azadliq-prospekti",
    Bakmil: "bakmil",
    "Jafar Jabbarly": "jafar-cabbarli",
    Darnagul: "darnagul",
    "Elmler Akademiyasi": "elmler-akademiyasi",
    Ganjlik: "ganjlik",
    "Hazi Aslanov": "hazi-aslanov",
    Koroglu: "koroglu",
    "Memar Ajami": "memar-ajami",
    "Memar Ajami 2": "memar-ajami-2",
    Neftchilar: "neftchilar",
    Nizami: "nizami",
    "Nariman Narimanov": "nariman-narimanov",
    Nasimi: "nasimi",
    "Gara Garayev": "qara-qarayev",
    Sahil: "sahil",
    Ulduz: "ulduz",
    "Khalglar Dostlughu": "khalglar-dostlugu",
    Khojasan: "hojasan",
    Insahatchilar: "inshaatchilar",
    Icherisheher: "icheri-sheher",
    "Shah Ismail Khatai": "khatai",
    Akhmedli: "ahmedli",
};

function normalizeName(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

export function MetroMap({ stations, selectedStationId, onStationClick, destinationPin }: MetroMapProps) {
    const mapRef = useRef<maplibregl.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const destinationMarkerRef = useRef<maplibregl.Marker | null>(null);
    const stationsRef = useRef<StationWithDemand[]>(stations);
    const stationLookupRef = useRef<Map<string, StationWithDemand>>(new Map());
    const resolvedMapDataRef = useRef<ResolvedMapData | null>(null);
    const onStationClickRef = useRef<MetroMapProps["onStationClick"]>(onStationClick);

    const syncSources = (map: maplibregl.Map, data: ResolvedMapData | null) => {
        if (!data) return;

        const lineSource = map.getSource("metro-lines") as maplibregl.GeoJSONSource | undefined;
        lineSource?.setData(data.linesGeojson);

        const stationSource = map.getSource("metro-stations") as maplibregl.GeoJSONSource | undefined;
        stationSource?.setData({ type: "FeatureCollection", features: data.stationFeatures });

        const labelSource = map.getSource("metro-station-labels") as maplibregl.GeoJSONSource | undefined;
        labelSource?.setData({ type: "FeatureCollection", features: data.labelFeatures });

        stationLookupRef.current = data.stationLookup;
    };

    useEffect(() => {
        stationsRef.current = stations;
    }, [stations]);

    useEffect(() => {
        onStationClickRef.current = onStationClick;
    }, [onStationClick]);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new maplibregl.Map({
            container: containerRef.current,
            style: {
                version: 8,
                glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
                sources: {
                    "baku-light": {
                        type: "raster",
                        tiles: [
                            "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
                            "https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
                            "https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
                        ],
                        tileSize: 256,
                        attribution: "OpenStreetMap contributors, CARTO",
                    },
                },
                layers: [{ id: "baku-light", type: "raster", source: "baku-light" }],
            },
            center: MAP_INITIAL_CAMERA.center,
            zoom: MAP_INITIAL_CAMERA.zoom,
            pitch: MAP_INITIAL_CAMERA.pitch,
            bearing: MAP_INITIAL_CAMERA.bearing,
            minZoom: 9,
            maxZoom: 17.5,
            dragRotate: true,
            pitchWithRotate: true,
            attributionControl: false,
        });

        map.touchZoomRotate.enableRotation();
        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

        map.on("load", async () => {
            map.addSource("terrain-dem", {
                type: "raster-dem",
                url: "https://demotiles.maplibre.org/terrain-tiles/tiles.json",
                tileSize: 256,
            });

            map.setTerrain({ source: "terrain-dem", exaggeration: 1.25 });

            map.addLayer({
                id: "terrain-hillshade",
                type: "hillshade",
                source: "terrain-dem",
                layout: {
                    visibility: "visible",
                },
                paint: {
                    "hillshade-shadow-color": "#4B5563",
                    "hillshade-highlight-color": "#F8FAFC",
                    "hillshade-accent-color": "#94A3B8",
                    "hillshade-exaggeration": 0.25,
                },
            });

            map.addSource("osm-buildings", {
                type: "vector",
                url: BUILDING_TILEJSON_URL,
            });

            const buildingSourceLayer = await detectBuildingSourceLayer();
            if (buildingSourceLayer) {
                map.addLayer({
                    id: "3d-buildings",
                    type: "fill-extrusion",
                    source: "osm-buildings",
                    "source-layer": buildingSourceLayer,
                    minzoom: 12.8,
                    paint: {
                        "fill-extrusion-color": [
                            "interpolate",
                            ["linear"],
                            ["coalesce", ["to-number", ["get", "render_height"]], 20],
                            0,
                            "#cbd5e1",
                            30,
                            "#94a3b8",
                            80,
                            "#64748b",
                        ],
                        "fill-extrusion-height": [
                            "interpolate",
                            ["linear"],
                            ["zoom"],
                            12.8,
                            0,
                            14.8,
                            [
                                "coalesce",
                                ["to-number", ["get", "render_height"]],
                                ["*", ["coalesce", ["to-number", ["get", "building:levels"]], 4], 3],
                            ],
                        ],
                        "fill-extrusion-base": [
                            "coalesce",
                            ["to-number", ["get", "render_min_height"]],
                            0,
                        ],
                        "fill-extrusion-opacity": 0.92,
                        "fill-extrusion-vertical-gradient": true,
                    },
                });
            }

            map.addSource("metro-lines", {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });

            map.addLayer({
                id: "metro-lines-casing",
                type: "line",
                source: "metro-lines",
                layout: {
                    "line-cap": "round",
                    "line-join": "round",
                },
                paint: {
                    "line-color": "#ffffff",
                    "line-width": 8,
                    "line-opacity": 0.95,
                },
            });

            map.addLayer({
                id: "metro-lines",
                type: "line",
                source: "metro-lines",
                filter: ["!=", ["get", "isBranch"], true],
                layout: {
                    "line-cap": "round",
                    "line-join": "round",
                },
                paint: {
                    "line-color": ["coalesce", ["get", "lineColor"], "#64748B"],
                    "line-width": 5.2,
                    "line-opacity": 0.95,
                },
            });

            map.addLayer({
                id: "metro-lines-branch",
                type: "line",
                source: "metro-lines",
                filter: ["==", ["get", "isBranch"], true],
                layout: {
                    "line-cap": "round",
                    "line-join": "round",
                },
                paint: {
                    "line-color": ["coalesce", ["get", "lineColor"], "#8BC34A"],
                    "line-width": 5.2,
                    "line-opacity": 0.95,
                    "line-dasharray": [2, 1.5],
                },
            });

            map.addSource("metro-stations", {
                type: "geojson",
                promoteId: "id",
                data: { type: "FeatureCollection", features: [] },
            });

            map.addLayer({
                id: "station-demand-glow",
                type: "circle",
                source: "metro-stations",
                paint: {
                    "circle-radius": ["case", ["==", ["get", "isTransfer"], true], 9, 7],
                    "circle-color": ["coalesce", ["get", "demandColor"], "#94A3B8"],
                    "circle-opacity": 0.18,
                    "circle-blur": 0.7,
                },
            });

            map.addLayer({
                id: "station-circles",
                type: "circle",
                source: "metro-stations",
                paint: {
                    "circle-radius": ["case", ["==", ["get", "isTransfer"], true], 6.8, 5.2],
                    "circle-color": "#ffffff",
                    "circle-stroke-color": ["coalesce", ["get", "lineColor"], "#334155"],
                    "circle-stroke-width": ["case", ["==", ["get", "isTransfer"], true], 3, 2],
                    "circle-opacity": 1,
                },
            });

            map.addLayer({
                id: "station-hitarea",
                type: "circle",
                source: "metro-stations",
                paint: {
                    "circle-radius": ["case", ["==", ["get", "isTransfer"], true], 15, 13],
                    "circle-color": "#000000",
                    "circle-opacity": 0,
                },
            });

            map.addLayer({
                id: "station-interchange-second-ring",
                type: "circle",
                source: "metro-stations",
                filter: ["==", ["get", "isTransfer"], true],
                paint: {
                    "circle-radius": 8.3,
                    "circle-color": "transparent",
                    "circle-stroke-color": ["coalesce", ["get", "secondaryLineColor"], "#8BC34A"],
                    "circle-stroke-width": 1.8,
                    "circle-opacity": 0.95,
                },
            });

            map.addLayer({
                id: "station-selected-ring",
                type: "circle",
                source: "metro-stations",
                filter: ["==", ["get", "linkedStationId"], "__none__"],
                paint: {
                    "circle-radius": 10,
                    "circle-color": "transparent",
                    "circle-stroke-color": "#111827",
                    "circle-stroke-width": 2.1,
                    "circle-opacity": 0.9,
                },
            });

            map.addSource("metro-station-labels", {
                type: "geojson",
                data: { type: "FeatureCollection", features: [] },
            });

            map.addLayer({
                id: "station-labels",
                type: "symbol",
                source: "metro-station-labels",
                layout: {
                    "text-field": ["get", "name"],
                    "text-size": 11,
                    "text-font": ["Noto Sans Regular"],
                    "text-anchor": "bottom",
                    "text-offset": [0, -1.1],
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                },
                paint: {
                    "text-color": "#111827",
                    "text-halo-color": "#ffffff",
                    "text-halo-width": 1.2,
                },
            });

            const handleStationSelect = (event: maplibregl.MapLayerMouseEvent) => {
                const feature = event.features?.[0];
                const linkedStationId = (feature?.properties?.linkedStationId as string | undefined) ?? "";
                if (!linkedStationId) return;

                const station =
                    stationLookupRef.current.get(linkedStationId) ??
                    stationsRef.current.find((item) => item.id === linkedStationId);

                if (station) {
                    onStationClickRef.current?.(station);
                }
            };

            const selectByLinkedStationId = (linkedStationId: string) => {
                if (!linkedStationId) return;

                const station =
                    stationLookupRef.current.get(linkedStationId) ??
                    stationsRef.current.find((item) => item.id === linkedStationId);

                if (station) {
                    onStationClickRef.current?.(station);
                }
            };

            map.on("click", "station-hitarea", handleStationSelect);
            map.on("click", "station-circles", handleStationSelect);
            map.on("click", "station-interchange-second-ring", handleStationSelect);

            map.on("mouseenter", "station-hitarea", () => {
                map.getCanvas().style.cursor = "pointer";
            });

            map.on("mouseleave", "station-hitarea", () => {
                map.getCanvas().style.cursor = "";
            });

            // Fallback tap/click handling: query nearby station features so taps on labels
            // and slightly off-center touches still open the station info panel.
            map.on("click", (event) => {
                const point = event.point;
                const hitFeatures = map.queryRenderedFeatures(
                    [
                        [point.x - 18, point.y - 18],
                        [point.x + 18, point.y + 18],
                    ],
                    {
                        layers: [
                            "station-hitarea",
                            "station-circles",
                            "station-interchange-second-ring",
                            "station-labels",
                        ],
                    }
                );

                const firstLinkedId = hitFeatures
                    .map((feature) => (feature.properties?.linkedStationId as string | undefined) ?? "")
                    .find((value) => value.length > 0);

                if (firstLinkedId) {
                    selectByLinkedStationId(firstLinkedId);
                }
            });

            syncSources(map, resolvedMapDataRef.current);

            map.easeTo({
                center: MAP_3D_CAMERA.center,
                zoom: MAP_3D_CAMERA.zoom,
                pitch: MAP_3D_CAMERA.pitch,
                bearing: MAP_3D_CAMERA.bearing,
                duration: 1400,
                essential: true,
            });
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    const resolvedMapData = useMemo(() => {
        const appStationBySlug = new Map(stations.map((station) => [station.slug, station]));
        const appStationByName = new Map<string, StationWithDemand>();
        for (const station of stations) {
            appStationByName.set(normalizeName(station.name), station);
            appStationByName.set(normalizeName(station.nameAz), station);
        }

        const lineMembership = new Map<string, MetroLineName[]>();
        for (const [lineKey, order] of Object.entries(lineDefinitions) as Array<
            [keyof typeof lineDefinitions, string[]]
        >) {
            const primary = LINE_KEY_TO_PRIMARY[lineKey];
            for (const stationName of order) {
                const existing = lineMembership.get(stationName) ?? [];
                existing.push(primary);
                lineMembership.set(stationName, existing);
            }
        }

        const parsedStations = STATION_DATA_JSON.map((item) => {
            const aliasSlug = DATASET_NAME_TO_APP_SLUG[item.station_name_en];
            const resolvedLinked =
                (aliasSlug ? appStationBySlug.get(aliasSlug) : undefined) ??
                appStationByName.get(normalizeName(item.station_name_en));

            const lines = lineMembership.get(item.station_name_en) ?? [];
            const primaryLine = lines[0] ?? "red";
            const secondaryLine = lines[1] ?? null;

            const fallbackId = `dataset-${normalizeName(item.station_name_en).replace(/\s+/g, "-")}`;
            const linkedStation: StationWithDemand =
                resolvedLinked ?? {
                    id: fallbackId,
                    slug: fallbackId,
                    name: item.station_name_en,
                    nameAz: item.station_name_en,
                    line: primaryLine,
                    lat: item.latitude,
                    lon: item.longitude,
                    stationType: "mixed",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    todayEntries: 0,
                    forecastEntries: 0,
                    demandLevel: "normal",
                    demandDelta: 0,
                    demandLabel: "Normal demand",
                };

            return {
                key: item.station_name_en,
                name: item.station_name_en,
                lon: item.longitude,
                lat: item.latitude,
                linkedStation,
                line: primaryLine,
                secondaryLine,
                isInterchange: INTERCHANGE_STATIONS.has(item.station_name_en) || lines.length > 1,
            };
        });

        const stationByName = new Map(parsedStations.map((s) => [s.name, s]));

        const linesGeojson: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
            type: "FeatureCollection",
            features: [],
        };

        for (const [lineKey, order] of Object.entries(lineDefinitions) as Array<
            [keyof typeof lineDefinitions, string[]]
        >) {
            const coordinates: [number, number][] = order
                .map((stationName) => stationByName.get(stationName))
                .filter((station): station is NonNullable<typeof station> => Boolean(station))
                .map((station) => [station.lon, station.lat]);

            if (coordinates.length < 2) continue;

            linesGeojson.features.push({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates,
                },
                properties: {
                    id: `${lineKey}-line`,
                    line: lineKey,
                    linePrimary: LINE_KEY_TO_PRIMARY[lineKey],
                    lineColor: LINE_KEY_TO_COLOR[lineKey],
                    isBranch: lineKey === "greenBranch" || lineKey === "redBranch",
                },
            });
        }

        const stationFeatures: GeoJSON.Feature<GeoJSON.Point>[] = parsedStations
            .filter((station) => station.name !== "Memar Ajami 2")
            .map((station) => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [station.lon, station.lat],
                },
                properties: {
                    id: station.key,
                    name: station.name,
                    line: station.line,
                    lineColor: METRO_LINE_COLORS[station.line],
                    secondaryLineColor: station.secondaryLine
                        ? METRO_LINE_COLORS[station.secondaryLine]
                        : null,
                    isTransfer: station.isInterchange,
                    demandColor: demandColor(station.linkedStation.demandLevel),
                    demandLevel: station.linkedStation.demandLevel,
                    linkedStationId: station.linkedStation.id,
                },
            }));

        const labelFeatures: GeoJSON.Feature<GeoJSON.Point>[] = parsedStations
            .filter((station) => station.name !== "Memar Ajami 2")
            .map((station) => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [station.lon, station.lat],
                },
                properties: {
                    id: station.key,
                    name: station.name,
                    labelAz: station.linkedStation.nameAz,
                    linkedStationId: station.linkedStation.id,
                },
            }));

        const stationLookup = new Map<string, StationWithDemand>();
        for (const station of parsedStations) {
            if (station.name === "Memar Ajami 2") continue;
            stationLookup.set(station.linkedStation.id, station.linkedStation);
        }

        return { linesGeojson, stationFeatures, labelFeatures, parsedStations, stationLookup };
    }, [stations]);

    useEffect(() => {
        resolvedMapDataRef.current = resolvedMapData;

        const map = mapRef.current;
        if (!map) return;

        syncSources(map, resolvedMapData);
    }, [resolvedMapData]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.getLayer("station-selected-ring")) return;

        map.setFilter("station-selected-ring", [
            "==",
            ["get", "linkedStationId"],
            selectedStationId ?? "__none__",
        ]);

        if (!selectedStationId) return;

        const station = resolvedMapData.parsedStations.find((item) => item.linkedStation?.id === selectedStationId);
        if (!station) return;

        map.easeTo({
            center: [station.lon, station.lat],
            zoom: 12.3,
            duration: 600,
            essential: true,
        });
    }, [resolvedMapData.parsedStations, selectedStationId]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        destinationMarkerRef.current?.remove();
        if (!destinationPin) return;

        const markerNode = document.createElement("div");
        markerNode.innerHTML = `
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.63 14 22 14 22S28 23.63 28 14C28 6.27 21.73 0 14 0z" fill="#16A34A"/>
        <circle cx="14" cy="14" r="6" fill="white"/>
      </svg>
    `;

        destinationMarkerRef.current = new maplibregl.Marker({ element: markerNode })
            .setLngLat([destinationPin.lon, destinationPin.lat])
            .addTo(map);
    }, [destinationPin]);

    return (
        <div className="relative h-[56svh] min-h-[360px] w-full sm:h-[62vh] lg:h-[70vh]">
            <div ref={containerRef} className="h-full w-full" />
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-black/10 bg-white/85 px-3 py-2 text-[11px] text-slate-600 backdrop-blur">
                Low <span className="mx-1 text-[#2DC653]">●</span>
                Normal <span className="mx-1 text-[#2196F3]">●</span>
                High <span className="mx-1 text-[#F4A261]">●</span>
                Surge <span className="ml-1 text-[#E63946]">●</span>
            </div>
            <div className="pointer-events-none absolute right-3 top-3 rounded-lg border border-white/20 bg-white/80 px-2.5 py-1 text-[10px] text-slate-600 backdrop-blur sm:hidden">
                Drag map • Tap marker
            </div>
        </div>
    );
}
