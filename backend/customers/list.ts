import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { ListCustomersRequest, ListCustomersResponse, Customer } from "./types";

// Lists customers with filtering, sorting, and pagination
export const list = api<ListCustomersRequest, ListCustomersResponse>(
  { expose: true, method: "GET", path: "/customers", auth: true },
  async (req) => {
    const auth = getAuthData()!;
    const page = req.page || 1;
    const limit = Math.min(req.limit || 20, 100);
    const offset = (page - 1) * limit;

    // Build WHERE clause based on role and filters
    let whereConditions = ["c.deleted_at IS NULL"];
    let params: any[] = [];
    let paramCount = 0;

    // Role-based access control
    if (auth.role === "employee") {
      // Employees can only see customers assigned to them
      whereConditions.push(`c.assigned_salesperson_id = $${++paramCount}`);
      params.push(auth.userID);
    }
    // Admin can see all customers - no additional filter needed

    // Search filter
    if (req.search) {
      whereConditions.push(`(
        c.name ILIKE $${++paramCount} OR 
        c.company_name ILIKE $${paramCount} OR 
        c.phone ILIKE $${paramCount} OR 
        c.email ILIKE $${paramCount}
      )`);
      params.push(`%${req.search}%`);
    }

    // Other filters
    if (req.stageId) {
      whereConditions.push(`c.stage_id = $${++paramCount}`);
      params.push(req.stageId);
    }
    if (req.temperatureId) {
      whereConditions.push(`c.temperature_id = $${++paramCount}`);
      params.push(req.temperatureId);
    }
    if (req.assignedSalespersonId) {
      whereConditions.push(`c.assigned_salesperson_id = $${++paramCount}`);
      params.push(req.assignedSalespersonId);
    }
    if (req.provinceId) {
      whereConditions.push(`c.province_id = $${++paramCount}`);
      params.push(req.provinceId);
    }
    if (req.contactStatusId) {
      whereConditions.push(`c.contact_status_id = $${++paramCount}`);
      params.push(req.contactStatusId);
    }
    if (req.leadSourceId) {
      whereConditions.push(`c.lead_source_id = $${++paramCount}`);
      params.push(req.leadSourceId);
    }
    if (req.productId) {
      whereConditions.push(`EXISTS (SELECT 1 FROM customer_products cp WHERE cp.customer_id = c.id AND cp.product_id = $${++paramCount})`);
      params.push(req.productId);
    }
    if (req.appointmentStatus) {
      switch (req.appointmentStatus) {
        case 'upcoming':
          whereConditions.push(`EXISTS (SELECT 1 FROM appointments a WHERE a.customer_id = c.id AND a.status = 'scheduled' AND a.scheduled_at >= NOW())`);
          break;
        case 'none':
          whereConditions.push(`NOT EXISTS (SELECT 1 FROM appointments a WHERE a.customer_id = c.id AND a.status = 'scheduled' AND a.scheduled_at >= NOW())`);
          break;
        case 'overdue':
          // For overdue, we check if there are no upcoming appointments but there are past appointments or the last contact was more than X days ago
          whereConditions.push(`(
            NOT EXISTS (SELECT 1 FROM appointments a WHERE a.customer_id = c.id AND a.status = 'scheduled' AND a.scheduled_at >= NOW())
            AND (
              EXISTS (SELECT 1 FROM appointments a WHERE a.customer_id = c.id AND a.status = 'completed' AND a.scheduled_at < NOW())
              OR (SELECT MAX(created_at) FROM contact_history ch WHERE ch.customer_id = c.id) < NOW() - INTERVAL '30 days'
              OR NOT EXISTS (SELECT 1 FROM contact_history ch WHERE ch.customer_id = c.id)
            )
          )`);
          break;
      }
    }
    if (req.createdFrom) {
      whereConditions.push(`c.created_at >= $${++paramCount}`);
      params.push(req.createdFrom);
    }
    if (req.createdTo) {
      whereConditions.push(`c.created_at <= $${++paramCount}`);
      params.push(req.createdTo);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    let orderBy = 'c.created_at DESC';
    if (req.sortBy) {
      const sortOrder = req.sortOrder === 'asc' ? 'ASC' : 'DESC';
      switch (req.sortBy) {
        case 'name':
          orderBy = `c.name ${sortOrder}`;
          break;
        case 'updated':
          orderBy = `c.updated_at ${sortOrder}`;
          break;
        case 'created':
          orderBy = `c.created_at ${sortOrder}`;
          break;
        case 'latest_contact':
          orderBy = `lc.created_at ${sortOrder} NULLS LAST`;
          break;
      }
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM customers c
      LEFT JOIN users sp ON c.assigned_salesperson_id = sp.id
      ${whereClause}
    `;
    const countResult = await db.rawQueryRow(countQuery, ...params);
    const total = parseInt(countResult?.total || '0');

    // Get customers with all related data
    const query = `
      SELECT DISTINCT
        c.*,
        ct.name as customer_type_name,
        bt.name as business_type_name,
        cs.name as company_size_name,
        p.name as province_name,
        ls.name as lead_source_name,
        sp.name as salesperson_name,
        s.name as stage_name,
        t.name as temperature_name,
        cst.name as contact_status_name,
        cb.name as created_by_name,
        ub.name as updated_by_name,
        lc.type as latest_contact_type,
        lc.created_at as latest_contact_at,
        COALESCE(lc.outcome, lc.next_step, '') as latest_contact_snippet,
        apt.total_appointments,
        apt.upcoming_appointments,
        apt.next_appointment_date,
        apt.next_appointment_title
      FROM customers c
      LEFT JOIN customer_types ct ON c.customer_type_id = ct.id
      LEFT JOIN business_types bt ON c.business_type_id = bt.id
      LEFT JOIN company_sizes cs ON c.company_size_id = cs.id
      LEFT JOIN provinces p ON c.province_id = p.id
      LEFT JOIN lead_sources ls ON c.lead_source_id = ls.id
      LEFT JOIN users sp ON c.assigned_salesperson_id = sp.id
      LEFT JOIN stages s ON c.stage_id = s.id
      LEFT JOIN temperatures t ON c.temperature_id = t.id
      LEFT JOIN contact_statuses cst ON c.contact_status_id = cst.id
      LEFT JOIN users cb ON c.created_by = cb.id
      LEFT JOIN users ub ON c.updated_by = ub.id
      LEFT JOIN LATERAL (
        SELECT type, created_at, outcome, next_step
        FROM contact_history ch
        WHERE ch.customer_id = c.id
        ORDER BY ch.created_at DESC
        LIMIT 1
      ) lc ON true
      LEFT JOIN LATERAL (
        SELECT 
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN status = 'scheduled' AND scheduled_at >= NOW() THEN 1 END) as upcoming_appointments,
          MIN(CASE WHEN status = 'scheduled' AND scheduled_at >= NOW() THEN scheduled_at END) as next_appointment_date,
          (SELECT title FROM appointments WHERE customer_id = c.id AND status = 'scheduled' AND scheduled_at >= NOW() ORDER BY scheduled_at ASC LIMIT 1) as next_appointment_title
        FROM appointments a
        WHERE a.customer_id = c.id
      ) apt ON true
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    params.push(limit, offset);

    const rows = await db.rawQueryAll(query, ...params);

    // Get products for each customer
    const customerIds = rows.map(row => row.id);
    let products: any[] = [];
    if (customerIds.length > 0) {
      const placeholders = customerIds.map((_, i) => `$${i + 1}`).join(',');
      products = await db.rawQueryAll(`
        SELECT cp.customer_id, p.id, p.name
        FROM customer_products cp
        JOIN products p ON cp.product_id = p.id
        WHERE cp.customer_id IN (${placeholders})
      `, ...customerIds);
    }

    const productsByCustomer = products.reduce((acc, product) => {
      if (!acc[product.customer_id]) acc[product.customer_id] = [];
      acc[product.customer_id].push({ id: product.id, name: product.name });
      return acc;
    }, {} as Record<string, any[]>);

    // Transform to Customer objects
    const customers: Customer[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      companyName: row.company_name,
      customerType: row.customer_type_name ? { id: row.customer_type_id, name: row.customer_type_name } : undefined,
      businessType: row.business_type_name ? { id: row.business_type_id, name: row.business_type_name } : undefined,
      companySize: row.company_size_name ? { id: row.company_size_id, name: row.company_size_name } : undefined,
      province: row.province_name ? { id: row.province_id, name: row.province_name } : undefined,

      leadSource: row.lead_source_name ? { id: row.lead_source_id, name: row.lead_source_name } : undefined,
      assignedSalesperson: row.salesperson_name ? { id: row.assigned_salesperson_id, name: row.salesperson_name } : undefined,
      stage: row.stage_name ? { id: row.stage_id, name: row.stage_name } : undefined,
      temperature: row.temperature_name ? { id: row.temperature_id, name: row.temperature_name } : undefined,
      contactStatus: row.contact_status_name ? { id: row.contact_status_id, name: row.contact_status_name } : undefined,
      customerFeedback: row.customer_feedback,
      notes: row.notes,
      products: productsByCustomer[row.id] || [],
      createdBy: row.created_by_name ? { id: row.created_by, name: row.created_by_name } : undefined,
      updatedBy: row.updated_by_name ? { id: row.updated_by, name: row.updated_by_name } : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      latestContact: row.latest_contact_type ? {
        type: row.latest_contact_type,
        createdAt: new Date(row.latest_contact_at),
        snippet: row.latest_contact_snippet || ''
      } : undefined,
      appointmentInfo: {
        totalAppointments: parseInt(row.total_appointments) || 0,
        upcomingAppointments: parseInt(row.upcoming_appointments) || 0,
        nextAppointment: row.next_appointment_date && row.next_appointment_title ? {
          date: new Date(row.next_appointment_date),
          title: row.next_appointment_title
        } : undefined
      },
    }));

    return {
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
);
