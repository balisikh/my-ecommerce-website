export type MutationResult =
  | { ok: true; productId?: string }
  | {
      ok: false;
      error: string;
      code?: "has_orders" | "forbidden" | "unauthorized" | "validation";
    };
