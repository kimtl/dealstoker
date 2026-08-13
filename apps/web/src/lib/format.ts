export function formatMoney(
  amount: number | string | null | undefined,
  currency: string | null | undefined = "USD",
): string | null {
  if (amount === null || amount === undefined || amount === "") {
    return null;
  }
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) {
    return null;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function formatRating(
  rating: number | string | null | undefined,
): string | null {
  if (rating === null || rating === undefined || rating === "") {
    return null;
  }
  const value = typeof rating === "string" ? Number(rating) : rating;
  if (Number.isNaN(value)) {
    return null;
  }
  return value.toFixed(1);
}

export function formatReviewCount(count: number | null | undefined): string {
  if (count === null || count === undefined) {
    return "";
  }
  return new Intl.NumberFormat("en-US").format(count);
}
