"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminMe, clearStoredAuth, setStoredAuth } from "@/lib/admin-api";
import styles from "../admin.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    clearStoredAuth();
    setStoredAuth(username.trim(), password);
    try {
      await adminMe();
      router.replace("/admin");
    } catch (err) {
      clearStoredAuth();
      const detail =
        err instanceof Error && err.message ? err.message : "Login failed.";
      setError(
        `${detail} Use Railway API variables ADMIN_USERNAME / ADMIN_PASSWORD (not the old local default changeme unless you set that).`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.loginWrap}>
      <form className={`${styles.loginCard} ${styles.form}`} onSubmit={onSubmit}>
        <h1>Admin login</h1>
        <p className={styles.muted}>
          Credentials come from the API service env:{" "}
          <code>ADMIN_USERNAME</code> / <code>ADMIN_PASSWORD</code>.
        </p>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
