import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { UpdateEmployeeRequest, Employee } from "./types";

// Updates an employee (admin only)
export const update = api(
  { expose: true, method: "PUT", path: "/employees/:id", auth: true },
  async (req: UpdateEmployeeRequest): Promise<Employee> => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin") {
      throw new Error("Access denied - Admin only");
    }

    // Check if email already exists for another user
    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE email = ${req.email} AND id != ${req.id}
    `;
    
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const employee = await db.queryRow`
      UPDATE users 
      SET name = ${req.name}, email = ${req.email}, phone = ${req.phone || null}, 
          active = ${req.active}, updated_at = now()
      WHERE id = ${req.id}
      RETURNING *
    `;

    if (!employee) {
      throw new Error("Employee not found");
    }

    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      active: employee.active,
      createdAt: new Date(employee.created_at),
      updatedAt: new Date(employee.updated_at),
    };
  }
);