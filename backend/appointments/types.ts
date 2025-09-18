export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // in minutes
  status: string; // scheduled, completed, cancelled, no_show
  reminderMinutes?: number[] | null; // reminder offset in minutes
  createdBy: { id: string; name: string };
  assignedTo: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentRequest {
  customerId: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  reminderMinutes?: number[];
  assignedToId?: string;
}

export interface UpdateAppointmentRequest {
  id: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  status: string;
  reminderMinutes?: number[];
}

export interface ListAppointmentsRequest {
  customerId?: string;
  assignedToId?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface ListAppointmentsResponse {
  appointments: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
