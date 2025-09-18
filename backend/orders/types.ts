export interface Order {
  id: string;
  customerId: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'active' | 'completed' | 'cancelled' | 'refunded';
  orderDate: Date;
  activationDate?: Date;
  expiryDate?: Date;
  licenseType?: 'trial' | 'subscription' | 'perpetual' | 'enterprise';
  notes?: string;
  items: OrderItem[];
  createdBy?: { id: string; name: string };
  updatedBy?: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface CreateOrderRequest {
  customerId: string;
  items: CreateOrderItemRequest[];
  discount?: string | number;
  tax?: string | number;
  total?: string | number;
  totalAmount?: number; // backward compatibility
  currency?: string;
  status?: string;
  orderDate?: Date;
  activationDate?: Date;
  expiryDate?: Date;
  licenseType?: 'trial' | 'subscription' | 'perpetual' | 'enterprise';
  notes?: string;
}

export interface CreateOrderItemRequest {
  sku?: string;
  productId?: string;
  productName?: string;
  qty?: number;
  quantity?: number; // backward compatibility
  price?: string | number;
  unitPrice?: number; // backward compatibility
  notes?: string;
}

export interface UpdateOrderRequest {
  id: string;
  totalAmount?: number;
  status?: string;
  activationDate?: Date;
  expiryDate?: Date;
  licenseType?: 'trial' | 'subscription' | 'perpetual' | 'enterprise';
  notes?: string;
  items?: CreateOrderItemRequest[];
}

export interface ListOrdersRequest {
  customerId?: string;
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ListOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}