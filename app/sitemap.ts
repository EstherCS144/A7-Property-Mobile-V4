import type { MetadataRoute } from "next";

import { allProperties } from "@/lib/property-catalog";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const coreRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/assistant`, changeFrequency: "monthly", priority: 0.7 },
  ];

  return [
    ...coreRoutes,
    ...allProperties.map((property) => ({
      url: `${SITE_URL}/properties/${property.id}`,
      changeFrequency: "weekly" as const,
      priority: property.verification_status === "verified" ? 0.8 : 0.6,
    })),
  ];
}
