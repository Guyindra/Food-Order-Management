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
  Minus,
  Search,
  X, 
  MoveRight, 
  MoveLeft,
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
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('tableId')) {
      return UserRole.CUSTOMER;
    }
    return UserRole.DASHBOARD;
  });
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(menuItems.map(m => m.category)))];
  }, [menuItems]);

  const cartQuantity = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + (curr.item.price * curr.quantity), 0);
  }, [cart]);

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [menuItems, selectedCategory, searchQuery]);

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
      total: cartTotal
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
              aria-label="Kitchen Board"
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all relative group ${role === UserRole.KITCHEN ? 'bg-brand-surface shadow-md text-brand-orange' : 'bg-white/20 text-white hover:bg-white/40'}`}
            >
              <ChefHat className="w-6 h-6" />
              <div className="absolute left-full ml-4 bg-brand-surface text-brand-text px-3 py-1.5 rounded shadow-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border-2 border-brand-border z-50">
                Kitchen Board
              </div>
            </button>
            <button 
              onClick={() => setRole(UserRole.CASHIER)}
              aria-label="Cashier Board"
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all relative group ${role === UserRole.CASHIER ? 'bg-brand-surface shadow-md text-brand-orange' : 'bg-white/20 text-white hover:bg-white/40'}`}
            >
              <CreditCard className="w-6 h-6" />
               <div className="absolute left-full ml-4 bg-brand-surface text-brand-text px-3 py-1.5 rounded shadow-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border-2 border-brand-border z-50">
                Cashier Board
              </div>
            </button>
            <button 
              onClick={() => setRole(UserRole.DASHBOARD)}
              aria-label="Main Dashboard"
              className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all relative group ${role === UserRole.DASHBOARD ? 'bg-brand-surface shadow-md text-brand-orange' : 'bg-white/20 text-white hover:bg-white/40'}`}
            >
              <BarChart2 className="w-6 h-6" />
               <div className="absolute left-full ml-4 bg-brand-surface text-brand-text px-3 py-1.5 rounded shadow-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border-2 border-brand-border z-50">
                Main Dashboard
              </div>
            </button>
            <button 
              onClick={() => setRole(UserRole.ADMIN)}
              aria-label="Admin Settings"
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
        {!isPublicCustomer && (
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
        )}

        {role === UserRole.CUSTOMER && selectedTable && !isPublicCustomer && (
          <div className="px-6 md:px-10 pb-4 pt-4">
             <button onClick={() => setSelectedTable(null)} className="text-xs font-bold text-brand-orange underline">Change Table Selection</button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
        {role === UserRole.CUSTOMER && (
          <div className="flex-1 flex flex-col md:flex-row h-full">
            {!selectedTable ? (
               isPublicCustomer ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#fff8f6]">
                  {tables.length === 0 ? (
                    <>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mb-4"></div>
                      <p className="text-brand-orange font-bold">Loading your table...</p>
                    </>
                  ) : (
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm">
                      <QrCode className="w-16 h-16 text-red-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Invalid QR Code</h2>
                      <p className="text-gray-500 mb-6">This table could not be found. Please ask staff for assistance or scan the code again.</p>
                    </div>
                  )}
                </div>
              ) : (
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
                        className="bg-brand-surface border-2 border-brand-border p-6 rounded-[32px] hover:border-brand-orange hover:translate-y-[-4px] focus-visible:ring-4 focus-visible:ring-brand-orange outline-none shadow-sm transition-all flex flex-col items-center gap-2 group"
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
              )
            ) : (isPublicCustomer || selectedTable.id === 'takeaway') && !customerName ? (
              <div className="flex-1 w-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 min-h-full relative overflow-y-auto bg-brand-bg">
                <main className="w-full max-w-md min-h-full h-full bg-[#fff8f6] shadow-xl relative flex flex-col mx-auto shrink-0">
                  <div className="relative flex h-full w-full flex-col">
                    <div className="flex-none">
                      <div 
                        className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-[#ffe9e1] min-h-[50vh] rounded-b-[2rem] shadow-[0_4px_20px_rgba(187,91,67,0.08)]" 
                        style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA5qeNIoqS2lHkj995bT3SWxzV-PLdK_OTFiqd8C-LuDizaTLiH4XiutGK-L8csri_y-QbM4MTYWDCi7r5F97Kdk8UJVyHoCqhoTQtvROrVIkdO1F3XY__ej5n7DZj6_tJIsoW5HxcDFUSYXiQ1_EcNVvcws3830uQRMjV99Zg_v7gEXoP5uyaHkINh7Y0rq5Awo_Duk6pA9qAkD_ap9xMfUc0DpRgzovgPLNIpLlgMSAiuojZQ23Drjx6dUqfN6_7zIADOFyxPVQA")'}}
                      >
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-center px-6 pt-8 pb-8 z-10 bg-[#fff8f6] flex-1">
                      <h1 className="text-[#512712] font-headline text-[32px] font-bold text-center pb-2 w-full mt-4">Welcome to Artisan Bakes</h1>
                      <h2 className="text-[#9c442e] font-headline text-2xl font-semibold text-center pb-6 w-full flex items-center justify-center gap-2">
                        <Utensils className="w-6 h-6" />
                        {selectedTable.tableNumber === 'Takeaway' ? 'Takeaway' : `Table ${selectedTable.tableNumber}`}
                      </h2>
                      <div className="flex w-full mt-auto py-4">
                        <button 
                          onClick={() => setCustomerName(selectedTable.tableNumber === 'Takeaway' ? 'Takeaway' : 'Guest')}
                          className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-6 bg-[#9c442e] text-[#fff7f6] font-semibold text-lg hover:-translate-y-1 transition-transform duration-300 ease-out shadow-[0_4px_20px_rgba(187,91,67,0.2)] active:scale-95"
                        >
                          <span className="truncate">Start Ordering</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            ) : isPublicCustomer ? (
              <>
                <div className={`flex-1 overflow-y-auto transition-all ${view !== 'menu' && isPublicCustomer ? 'hidden' : ''} bg-[#fff8f6]`}>
                  <div className={`relative flex h-auto min-h-screen w-full ${isPublicCustomer ? 'max-w-md mx-auto' : ''} flex-col pb-28 font-body`}>
                    
                    {/* Header */}
                    <div className="flex items-center bg-[#fff8f6] p-4 pb-2 justify-between sticky top-0 z-10">
                      <button onClick={() => isPublicCustomer && customerName ? setCustomerName('') : setSelectedTable(null)} className="text-[#512712] flex size-12 shrink-0 items-center justify-center hover:bg-[#ffe9e1] rounded-full transition-colors">
                        <MoveLeft className="w-6 h-6" />
                      </button>
                      <h2 className="text-[#512712] font-headline font-semibold text-2xl tracking-[-0.015em] flex-1 text-center pr-12">Menu</h2>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="px-4 py-3">
                      <label className="flex flex-col min-w-40 h-12 w-full">
                        <div className="flex w-full flex-1 items-stretch rounded-lg h-full ring-2 ring-[#ffdbcc] focus-within:ring-[#9c442e] transition-all bg-[#ffe9e1]">
                          <div className="text-[#a66d53] flex border-none items-center justify-center pl-4 rounded-l-lg pr-2">
                            <Search className="w-5 h-5" />
                          </div>
                          <input 
                            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-[#512712] focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-[#a66d53] px-2 font-body" 
                            placeholder="Search menu..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </label>
                    </div>

                    {/* Category Tabs */}
                    <div className="pb-3 relative">
                      <div className="flex border-b border-[#e5a386] px-4 gap-8 overflow-x-auto scrollbar-none">
                        {categories.map(cat => {
                          const isSelected = selectedCategory === cat;
                          return (
                            <button
                              key={cat as string}
                              onClick={() => setSelectedCategory(cat as string)}
                              className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 shrink-0 px-2 transition-colors ${
                                isSelected ? 'border-b-[#9c442e] text-[#512712]' : 'border-b-transparent text-[#a66d53] hover:text-[#86523a]'
                              }`}
                            >
                              <p className={`font-label font-semibold tracking-[0.015em] ${isSelected ? 'text-[15px]' : 'text-sm'}`}>
                                {(cat as string) === 'All' ? 'All Items' : (cat as string)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Item List */}
                    <div className="flex flex-col gap-3 px-4 py-2">
                      {filteredMenuItems
                        .map(item => {
                          const cartItem = cart.find(c => c.item.id === item.id);
                          const quantity = cartItem ? cartItem.quantity : 0;
                          
                          return (
                            <div key={item.id} className={`flex gap-4 bg-[#ffffff] p-3 rounded-xl shadow-sm border border-[#ffe2d7] justify-between items-center ${!item.isAvailable ? 'opacity-60 grayscale-[30%]' : ''}`}>
                              <div className="flex items-center gap-4 flex-1">
                                <div 
                                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-[80px] shrink-0 bg-[#fff1ec]" 
                                  style={{backgroundImage: `url("${item.image || `https://picsum.photos/seed/${item.id}/400/400`}")`}}
                                ></div>
                                <div className="flex flex-1 flex-col justify-center">
                                  <p className="text-[#512712] font-body text-base md:text-lg font-semibold leading-tight mb-1">{item.name}</p>
                                  <p className="text-[#a66d53] font-body text-xs md:text-sm leading-snug line-clamp-2 md:line-clamp-3 mb-1">
                                    {!item.isAvailable ? "Sold out for the day. Check back tomorrow!" : item.description}
                                  </p>
                                  <p className={`font-label font-semibold text-sm ${!item.isAvailable ? 'text-[#a66d53] line-through' : 'text-[#9c442e]'}`}>
                                    ${item.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0 pl-2">
                                {quantity > 0 ? (
                                  <div className="flex flex-col items-center gap-2 bg-[#ffe9e1] rounded-full p-1">
                                    <button onClick={() => updateCartQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#ffffff] text-[#512712] shadow-sm hover:bg-[#fff8f6]">
                                      <Plus className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs font-semibold text-[#512712]">{quantity}</span>
                                    <button onClick={() => {
                                      if (quantity === 1) removeFromCart(item.id);
                                      else updateCartQuantity(item.id, -1);
                                    }} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#ffffff] text-[#512712] shadow-sm hover:bg-[#fff8f6]">
                                      <Minus className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    disabled={!item.isAvailable}
                                    className={`flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg transition-colors ring-1 ${
                                      item.isAvailable 
                                        ? 'bg-[#ffe9e1] text-[#512712] hover:bg-[#9c442e] hover:text-[#fff7f6] ring-[#ffdbcc]' 
                                        : 'bg-[#ffdbcc] text-[#a66d53]/50 cursor-not-allowed ring-[#ffdbcc]'
                                    }`}
                                  >
                                    <Plus className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {menuItems.length === 0 && (
                          <div className="py-20 text-center opacity-60">
                            <Utensils className="w-12 h-12 text-[#86523a] mx-auto mb-4" />
                            <p className="font-headline font-bold text-lg text-[#512712]">Menu is empty</p>
                          </div>
                        )}
                    </div>
                    
                    {/* Floating Action Button */}
                    {cart.length > 0 && view === 'menu' && (
                      <div className={`fixed bottom-0 ${isPublicCustomer ? 'left-0 right-0 max-w-md mx-auto' : 'absolute bottom-0 left-0 w-full'} p-4 pb-8 bg-gradient-to-t from-[#fff8f6] via-[#fff8f6] to-transparent z-20 pointer-events-none`}>
                        <button 
                          onClick={() => setView('cart')}
                          className="w-full bg-[#9c442e] text-[#fff7f6] py-4 px-6 rounded-xl shadow-[0_8px_24px_rgba(156,68,46,0.25)] font-semibold flex justify-between items-center pointer-events-auto active:scale-[0.98] transition-transform"
                        >
                          <div className="flex items-center gap-2">
                            <div className="bg-[#fff7f6] text-[#9c442e] rounded-full size-6 flex items-center justify-center font-bold text-xs">
                              {cartQuantity}
                            </div>
                            <span>View Order</span>
                          </div>
                          <span>${cartTotal.toFixed(2)}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {(view === 'cart' || view === 'status') && isPublicCustomer ? (
                    <div className="fixed inset-0 bg-[#fff8f6] z-[100] flex flex-col font-body text-[#512712] overflow-hidden">
                      <header className="flex items-center justify-between p-4 bg-[#fff8f6] sticky top-0 z-10 shrink-0">
                        <button onClick={() => setView('menu')} aria-label="Go back" className="w-10 h-10 flex items-center justify-center rounded-full bg-[#ffe9e1] hover:bg-[#ffe2d7] transition-colors text-[#512712]">
                          <MoveRight className="w-6 h-6 rotate-180" />
                        </button>
                        <h1 className="text-2xl font-headline font-semibold text-[#512712] flex-1 text-center pr-10">{view === 'cart' ? 'My Order' : 'Order Status'}</h1>
                      </header>
                      
                      <main className="flex-1 flex flex-col px-4 pb-24 max-w-md mx-auto w-full overflow-y-auto scrollbar-none">
                        {view === 'cart' ? (
                          <>
                            {cart.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center pb-20 opacity-60">
                                <ShoppingCart className="w-12 h-12 text-[#86523a] mb-4" />
                                <p className="font-headline font-bold text-lg text-[#512712]">Your cart is empty</p>
                                <p className="text-sm text-[#86523a] mt-1">Add some delicious food!</p>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-4 mt-2">
                                {cart.map(c => (
                                  <div key={c.item.id} className="flex flex-col gap-3 bg-[#ffffff] p-4 rounded-xl shadow-[0_4px_12px_rgba(156,68,46,0.05)] border border-[#fff1ec]">
                                    <div className="flex items-center gap-4">
                                      <div className="w-[72px] h-[72px] rounded-lg bg-[#ffe9e1] overflow-hidden shrink-0">
                                        <img src={c.item.image || `https://picsum.photos/seed/${c.item.id}/100/100`} alt={c.item.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1 flex flex-col">
                                        <h2 className="text-lg font-semibold text-[#512712]">{c.item.name}</h2>
                                        {c.item.description && <p className="text-sm text-[#86523a] mt-0.5 line-clamp-1">{c.item.description}</p>}
                                        <p className="text-sm font-semibold text-[#9c442e] mt-1">${c.item.price.toFixed(2)}</p>
                                      </div>
                                      <div className="flex flex-col items-center gap-2 bg-[#ffe9e1] rounded-full p-1">
                                        <button onClick={() => updateCartQuantity(c.item.id, 1)} aria-label="Increase quantity" className="w-7 h-7 flex items-center justify-center rounded-full bg-[#ffffff] text-[#512712] shadow-sm hover:bg-[#fff8f6]">
                                          <Plus className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs font-semibold text-[#512712]">{c.quantity}</span>
                                        <button onClick={() => updateCartQuantity(c.item.id, -1)} aria-label="Decrease quantity" className="w-7 h-7 flex items-center justify-center rounded-full bg-[#ffffff] text-[#512712] shadow-sm hover:bg-[#fff8f6]">
                                          <Minus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-2">
                                      <textarea 
                                        placeholder="Special Instructions (e.g., extra oat milk...)" 
                                        value={c.notes || ''} 
                                        onChange={(e) => updateCartNote(c.item.id, e.target.value)}
                                        rows={1}
                                        className="w-full rounded-lg border border-[#ffe2d7] bg-[#fff8f6] p-2.5 text-sm text-[#512712] placeholder:text-[#a66d53] focus:border-[#9c442e] focus:ring-0 outline-none resize-none transition-colors"
                                      />
                                    </div>
                                  </div>
                                ))}
                                
                                <div className="mt-6 flex flex-col gap-3 px-1">
                                  <div className="flex justify-between items-center text-base text-[#86523a]">
                                    <span>Subtotal</span>
                                    <span>${cartTotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-base text-[#86523a]">
                                    <span>Tax (Included)</span>
                                    <span>$0.00</span>
                                  </div>
                                  <div className="w-full h-[1px] bg-[#ffe2d7] my-1"></div>
                                  <div className="flex justify-between items-center text-xl font-headline font-semibold text-[#512712]">
                                    <span>Total</span>
                                    <span className="text-[#9c442e] font-bold">${cartTotal.toFixed(2)}</span>
                                  </div>
                                </div>
                                <div className="mt-8 text-center">
                                   <button onClick={() => setView('status')} className="text-[#9c442e] text-sm font-headline font-bold uppercase tracking-wider">
                                     View Order Status
                                   </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex flex-col w-full h-full">
                            {orders.filter(o => o.tableId === selectedTable.id && o.status !== OrderStatus.PAID).length > 0 ? (
                              (() => {
                                const activeOrders = orders.filter(o => o.tableId === selectedTable.id && o.status !== OrderStatus.PAID);
                                // Pick the most recently created order that is not paid
                                const order = activeOrders.sort((a, b) => {
                                  const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                                  const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                                  return bTime - aTime;
                                })[0];

                                const statusProgress = 
                                  order.status === OrderStatus.PENDING ? { width: '25%', text: 'Order Received!', sub: 'Preparing your treats' } :
                                  order.status === OrderStatus.COOKING ? { width: '50%', text: 'Cooking!', sub: 'Your treats are being prepared' } :
                                  order.status === OrderStatus.READY ? { width: '85%', text: 'Ready!', sub: 'Your treats are on the way' } :
                                  { width: '100%', text: 'Served!', sub: 'Enjoy your meal!' };

                                return (
                                  <div className="flex flex-col h-full mt-4 pb-20">
                                    <div className="@[480px]:px-4 @[480px]:py-3 px-4">
                                      <div 
                                        className="w-full bg-center bg-no-repeat bg-contain flex flex-col justify-end overflow-hidden @[480px]:rounded-lg min-h-[260px]" 
                                        style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBndlkE4Ng12qnqKhNJjUitNjUGoymwsR-mN-7WauybwSGQ2EiBYJkt9TpGzyAlnTwoEcQsvDR4YSivwi4E0Z2FsdfuIVrXxh2vZqf5sSNK4y8knlkUmKxHB0ISYR_IWulm30e090p5Kxv3cF3SoUIaEQ-xVY7jhwH47RrMpnOlXVIO4sqOgkxG8c7sCLZM9WHdxUTNCR1juhqdKexEoWdI-UcBC9sXvWDAbXdYS25glWfa78M0VAIZhQgY0Xy8qmOzvAPbO_2HH5Y")'}}
                                      ></div>
                                    </div>
                                    <h1 className="text-[#512712] font-headline tracking-tight text-[32px] font-bold leading-tight px-4 text-center pb-3 pt-6">{statusProgress.text}</h1>
                                    
                                    <div className="flex flex-col gap-3 p-4 px-6 mt-2">
                                      <div className="flex gap-6 justify-between">
                                        <p className="text-[#512712] font-body text-base font-medium leading-normal">{statusProgress.sub}</p>
                                      </div>
                                      <div className="rounded-full bg-[#ffdbcc] overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                                        <div className="h-3 rounded-full bg-[#9c442e] transition-all duration-1000 ease-in-out" style={{width: statusProgress.width}}></div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex justify-center mt-auto">
                                      <div className="flex flex-1 gap-4 max-w-[480px] flex-col items-stretch px-6 py-4">
                                        <button onClick={() => setView('menu')} className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-[#9c442e] hover:bg-[#8d3823] transition-colors text-[#fff7f6] font-semibold text-base leading-normal shadow-[0_4px_12px_rgba(156,68,46,0.2)] w-full active:scale-[0.98]">
                                          <span className="truncate">Back to Menu</span>
                                        </button>
                                        <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-transparent hover:bg-[#ffe9e1] transition-colors text-[#512712] font-semibold text-base leading-normal w-full active:scale-[0.98]">
                                          <span className="truncate">Need help?</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="text-center py-20 opacity-60 flex-1 flex flex-col justify-center items-center">
                                <Utensils className="w-12 h-12 text-[#86523a] mx-auto mb-4" />
                                <p className="font-headline font-bold text-lg text-[#512712]">No active orders</p>
                                <button onClick={() => setView('menu')} className="mt-6 text-[#9c442e] text-sm font-headline font-bold uppercase tracking-wider">
                                  Browse Menu
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </main>
                      
                      {view === 'cart' && cart.length > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#fff8f6] border-t border-[#fff1ec] shadow-[0_-4px_20px_rgba(156,68,46,0.05)] z-20">
                          <div className="max-w-md mx-auto">
                            <button
                              onClick={() => { placeOrder(); setView('status'); }}
                              className="w-full bg-[#9c442e] text-[#fff7f6] py-4 rounded-xl text-lg font-semibold shadow-[0_4px_12px_rgba(156,68,46,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-transform flex justify-center items-center gap-2"
                            >
                              Place Order
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </AnimatePresence>
              </>
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
                            {cartQuantity}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-none">
                    {categories.map(cat => (
                      <button key={cat as string} onClick={() => setSelectedCategory(cat as string)} className={`px-6 py-2.5 ${selectedCategory === cat ? 'bg-brand-orange text-white border-brand-orange' : 'bg-brand-surface text-brand-text border-brand-border hover:border-brand-orange hover:text-brand-orange'} border-2 rounded-full text-sm font-black whitespace-nowrap transition-all`}>
                        {(cat as string).toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                    {filteredMenuItems.map(item => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={item.id} 
                        className={`bg-brand-surface rounded-3xl md:rounded-[32px] overflow-hidden border-2 border-brand-border hover:border-brand-teal group flex flex-col transition-all ${!item.isAvailable ? 'opacity-50 grayscale' : ''}`}
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
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 md:p-6 flex-1 flex flex-col">
                          <h3 className="font-black text-sm md:text-xl mb-1 md:mb-2 tracking-tight leading-tight">{item.name}</h3>
                          <p className="text-brand-muted text-[10px] md:text-sm font-medium line-clamp-2 md:line-clamp-2 mb-3 md:mb-6 flex-1 leading-tight">{item.description}</p>
                          <button
                            onClick={() => addToCart(item)}
                            disabled={!item.isAvailable}
                            className={`w-full ${item.isAvailable ? 'bg-brand-orange text-white hover:translate-y-[-2px] shadow-[0_3px_0_0_#D85A2B] md:shadow-[0_4px_0_0_#D85A2B] active:translate-y-[2px] active:shadow-none' : 'bg-brand-border text-brand-muted'} py-2 md:py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm flex items-center justify-center gap-1 md:gap-2 transition-all disabled:opacity-50`}
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
                                          <span>${(c.item.price * c.quantity).toFixed(2)}</span>
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
                                        <span className="font-black text-brand-muted">${(i.price * i.quantity).toFixed(2)}</span>
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
                                    <span className="text-2xl font-black text-brand-orange">${order.total.toFixed(2)}</span>
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
                            <span className="text-3xl font-black text-brand-orange">${cartTotal.toFixed(2)}</span>
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
            orders={orders}
            updateOrderStatus={updateOrderStatus}
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
