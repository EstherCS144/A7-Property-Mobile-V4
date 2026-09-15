import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { PropertyCRM } from "@/components/dashboard/property-crm";
import { allProperties } from "@/lib/property-catalog";

export const metadata: Metadata = { title: "Owner dashboard | A7 Property", description: "Manage property listings, inquiries, pricing, analytics and verification.", robots: { index: false, follow: false } };

export default function OwnerPage() {
  return (
    <RequireAuth requireRole="lister">
      <PropertyCRM role="owner" properties={allProperties} />
    </RequireAuth>
  );
}
