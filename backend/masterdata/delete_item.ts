import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { DeleteMasterDataRequest } from "./list_items";

interface DeleteMasterDataResponse {
  success: boolean;
}

// Deletes a master data item (hard delete)
export const deleteItem = api(
  { expose: true, method: "DELETE", path: "/masterdata/:table/:id", auth: true },
  async (req: DeleteMasterDataRequest): Promise<DeleteMasterDataResponse> => {
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

    // Check if item is being used by any customers
    let usageCheck;
    
    switch (req.table) {
      case 'customer_types':
        usageCheck = await db.queryRow`SELECT id FROM customers WHERE customer_type_id = ${req.id} AND deleted_at IS NULL LIMIT 1`;
        break;
      case 'business_types':
        usageCheck = await db.queryRow`SELECT id FROM customers WHERE business_type_id = ${req.id} AND deleted_at IS NULL LIMIT 1`;
        break;
      case 'stages':
        usageCheck = await db.queryRow`SELECT id FROM customers WHERE stage_id = ${req.id} AND deleted_at IS NULL LIMIT 1`;
        break;
      case 'temperatures':
        usageCheck = await db.queryRow`SELECT id FROM customers WHERE temperature_id = ${req.id} AND deleted_at IS NULL LIMIT 1`;
        break;
      case 'contact_statuses':
        usageCheck = await db.queryRow`SELECT id FROM customers WHERE contact_status_id = ${req.id} AND deleted_at IS NULL LIMIT 1`;
        break;
      case 'lead_sources':
        usageCheck = await db.queryRow`SELECT id FROM customers WHERE lead_source_id = ${req.id} AND deleted_at IS NULL LIMIT 1`;
        break;
      case 'company_sizes':
        usageCheck = await db.queryRow`SELECT id FROM customers WHERE company_size_id = ${req.id} AND deleted_at IS NULL LIMIT 1`;
        break;
      case 'products':
        usageCheck = await db.queryRow`SELECT customer_id FROM customer_products WHERE product_id = ${req.id} LIMIT 1`;
        break;
    }

    if (usageCheck) {
      throw new Error("Cannot delete item - it is being used by existing customers. Please deactivate it instead.");
    }

    let result;
    switch (req.table) {
      case 'customer_types':
        result = await db.queryRow`DELETE FROM customer_types WHERE id = ${req.id} RETURNING id`;
        break;
      case 'business_types':
        result = await db.queryRow`DELETE FROM business_types WHERE id = ${req.id} RETURNING id`;
        break;
      case 'products':
        result = await db.queryRow`DELETE FROM products WHERE id = ${req.id} RETURNING id`;
        break;
      case 'lead_sources':
        result = await db.queryRow`DELETE FROM lead_sources WHERE id = ${req.id} RETURNING id`;
        break;
      case 'stages':
        result = await db.queryRow`DELETE FROM stages WHERE id = ${req.id} RETURNING id`;
        break;
      case 'contact_statuses':
        result = await db.queryRow`DELETE FROM contact_statuses WHERE id = ${req.id} RETURNING id`;
        break;
      case 'temperatures':
        result = await db.queryRow`DELETE FROM temperatures WHERE id = ${req.id} RETURNING id`;
        break;
      case 'company_sizes':
        result = await db.queryRow`DELETE FROM company_sizes WHERE id = ${req.id} RETURNING id`;
        break;
    }

    if (!result) {
      throw new Error("Item not found");
    }

    return { success: true };
  }
);