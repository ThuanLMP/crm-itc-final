import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { Appointment } from "./types";

interface GetCustomerAppointmentsRequest {
  customerId: string;
  fromDate?: Date;
  toDate?: Date;
  status?: string;
}

interface GetCustomerAppointmentsResponse {
  appointments: Appointment[];
}

// Get all appointments for a specific customer
export const getByCustomer = api(
  { expose: true, method: "GET", path: "/appointments/customer/:customerId", auth: true },
  async (req: GetCustomerAppointmentsRequest): Promise<GetCustomerAppointmentsResponse> => {
    const auth = getAuthData()!;

    let whereConditions = ["c.deleted_at IS NULL", "a.customer_id = $1"];
    let params: any[] = [req.customerId];
    let paramCount = 1;

    // Role-based access control
    if (auth.role === "employee") {
      whereConditions.push(`(a.assigned_to = $${++paramCount} OR c.assigned_salesperson_id = $${paramCount})`);
      params.push(auth.userID);
    }

    if (req.fromDate) {
      whereConditions.push(`a.scheduled_at >= $${++paramCount}`);
      params.push(req.fromDate);
    }
    if (req.toDate) {
      whereConditions.push(`a.scheduled_at <= $${++paramCount}`);
      params.push(req.toDate);
    }
    if (req.status) {
      whereConditions.push(`a.status = $${++paramCount}`);
      params.push(req.status);
    }

    const whereClause = whereConditions.join(' AND ');

    const appointmentsQuery = `
      SELECT 
        a.id, a.customer_id, a.title, a.description, a.scheduled_at, a.duration_minutes,
        a.status, a.reminder_minutes, a.created_by, a.assigned_to, a.created_at, a.updated_at,
        c.name as customer_name,
        creator.name as creator_name,
        assignee.name as assignee_name
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      LEFT JOIN users creator ON a.created_by = creator.id
      LEFT JOIN users assignee ON a.assigned_to = assignee.id
      WHERE ${whereClause}
      ORDER BY a.scheduled_at ASC
    `;
    
    const appointments = await db.rawQueryAll(appointmentsQuery, ...params);

    return {
      appointments: appointments.map((apt: any) => ({
        id: apt.id,
        customerId: apt.customer_id,
        customerName: apt.customer_name,
        title: apt.title,
        description: apt.description,
        scheduledAt: new Date(apt.scheduled_at),
        duration: apt.duration_minutes,
        status: apt.status,
        reminderMinutes: apt.reminder_minutes,
        createdBy: {
          id: apt.created_by,
          name: apt.creator_name || "Unknown"
        },
        assignedTo: {
          id: apt.assigned_to,
          name: apt.assignee_name || "Unknown"
        },
        createdAt: new Date(apt.created_at),
        updatedAt: new Date(apt.updated_at),
      }))
    };
  }
);