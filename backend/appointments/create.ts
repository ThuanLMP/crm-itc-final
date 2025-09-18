import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { CreateAppointmentRequest, Appointment } from "./types";

// Creates a new appointment
export const create = api(
  { expose: true, method: "POST", path: "/appointments", auth: true },
  async (req: CreateAppointmentRequest): Promise<Appointment> => {
    const auth = getAuthData()!;

    // Verify user has access to this customer
    const customer = await db.queryRow`
      SELECT id, name, assigned_salesperson_id 
      FROM customers 
      WHERE id = ${req.customerId} AND deleted_at IS NULL
    `;

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Check access permissions
    if (auth.role === "employee" && customer.assigned_salesperson_id !== auth.userID) {
      throw new Error("Access denied - You can only create appointments for customers assigned to you");
    }

    const assignedToId = req.assignedToId || auth.userID;

    const appointment = await db.queryRow`
      INSERT INTO appointments (
        customer_id, title, description, scheduled_at, duration_minutes, 
        reminder_minutes, created_by, assigned_to
      ) VALUES (
        ${req.customerId}, ${req.title}, ${req.description || null}, 
        ${new Date(req.scheduledAt)}, ${req.duration}, ${req.reminderMinutes || null}, 
        ${auth.userID}, ${assignedToId}
      )
      RETURNING *
    `;

    if (!appointment) {
      throw new Error("Failed to create appointment");
    }

    // Get creator and assignee details
    const [creator, assignee] = await Promise.all([
      db.queryRow`SELECT id, name FROM users WHERE id = ${auth.userID}`,
      db.queryRow`SELECT id, name FROM users WHERE id = ${assignedToId}`
    ]);

    return {
      id: appointment.id,
      customerId: appointment.customer_id,
      customerName: customer.name,
      title: appointment.title,
      description: appointment.description,
      scheduledAt: new Date(appointment.scheduled_at),
      duration: appointment.duration_minutes,
      status: appointment.status,
      reminderMinutes: appointment.reminder_minutes,
      createdBy: {
        id: creator?.id || auth.userID,
        name: creator?.name || "Unknown"
      },
      assignedTo: {
        id: assignee?.id || assignedToId,
        name: assignee?.name || "Unknown"
      },
      createdAt: new Date(appointment.created_at),
      updatedAt: new Date(appointment.updated_at),
    };
  }
);
