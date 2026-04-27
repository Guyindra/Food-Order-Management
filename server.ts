import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
// Use Node.js built-in sqlite to avoid glibc environment compatibility issues
import { DatabaseSync } from "node:sqlite";
import path from "path";
import cors from "cors";

// We'll store DB locally in project root
const DB_PATH = path.resolve(process.cwd(), "database.sqlite");

function initDB(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS menu (
      id TEXT PRIMARY KEY,
      name TEXT,
      price REAL,
      category TEXT,
      description TEXT,
      isAvailable INTEGER,
      image TEXT
    );
    
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      tableNumber TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      tableId TEXT,
      tableNumber TEXT,
      items TEXT,
      status TEXT,
      total REAL,
      createdAt INTEGER,
      updatedAt INTEGER
    );
  `);
  return db;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(cors());
  app.use(express.json());

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  const db = await initDB();

  // Socket.io handlers
  io.on("connection", (socket) => {
    // Send initial state
    const sendInitialState = () => {
      const menu = db.prepare("SELECT * FROM menu").all() as any[];
      // JSON parse standard properties
      const parsedMenu = menu.map(m => ({ ...m, isAvailable: Boolean(m.isAvailable) }));
      
      const tables = db.prepare("SELECT * FROM tables").all() as any[];
      
      const orders = db.prepare("SELECT * FROM orders").all() as any[];
      const parsedOrders = orders.map(o => ({
        ...o,
        items: JSON.parse(o.items)
      }));

      socket.emit("initial_state", { menu: parsedMenu, tables, orders: parsedOrders });
    };

    sendInitialState();

    socket.on("add_menu", (item) => {
      const id = Math.random().toString(36).substr(2, 9);
      db.prepare(
        "INSERT INTO menu (id, name, price, category, description, isAvailable, image) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(id, item.name, item.price, item.category, item.description, item.isAvailable ? 1 : 0, item.image || "");
      io.emit("menu_updated", { ...item, id });
    });

    socket.on("delete_menu", (id) => {
      db.prepare("DELETE FROM menu WHERE id = ?").run(id);
      io.emit("menu_deleted", id);
    });

    socket.on("add_table", (table) => {
       const id = Math.random().toString(36).substr(2, 9);
       db.prepare(
         "INSERT INTO tables (id, tableNumber, status) VALUES (?, ?, ?)"
       ).run(id, table.tableNumber, "empty");
       io.emit("table_updated", { ...table, id, status: "empty" });
    });

    socket.on("delete_table", (id) => {
       db.prepare("DELETE FROM tables WHERE id = ?").run(id);
       io.emit("table_deleted", id);
    });

    socket.on("place_order", (order) => {
      const id = Math.random().toString(36).substr(2, 9);
      const now = Date.now();
      db.prepare(
        "INSERT INTO orders (id, tableId, tableNumber, items, status, total, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(id, order.tableId, order.tableNumber, JSON.stringify(order.items), order.status, order.total, now, now);
      io.emit("order_updated", { ...order, id, createdAt: now, updatedAt: now });
    });

    socket.on("update_order_status", ({ id, status }) => {
      const now = Date.now();
      db.prepare("UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?").run(status, now, id);
      io.emit("order_status_changed", { id, status, updatedAt: now });
    });

    socket.on("init_demo", () => {
      // clear tables and menu
      db.prepare("DELETE FROM tables").run();
      db.prepare("DELETE FROM menu").run();

      // Add tables
      const tableIds = [];
      const insertTable = db.prepare("INSERT INTO tables (id, tableNumber, status) VALUES (?, ?, ?)");
      for (const t of ['1', '2', '3']) {
        const id = Math.random().toString(36).substr(2, 9);
        insertTable.run(id, t, "empty");
        tableIds.push({ id, tableNumber: t, status: "empty" });
      }

      // Add demo menus
      const demoMenus = [
        { name: 'Nasi Lemak Special', price: 12.50, category: 'Main', description: 'Malaysian classic coconut rice with spicy sambal, fried chicken, and egg.', isAvailable: true, image: 'https://images.unsplash.com/photo-1595309092448-b9a2240268a1?auto=format&fit=crop&w=400&q=80' },
        { name: 'Satay Chicken (6pcs)', price: 15.00, category: 'Appetizer', description: 'Grilled chicken skewers with peanut sauce.', isAvailable: true, image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=400&q=80' },
        { name: 'Teh Tarik', price: 3.50, category: 'Drinks', description: 'Traditional pulled milk tea, sweet and frothy.', isAvailable: true, image: 'https://images.unsplash.com/photo-1594968973184-9140fa30773d?auto=format&fit=crop&w=400&q=80' },
        { name: 'Rendang Beef', price: 18.00, category: 'Main', description: 'Slow-cooked beef in coconut milk and spices.', isAvailable: true, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=400&q=80' }
      ];

      const menuItems = [];
      const insertMenu = db.prepare("INSERT INTO menu (id, name, price, category, description, isAvailable, image) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for(const m of demoMenus) {
        const id = Math.random().toString(36).substr(2, 9);
        insertMenu.run(id, m.name, m.price, m.category, m.description, 1, m.image);
        menuItems.push({ id, ...m, isAvailable: 1 });
      }
      
      // send refresh to all
      const orders = db.prepare("SELECT * FROM orders").all() as any[];
      const parsedOrders = orders.map(o => ({ ...o, items: JSON.parse(o.items) }));
      io.emit("initial_state", { menu: menuItems, tables: tableIds, orders: parsedOrders });
    });
  });

  // API Route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built dist directory
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
