import { api } from "encore.dev/api";
import db from "../db";

interface MasterDataResponse {
  customerTypes: Array<{ id: string; name: string; active: boolean }>;
  businessTypes: Array<{ id: string; name: string; active: boolean }>;
  products: Array<{ id: string; name: string; active: boolean }>;
  leadSources: Array<{ id: string; name: string; active: boolean }>;
  stages: Array<{ id: string; name: string; active: boolean }>;
  contactStatuses: Array<{ id: string; name: string; active: boolean }>;
  temperatures: Array<{ id: string; name: string; active: boolean }>;
  companySizes: Array<{ id: string; name: string; active: boolean }>;
  provinces: Array<{ id: string; name: string; code: string }>;
}

// Gets all master data for form dropdowns
export const getAll = api(
  { expose: true, method: "GET", path: "/masterdata", auth: true },
  async (): Promise<MasterDataResponse> => {
    const [
      customerTypes,
      businessTypes,
      products,
      leadSources,
      stages,
      contactStatuses,
      temperatures,
      companySizes,
      provinces,
    ] = await Promise.all([
      db.queryAll`SELECT id, name, active FROM customer_types ORDER BY name`,
      db.queryAll`SELECT id, name, active FROM business_types ORDER BY name`,
      db.queryAll`SELECT id, name, active FROM products ORDER BY name`,
      db.queryAll`SELECT id, name, active FROM lead_sources ORDER BY name`,
      db.queryAll`SELECT id, name, active FROM stages ORDER BY name`,
      db.queryAll`SELECT id, name, active FROM contact_statuses ORDER BY name`,
      db.queryAll`SELECT id, name, active FROM temperatures ORDER BY name`,
      db.queryAll`SELECT id, name, active FROM company_sizes ORDER BY name`,
      db.queryAll`SELECT id, name, code FROM provinces ORDER BY name`,
    ]);

    return {
      customerTypes: customerTypes as Array<{ id: string; name: string; active: boolean }>,
      businessTypes: businessTypes as Array<{ id: string; name: string; active: boolean }>,
      products: products as Array<{ id: string; name: string; active: boolean }>,
      leadSources: leadSources as Array<{ id: string; name: string; active: boolean }>,
      stages: stages as Array<{ id: string; name: string; active: boolean }>,
      contactStatuses: contactStatuses as Array<{ id: string; name: string; active: boolean }>,
      temperatures: temperatures as Array<{ id: string; name: string; active: boolean }>,
      companySizes: companySizes as Array<{ id: string; name: string; active: boolean }>,
      provinces: provinces as Array<{ id: string; name: string; code: string }>,
    };
  }
);
