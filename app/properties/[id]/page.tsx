import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PropertyDetailView } from "@/components/property/property-detail-view";
import { allProperties, getProperty } from "@/lib/property-catalog";
import { formatPropertyPrice, listingVerificationLabel } from "@/lib/properties";
import { absoluteSiteUrl } from "@/lib/site";

type RouteProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return allProperties.map((property) => ({ id: property.id }));
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { id } = await params;
  const property = getProperty(id);
  if (!property) return { title: "Property not found | A7 Property" };
  const title = `${property.title} | A7 Property`;
  const verification = listingVerificationLabel(property);
  const description = `${formatPropertyPrice(property)} · ${property.bedrooms} bedrooms · ${property.area_sqft} sqft in ${property.township}, ${property.city}. ${verification}.`;
  const image = absoluteSiteUrl(property.images[0]);
  return {
    title,
    description,
    alternates: { canonical: absoluteSiteUrl(`/properties/${property.id}`) },
    openGraph: { title, description, images: [{ url: image, alt: property.title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function PropertyDetailPage({ params }: RouteProps) {
  const { id } = await params;
  const property = getProperty(id);
  if (!property) notFound();
  return <PropertyDetailView property={property} />;
}
