import type { Metadata } from "next";
import { AdminChrome } from "./AdminChrome";

export const metadata: Metadata = {
  title: "Admin | DealStoker",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminChrome>{children}</AdminChrome>;
}
