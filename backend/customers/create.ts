import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { CreateCustomerRequest, Customer } from "./types";

// Creates a new customer
export const create = api(
  { expose: true, method: "POST", path: "/customers", auth: true },
  async (req: CreateCustomerRequest): Promise<Customer> => {
    const auth = getAuthData()!;

    // Only admins and employees can create customers
    if (auth.role !== "admin" && auth.role !== "employee") {
      throw new Error("Truy cập bị từ chối");
    }

    // Validate required fields
    if (!req.name.trim()) {
      throw new Error("Tên khách hàng là bắt buộc");
    }

    // Check for duplicates
    if (req.phone || req.email) {
      const existingCustomer = await db.queryRow`
        SELECT id FROM customers 
        WHERE deleted_at IS NULL 
        AND (phone = ${req.phone} OR email = ${req.email})
      `;
      if (existingCustomer) {
        throw new Error("Khách hàng với số điện thoại hoặc email này đã tồn tại");
      }
    }

    // Handle assignment based on role
    let assignedSalespersonId: string;
    
    if (auth.role === "admin") {
      // Admin can assign to anyone, or default to themselves
      assignedSalespersonId = req.assignedSalespersonId || auth.userID;
    } else {
      // Employee can only assign to themselves
      assignedSalespersonId = auth.userID;
    }

    // Helper function to convert empty strings to null for UUID fields
    const toUuidOrNull = (value: string | undefined): string | null => {
      return value && value.trim() !== "" ? value : null;
    };

    // Insert customer with proper null handling for UUID fields
    const customer = await db.queryRow`
      INSERT INTO customers (
        name, phone, email, address, company_name,
        customer_type_id, business_type_id, company_size_id,
        province_id, lead_source_id, assigned_salesperson_id,
        stage_id, temperature_id, contact_status_id,
        customer_feedback, notes, created_by, updated_by
      ) VALUES (
        ${req.name}, ${req.phone || null}, ${req.email || null}, ${req.address || null}, ${req.companyName || null},
        ${toUuidOrNull(req.customerTypeId)}, ${toUuidOrNull(req.businessTypeId)}, ${toUuidOrNull(req.companySizeId)},
        ${toUuidOrNull(req.provinceId)}, ${toUuidOrNull(req.leadSourceId)}, ${assignedSalespersonId},
        ${toUuidOrNull(req.stageId)}, ${toUuidOrNull(req.temperatureId)}, ${toUuidOrNull(req.contactStatusId)},
        ${req.customerFeedback || null}, ${req.notes || null}, ${auth.userID}, ${auth.userID}
      )
      RETURNING *
    `;

    // Insert products
    if (req.productIds && req.productIds.length > 0) {
      // Filter out empty strings and invalid UUIDs
      const validProductIds = req.productIds.filter(id => id && id.trim() !== "");
      if (validProductIds.length > 0) {
        const productValues = validProductIds.map(productId => `('${customer!.id}', '${productId}')`).join(', ');
        await db.rawExec(`
          INSERT INTO customer_products (customer_id, product_id) 
          VALUES ${productValues}
        `);
      }
    }

    // Log creation in audit log
    await db.exec`
      INSERT INTO audit_log (table_name, record_id, action, user_id)
      VALUES ('customers', ${customer?.id}, 'create', ${auth.userID})
    `;

    // Fetch and return the complete customer
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
      WHERE c.id = ${customer?.id}
    `;

    const products = await db.queryAll`
      SELECT p.id, p.name
      FROM customer_products cp
      JOIN products p ON cp.product_id = p.id
      WHERE cp.customer_id = ${customer!.id}
    `;

    if (!result) {
      throw new Error("Không thể tải thông tin khách hàng vừa tạo");
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
