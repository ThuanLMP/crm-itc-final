import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { UpdateCustomerRequest, Customer } from "./types";

// Updates an existing customer
export const update = api(
  { expose: true, method: "PUT", path: "/customers/:id", auth: true },
  async (req: UpdateCustomerRequest): Promise<Customer> => {
    const auth = getAuthData()!;

    // Verify customer exists and check permissions
    const existingCustomer = await db.queryRow`
      SELECT id, assigned_salesperson_id 
      FROM customers 
      WHERE id = ${req.id} AND deleted_at IS NULL
    `;

    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    // Check access permissions
    if (auth.role === "employee" && existingCustomer.assigned_salesperson_id !== auth.userID) {
      throw new Error("Access denied - You can only edit customers assigned to you");
    }

    // Validate required fields
    if (!req.name.trim()) {
      throw new Error("Customer name is required");
    }

    // Check for duplicates (excluding current customer)
    if (req.phone || req.email) {
      const duplicateCustomer = await db.queryRow`
        SELECT id FROM customers 
        WHERE deleted_at IS NULL 
        AND id != ${req.id}
        AND (phone = ${req.phone} OR email = ${req.email})
      `;
      if (duplicateCustomer) {
        throw new Error("Customer with this phone or email already exists");
      }
    }

    // Handle assignment based on role
    let assignedSalespersonId: string;
    
    if (auth.role === "admin") {
      // Admin can assign to anyone
      assignedSalespersonId = req.assignedSalespersonId || existingCustomer.assigned_salesperson_id;
    } else {
      // Employee cannot change assignment - keep existing assignment
      assignedSalespersonId = existingCustomer.assigned_salesperson_id;
    }

    // Helper function to convert empty strings to null for UUID fields
    const toUuidOrNull = (value: string | undefined): string | null => {
      return value && value.trim() !== "" ? value : null;
    };

    // Update customer
    const customer = await db.queryRow`
      UPDATE customers SET
        name = ${req.name},
        phone = ${req.phone || null},
        email = ${req.email || null},
        address = ${req.address || null},
        company_name = ${req.companyName || null},
        customer_type_id = ${toUuidOrNull(req.customerTypeId)},
        business_type_id = ${toUuidOrNull(req.businessTypeId)},
        company_size_id = ${toUuidOrNull(req.companySizeId)},
        province_id = ${toUuidOrNull(req.provinceId)},
        city = ${req.city || null},
        lead_source_id = ${toUuidOrNull(req.leadSourceId)},
        assigned_salesperson_id = ${assignedSalespersonId},
        stage_id = ${toUuidOrNull(req.stageId)},
        temperature_id = ${toUuidOrNull(req.temperatureId)},
        contact_status_id = ${toUuidOrNull(req.contactStatusId)},
        customer_feedback = ${req.customerFeedback || null},
        notes = ${req.notes || null},
        updated_by = ${auth.userID},
        updated_at = now()
      WHERE id = ${req.id}
      RETURNING *
    `;

    if (!customer) {
      throw new Error("Failed to update customer");
    }

    // Update products
    await db.exec`DELETE FROM customer_products WHERE customer_id = ${req.id}`;
    
    if (req.productIds && req.productIds.length > 0) {
      const validProductIds = req.productIds.filter(id => id && id.trim() !== "");
      if (validProductIds.length > 0) {
        const productValues = validProductIds.map(productId => `('${req.id}', '${productId}')`).join(', ');
        await db.rawExec(`
          INSERT INTO customer_products (customer_id, product_id) 
          VALUES ${productValues}
        `);
      }
    }

    // Log update in audit log
    await db.exec`
      INSERT INTO audit_log (table_name, record_id, action, user_id)
      VALUES ('customers', ${req.id}, 'update', ${auth.userID})
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
      WHERE c.id = ${req.id}
    `;

    const products = await db.queryAll`
      SELECT p.id, p.name
      FROM customer_products cp
      JOIN products p ON cp.product_id = p.id
      WHERE cp.customer_id = ${req.id}
    `;

    if (!result) {
      throw new Error("Failed to retrieve updated customer");
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
      city: result!.city,
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
