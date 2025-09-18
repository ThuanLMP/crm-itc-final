import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { DashboardStats } from "./types";

// Gets dashboard statistics
export const getDashboard = api(
  { expose: true, method: "GET", path: "/reports/dashboard", auth: true },
  async (): Promise<DashboardStats> => {
    const auth = getAuthData()!;

    const params: any[] = [];
    let customerAccessFilter = '';
    let appointmentAccessFilter = '';
    let contactAccessFilter = '';

    if (auth.role === 'employee') {
      params.push(auth.userID);
      const paramIndex = `$${params.length}`;
      customerAccessFilter = `AND c.assigned_salesperson_id = ${paramIndex}`;
      appointmentAccessFilter = `AND a.assigned_to = ${paramIndex}`;
      contactAccessFilter = `AND c.assigned_salesperson_id = ${paramIndex}`;
    }

    const [
        totalCustomersData,
        totalAppointmentsData,
        totalContactsData,
        customersByStageData,
        customersByTypeData,
        customersBySalespersonData,
        customersByProductData,
        recentActivitiesData,
        upcomingAppointmentsData,
    ] = await Promise.all([
        db.rawQueryRow(`SELECT COUNT(*)::int as count FROM customers c WHERE c.deleted_at IS NULL ${customerAccessFilter}`, ...params),
        db.rawQueryRow(`SELECT COUNT(*)::int as count FROM appointments a JOIN customers c on a.customer_id = c.id WHERE c.deleted_at IS NULL ${customerAccessFilter}`, ...params),
        db.rawQueryRow(`SELECT COUNT(*)::int as count FROM contact_history ch JOIN customers c on ch.customer_id = c.id WHERE c.deleted_at IS NULL ${contactAccessFilter}`, ...params),
        db.rawQueryAll(`SELECT s.name, COUNT(c.id)::int as count FROM customers c JOIN stages s ON c.stage_id = s.id WHERE c.deleted_at IS NULL ${customerAccessFilter} GROUP BY s.name ORDER BY count DESC`, ...params),
        db.rawQueryAll(`SELECT ct.name, COUNT(c.id)::int as count FROM customers c JOIN customer_types ct ON c.customer_type_id = ct.id WHERE c.deleted_at IS NULL ${customerAccessFilter} GROUP BY ct.name ORDER BY count DESC`, ...params),
        db.rawQueryAll(`SELECT u.name, COUNT(c.id)::int as count FROM customers c JOIN users u ON c.assigned_salesperson_id = u.id WHERE c.deleted_at IS NULL ${customerAccessFilter} GROUP BY u.name ORDER BY count DESC`, ...params),
        db.rawQueryAll(`SELECT p.name, COUNT(DISTINCT cp.customer_id)::int as count FROM customer_products cp JOIN products p ON cp.product_id = p.id JOIN customers c ON cp.customer_id = c.id WHERE c.deleted_at IS NULL ${customerAccessFilter} GROUP BY p.name ORDER BY count DESC`, ...params),
        db.rawQueryAll(`SELECT ch.type, ch.subject, ch.created_at, c.name as customer_name, u.name as created_by FROM contact_history ch JOIN customers c ON ch.customer_id = c.id JOIN users u ON ch.created_by = u.id WHERE c.deleted_at IS NULL ${contactAccessFilter} ORDER BY ch.created_at DESC LIMIT 5`, ...params),
        db.rawQueryAll(`SELECT a.id, a.title, a.scheduled_at, c.name as customer_name, u.name as assigned_to FROM appointments a JOIN customers c ON a.customer_id = c.id JOIN users u ON a.assigned_to = u.id WHERE a.status = 'scheduled' AND a.scheduled_at >= now() AND c.deleted_at IS NULL ${appointmentAccessFilter} ORDER BY a.scheduled_at ASC LIMIT 5`, ...params),
    ]);

    return {
        totalCustomers: totalCustomersData?.count || 0,
        totalAppointments: totalAppointmentsData?.count || 0,
        totalContacts: totalContactsData?.count || 0,
        customersByStage: customersByStageData.map((r: any) => ({ name: r.name || 'Uncategorized', count: r.count })),
        customersByType: customersByTypeData.map((r: any) => ({ name: r.name || 'Uncategorized', count: r.count })),
        customersBySalesperson: customersBySalespersonData.map((r: any) => ({ name: r.name, count: r.count })),
        customersByProduct: customersByProductData.map((r: any) => ({ name: r.name, count: r.count })),
        recentActivities: recentActivitiesData.map((r: any) => ({
            type: r.type,
            subject: r.subject,
            customerName: r.customer_name,
            createdAt: new Date(r.created_at),
            createdBy: r.created_by,
        })),
        upcomingAppointments: upcomingAppointmentsData.map((r: any) => ({
            id: r.id,
            title: r.title,
            customerName: r.customer_name,
            scheduledAt: new Date(r.scheduled_at),
            assignedTo: r.assigned_to,
        })),
    };
  }
);
