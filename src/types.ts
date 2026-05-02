export enum OrderStatus {
  PENDING = 'pending',
  COOKING = 'cooking',
  READY = 'ready',
  SERVED = 'served',
  PAID = 'paid'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
}

export interface Table {
  id: string;
  tableNumber: string;
  status: 'empty' | 'occupied' | 'needs_cleaning';
  currentOrderId?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableId: string;
  tableNumber: string;
  customerName?: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: any;
  updatedAt: any;
}

export enum UserRole {
  CUSTOMER = 'customer',
  KITCHEN = 'kitchen',
  CASHIER = 'cashier',
  ADMIN = 'admin',
  DASHBOARD = 'dashboard'
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
