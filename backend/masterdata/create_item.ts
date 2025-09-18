import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { CreateMasterDataRequest, MasterDataItem } from "./list_items";

// Creates a new master data item
export const createItem = api(
  { expose: true, method: "POST", path: "/masterdata/:table", auth: true },
  async (req: CreateMasterDataRequest): Promise<MasterDataItem> => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin") {
      throw new Error("Access denied - Admin only");
    }

    const ALLOWED_TABLES = [
      'customer_types',
      'business_types', 
      'products',
      'lead_sources',
      'stages',
      'contact_statuses',
      'temperatures',
      'company_sizes'
    ];

    if (!ALLOWED_TABLES.includes(req.table)) {
      throw new Error("Invalid table name");
    }

    if (!req.name.trim()) {
      throw new Error("Name is required");
    }

    // Check if name already exists
    let existing;
    switch (req.table) {
      case 'customer_types':
        existing = await db.queryRow`SELECT id FROM customer_types WHERE name = ${req.name}`;
        break;
      case 'business_types':
        existing = await db.queryRow`SELECT id FROM business_types WHERE name = ${req.name}`;
        break;
      case 'products':
        existing = await db.queryRow`SELECT id FROM products WHERE name = ${req.name}`;
        break;
      case 'lead_sources':
        existing = await db.queryRow`SELECT id FROM lead_sources WHERE name = ${req.name}`;
        break;
      case 'stages':
        existing = await db.queryRow`SELECT id FROM stages WHERE name = ${req.name}`;
        break;
      case 'contact_statuses':
        existing = await db.queryRow`SELECT id FROM contact_statuses WHERE name = ${req.name}`;
        break;
      case 'temperatures':
        existing = await db.queryRow`SELECT id FROM temperatures WHERE name = ${req.name}`;
        break;
      case 'company_sizes':
        existing = await db.queryRow`SELECT id FROM company_sizes WHERE name = ${req.name}`;
        break;
    }

    if (existing) {
      throw new Error("Name already exists");
    }

    let item;
    switch (req.table) {
      case 'customer_types':
        item = await db.queryRow`INSERT INTO customer_types (name) VALUES (${req.name.trim()}) RETURNING *`;
        break;
      case 'business_types':
        item = await db.queryRow`INSERT INTO business_types (name) VALUES (${req.name.trim()}) RETURNING *`;
        break;
      case 'products':
        item = await db.queryRow`INSERT INTO products (name) VALUES (${req.name.trim()}) RETURNING *`;
        break;
      case 'lead_sources':
        item = await db.queryRow`INSERT INTO lead_sources (name) VALUES (${req.name.trim()}) RETURNING *`;
        break;
      case 'stages':
        item = await db.queryRow`INSERT INTO stages (name) VALUES (${req.name.trim()}) RETURNING *`;
        break;
      case 'contact_statuses':
        item = await db.queryRow`INSERT INTO contact_statuses (name) VALUES (${req.name.trim()}) RETURNING *`;
        break;
      case 'temperatures':
        item = await db.queryRow`INSERT INTO temperatures (name) VALUES (${req.name.trim()}) RETURNING *`;
        break;
      case 'company_sizes':
        item = await db.queryRow`INSERT INTO company_sizes (name) VALUES (${req.name.trim()}) RETURNING *`;
        break;
    }

    if (!item) {
      throw new Error("Failed to create item");
    }

    return {
      id: item.id,
      name: item.name,
      active: item.active,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    };
  }
);