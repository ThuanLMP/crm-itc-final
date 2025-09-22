import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { ListEmployeesResponse } from "./types";

// Lists all employees (admin and employees can view)
export const list = api(
  { expose: true, method: "GET", path: "/employees", auth: true },
  async (): Promise<ListEmployeesResponse> => {
    const auth = getAuthData()!;
    
    // Allow both admin and employee roles to view employee list
    if (auth.role !== "admin" && auth.role !== "employee") {
      throw new Error("Access denied - Admin or Employee role required");
    }

    const employees = await db.queryAll`
      SELECT id, email, name, phone, role, active, created_at, updated_at
      FROM users
      ORDER BY name
    `;

    return { 
      employees: employees.map(emp => ({
        id: emp.id,
        email: emp.email,
        name: emp.name,
        phone: emp.phone,
        role: emp.role,
        active: emp.active,
        createdAt: new Date(emp.created_at),
        updatedAt: new Date(emp.updated_at),
      }))
    };
  }
);