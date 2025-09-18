import { api } from "encore.dev/api";
import db from "../db";
import type { ListOrdersRequest, ListOrdersResponse, Order } from "./types";

// Utility function to safely parse decimal strings from database
const parseDecimalSafe = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  const parsed = parseFloat(value.trim());
  if (isNaN(parsed) || !isFinite(parsed)) {
    console.warn(`Invalid decimal value from database: ${value}`);
    return 0;
  }
  return parsed;
};

export const list = api(
  { method: "GET", path: "/orders", expose: true },
  async (req: ListOrdersRequest): Promise<ListOrdersResponse> => {
    const page = req.page || 1;
    const limit = Math.min(req.limit || 50, 100);
    const offset = (page - 1) * limit;

    let totalCount = 0;
    let ordersResult: any[] = [];

    if (req.customerId) {
      // Query for a specific customer
      const countResult = await db.queryRow`
        SELECT COUNT(*) as count FROM orders WHERE customer_id = ${req.customerId}
      `;
      totalCount = parseInt(countResult?.count || '0');

      ordersResult = await db.queryAll`
        SELECT 
          o.id, o.customer_id, o.order_number, o.total_amount::text, o.currency,
          o.status, o.order_date, o.activation_date, o.expiry_date, o.license_type, o.notes,
          o.created_at, o.updated_at,
          cb.id as created_by_id, cb.name as created_by_name,
          ub.id as updated_by_id, ub.name as updated_by_name
        FROM orders o
        LEFT JOIN users cb ON o.created_by = cb.id
        LEFT JOIN users ub ON o.updated_by = ub.id
        WHERE o.customer_id = ${req.customerId}
        ORDER BY o.order_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Query for all orders
      const countResult = await db.queryRow`
        SELECT COUNT(*) as count FROM orders
      `;
      totalCount = parseInt(countResult?.count || '0');

      ordersResult = await db.queryAll`
        SELECT 
          o.id, o.customer_id, o.order_number, o.total_amount::text, o.currency,
          o.status, o.order_date, o.activation_date, o.expiry_date, o.license_type, o.notes,
          o.created_at, o.updated_at,
          cb.id as created_by_id, cb.name as created_by_name,
          ub.id as updated_by_id, ub.name as updated_by_name
        FROM orders o
        LEFT JOIN users cb ON o.created_by = cb.id
        LEFT JOIN users ub ON o.updated_by = ub.id
        ORDER BY o.order_date DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const orders: Order[] = [];

    for (const orderRow of ordersResult) {
      // Get order items
      const itemsResult = await db.queryAll`
        SELECT id, order_id, product_id, product_name, quantity, unit_price::text, total_price::text, notes
         FROM order_items 
         WHERE order_id = ${orderRow.id}
         ORDER BY id
      `;

      const order: Order = {
        id: orderRow.id,
        customerId: orderRow.customer_id,
        orderNumber: orderRow.order_number,
        totalAmount: parseDecimalSafe(orderRow.total_amount),
        currency: orderRow.currency,
        status: orderRow.status,
        orderDate: new Date(orderRow.order_date),
        activationDate: orderRow.activation_date ? new Date(orderRow.activation_date) : undefined,
        expiryDate: orderRow.expiry_date ? new Date(orderRow.expiry_date) : undefined,
        licenseType: orderRow.license_type,
        notes: orderRow.notes,
        items: itemsResult.map(item => ({
          id: item.id,
          orderId: item.order_id,
          productId: item.product_id,
          productName: item.product_name,
          quantity: parseInt(item.quantity),
          unitPrice: parseDecimalSafe(item.unit_price),
          totalPrice: parseDecimalSafe(item.total_price),
          notes: item.notes
        })),
        createdBy: orderRow.created_by_id ? {
          id: orderRow.created_by_id,
          name: orderRow.created_by_name
        } : undefined,
        updatedBy: orderRow.updated_by_id ? {
          id: orderRow.updated_by_id,
          name: orderRow.updated_by_name
        } : undefined,
        createdAt: new Date(orderRow.created_at),
        updatedAt: new Date(orderRow.updated_at)
      };

      orders.push(order);
    }

    return {
      orders,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  }
);