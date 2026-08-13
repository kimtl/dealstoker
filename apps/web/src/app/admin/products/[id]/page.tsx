"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminGetProduct } from "@/lib/admin-api";
import type { ProductDetail } from "@/lib/types";
import { ProductForm } from "../ProductForm";
import styles from "../../admin.module.css";

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    adminGetProduct(id)
      .then(setProduct)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [id]);

  return (
    <div>
      <h1 className={styles.title}>Edit product #{id}</h1>
      {error ? <p className={styles.error}>{error}</p> : null}
      {!product && !error ? (
        <p className={styles.muted}>Loading…</p>
      ) : product ? (
        <div className={styles.card}>
          <ProductForm product={product} />
        </div>
      ) : null}
    </div>
  );
}
