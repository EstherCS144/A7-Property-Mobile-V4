import type { Metadata } from "next";

import { MessagesExperience } from "@/components/mobile/messages-experience";
import { RequireAuth } from "@/components/auth/require-auth";
import { allProperties } from "@/lib/property-catalog";

export const metadata: Metadata = {
  title: "Messages | A7 Property",
  description: "Keep property inquiries, contact verification details, and viewing requests together.",
  robots: { index: false, follow: false },
};

export default function MessagesPage() {
  return <RequireAuth><MessagesExperience properties={allProperties} /></RequireAuth>;
}
