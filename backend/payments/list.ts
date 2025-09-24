import { api } from "encore.dev/api";
import db from "../db";
import type { ListPaymentsRequest, ListPaymentsResponse, Payment } from "./types";

/** Parse an toàn số thập phân (đọc từ DB dạng text) */
const parseDecimalSafe = (value: unknown): number => {
  if (value == null) return 0;
  const s = String(value).trim();
  if (!s) return 0;
  const n = Number(s);
  if (!isFinite(n)) {
    console.warn("Invalid decimal from DB:", value);
    return 0;
  }
  return n;
};

export const list = api(
  { method: "GET", path: "/payments", expose: true },
  async (req: ListPaymentsRequest): Promise<ListPaymentsResponse> => {
    const page = Math.max(1, Number(req.page ?? 1));
    const limit = Math.min(Math.max(1, Number(req.limit ?? 50)), 100);
    const offset = (page - 1) * limit;

    let totalCount = 0;
    let rows: any[] = [];

    if (req.customerId && String(req.customerId).trim()) {
      // Đếm theo customer
      const c = await db.queryRow`
        SELECT COUNT(*)::text AS count_text
        FROM payments
        WHERE customer_id = ${String(req.customerId).trim()}
      `;
      totalCount = parseInt(c?.count_text ?? "0", 10) || 0;

      rows = await db.queryAll`
        SELECT 
          p.id,
          p.customer_id,
          p.order_id,
          p.payment_number,
          p.amount::text AS amount_text,      -- numeric -> text
          p.currency,
          p.payment_method,
          p.payment_date,
          p.status,
          p.reference_number,
          p.notes,
          p.created_at,
          p.updated_at,
          cb.id   AS created_by_id,
          cb.name AS created_by_name,
          ub.id   AS updated_by_id,
          ub.name AS updated_by_name
        FROM payments p
        LEFT JOIN users cb ON p.created_by = cb.id
        LEFT JOIN users ub ON p.updated_by = ub.id
        WHERE p.customer_id = ${String(req.customerId).trim()}
        ORDER BY p.payment_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Đếm tất cả
      const c = await db.queryRow`
        SELECT COUNT(*)::text AS count_text
        FROM payments
      `;
      totalCount = parseInt(c?.count_text ?? "0", 10) || 0;

      rows = await db.queryAll`
        SELECT 
          p.id,
          p.customer_id,
          p.order_id,
          p.payment_number,
          p.amount::text AS amount_text,      -- numeric -> text
          p.currency,
          p.payment_method,
          p.payment_date,
          p.status,
          p.reference_number,
          p.notes,
          p.created_at,
          p.updated_at,
          cb.id   AS created_by_id,
          cb.name AS created_by_name,
          ub.id   AS updated_by_id,
          ub.name AS updated_by_name
        FROM payments p
        LEFT JOIN users cb ON p.created_by = cb.id
        LEFT JOIN users ub ON p.updated_by = ub.id
        ORDER BY p.payment_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const payments: Payment[] = rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      orderId: row.order_id ?? undefined,
      paymentNumber: row.payment_number,
      amount: parseDecimalSafe(row.amount_text), // dùng amount_text
      currency: row.currency,
      paymentMethod: row.payment_method,
      paymentDate: new Date(row.payment_date),
      status: row.status,
      referenceNumber: row.reference_number ?? undefined,
      notes: row.notes ?? undefined,
      createdBy: row.created_by_id
        ? { id: row.created_by_id, name: row.created_by_name }
        : undefined,
      updatedBy: row.updated_by_id
        ? { id: row.updated_by_id, name: row.updated_by_name }
        : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));

    return {
      payments,
      total: totalCount,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    };
  }
);
