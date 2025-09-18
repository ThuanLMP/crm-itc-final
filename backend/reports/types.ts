export interface DashboardStats {
  totalCustomers: number;
  totalAppointments: number;
  totalContacts: number;
  customersByStage: Array<{ name: string; count: number }>;
  customersByType: Array<{ name: string; count: number }>;
  customersBySalesperson: Array<{ name: string; count: number }>;
  customersByProduct: Array<{ name: string; count: number }>;
  recentActivities: Array<{
    type: string;
    subject: string;
    customerName: string;
    createdAt: Date;
    createdBy: string;
  }>;
  upcomingAppointments: Array<{
    id: string;
    title: string;
    customerName: string;
    scheduledAt: Date;
    assignedTo: string;
  }>;
}

export interface ReportsFilters {
  fromDate?: Date;
  toDate?: Date;
  salesPersonId?: string;
  customerId?: string;
}

export interface CustomerReport {
  totalCustomers: number;
  newCustomers: number;
  customersByStage: Array<{ stage: string; count: number }>;
  customersBySource: Array<{ source: string; count: number }>;
  conversionRate: number;
}

export interface ActivityReport {
  totalContacts: number;
  contactsByType: Array<{ type: string; count: number }>;
  totalAppointments: number;
  appointmentsByStatus: Array<{ status: string; count: number }>;
  avgContactsPerCustomer: number;
}
