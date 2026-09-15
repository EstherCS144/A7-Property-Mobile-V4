import { formatMyanmarAmount } from "@/lib/myanmar-numbers";

export type PropertyPurpose = "rent" | "sale";

export interface PropertyOwner {
  id: string;
  name: string;
  type: "owner" | "agent";
  phone_verified: boolean;
  response_time_minutes: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  property_type: "condo" | "apartment" | "house" | "mini_condo" | "villa";
  purpose: PropertyPurpose;
  city: string;
  township: string;
  address: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  floor: number | null;
  year_built: number;
  furniture: "unfurnished" | "partly_furnished" | "fully_furnished";
  amenities: string[];
  images: string[];
  owner: PropertyOwner;
  verification_status: "verified" | "pending" | "unverified";
  rating: number;
  lat: number;
  lng: number;
}

export interface SearchFilters {
  location: string;
  minPrice: number | null;
  maxPrice: number | null;
  purpose: "all" | PropertyPurpose;
  propertyTypes: Property["property_type"][];
  bedrooms: number | null;
  bathrooms: number | null;
  furniture: "all" | Property["furniture"];
  parking: boolean;
}

export type PropertySort = "recommended" | "newest" | "price-asc" | "price-desc";

export const defaultSearchFilters: SearchFilters = {
  location: "All Myanmar",
  minPrice: null,
  maxPrice: null,
  purpose: "rent",
  propertyTypes: [],
  bedrooms: null,
  bathrooms: null,
  furniture: "all",
  parking: false,
};

export const propertyTypeLabels: Record<Property["property_type"], string> = {
  condo: "Condo",
  apartment: "Apartment",
  house: "House",
  mini_condo: "Mini condo",
  villa: "Villa",
};

export const furnitureLabels: Record<Property["furniture"], string> = {
  unfurnished: "Unfurnished",
  partly_furnished: "Partly furnished",
  fully_furnished: "Fully furnished",
};

export const searchLocations = [
  "All Myanmar",
  "Yangon",
  "Mandalay",
  "Bahan",
  "Kamayut",
  "Hlaing",
  "Yankin",
  "Sanchaung",
  "Dagon",
  "Mayangone",
  "Chanmyathazi",
  "Aungmyaythazan",
] as const;

export type PriceLanguage = "en" | "my";

export function formatPropertyPrice(property: Pick<Property, "price" | "currency" | "purpose">, lang: PriceLanguage = "en") {
  if (lang === "my") {
    const isSale = property.purpose === "sale";
    const value = isSale ? property.price / 1_000_000 : property.price / 100_000;
    const unit = isSale ? "သန်း" : "သိန်း";
    return `${formatMyanmarAmount(value)} ${unit}`;
  }
  if (property.purpose === "sale") return `${property.price / 1_000_000}M ${property.currency}`;
  return `${new Intl.NumberFormat("en-US").format(property.price)} ${property.currency}`;
}

export function formatCompactPrice(property: Pick<Property, "price" | "purpose">, lang: PriceLanguage = "en") {
  if (lang === "my") {
    const isSale = property.purpose === "sale";
    const value = isSale ? property.price / 1_000_000 : property.price / 100_000;
    const unit = isSale ? "သန်း" : "သိန်း";
    return `${formatMyanmarAmount(value)} ${unit}`;
  }
  if (property.purpose === "sale") return `${property.price / 1_000_000}M`;
  if (property.price >= 1_000_000) return `${(property.price / 1_000_000).toFixed(1)}M`;
  return `${property.price / 1_000}K`;
}

export function filterProperties(properties: Property[], filters: SearchFilters) {
  const location = filters.location.toLowerCase();
  return properties.filter((property) => {
    const matchesLocation = location === "all myanmar"
      || property.city.toLowerCase() === location
      || property.township.toLowerCase() === location;
    const matchesPurpose = filters.purpose === "all" || property.purpose === filters.purpose;
    const matchesType = filters.propertyTypes.length === 0 || filters.propertyTypes.includes(property.property_type);
    const matchesMin = filters.minPrice === null || property.price >= filters.minPrice;
    const matchesMax = filters.maxPrice === null || property.price <= filters.maxPrice;
    const matchesBedrooms = filters.bedrooms === null || property.bedrooms >= filters.bedrooms;
    const matchesBathrooms = filters.bathrooms === null || property.bathrooms >= filters.bathrooms;
    const matchesFurniture = filters.furniture === "all" || property.furniture === filters.furniture;
    const matchesParking = !filters.parking || property.amenities.some((item) => item.toLowerCase().includes("parking"));
    return matchesLocation && matchesPurpose && matchesType && matchesMin && matchesMax && matchesBedrooms && matchesBathrooms && matchesFurniture && matchesParking;
  });
}

export function sortProperties(properties: Property[], sort: PropertySort) {
  const sorted = [...properties];
  if (sort === "price-asc") return sorted.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return sorted.sort((a, b) => b.price - a.price);
  // The demo dataset has no publication timestamp. Its sequential IDs are the
  // only listing-recency signal, so do not mislabel the construction year as new.
  if (sort === "newest") return sorted.sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
  return sorted.sort((a, b) => {
    const verification = Number(b.verification_status === "verified") - Number(a.verification_status === "verified");
    return verification || b.rating - a.rating || a.price - b.price;
  });
}

export function listingVerificationLabel(property: Pick<Property, "verification_status">) {
  if (property.verification_status === "verified") return "Verified listing";
  if (property.verification_status === "pending") return "Verification pending";
  return "Unverified listing";
}

export function contactVerificationLabel(owner: Pick<PropertyOwner, "type" | "phone_verified">) {
  const role = owner.type === "agent" ? "agent" : "owner";
  return owner.phone_verified ? `Phone-verified ${role}` : `${role[0].toUpperCase()}${role.slice(1)} contact not verified`;
}

export function countActiveFilters(filters: SearchFilters) {
  return [
    filters.location !== "All Myanmar",
    filters.minPrice !== null,
    filters.maxPrice !== null,
    filters.purpose !== "all",
    filters.propertyTypes.length > 0,
    filters.bedrooms !== null,
    filters.bathrooms !== null,
    filters.furniture !== "all",
    filters.parking,
  ].filter(Boolean).length;
}
