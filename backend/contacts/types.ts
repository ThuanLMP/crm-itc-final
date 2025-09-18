export interface ContactHistory {
  id: string;
  customerId: string;
  type: string; // Call, Email, Meeting, Zalo, Other
  subject: string;
  notes: string;
  outcome?: string;
  nextStep?: string;
  duration?: number; // in minutes
  createdBy: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactRequest {
  customerId: string;
  type: string;
  subject: string;
  notes: string;
  outcome?: string;
  nextStep?: string;
  duration?: number;
}

export interface UpdateContactRequest {
  id: string;
  type: string;
  subject: string;
  notes: string;
  outcome?: string;
  nextStep?: string;
  duration?: number;
}

export interface ListContactsRequest {
  customerId: string;
  page?: number;
  limit?: number;
}

export interface ListContactsResponse {
  contacts: ContactHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}