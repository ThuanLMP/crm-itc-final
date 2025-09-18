import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { CreateContactRequest, ContactHistory } from "./types";

// Creates a new contact history entry
export const create = api(
  { expose: true, method: "POST", path: "/contacts", auth: true },
  async (req: CreateContactRequest): Promise<ContactHistory> => {
    const auth = getAuthData()!;

    // Verify user has access to this customer
    const customer = await db.queryRow`
      SELECT id, assigned_salesperson_id 
      FROM customers 
      WHERE id = ${req.customerId} AND deleted_at IS NULL
    `;

    if (!customer) {
      throw new Error("Không tìm thấy khách hàng");
    }

    // Check access permissions
    if (auth.role === "employee" && customer.assigned_salesperson_id !== auth.userID) {
      throw new Error("Access denied");
    }

    // Create contact history entry using correct column names from migration 004
    const contactRow = await db.queryRow`
      INSERT INTO contact_history (
        customer_id, type, subject, notes, outcome, next_step, 
        duration, created_by, created_at, updated_at
      )
      VALUES (
        ${req.customerId}, ${req.type}, ${req.subject || null}, ${req.notes || null}, 
        ${req.outcome || null}, ${req.nextStep || null}, ${req.duration || null}, 
        ${auth.userID}, NOW(), NOW()
      )
      RETURNING *
    `;

    if (!contactRow) {
      throw new Error("Failed to create contact");
    }

    // Get user info for response
    const user = await db.queryRow`SELECT id, name FROM users WHERE id = ${auth.userID}`;

    return {
      id: contactRow.id,
      customerId: contactRow.customer_id,
      type: contactRow.type,
      subject: contactRow.subject,
      notes: contactRow.notes,
      outcome: contactRow.outcome,
      nextStep: contactRow.next_step,
      duration: contactRow.duration,
      createdBy: {
        id: auth.userID,
        name: user?.name || "Unknown"
      },
      createdAt: new Date(contactRow.created_at),
      updatedAt: new Date(contactRow.updated_at || contactRow.created_at),
    };
  }
);