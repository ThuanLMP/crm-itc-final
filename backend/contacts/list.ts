import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { ListContactsRequest, ListContactsResponse } from "./types";

// Lists contact history for a customer
export const list = api(
  { expose: true, method: "GET", path: "/contacts/:customerId", auth: true },
  async (req: ListContactsRequest): Promise<ListContactsResponse> => {
    const auth = getAuthData()!;
    const page = req.page || 1;
    const limit = Math.min(req.limit || 20, 100);
    const offset = (page - 1) * limit;

    // Verify user has access to this customer
    const customer = await db.queryRow`
      SELECT id, assigned_salesperson_id 
      FROM customers 
      WHERE id = ${req.customerId} AND deleted_at IS NULL
    `;

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Check access permissions
    if (auth.role === "employee" && customer.assigned_salesperson_id !== auth.userID) {
      throw new Error("Access denied");
    }

    // Get total count
    const totalResult = await db.queryRow`
      SELECT COUNT(*) as count 
      FROM contact_history 
      WHERE customer_id = ${req.customerId}
    `;
    const total = parseInt(totalResult?.count || "0");

    // Get contacts with creator details using correct column names
    const contacts = await db.queryAll`
      SELECT 
        ch.id,
        ch.customer_id,
        ch.type,
        ch.subject,
        ch.notes,
        ch.outcome,
        ch.next_step,
        ch.duration,
        ch.created_by,
        ch.created_at,
        ch.updated_at,
        u.name as creator_name
      FROM contact_history ch
      LEFT JOIN users u ON ch.created_by = u.id
      WHERE ch.customer_id = ${req.customerId}
      ORDER BY ch.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return {
      contacts: contacts.map((contact: any) => ({
        id: contact.id,
        customerId: contact.customer_id,
        type: contact.type,
        subject: contact.subject,
        notes: contact.notes,
        outcome: contact.outcome,
        nextStep: contact.next_step,
        duration: contact.duration,
        createdBy: {
          id: contact.created_by,
          name: contact.creator_name || "Unknown"
        },
        createdAt: new Date(contact.created_at),
        updatedAt: new Date(contact.updated_at || contact.created_at),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
);