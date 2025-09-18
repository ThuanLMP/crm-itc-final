import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

interface DeleteEmployeeRequest {
  id: string;
}

interface DeleteEmployeeResponse {
  success: boolean;
}

// Deletes an employee (admin only) - soft delete by setting active = false
export const deleteEmployee = api(
  { expose: true, method: "DELETE", path: "/employees/:id", auth: true },
  async (req: DeleteEmployeeRequest): Promise<DeleteEmployeeResponse> => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin") {
      throw new Error("Access denied - Admin only");
    }

    // Cannot delete yourself
    if (req.id === auth.userID) {
      throw new Error("Cannot delete your own account");
    }

    const result = await db.queryRow`
      UPDATE users 
      SET active = false, updated_at = now()
      WHERE id = ${req.id} AND role = 'employee'
      RETURNING id
    `;

    if (!result) {
      throw new Error("Employee not found or cannot be deleted");
    }

    return { success: true };
  }
);