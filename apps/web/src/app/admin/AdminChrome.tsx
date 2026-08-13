"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearStoredAuth, hasStoredAuth } from "@/lib/admin-api";
import styles from "./admin.module.css";

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(isLogin);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!hasStoredAuth()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [isLogin, pathname, router]);

  if (isLogin) {
    return <div className={styles.shell}>{children}</div>;
  }

  if (!ready) {
    return (
      <div className={styles.shell}>
        <div className={styles.content}>
          <p className={styles.muted}>Checking session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/admin" className={styles.brand}>
          DealStoker Admin
        </Link>
        <nav className={styles.nav}>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/categories">Categories</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/">View site</Link>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() => {
              clearStoredAuth();
              router.push("/admin/login");
            }}
          >
            Log out
          </button>
        </nav>
      </header>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
