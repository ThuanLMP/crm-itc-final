import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { Customer } from "./types";

interface GetCustomerRequest {
  id: string;
}

// Gets a single customer by ID
export const get = api(
  { expose: true, method: "GET", path: "/customers/:id", auth: true },
  async (req: GetCustomerRequest): Promise<Customer> => {
    const auth = getAuthData()!;

    // Check access permissions
    const customer = await db.queryRow`
      SELECT c.*
      FROM customers c
      WHERE c.id = ${req.id} AND c.deleted_at IS NULL
    `;

    if (!customer) {
      throw new Error("Không tìm thấy khách hàng");
    }

    // Role-based access control
    if (auth.role === "employee") {
      if (customer.assigned_salesperson_id !== auth.userID) {
        throw new Error("Truy cập bị từ chối - Bạn chỉ có thể xem khách hàng được phân công cho bạn");
      }
    }
    // Admin can view all customers

    // Get full customer data
    const result = await db.queryRow`
      SELECT 
        c.*,
        ct.name as customer_type_name,
        bt.name as business_type_name,
        cs.name as company_size_name,
        p.name as province_name,
        ls.name as lead_source_name,
        sp.name as salesperson_name,
        s.name as stage_name,
        t.name as temperature_name,
        cst.name as contact_status_name,
        cb.name as created_by_name,
        ub.name as updated_by_name
      FROM customers c
      LEFT JOIN customer_types ct ON c.customer_type_id = ct.id
      LEFT JOIN business_types bt ON c.business_type_id = bt.id
      LEFT JOIN company_sizes cs ON c.company_size_id = cs.id
      LEFT JOIN provinces p ON c.province_id = p.id
      LEFT JOIN lead_sources ls ON c.lead_source_id = ls.id
      LEFT JOIN users sp ON c.assigned_salesperson_id = sp.id
      LEFT JOIN stages s ON c.stage_id = s.id
      LEFT JOIN temperatures t ON c.temperature_id = t.id
      LEFT JOIN contact_statuses cst ON c.contact_status_id = cst.id
      LEFT JOIN users cb ON c.created_by = cb.id
      LEFT JOIN users ub ON c.updated_by = ub.id
      WHERE c.id = ${req.id}
    `;

    const products = await db.queryAll`
      SELECT p.id, p.name
      FROM customer_products cp
      JOIN products p ON cp.product_id = p.id
      WHERE cp.customer_id = ${req.id}
    `;

    if (!result) {
      throw new Error("Không tìm thấy khách hàng");
    }

    return {
      id: result!.id,
      name: result!.name,
      phone: result!.phone,
      email: result!.email,
      address: result!.address,
      companyName: result!.company_name,
      customerType: result!.customer_type_name ? { id: result!.customer_type_id, name: result!.customer_type_name } : undefined,
      businessType: result!.business_type_name ? { id: result!.business_type_id, name: result!.business_type_name } : undefined,
      companySize: result!.company_size_name ? { id: result!.company_size_id, name: result!.company_size_name } : undefined,
      province: result!.province_name ? { id: result!.province_id, name: result!.province_name } : undefined,

      leadSource: result!.lead_source_name ? { id: result!.lead_source_id, name: result!.lead_source_name } : undefined,
      assignedSalesperson: result!.salesperson_name ? { id: result!.assigned_salesperson_id, name: result!.salesperson_name } : undefined,
      stage: result!.stage_name ? { id: result!.stage_id, name: result!.stage_name } : undefined,
      temperature: result!.temperature_name ? { id: result!.temperature_id, name: result!.temperature_name } : undefined,
      contactStatus: result!.contact_status_name ? { id: result!.contact_status_id, name: result!.contact_status_name } : undefined,
      customerFeedback: result!.customer_feedback,
      notes: result!.notes,
      products: products as Array<{ id: string; name: string }>,
      createdBy: result!.created_by_name ? { id: result!.created_by, name: result!.created_by_name } : undefined,
      updatedBy: result!.updated_by_name ? { id: result!.updated_by, name: result!.updated_by_name } : undefined,
      createdAt: new Date(result!.created_at),
      updatedAt: new Date(result!.updated_at),
    };
  }
);
