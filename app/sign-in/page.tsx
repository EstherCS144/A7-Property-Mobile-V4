import type { Metadata } from "next";

import { SignInView } from "@/components/auth/sign-in-view";

export const metadata: Metadata = {
  title: "Sign in | A7 Property",
  description: "Sign in to continue your A7 Property home search.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return <SignInView />;
}
