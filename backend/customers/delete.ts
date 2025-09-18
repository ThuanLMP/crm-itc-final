import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface DeleteCustomerRequest {
  id: string;
}

interface DeleteCustomerResponse {
  success: boolean;
}

// Deletes a customer (admin only) - soft delete
export const deleteCustomer = api(
  { expose: true, method: "DELETE", path: "/customers/:id", auth: true },
  async (req: DeleteCustomerRequest): Promise<DeleteCustomerResponse> => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin") {
      throw new Error("Access denied - Admin only");
    }

    // Verify customer exists
    const customer = await db.queryRow`
      SELECT id FROM customers 
      WHERE id = ${req.id} AND deleted_at IS NULL
    `;

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Soft delete the customer
    await db.exec`
      UPDATE customers 
      SET deleted_at = now(), updated_by = ${auth.userID}, updated_at = now()
      WHERE id = ${req.id}
    `;

    // Log deletion in audit log
    await db.exec`
      INSERT INTO audit_log (table_name, record_id, action, user_id)
      VALUES ('customers', ${req.id}, 'delete', ${auth.userID})
    `;

    return { success: true };
  }
);
