import { HomeDiscovery } from "@/components/mobile/home-discovery";
import { allProperties } from "@/lib/property-catalog";
import { sortProperties, type Property } from "@/lib/properties";

export default function HomePage() {
  const recommendedByPurpose = {
    rent: getRecommendations("rent"),
    sale: getRecommendations("sale"),
  };
  const locationCounts = Object.fromEntries(
    ["Yangon", "Mandalay", "Bahan"].map((location) => [
      location,
      allProperties.filter((property) => property.city === location || property.township === location).length,
    ]),
  );

  return <HomeDiscovery recommendedByPurpose={recommendedByPurpose} locationCounts={locationCounts} />;
}

function getRecommendations(purpose: Property["purpose"]) {
  return sortProperties(
    allProperties.filter((property) => property.purpose === purpose && property.verification_status === "verified"),
    "recommended",
  ).slice(0, 4);
}
