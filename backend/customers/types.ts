export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  companyName?: string;
  customerType?: { id: string; name: string };
  businessType?: { id: string; name: string };
  companySize?: { id: string; name: string };
  province?: { id: string; name: string };
  leadSource?: { id: string; name: string };
  assignedSalesperson?: { id: string; name: string };
  stage?: { id: string; name: string };
  temperature?: { id: string; name: string };
  contactStatus?: { id: string; name: string };
  customerFeedback?: string;
  notes?: string;
  products: Array<{ id: string; name: string }>;
  createdBy?: { id: string; name: string };
  updatedBy?: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
  latestContact?: {
    type: string;
    createdAt: Date;
    snippet: string;
  };
  appointmentInfo?: {
    totalAppointments: number;
    upcomingAppointments: number;
    nextAppointment?: {
      date: Date;
      title: string;
    };
  };
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  companyName?: string;
  customerTypeId?: string;
  businessTypeId?: string;
  companySizeId?: string;
  provinceId?: string;

  leadSourceId?: string;
  assignedSalespersonId?: string;
  stageId?: string;
  temperatureId?: string;
  contactStatusId?: string;
  customerFeedback?: string;
  notes?: string;
  productIds: string[];
}

export interface UpdateCustomerRequest {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  companyName?: string;
  customerTypeId?: string;
  businessTypeId?: string;
  companySizeId?: string;
  provinceId?: string;

  leadSourceId?: string;
  assignedSalespersonId?: string;
  stageId?: string;
  temperatureId?: string;
  contactStatusId?: string;
  customerFeedback?: string;
  notes?: string;
  productIds: string[];
}

export interface ListCustomersRequest {
  page?: number;
  limit?: number;
  search?: string;
  stageId?: string;
  temperatureId?: string;
  assignedSalespersonId?: string;
  provinceId?: string;
  productId?: string;
  contactStatusId?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: string;
  sortOrder?: string;
}

export interface ListCustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
