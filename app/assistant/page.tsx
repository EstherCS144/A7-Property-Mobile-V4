import type { Metadata } from "next";

import { PropertyConsultant } from "@/components/assistant/property-consultant";
import { allProperties } from "@/lib/property-catalog";

export const metadata: Metadata = { title: "Home matching demo | A7 Property", description: "Try a browser-based property matching demo that filters and ranks the A7 sample listings." };

export default function AssistantPage() { return <PropertyConsultant properties={allProperties} />; }
