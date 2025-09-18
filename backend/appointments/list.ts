import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { ListAppointmentsRequest, ListAppointmentsResponse } from "./types";

// Lists appointments with filtering
export const list = api(
  { expose: true, method: "GET", path: "/appointments", auth: true },
  async (req: ListAppointmentsRequest): Promise<ListAppointmentsResponse> => {
    const auth = getAuthData()!;
    const page = req.page || 1;
    const limit = Math.min(req.limit || 20, 100);
    const offset = (page - 1) * limit;

    let whereConditions = ["c.deleted_at IS NULL"];
    let params: any[] = [];
    let paramCount = 0;

    if (auth.role === "employee") {
      whereConditions.push(`(a.assigned_to = $${++paramCount} OR c.assigned_salesperson_id = $${paramCount})`);
      params.push(auth.userID);
    }

    if (req.customerId) {
      whereConditions.push(`a.customer_id = $${++paramCount}`);
      params.push(req.customerId);
    }
    if (req.assignedToId) {
      whereConditions.push(`a.assigned_to = $${++paramCount}`);
      params.push(req.assignedToId);
    }
    if (req.status) {
      whereConditions.push(`a.status = $${++paramCount}`);
      params.push(req.status);
    }
    if (req.fromDate) {
      whereConditions.push(`a.scheduled_at >= $${++paramCount}`);
      params.push(req.fromDate);
    }
    if (req.toDate) {
      whereConditions.push(`a.scheduled_at <= $${++paramCount}`);
      params.push(req.toDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as count 
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      ${whereClause}
    `;
    const totalResult = await db.rawQueryRow(countQuery, ...params);
    const total = parseInt(totalResult?.count || "0");

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
      ${whereClause}
      ORDER BY a.scheduled_at ASC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    const queryParams = [...params, limit, offset];
    
    const appointments = await db.rawQueryAll(appointmentsQuery, ...queryParams);

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
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
);
