import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { PropertyCRM } from "@/components/dashboard/property-crm";
import { allProperties } from "@/lib/property-catalog";

export const metadata: Metadata = { title: "Agent workspace | A7 Property", description: "Professional Myanmar property CRM for inventory, leads, analytics and verification.", robots: { index: false, follow: false } };

export default function AgentPage() {
  return (
    <RequireAuth requireRole="lister">
      <PropertyCRM role="agent" properties={allProperties} />
    </RequireAuth>
  );
}
