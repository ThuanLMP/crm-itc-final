import { api } from "encore.dev/api";
import db from "../db";
import { getAuthData } from "~encore/auth";
import type { CreatePaymentRequest, Payment } from "./types";

export const create = api(
  { method: "POST", path: "/payments", expose: true },
  async (req: CreatePaymentRequest): Promise<Payment> => {
    const auth = getAuthData();
    if (!auth?.userID) {
      throw new Error("Không được phép");
    }

    // Generate payment number (simplified for now)
    const paymentNumber = `PAY-${Date.now()}`;

    // Create payment
    const paymentRow = await db.queryRow`
      INSERT INTO payments (
        customer_id, order_id, payment_number, amount, currency, 
        payment_method, payment_date, status, reference_number, notes, 
        created_by, updated_by
      ) VALUES (
        ${req.customerId}, ${req.orderId || null}, ${paymentNumber}, ${req.amount.toString()}, ${req.currency || 'VND'}, 
        ${req.paymentMethod}, ${req.paymentDate || new Date()}, ${req.status || 'pending'}, 
        ${req.referenceNumber || null}, ${req.notes || null}, ${auth.userID}, ${auth.userID}
      )
      RETURNING *
    `;

    if (!paymentRow) {
      throw new Error("Failed to create payment");
    }

    // Get user info for response
    const user = await db.queryRow`SELECT id, name FROM users WHERE id = ${auth.userID}`;

    return {
      id: paymentRow.id,
      customerId: paymentRow.customer_id,
      orderId: paymentRow.order_id,
      paymentNumber: paymentRow.payment_number,
      amount: parseFloat(paymentRow.amount),
      currency: paymentRow.currency,
      paymentMethod: paymentRow.payment_method,
      paymentDate: new Date(paymentRow.payment_date),
      status: paymentRow.status,
      referenceNumber: paymentRow.reference_number,
      notes: paymentRow.notes,
      createdBy: user ? {
        id: user.id,
        name: user.name
      } : undefined,
      updatedBy: user ? {
        id: user.id,
        name: user.name
      } : undefined,
      createdAt: new Date(paymentRow.created_at),
      updatedAt: new Date(paymentRow.updated_at)
    };
  }
);