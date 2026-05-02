/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Utensils, 
  ChefHat, 
  CreditCard, 
  Settings, 
  Plus, 
  X, 
  MoveRight, 
  QrCode,
  Trash2,
  AlertCircle,
  ChevronRight,
  ShoppingCart,
  Sun,
  Moon,
  LayoutDashboard,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

import { 
  MenuItem, 
  Table, 
  Order, 
  OrderStatus, 
  UserRole
} from './types';
import { db } from './services/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { placeOrder as placeOrderService, updateOrder as updateOrderService } from './services/store';
import { RESTAURANT_ID } from './constants';

import { Badge } from './components/ui/Badge';
import { KitchenBoard } from './components/KitchenBoard';
import { CashierBoard } from './components/CashierBoard';
import { AdminBoard } from './components/AdminBoard';
import { MainDashboard } from './components/MainDashboard';

export default function App() {
  const [role, setRole] = useState<UserRole>(UserRole.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [view, setView] = useState<'menu' | 'cart' | 'status'>('menu');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [inputName, setInputName] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<{ item: MenuItem, quantity: number, notes?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<{ id: number, message: string }[]>([]);
  const [baseUrl, setBaseUrl] = useState(() => {
    const origin = window.location.origin;
    if (origin.includes('ais-dev')) {
      return origin.replace('ais-dev', 'ais-pre') + window.location.pathname;
    }
    return origin + window.location.pathname;
  });

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    let isLoading = true;

    const unsubMenu = onSnapshot(collection(db, `restaurants/${RESTAURANT_ID}/menu`), (snapshot) => {
      const items: MenuItem[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as MenuItem);
      });
      setMenuItems(items);
      if (isLoading) { isLoading = false; setLoading(false); }
    });

    const unsubTables = onSnapshot(collection(db, `restaurants/${RESTAURANT_ID}/tables`), (snapshot) => {
      const ts: Table[] = [];
      snapshot.forEach(doc => {
        ts.push({ id: doc.id, ...doc.data() } as Table);
      });
      setTables(ts);
    });

    const unsubOrders = onSnapshot(query(collection(db, `restaurants/${RESTAURANT_ID}/orders`), orderBy('createdAt', 'desc')), (snapshot) => {
      const ords: Order[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        ords.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now()
        } as Order);
      });
      setOrders(ords);
    });

    return () => {
      unsubMenu();
      unsubTables();
      unsubOrders();
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('tableId');
    if (tableId) {
      if (tables.length > 0) {
        const table = tables.find(t => t.id === tableId);
        if (table) {
          setSelectedTable(table);
          setRole(UserRole.CUSTOMER);
        }
      }
    }
  }, [tables]);

  const isPublicCustomer = useMemo(() => {
    return new URLSearchParams(window.location.search).has('tableId');
  }, [window.location.search]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(p => p.item.id === item.id);
      if (existing) {
        return prev.map(p => p.item.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { item, quantity: 1, notes: '' }];
    });
    showToast(`Added ${item.name} to cart`);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(p => p.item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(p => {
      if (p.item.id === itemId) {
        return { ...p, quantity: Math.max(1, p.quantity + delta) };
      }
      return p;
    }));
  };

  const updateCartNote = (itemId: string, notes: string) => {
    setCart(prev => prev.map(p => {
      if (p.item.id === itemId) {
        return { ...p, notes };
      }
      return p;
    }));
  };

  const placeOrder = async () => {
    if (!selectedTable || cart.length === 0) {
      showToast("Select a table and add items first");
      return;
    }

    const newOrder = {
      tableId: selectedTable.id,
      tableNumber: selectedTable.tableNumber,
      customerName: customerName || undefined,
      items: cart.map(c => ({
        id: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        ...(c.notes ? { notes: c.notes } : {})
      })),
      status: OrderStatus.PENDING,
      total: cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0)
    };

    await placeOrderService(newOrder);
    setCart([]);
    setView('status');
    showToast("Order placed successfully!");
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await updateOrderService(orderId, status);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg flex overflow-hidden">
      {!isPublicCustomer && (
        <nav className="hidden lg:flex w-24 bg-brand-orange flex-col items-center py-8 gap-10 border-r-4 border-black/10 shrink-0">
          <div className="w-12 h-12 bg-brand-surface rounded-2xl flex items-center justify-center shadow-lg">
            <div className="w-6 h-6 bg-brand-orange rounded-full"></div>
          </div>
          <div className="flex flex-col gap-8">
            <button 
              onClick={() => setRole(UserRole.KITCHEN)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all relative group ${role === UserRole.KITCHEN ? 'bg-brand-surface shadow-md text-brand-orange' : 'bg-white/20 text-white hover:bg-white/40'}`}
            >
              <ChefHat className="w-6 h-6" />
              <div className="absolute left-full ml-4 bg-brand-surface text-brand-text px-3 py-1.5 rounded shadow-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border-2 border-brand-border z-50">
                Kitchen Board
              </div>
            </button>
            <button 
              onClick={() => setRole(UserRole.CASHIER)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all relative group ${role === UserRole.CASHIER ? 'bg-brand-surface shadow-md text-brand-orange' : 'bg-white/20 text-white hover:bg-white/40'}`}
            >
              <CreditCard className="w-6 h-6" />
               <div className="absolute left-full ml-4 bg-brand-surface text-brand-text px-3 py-1.5 rounded shadow-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border-2 border-brand-border z-50">
                Cashier Board
              </div>
            </button>
            <button 
              onClick={() => setRole(UserRole.DASHBOARD)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all relative group ${role === UserRole.DASHBOARD ? 'bg-brand-surface shadow-md text-brand-orange' : 'bg-white/20 text-white hover:bg-white/40'}`}
            >
              <BarChart2 className="w-6 h-6" />
               <div className="absolute left-full ml-4 bg-brand-surface text-brand-text px-3 py-1.5 rounded shadow-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border-2 border-brand-border z-50">
                Main Dashboard
              </div>
            </button>
            <button 
              onClick={() => setRole(UserRole.ADMIN)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all relative group ${role === UserRole.ADMIN ? 'bg-brand-surface shadow-md text-brand-orange' : 'bg-white/20 text-white hover:bg-white/40'}`}
            >
              <Settings className="w-6 h-6" />
               <div className="absolute left-full ml-4 bg-brand-surface text-brand-text px-3 py-1.5 rounded shadow-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border-2 border-brand-border z-50">
                Admin Settings
              </div>
            </button>
          </div>
        </nav>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-24 px-6 md:px-10 flex items-center justify-between border-b border-brand-border bg-brand-surface lg:bg-transparent">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-brand-text tracking-tight flex items-center gap-2">
              <Utensils className="w-8 h-8 text-brand-orange lg:hidden" />
              QuickServe <span className="text-brand-orange italic">SMB</span>
            </h1>
            <p className="text-xs md:text-sm text-brand-muted font-medium capitalize">
              {isPublicCustomer ? `Table ${selectedTable?.tableNumber || '?'}` : `${role.replace('_', ' ')} Dashboard`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full border-2 border-brand-border text-brand-text hover:bg-brand-border/50 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {!isPublicCustomer && (
              <div className="hidden md:flex bg-brand-teal/10 text-brand-teal px-4 py-2 rounded-full font-bold text-sm border border-brand-teal/20">
                {tables.filter(t => t.status === 'occupied').length} Active Tables
              </div>
            )}
            <div className="flex items-center gap-3">
              {!isPublicCustomer && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black text-brand-text leading-none">Local Mode</p>
                  <p className="text-[10px] text-brand-muted font-bold uppercase">No internet required</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {role === UserRole.CUSTOMER && selectedTable && !isPublicCustomer && (
          <div className="px-6 md:px-10 pb-4 pt-4">
             <button onClick={() => setSelectedTable(null)} className="text-xs font-bold text-brand-orange underline">Change Table Selection</button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
        {role === UserRole.CUSTOMER && (
          <div className="flex-1 flex flex-col md:flex-row h-full">
            {!selectedTable ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="max-w-md">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-40"></div>
                    <div className="relative bg-orange-100 p-6 rounded-full">
                      <QrCode className="w-12 h-12 text-orange-500" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Welcome to Our Restaurant!</h2>
                  <p className="text-gray-500 mb-8">Please select your table number to start ordering.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tables.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTable(t)}
                        className="bg-brand-surface border-2 border-brand-border p-6 rounded-[32px] hover:border-brand-orange hover:translate-y-[-4px] shadow-sm transition-all flex flex-col items-center gap-2 group"
                      >
                        <span className="text-3xl font-black text-brand-orange group-hover:scale-110 transition-transform">{t.tableNumber}</span>
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Select Table</span>
                      </button>
                    ))}
                  </div>
                  {tables.length === 0 && (
                    <div className="text-gray-400 italic">No tables set up yet. Log in as Admin to add tables.</div>
                  )}
                </div>
              </div>
            ) : (isPublicCustomer || selectedTable.id === 'takeaway') && !customerName ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="max-w-md w-full bg-brand-surface p-8 rounded-[40px] border-2 border-brand-border shadow-xl">
                  <div className="inline-block bg-brand-orange/10 p-5 rounded-full mb-6">
                    <Utensils className="w-10 h-10 text-brand-orange" />
                  </div>
                  <h2 className="text-3xl font-black mb-3 tracking-tight">Who's ordering?</h2>
                  <p className="text-brand-muted font-medium mb-8">Please enter your name for this order.</p>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (inputName.trim()) setCustomerName(inputName.trim());
                  }} className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      placeholder="Your Name (e.g. Alex)" 
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      className="w-full bg-brand-bg border-4 border-brand-border rounded-2xl px-6 py-5 font-black text-xl text-center focus:border-brand-orange outline-none transition-all placeholder:font-medium placeholder:text-brand-muted/50"
                      autoFocus
                    />
                    <button 
                      type="submit"
                      disabled={!inputName.trim()}
                      className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black text-lg hover:scale-[1.02] shadow-[0_6px_0_0_#D85A2B] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                      CONTINUE TO MENU
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <>
                <div className={`flex-1 overflow-y-auto p-4 md:p-8 transition-all ${view !== 'menu' ? 'hidden md:block' : ''}`}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-black tracking-tight">
                        {selectedTable.tableNumber === 'Takeaway' ? 'Takeaway Order' : `Table ${selectedTable.tableNumber}`}
                      </h2>
                      <p className="text-brand-muted text-sm font-medium">What would you like to eat today?</p>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setSelectedTable(null)}
                        className="hidden md:flex items-center gap-2 text-brand-muted hover:text-brand-orange font-bold text-sm transition-colors"
                      >
                        Change Table
                      </button>
                      <button 
                        onClick={() => setView(view === 'cart' ? 'menu' : 'cart')}
                        className="md:hidden relative bg-brand-orange text-white p-4 rounded-2xl shadow-lg"
                      >
                        <ShoppingCart className="w-6 h-6" />
                        {cart.length > 0 && (
                          <span className="absolute -top-2 -right-2 bg-brand-yellow text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-white font-black">
                            {cart.reduce((a, b) => a + b.quantity, 0)}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-none">
                    {['All', ...Array.from(new Set(menuItems.map(m => m.category)))].map(cat => (
                      <button key={cat as string} className="px-6 py-2.5 bg-brand-surface border-2 border-brand-border rounded-full text-sm font-black whitespace-nowrap hover:border-brand-orange hover:text-brand-orange transition-all">
                        {(cat as string).toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                    {menuItems.map(item => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={item.id} 
                        className="bg-brand-surface rounded-3xl md:rounded-[32px] overflow-hidden border-2 border-brand-border hover:border-brand-teal group flex flex-col transition-all"
                      >
                        <div className="h-32 md:h-56 bg-brand-border relative overflow-hidden">
                          <img 
                            src={item.image || `https://picsum.photos/seed/${item.id}/400/400`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                            alt={item.name}
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 right-2 md:top-4 md:right-4">
                            <span className="bg-brand-surface px-2 py-0.5 md:px-4 md:py-1 rounded-full font-black text-brand-teal shadow-md border-2 border-brand-teal/10 text-xs md:text-base">
                              RM {item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 md:p-6 flex-1 flex flex-col">
                          <h3 className="font-black text-sm md:text-xl mb-1 md:mb-2 tracking-tight leading-tight">{item.name}</h3>
                          <p className="text-brand-muted text-[10px] md:text-sm font-medium line-clamp-2 md:line-clamp-2 mb-3 md:mb-6 flex-1 leading-tight">{item.description}</p>
                          <button
                            onClick={() => addToCart(item)}
                            disabled={!item.isAvailable}
                            className="w-full bg-brand-orange text-white py-2 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm flex items-center justify-center gap-1 md:gap-2 hover:translate-y-[-2px] shadow-[0_3px_0_0_#D85A2B] md:shadow-[0_4px_0_0_#D85A2B] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline">ADD TO CART</span>
                            <span className="inline sm:hidden">ADD</span>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {menuItems.length === 0 && (
                    <div className="text-center py-20 bg-brand-surface rounded-2xl border-2 border-dashed border-gray-200">
                      <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Wait! The menu is still being prepared.</p>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {(view === 'cart' || view === 'status') && (
                    <motion.div 
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      className="fixed inset-0 z-50 md:relative md:inset-auto md:w-96 bg-brand-surface flex flex-col shadow-2xl md:shadow-none border-l-4 border-black/5"
                    >
                      <div className="p-6 border-b border-brand-border flex items-center justify-between">
                        <button onClick={() => setView('menu')} className="md:hidden">
                          <MoveRight className="w-6 h-6 rotate-180" />
                        </button>
                        <div>
                          <h3 className="font-black text-2xl tracking-tight leading-none">
                            {selectedTable.tableNumber === 'Takeaway' ? 'Takeaway' : `Table ${selectedTable.tableNumber}`}
                          </h3>
                          {customerName && (
                            <div className="text-sm font-bold text-brand-muted mt-1 opacity-70">
                              {customerName}
                            </div>
                          )}
                        </div>
                        {view === 'cart' && cart.length > 0 && (
                          <button onClick={() => setView('status')} className="text-brand-orange text-xs font-black flex items-center gap-1 uppercase tracking-widest">
                            Orders <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                        {view === 'status' && (
                          <button onClick={() => setView('cart')} className="text-brand-orange text-xs font-black uppercase tracking-widest">
                            Menu
                          </button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
                        {view === 'cart' ? (
                          <>
                            {cart.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-brand-border/30 rounded-full flex items-center justify-center mb-6">
                                  <ShoppingCart className="w-8 h-8 text-brand-muted opacity-40" />
                                </div>
                                <p className="font-bold text-brand-muted">Your cart is empty</p>
                                <p className="text-xs text-brand-muted mt-1">Add some delicious food!</p>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {cart.map(c => (
                                  <div key={c.item.id} className="flex flex-col gap-3 group border-b border-brand-border pb-4 last:border-0">
                                    <div className="flex gap-4">
                                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-brand-border">
                                        <img src={c.item.image || `https://picsum.photos/seed/${c.item.id}/100/100`} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex justify-between font-black text-sm mb-2">
                                          <span className="truncate pr-2">{c.item.name}</span>
                                          <span>RM {(c.item.price * c.quantity).toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1 bg-brand-bg rounded-lg p-1 border border-brand-border">
                                            <button onClick={() => updateCartQuantity(c.item.id, -1)} className="p-1 hover:text-brand-orange"><X className="w-3 h-3" /></button>
                                            <span className="w-8 text-center text-xs font-black">{c.quantity}</span>
                                            <button onClick={() => updateCartQuantity(c.item.id, 1)} className="p-1 hover:text-brand-orange"><Plus className="w-3 h-3" /></button>
                                          </div>
                                          <button onClick={() => removeFromCart(c.item.id)} className="text-brand-muted hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <input 
                                      type="text" 
                                      placeholder="Add note (e.g., less spicy, extra sauce)" 
                                      value={c.notes || ''} 
                                      onChange={(e) => updateCartNote(c.item.id, e.target.value)}
                                      className="text-xs font-medium bg-brand-bg/50 px-3 py-2 rounded-lg border border-brand-border outline-none focus:border-brand-orange focus:bg-brand-surface w-full text-brand-text placeholder-brand-muted/70 transition-colors"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-8">
                            {orders.filter(o => o.tableId === selectedTable.id && o.status !== OrderStatus.PAID).map(order => (
                              <div key={order.id} className="bg-brand-surface rounded-[32px] border-2 border-brand-orange/20 overflow-hidden shadow-sm">
                                <div className="bg-brand-orange/5 p-4 border-b-2 border-brand-orange/10 flex justify-between items-center">
                                  <Badge color={order.status === OrderStatus.READY ? 'green' : 'orange'}>
                                    {order.status}
                                  </Badge>
                                  <span className="text-[10px] font-black text-brand-muted font-mono">#{order.id.slice(-4)}</span>
                                </div>
                                <div className="p-5 space-y-3">
                                  {order.items.map(i => (
                                    <div key={i.id} className="flex flex-col text-sm font-medium">
                                      <div className="flex justify-between items-center">
                                        <span className="text-brand-text">{i.quantity}x {i.name}</span>
                                        <span className="font-black text-brand-muted">RM {(i.price * i.quantity).toFixed(2)}</span>
                                      </div>
                                      {i.notes && (
                                        <span className="text-[10px] text-brand-orange pl-4 italic px-2 py-0.5 rounded -mt-1 block">
                                          Note: {i.notes}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  <div className="pt-4 border-t-2 border-dashed border-brand-border flex justify-between items-end">
                                    <span className="text-xs font-bold text-brand-muted uppercase tracking-widest">Total Bill</span>
                                    <span className="text-2xl font-black text-brand-orange">RM {order.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {orders.filter(o => o.tableId === selectedTable.id && o.status !== OrderStatus.PAID).length === 0 && (
                              <div className="text-center py-10 opacity-40">
                                <Utensils className="w-12 h-12 mx-auto mb-4" />
                                <p className="font-bold">No active orders</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {view === 'cart' && cart.length > 0 && (
                        <div className="p-6 border-t-4 border-brand-bg bg-brand-surface shadow-inner">
                          <div className="flex justify-between items-end mb-6">
                            <span className="text-sm font-black text-brand-muted uppercase tracking-widest">Bag Total</span>
                            <span className="text-3xl font-black text-brand-orange">RM {cart.reduce((a, b) => a + (b.item.price * b.quantity), 0).toFixed(2)}</span>
                          </div>
                          <button
                            onClick={placeOrder}
                            className="w-full vibrant-button-primary"
                          >
                            PLACE ORDER
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        )}

        {role === UserRole.KITCHEN && (
          <KitchenBoard
            orders={orders}
            updateOrderStatus={updateOrderStatus}
          />
        )}

        {role === UserRole.CASHIER && (
          <CashierBoard
            orders={orders}
            tables={tables}
            menuItems={menuItems}
            updateOrderStatus={updateOrderStatus}
            showToast={showToast}
            onPlaceOrder={async (orderPayload) => {
              await placeOrderService(orderPayload);
              showToast("Takeaway Order placed!");
            }}
          />
        )}

        {role === UserRole.ADMIN && (
          <AdminBoard
            tables={tables}
            menuItems={menuItems}
            baseUrl={baseUrl}
            showToast={showToast}
          />
        )}
        
        {role === UserRole.DASHBOARD && (
          <MainDashboard orders={orders} />
        )}
      </main>

      {!isPublicCustomer && (
        <div className="fixed bottom-4 left-4 z-40">
           <div className="group relative">
              <div className="bg-gray-900 text-white h-10 w-10 rounded-full flex items-center justify-center cursor-help shadow-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-brand-surface p-4 rounded-xl shadow-xl border hidden group-hover:block transition-all animate-in fade-in slide-in-from-bottom-2">
                <p className="text-xs font-bold text-gray-900 mb-2">💡 Demo Tip</p>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  Switch roles above to see the flow: 
                  <br/>1. <b>Admin:</b> Setup tables and QR.
                  <br/>2. <b>Customer:</b> Select table and order.
                  <br/>3. <b>Kitchen:</b> Accept & complete orders.
                  <br/>4. <b>Cashier:</b> Finalize payments.
                </p>
              </div>
           </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="bg-brand-text text-white px-8 py-4 rounded-[24px] shadow-2xl font-black text-xs tracking-widest flex items-center gap-4 border-2 border-white/20 whitespace-nowrap"
            >
              <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse shadow-[0_0_10px_#229489]"></div>
              {t.message.toUpperCase()}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      </div>
    </div>
  );
}
