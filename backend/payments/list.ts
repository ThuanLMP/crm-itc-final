import { api } from "encore.dev/api";
import db from "../db";
import type { ListPaymentsRequest, ListPaymentsResponse, Payment } from "./types";

export const list = api(
  { method: "GET", path: "/payments", expose: true },
  async (req: ListPaymentsRequest): Promise<ListPaymentsResponse> => {
    const page = req.page || 1;
    const limit = Math.min(req.limit || 50, 100);
    const offset = (page - 1) * limit;

    let totalCount = 0;
    let paymentsResult: any[] = [];

    if (req.customerId) {
      // Query for a specific customer
      const countResult = await db.queryRow`
        SELECT COUNT(*) as count FROM payments WHERE customer_id = ${req.customerId}
      `;
      totalCount = parseInt(countResult?.count || '0');

      paymentsResult = await db.queryAll`
        SELECT 
          p.id, p.customer_id, p.order_id, p.payment_number, p.amount, p.currency,
          p.payment_method, p.payment_date, p.status, p.reference_number, p.notes,
          p.created_at, p.updated_at,
          cb.id as created_by_id, cb.name as created_by_name,
          ub.id as updated_by_id, ub.name as updated_by_name
        FROM payments p
        LEFT JOIN users cb ON p.created_by = cb.id
        LEFT JOIN users ub ON p.updated_by = ub.id
        WHERE p.customer_id = ${req.customerId}
        ORDER BY p.payment_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Query for all payments
      const countResult = await db.queryRow`
        SELECT COUNT(*) as count FROM payments
      `;
      totalCount = parseInt(countResult?.count || '0');

      paymentsResult = await db.queryAll`
        SELECT 
          p.id, p.customer_id, p.order_id, p.payment_number, p.amount, p.currency,
          p.payment_method, p.payment_date, p.status, p.reference_number, p.notes,
          p.created_at, p.updated_at,
          cb.id as created_by_id, cb.name as created_by_name,
          ub.id as updated_by_id, ub.name as updated_by_name
        FROM payments p
        LEFT JOIN users cb ON p.created_by = cb.id
        LEFT JOIN users ub ON p.updated_by = ub.id
        ORDER BY p.payment_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const payments: Payment[] = paymentsResult.map(row => ({
      id: row.id,
      customerId: row.customer_id,
      orderId: row.order_id,
      paymentNumber: row.payment_number,
      amount: parseFloat(row.amount),
      currency: row.currency,
      paymentMethod: row.payment_method,
      paymentDate: new Date(row.payment_date),
      status: row.status,
      referenceNumber: row.reference_number,
      notes: row.notes,
      createdBy: row.created_by_id ? {
        id: row.created_by_id,
        name: row.created_by_name
      } : undefined,
      updatedBy: row.updated_by_id ? {
        id: row.updated_by_id,
        name: row.updated_by_name
      } : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));

    return {
      payments,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  }
);