import { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://metropulse-baku.vercel.app";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, priority: 1.0, changeFrequency: "daily" },
    { url: `${base}/map`, priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/leaderboard`, priority: 0.8, changeFrequency: "daily" },
    { url: `${base}/insights`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${base}/compare`, priority: 0.6, changeFrequency: "weekly" },
    { url: `${base}/about-data`, priority: 0.5, changeFrequency: "monthly" },
  ];

  let stationRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabase = createServiceClient();
    const { data } = await supabase.from("stations").select("slug");
    stationRoutes = (data ?? []).map((s) => ({
      url: `${base}/station/${s.slug}`,
      priority: 0.7,
      changeFrequency: "daily" as const,
    }));
  } catch {
    stationRoutes = [];
  }

  return [...staticRoutes, ...stationRoutes];
}
