import type { Timestamp, FieldValue } from 'firebase/firestore';

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
  createdAt: Timestamp | FieldValue | Date | number | string;
  updatedAt: Timestamp | FieldValue | Date | number | string;
}

export enum UserRole {
  CUSTOMER = 'customer',
  KITCHEN = 'kitchen',
  CASHIER = 'cashier',
  ADMIN = 'admin',
  DASHBOARD = 'dashboard'
}


