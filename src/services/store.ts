import { collection, doc, setDoc, deleteDoc, serverTimestamp, onSnapshot, updateDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './errorHandler';
import { MenuItem, Table, Order, OrderStatus } from '../types';
import { RESTAURANT_ID } from '../constants';

const MENU_PATH = `restaurants/${RESTAURANT_ID}/menu`;
const TABLES_PATH = `restaurants/${RESTAURANT_ID}/tables`;
const ORDERS_PATH = `restaurants/${RESTAURANT_ID}/orders`;

export const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
  try {
    const id = Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, MENU_PATH, id), { id, ...item });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, MENU_PATH);
  }
};

export const deleteMenuItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, MENU_PATH, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MENU_PATH}/${id}`);
  }
};

export const addTable = async (table: Pick<Table, 'tableNumber'>) => {
  try {
    const id = Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, TABLES_PATH, id), { id, tableNumber: table.tableNumber, status: 'empty' });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, TABLES_PATH);
  }
};

export const deleteTable = async (id: string) => {
  try {
    await deleteDoc(doc(db, TABLES_PATH, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${TABLES_PATH}/${id}`);
  }
};

export const placeOrder = async (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID().split('-')[0].toUpperCase() 
      : Math.random().toString(36).substr(2, 8).toUpperCase();
    const id = `ORD-${new Date().toISOString().slice(2,10).replace(/-/g, '')}-${uuid}`;
    await setDoc(doc(db, ORDERS_PATH, id), { 
      id, 
      ...order, 
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ORDERS_PATH);
  }
};

export const updateOrder = async (id: string, status: OrderStatus) => {
  try {
    await updateDoc(doc(db, ORDERS_PATH, id), { 
      status, 
      updatedAt: serverTimestamp() 
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_PATH}/${id}`);
  }
};

export const initDemo = async () => {
    try {
        // clear tables and menu
        const tablesSnap = await getDocs(collection(db, TABLES_PATH));
        for (const t of tablesSnap.docs) {
            await deleteDoc(t.ref);
        }
        const menuSnap = await getDocs(collection(db, MENU_PATH));
        for (const m of menuSnap.docs) {
            await deleteDoc(m.ref);
        }

        // Add tables
        const tableIds: string[] = [];
        for (const t of ['1', '2', '3']) {
            const id = Math.random().toString(36).substr(2, 9);
            await setDoc(doc(db, TABLES_PATH, id), { id, tableNumber: t, status: "empty" });
            tableIds.push(id);
        }

        // Add demo menu
        const demoMenus = [
            { name: "Classic Cheeseburger", price: 12.99, category: "Mains", description: "Juicy beef patty with melted cheddar, lettuce, and our secret sauce.", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800" },
            { name: "Truffle Fries", price: 8.50, category: "Sides", description: "Crispy fries tossed in truffle oil and parmesan cheese.", image: "https://images.unsplash.com/photo-1530016555861-110fa7af8e04?auto=format&fit=crop&q=80&w=800" },
            { name: "Mango Smoothie", price: 6.99, category: "Drinks", description: "Fresh mango blended with honey and yogurt.", image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=800" },
            { name: "Caesar Salad", price: 10.99, category: "Starters", description: "Crisp romaine, garlic croutons, and house-made caesar dressing.", image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=800" },
            { name: "Chocolate Lava Cake", price: 9.50, category: "Desserts", description: "Warm chocolate cake with a molten center, served with vanilla ice cream.", image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&q=80&w=800" }
        ];

        for(const m of demoMenus) {
            const id = Math.random().toString(36).substr(2, 9);
            await setDoc(doc(db, MENU_PATH, id), {
                id, name: m.name, price: m.price, category: m.category, description: m.description, isAvailable: true, image: m.image
            });
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'demo');
    }
}
