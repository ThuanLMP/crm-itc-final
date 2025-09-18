import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { CreateEmployeeRequest, Employee } from "./types";
import { PasswordHelper } from "../auth/password-helper";

// Creates a new employee (admin only)
export const create = api(
  { expose: true, method: "POST", path: "/employees", auth: true },
  async (req: CreateEmployeeRequest): Promise<Employee> => {
    const auth = getAuthData()!;
    
    if (auth.role !== "admin") {
      throw new Error("Truy cập bị từ chối - Chỉ dành cho quản trị viên");
    }

    // Check if email already exists
    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE email = ${req.email}
    `;
    
    if (existingUser) {
      throw new Error("Email already exists");
    }

    if (!req.password || req.password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Hash the password
    const hashedPassword = await PasswordHelper.hashPassword(req.password);

    const employee = await db.queryRow`
      INSERT INTO users (name, email, phone, password, role)
      VALUES (${req.name}, ${req.email}, ${req.phone || null}, ${hashedPassword}, 'employee')
      RETURNING *
    `;

    if (!employee) {
      throw new Error("Failed to create employee");
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