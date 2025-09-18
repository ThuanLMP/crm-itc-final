export interface Payment {
  id: string;
  customerId: string;
  orderId?: string;
  paymentNumber: string;
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other';
  paymentDate: Date;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  referenceNumber?: string;
  notes?: string;
  createdBy?: { id: string; name: string };
  updatedBy?: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentRequest {
  customerId: string;
  orderId?: string;
  amount: number;
  currency?: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other';
  paymentDate?: Date;
  status?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface UpdatePaymentRequest {
  id: string;
  amount?: number;
  paymentMethod?: 'cash' | 'bank_transfer' | 'credit_card' | 'check' | 'other';
  paymentDate?: Date;
  status?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface ListPaymentsRequest {
  customerId?: string;
  orderId?: string;
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ListPaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}