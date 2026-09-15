import type { Metadata } from "next";
import { Suspense } from "react";

import { MobilePropertySearch } from "@/components/mobile/mobile-property-search";
import { allProperties } from "@/lib/property-catalog";

export const metadata: Metadata = {
  title: "Explore homes in Myanmar | A7 Property",
  description: "Explore property listings across Myanmar by location, price, verification status, and property type.",
  openGraph: {
    title: "Explore Homes | A7 Property",
    description: "Explore property listings across Myanmar by location, price, verification status, and property type.",
    images: [{ url: "/og-explore-homes.png", width: 1734, height: 907, alt: "A7 Property Explore Homes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Homes | A7 Property",
    description: "Explore property listings across Myanmar by location, price, verification status, and property type.",
    images: ["/og-explore-homes.png"],
  },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F7FF]" />}>
      <MobilePropertySearch properties={allProperties} />
    </Suspense>
  );
}
