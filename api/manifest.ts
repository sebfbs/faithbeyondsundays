import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  const church = req.query.church as string | undefined;

  if (!church) {
    res.setHeader("Location", "/manifest.json");
    return res.status(302).end();
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.setHeader("Location", "/manifest.json");
    return res.status(302).end();
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data } = await supabase
      .from("churches")
      .select("name, logo_url, logo_192_url, logo_512_url, app_short_name")
      .eq("code", church)
      .eq("is_active", true)
      .single();

    const fallback192 = "/icons/icon-192x192.png";
    const fallback512 = "/icons/icon-512x512.png";

    const icon192 = data?.logo_192_url || fallback192;
    const icon512 = data?.logo_512_url || fallback512;
    const churchName = data?.name || "Faith Beyond Sundays";
    const shortName = data?.app_short_name || churchName;

    const manifest = {
      name: churchName,
      short_name: shortName,
      description: `${churchName} — daily faith content`,
      start_url: `/?church=${encodeURIComponent(church)}`,
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#ffffff",
      theme_color: "#000000",
      icons: [
        { src: icon192, sizes: "192x192", type: "image/png" },
        { src: icon512, sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
    };

    res.setHeader("Content-Type", "application/manifest+json");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(manifest);
  } catch {
    res.setHeader("Location", "/manifest.json");
    return res.status(302).end();
  }
}
