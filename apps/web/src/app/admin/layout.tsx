import type { Metadata } from "next";
import { AdminChrome } from "./AdminChrome";

export const metadata: Metadata = {
  title: "Admin | DealStoker",
  robots: { index: false, follow: false },
  // Do not inherit the root layout's canonical + hreflang (they point at /).
  alternates: { canonical: null },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminChrome>{children}</AdminChrome>;
}
