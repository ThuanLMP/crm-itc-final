import { api } from "encore.dev/api";
import db from "../db";
import { getAuthData } from "~encore/auth";
import type { CreateOrderRequest, Order } from "./types";

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

/** Dùng cho Postgres: truyền TEXT rồi to_number(TEXT,'pattern') */
const toDecimalText = (value: unknown): string => {
  const n = toDecimalNumber(value);
  // đảm bảo đúng định dạng thập phân có 2 chữ số
  return n.toFixed(2);
};

/** Parse an toàn từ DB (DB trả text cho numeric) */
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
  { method: "POST", path: "/orders", expose: true },
  async (req: CreateOrderRequest): Promise<Order> => {
    const auth = getAuthData();
    if (!auth?.userID) throw new Error("Không được phép");

    // Validate cơ bản
    if (!req.customerId || !req.customerId.trim()) {
      throw new Error("Customer ID is required");
    }
    if (!req.items || req.items.length === 0) {
      throw new Error("At least one item is required");
    }

    // Chuẩn hoá items
    const normalizedItems = req.items.map((item, index) => {
      const price = item.price ?? item.unitPrice ?? 0;
      const unitPrice = Number(price);

      if (!isFinite(unitPrice) || unitPrice < 0) {
        throw new Error(`Invalid unit price for item ${index + 1}: ${price}`);
      }

      const quantity = Number(item.qty ?? item.quantity ?? 1);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for item ${index + 1}: ${quantity}`);
      }

      const productName = (item.productName ?? item.sku ?? "Product").trim();
      if (!productName) {
        throw new Error(`Product name is required for item ${index + 1}`);
      }

      const productId =
        item.sku != null && String(item.sku).trim()
          ? String(item.sku).trim()
          : item.productId != null && String(item.productId).trim()
          ? String(item.productId).trim()
          : null;

      return {
        productId,
        productName,
        quantity,
        unitPrice,
        notes: item.notes ?? null,
      };
    });

    const orderNumber = `ORD-${Date.now()}`;

    // Tính tổng
    let totalAmount: number;
    if (req.total != null) {
      const t = Number(req.total);
      if (!isFinite(t) || t < 0) throw new Error(`Invalid total amount: ${req.total}`);
      totalAmount = t;
    } else if (req.totalAmount != null && req.totalAmount > 0) {
      totalAmount = req.totalAmount;
    } else {
      totalAmount = normalizedItems.reduce(
        (sum, it) => sum + it.quantity * it.unitPrice,
        0
      );
    }
    if (!isFinite(totalAmount) || totalAmount < 0) {
      throw new Error(`Invalid calculated total amount: ${totalAmount}`);
    }

    // Chuẩn bị TEXT để Postgres to_number(...)
    const totalAmountText = toDecimalText(totalAmount);

    // 🧪 Log xác minh kiểu dữ liệu (có thể tắt sau khi ổn định)
    // console.log("DEBUG to_number input:", { totalAmountText, typeof_totalAmountText: typeof totalAmountText });

    // INSERT orders: dùng to_number($1,'FM999999999.00') để ép TEXT -> numeric
    const orderRow = await db.queryRow`
      INSERT INTO orders (
        customer_id, order_number, total_amount, currency, status,
        order_date, activation_date, expiry_date, license_type, notes,
        created_by, updated_by
      ) VALUES (
        ${String(req.customerId)},
        ${String(orderNumber)},
        to_number(${totalAmountText}, 'FM999999999.00'),
        ${String(req.currency ?? "VND")},
        ${String(req.status ?? "pending")},
        ${req.orderDate ?? new Date()},
        ${req.activationDate ?? null},
        ${req.expiryDate ?? null},
        ${req.licenseType ?? null},
        ${req.notes ?? null},
        ${String(auth.userID)},
        ${String(auth.userID)}
      )
      RETURNING
        id, customer_id, order_number,
        total_amount::text AS total_amount,
        currency, status,
        order_date, activation_date, expiry_date, license_type, notes,
        created_by, updated_by, created_at, updated_at
    `;

    if (!orderRow) throw new Error("Failed to create order");

    // INSERT order_items (dùng to_number tương tự)
    const items: Order["items"] = [];
    for (const it of normalizedItems) {
      const unitPriceText = toDecimalText(it.unitPrice);
      const totalPriceText = toDecimalText(it.quantity * it.unitPrice);

      const itemRow = await db.queryRow`
        INSERT INTO order_items (
          order_id, product_id, product_name, quantity,
          unit_price, total_price, notes
        ) VALUES (
          ${orderRow.id},
          ${it.productId},
          ${it.productName},
          ${it.quantity},
          to_number(${unitPriceText}, 'FM999999999.00'),
          to_number(${totalPriceText}, 'FM999999999.00'),
          ${it.notes}
        )
        RETURNING
          id, order_id, product_id, product_name, quantity,
          unit_price::text, total_price::text, notes
      `;

      if (itemRow) {
        items.push({
          id: itemRow.id,
          orderId: itemRow.order_id,
          productId: itemRow.product_id ?? undefined,
          productName: itemRow.product_name,
          quantity: Number(itemRow.quantity),
          unitPrice: parseDecimalSafe(itemRow.unit_price),
          totalPrice: parseDecimalSafe(itemRow.total_price),
          notes: itemRow.notes ?? undefined,
        });
      }
    }

    const user = await db.queryRow`
      SELECT id, name FROM users WHERE id = ${String(auth.userID)}
    `;

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
      licenseType: orderRow.license_type ?? undefined,
      notes: orderRow.notes ?? undefined,
      items,
      createdBy: user ? { id: user.id, name: user.name } : undefined,
      updatedBy: user ? { id: user.id, name: user.name } : undefined,
      createdAt: new Date(orderRow.created_at),
      updatedAt: new Date(orderRow.updated_at),
    };
  }
);
