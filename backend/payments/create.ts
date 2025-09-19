import { api } from "encore.dev/api";
import db from "../db";
import { getAuthData } from "~encore/auth";
import type { CreatePaymentRequest, Payment } from "./types";

/** Ép về number (2 chữ số thập phân) */
const toDecimalNumber = (value: unknown): number => {
  if (typeof value === "number") {
    if (!isFinite(value)) throw new Error("Invalid decimal input");
    return Math.round(value * 100) / 100;
  }
  if (typeof value === "bigint") {
    const n = Number(value);
    if (!isFinite(n)) throw new Error("Invalid bigint decimal input");
    return Math.round(n * 100) / 100;
  }
  if (typeof value === "string") {
    const n = Number(value.trim());
    if (!isFinite(n)) throw new Error(`Invalid decimal string: ${value}`);
    return Math.round(n * 100) / 100;
  }
  throw new Error(`Invalid decimal input type: ${typeof value}`);
};

/** Truyền TEXT vào SQL rồi dùng to_number(TEXT,'FM999999999.00') */
const toDecimalText = (value: unknown): string => {
  return toDecimalNumber(value).toFixed(2);
};

/** Parse an toàn từ DB (khi SELECT/RETURNING ...::text) */
const parseDecimalSafe = (value: string): number => {
  if (!value || value.trim() === "") return 0;
  const n = Number(value.trim());
  if (!isFinite(n)) {
    console.warn(`Invalid decimal value from database: ${value}`);
    return 0;
  }
  return n;
};

export const create = api(
  { method: "POST", path: "/payments", expose: true },
  async (req: CreatePaymentRequest): Promise<Payment> => {
    const auth = getAuthData();
    if (!auth?.userID) throw new Error("Không được phép");

    // ---- Validate cơ bản ----
    if (!req.customerId || !String(req.customerId).trim()) {
      throw new Error("Customer ID is required");
    }
    if (!req.amount && req.amount !== 0) {
      throw new Error("Amount is required");
    }
    const amountNum = toDecimalNumber(req.amount);
    if (amountNum <= 0) {
      throw new Error("Amount must be greater than 0");
    }
    const amountText = amountNum.toFixed(2); // cho to_number

    const currency = String(req.currency ?? "VND");
    const paymentMethod = req.paymentMethod ? String(req.paymentMethod) : "cash";
    const status = String(req.status ?? "pending");
    const paymentDate = req.paymentDate ?? new Date();
    const referenceNumber =
      req.referenceNumber != null ? String(req.referenceNumber) : null;
    const notes = req.notes != null ? String(req.notes) : null;
    const orderId =
      req.orderId != null && String(req.orderId).trim()
        ? String(req.orderId).trim()
        : null;

    // ---- Sinh số chứng từ ----
    const paymentNumber = `PAY-${Date.now()}`;

    // ---- INSERT payments (dùng to_number để nạp numeric) ----
    const paymentRow = await db.queryRow`
      INSERT INTO payments (
        customer_id, order_id, payment_number, amount, currency,
        payment_method, payment_date, status, reference_number, notes,
        created_by, updated_by
      ) VALUES (
        ${String(req.customerId)},
        ${orderId},
        ${String(paymentNumber)},
        to_number(${amountText}, 'FM999999999.00'),
        ${currency},
        ${paymentMethod},
        ${paymentDate},
        ${status},
        ${referenceNumber},
        ${notes},
        ${String(auth.userID)},
        ${String(auth.userID)}
      )
      RETURNING
        id,
        customer_id,
        order_id,
        payment_number,
        amount::text AS amount_text,   -- đọc numeric dưới dạng text
        currency,
        payment_method,
        payment_date,
        status,
        reference_number,
        notes,
        created_by,
        updated_by,
        created_at,
        updated_at
    `;

    if (!paymentRow) {
      throw new Error("Failed to create payment");
    }

    // ---- Lấy thông tin user (optional) ----
    const user = await db.queryRow`
      SELECT id, name FROM users WHERE id = ${String(auth.userID)}
    `;

    // ---- Trả về Payment chuẩn hoá ----
    return {
      id: paymentRow.id,
      customerId: paymentRow.customer_id,
      orderId: paymentRow.order_id ?? undefined,
      paymentNumber: paymentRow.payment_number,
      amount: parseDecimalSafe(paymentRow.amount_text),
      currency: paymentRow.currency,
      paymentMethod: paymentRow.payment_method,
      paymentDate: new Date(paymentRow.payment_date),
      status: paymentRow.status,
      referenceNumber: paymentRow.reference_number ?? undefined,
      notes: paymentRow.notes ?? undefined,
      createdBy: user ? { id: user.id, name: user.name } : undefined,
      updatedBy: user ? { id: user.id, name: user.name } : undefined,
      createdAt: new Date(paymentRow.created_at),
      updatedAt: new Date(paymentRow.updated_at),
    };
  }
);
