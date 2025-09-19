import { api } from "encore.dev/api";
import db from "../db";
import { getAuthData } from "~encore/auth";
import type { CreateOrderRequest, Order } from "./types";

// Utility function to convert numbers to decimal strings for Postgres numeric type
const toDecimalString = (value: unknown): string => {
  if (typeof value === "number") {
    if (isNaN(value) || !isFinite(value)) {
      throw new Error("Invalid decimal input: NaN or Infinity");
    }
    return value.toFixed(2);
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed) || !isFinite(parsed)) {
      throw new Error(`Invalid decimal string: ${trimmed}`);
    }
    return parsed.toFixed(2);
  }
  throw new Error(`Invalid decimal input type: ${typeof value}`);
};

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

export const create = api(
  { method: "POST", path: "/orders", expose: true },
  async (req: CreateOrderRequest): Promise<Order> => {
    const auth = getAuthData();
    if (!auth?.userID) {
      throw new Error("Không được phép");
    }

    // Validate required fields
    if (!req.customerId || !req.customerId.trim()) {
      throw new Error("Customer ID is required");
    }
    if (!req.items || req.items.length === 0) {
      throw new Error("At least one item is required");
    }
    
    // Normalize items to handle both formats
    const normalizedItems = req.items.map((item, index) => {
      const price = item.price || item.unitPrice || 0;
      const unitPrice = typeof price === 'string' ? parseFloat(price) : price;
      
      // Validate individual item fields
      if (isNaN(unitPrice) || unitPrice < 0) {
        throw new Error(`Invalid unit price for item ${index + 1}: ${price}`);
      }
      
      const quantity = item.qty || item.quantity || 1;
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for item ${index + 1}: ${quantity}`);
      }
      
      const productName = item.productName || item.sku || 'Product';
      if (!productName.trim()) {
        throw new Error(`Product name is required for item ${index + 1}`);
      }
      
      return {
        productId: item.sku || item.productId,
        productName: productName,
        quantity: quantity,
        unitPrice: unitPrice,
        notes: item.notes
      };
    });

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Calculate total amount - prioritize 'total' field from new format
    let totalAmount: number;
    if (req.total) {
      const parsedTotal = typeof req.total === 'string' ? parseFloat(req.total) : req.total;
      if (isNaN(parsedTotal) || parsedTotal < 0) {
        throw new Error(`Invalid total amount: ${req.total}`);
      }
      totalAmount = parsedTotal;
    } else if (req.totalAmount && !isNaN(req.totalAmount) && req.totalAmount > 0) {
      totalAmount = req.totalAmount;
    } else {
      // Calculate from items
      totalAmount = normalizedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    }
    
    // Additional validation for calculated total
    if (isNaN(totalAmount) || totalAmount < 0) {
      throw new Error(`Invalid calculated total amount: ${totalAmount}`);
    }

    // Convert to decimal string for Postgres numeric type
    const finalTotalAmount = toDecimalString(totalAmount);

    // Tạo đơn hàng
    const orderRow = await db.queryRow`
      INSERT INTO orders (
        customer_id, order_number, total_amount, currency, status,
        order_date, activation_date, expiry_date, license_type, notes,
        created_by, updated_by
      ) VALUES (
        ${req.customerId}::uuid,
        ${orderNumber}::text,
        ${finalTotalAmount}::numeric,
        ${req.currency ?? 'VND'}::text,
        ${req.status ?? 'pending'}::text,
        ${req.orderDate ?? new Date()}::timestamptz,
        ${req.activationDate ?? null}::timestamptz,
        ${req.expiryDate ?? null}::timestamptz,
        ${req.licenseType ?? null}::text,
        ${req.notes ?? null}::text,
        ${auth.userID}::uuid,
        ${auth.userID}::uuid
      )
      RETURNING
        id, customer_id, order_number,
        total_amount::text AS total_amount,
        currency, status,
        order_date, activation_date, expiry_date, license_type, notes,
        created_by, updated_by, created_at, updated_at
    `;


    if (!orderRow) {
      throw new Error("Failed to create order");
    }

    // Add each item
    const items = [];
    for (const item of normalizedItems) {
      const totalPrice = item.quantity * item.unitPrice;

      // Convert monetary values to decimal strings for Postgres numeric type
      const finalUnitPrice = toDecimalString(item.unitPrice);
      const finalTotalPrice = toDecimalString(totalPrice);
      const productId = item.productId && item.productId.trim() ? item.productId : null;

      const itemResult = await db.queryRow`
        INSERT INTO order_items (
          order_id, product_id, product_name, quantity, 
          unit_price, total_price, notes
        ) VALUES (
          ${orderRow.id}, ${productId}, ${item.productName}, ${item.quantity}, 
          ${finalUnitPrice}::numeric, ${finalTotalPrice}::numeric, ${item.notes || null}
        )
        RETURNING id, order_id, product_id, product_name, quantity, 
                  unit_price::text, total_price::text, notes
      `;

      if (itemResult) {
        items.push({
          id: itemResult.id,
          orderId: itemResult.order_id,
          productId: itemResult.product_id,
          productName: itemResult.product_name,
          quantity: parseInt(itemResult.quantity),
          unitPrice: parseDecimalSafe(itemResult.unit_price),
          totalPrice: parseDecimalSafe(itemResult.total_price),
          notes: itemResult.notes
        });
      }
    }

    // Lấy thông tin người tạo
    const user = await db.queryRow`SELECT id, name FROM users WHERE id = ${auth.userID}`;

    return {
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
      items,
      createdBy: user ? {
        id: user.id,
        name: user.name
      } : undefined,
      updatedBy: user ? {
        id: user.id,
        name: user.name
      } : undefined,
      createdAt: new Date(orderRow.created_at),
      updatedAt: new Date(orderRow.updated_at)
    };
  }
);
