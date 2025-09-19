import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import type { UpdateAppointmentRequest, Appointment } from "./types";

export const update = api(
  { method: "PUT", path: "/appointments/:id", expose: true, auth: true },
  async ({ id, title, description, scheduledAt, duration, status, reminderMinutes }: UpdateAppointmentRequest): Promise<Appointment> => {
    const auth = getAuthData()!;
    
    // First check if appointment exists and user has permission
    const existingAppointment = await db.queryRow`
      SELECT a.*, c.name as customer_name
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      WHERE a.id = ${id}
    `;
    
    if (!existingAppointment) {
      throw new Error("Appointment not found");
    }

    // Check permissions: admin can edit all, employees can only edit their own
    if (auth.role === "employee" && existingAppointment.assigned_to !== auth.userID) {
      throw new Error("Access denied - You can only edit appointments assigned to you");
    }

    // Update the appointment
    await db.exec`
      UPDATE appointments 
      SET title = ${title}, description = ${description || null}, scheduled_at = ${new Date(scheduledAt)}, 
          duration_minutes = ${duration}, status = ${status}, 
          reminder_minutes = ${reminderMinutes || null}, updated_at = NOW()
      WHERE id = ${id}
    `;

    // Get updated appointment with all related data
    const result = await db.queryRow`
      SELECT 
        a.id, a.customer_id, a.title, a.description, a.scheduled_at, a.duration_minutes, a.status,
        a.reminder_minutes, a.created_at, a.updated_at,
        c.name as customer_name,
        cb.id as created_by_id, cb.name as created_by_name,
        ab.id as assigned_to_id, ab.name as assigned_to_name
       FROM appointments a
       JOIN customers c ON a.customer_id = c.id
       JOIN users cb ON a.created_by = cb.id  
       JOIN users ab ON a.assigned_to = ab.id
       WHERE a.id = ${id}
    `;

    if (!result) {
      throw new Error("Failed to retrieve updated appointment");
    }

    return {
      id: result.id,
      customerId: result.customer_id,
      customerName: result.customer_name,
      title: result.title,
      description: result.description,
      scheduledAt: new Date(result.scheduled_at),
      duration: result.duration_minutes,
      status: result.status,
      reminderMinutes: result.reminder_minutes,
      createdBy: {
        id: result.created_by_id,
        name: result.created_by_name
      },
      assignedTo: {
        id: result.assigned_to_id,
        name: result.assigned_to_name
      },
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at)
    };
  }
);