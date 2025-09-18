export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface UpdateEmployeeRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  active: boolean;
}

export interface ListEmployeesResponse {
  employees: Employee[];
}