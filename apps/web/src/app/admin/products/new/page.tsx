"use client";

import { ProductForm } from "../ProductForm";
import styles from "../../admin.module.css";

export default function AdminNewProductPage() {
  return (
    <div>
      <h1 className={styles.title}>New product</h1>
      <div className={styles.card}>
        <ProductForm />
      </div>
    </div>
  );
}
