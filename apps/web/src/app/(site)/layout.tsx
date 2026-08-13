import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCategories } from "@/lib/api";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }

  return (
    <>
      <Header categories={categories} compact />
      {children}
      <Footer />
    </>
  );
}
