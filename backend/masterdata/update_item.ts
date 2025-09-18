import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { UpdateMasterDataRequest, MasterDataItem } from "./list_items";

// Updates a master data item
export const updateItem = api(
  { expose: true, method: "PUT", path: "/masterdata/:table/:id", auth: true },
  async (req: UpdateMasterDataRequest): Promise<MasterDataItem> => {
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

    // Check if name already exists for another item
    let existing;
    switch (req.table) {
      case 'customer_types':
        existing = await db.queryRow`SELECT id FROM customer_types WHERE name = ${req.name} AND id != ${req.id}`;
        break;
      case 'business_types':
        existing = await db.queryRow`SELECT id FROM business_types WHERE name = ${req.name} AND id != ${req.id}`;
        break;
      case 'products':
        existing = await db.queryRow`SELECT id FROM products WHERE name = ${req.name} AND id != ${req.id}`;
        break;
      case 'lead_sources':
        existing = await db.queryRow`SELECT id FROM lead_sources WHERE name = ${req.name} AND id != ${req.id}`;
        break;
      case 'stages':
        existing = await db.queryRow`SELECT id FROM stages WHERE name = ${req.name} AND id != ${req.id}`;
        break;
      case 'contact_statuses':
        existing = await db.queryRow`SELECT id FROM contact_statuses WHERE name = ${req.name} AND id != ${req.id}`;
        break;
      case 'temperatures':
        existing = await db.queryRow`SELECT id FROM temperatures WHERE name = ${req.name} AND id != ${req.id}`;
        break;
      case 'company_sizes':
        existing = await db.queryRow`SELECT id FROM company_sizes WHERE name = ${req.name} AND id != ${req.id}`;
        break;
    }

    if (existing) {
      throw new Error("Name already exists");
    }

    let item;
    switch (req.table) {
      case 'customer_types':
        item = await db.queryRow`UPDATE customer_types SET name = ${req.name.trim()}, active = ${req.active}, updated_at = now() WHERE id = ${req.id} RETURNING *`;
        break;
      case 'business_types':
        item = await db.queryRow`UPDATE business_types SET name = ${req.name.trim()}, active = ${req.active}, updated_at = now() WHERE id = ${req.id} RETURNING *`;
        break;
      case 'products':
        item = await db.queryRow`UPDATE products SET name = ${req.name.trim()}, active = ${req.active}, updated_at = now() WHERE id = ${req.id} RETURNING *`;
        break;
      case 'lead_sources':
        item = await db.queryRow`UPDATE lead_sources SET name = ${req.name.trim()}, active = ${req.active}, updated_at = now() WHERE id = ${req.id} RETURNING *`;
        break;
      case 'stages':
        item = await db.queryRow`UPDATE stages SET name = ${req.name.trim()}, active = ${req.active}, updated_at = now() WHERE id = ${req.id} RETURNING *`;
        break;
      case 'contact_statuses':
        item = await db.queryRow`UPDATE contact_statuses SET name = ${req.name.trim()}, active = ${req.active}, updated_at = now() WHERE id = ${req.id} RETURNING *`;
        break;
      case 'temperatures':
        item = await db.queryRow`UPDATE temperatures SET name = ${req.name.trim()}, active = ${req.active}, updated_at = now() WHERE id = ${req.id} RETURNING *`;
        break;
      case 'company_sizes':
        item = await db.queryRow`UPDATE company_sizes SET name = ${req.name.trim()}, active = ${req.active}, updated_at = now() WHERE id = ${req.id} RETURNING *`;
        break;
    }

    if (!item) {
      throw new Error("Item not found");
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