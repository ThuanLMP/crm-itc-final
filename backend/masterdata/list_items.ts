import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface MasterDataItem {
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMasterDataRequest {
  table: string;
  name: string;
}

export interface UpdateMasterDataRequest {
  table: string;
  id: string;
  name: string;
  active: boolean;
}

export interface DeleteMasterDataRequest {
  table: string;
  id: string;
}

interface MasterDataListResponse {
  items: MasterDataItem[];
}

// Allowed master data tables
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

// Gets master data items for a specific table
export const listItems = api(
  { expose: true, method: "GET", path: "/masterdata/:table", auth: true },
  async (req: { table: string }): Promise<MasterDataListResponse> => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin") {
      throw new Error("Access denied - Admin only");
    }

    if (!ALLOWED_TABLES.includes(req.table)) {
      throw new Error("Invalid table name");
    }

    let items;
    switch (req.table) {
      case 'customer_types':
        items = await db.queryAll`SELECT id, name, active, created_at, updated_at FROM customer_types ORDER BY name`;
        break;
      case 'business_types':
        items = await db.queryAll`SELECT id, name, active, created_at, updated_at FROM business_types ORDER BY name`;
        break;
      case 'products':
        items = await db.queryAll`SELECT id, name, active, created_at, updated_at FROM products ORDER BY name`;
        break;
      case 'lead_sources':
        items = await db.queryAll`SELECT id, name, active, created_at, updated_at FROM lead_sources ORDER BY name`;
        break;
      case 'stages':
        items = await db.queryAll`SELECT id, name, active, created_at, updated_at FROM stages ORDER BY name`;
        break;
      case 'contact_statuses':
        items = await db.queryAll`SELECT id, name, active, created_at, updated_at FROM contact_statuses ORDER BY name`;
        break;
      case 'temperatures':
        items = await db.queryAll`SELECT id, name, active, created_at, updated_at FROM temperatures ORDER BY name`;
        break;
      case 'company_sizes':
        items = await db.queryAll`SELECT id, name, active, created_at, updated_at FROM company_sizes ORDER BY name`;
        break;
      default:
        throw new Error('Invalid table name');
    }

    return { 
      items: items.map((item: any) => ({
        id: item.id,
        name: item.name,
        active: item.active,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      }))
    };
  }
);