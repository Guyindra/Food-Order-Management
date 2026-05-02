import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, TrendingDown, Calendar, 
  ChevronRight, MoreHorizontal, Coffee, 
  CheckCircle, Package, MessageSquare, Receipt
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface MainDashboardProps {
  orders: Order[];
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ orders }) => {
  const [showSalesBreakdown, setShowSalesBreakdown] = useState(false);
  const [showOrdersBreakdown, setShowOrdersBreakdown] = useState(false);

  // Simple calculations for demo
  const todayOrders = useMemo(() => orders, [orders]);
  
  const dineInOrders = useMemo(() => todayOrders.filter(o => o.tableId !== 'takeaway'), [todayOrders]);
  const takeawayOrders = useMemo(() => todayOrders.filter(o => o.tableId === 'takeaway'), [todayOrders]);

  const totalSales = useMemo(() => {
    return todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  }, [todayOrders]);
  
  const dineInSales = useMemo(() => dineInOrders.reduce((sum, order) => sum + (order.total || 0), 0), [dineInOrders]);
  const takeawaySales = useMemo(() => takeawayOrders.reduce((sum, order) => sum + (order.total || 0), 0), [takeawayOrders]);

  const avgTicket = todayOrders.length > 0 ? totalSales / todayOrders.length : 0;
  
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const recentActivities = useMemo(() => {
    return [...orders].sort((a, b) => {
      // Handle Firebase timestamp or JS Date/timestamp
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
      return timeB - timeA;
    }).slice(0, 4);
  }, [orders]);

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const timeMs = timestamp.toMillis ? timestamp.toMillis() : timestamp;
    const diffMins = Math.floor((Date.now() - timeMs) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const flowData = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    const labels = ['8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'];
    
    todayOrders.forEach(o => {
      const ms = o.createdAt?.toMillis ? o.createdAt.toMillis() : (o.createdAt || Date.now());
      const hour = new Date(ms).getHours();
      
      if (hour >= 7 && hour < 9) buckets[0]++;
      else if (hour >= 9 && hour < 11) buckets[1]++;
      else if (hour >= 11 && hour < 13) buckets[2]++;
      else if (hour >= 13 && hour < 15) buckets[3]++;
      else if (hour >= 15 && hour < 17) buckets[4]++;
      else if (hour >= 17 && hour < 19) buckets[5]++;
      else if (hour >= 19 || hour < 7) buckets[6]++; 
    });

    const maxOrders = Math.max(...buckets, 4); // base max of 4 to prevent empty charts looking too high
    
    const points = buckets.map((count, i) => {
      const x = (i / 6) * 1000;
      const y = 200 - ((count / maxOrders) * 140 + 20);
      return { x, y, count, label: labels[i] };
    });

    const dPath = points.map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = points[i - 1];
      const cpX = (p.x + prev.x) / 2;
      return `C${cpX},${prev.y} ${cpX},${p.y} ${p.x},${p.y}`;
    }).join(' ');

    const fillPath = `${dPath} L1000,200 L0,200 Z`;

    const currentHour = new Date().getHours();
    let currentBucketIdx = 0;
    if (currentHour >= 19 || currentHour < 7) currentBucketIdx = 6;
    else if (currentHour >= 17) currentBucketIdx = 5;
    else if (currentHour >= 15) currentBucketIdx = 4;
    else if (currentHour >= 13) currentBucketIdx = 3;
    else if (currentHour >= 11) currentBucketIdx = 2;
    else if (currentHour >= 9) currentBucketIdx = 1;

    return { points, dPath, fillPath, currentBucketIdx };
  }, [todayOrders]);

  return (
    <div className="bg-kitchen-bg text-kitchen-on-surface font-body min-h-full">
      {/* Header handled by App.tsx generally, but we'll add our page header */}
      <div className="p-8 md:p-12 pb-12 w-full max-w-7xl mx-auto">
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-lg text-kitchen-on-surface-variant mb-1">Happy {new Date().toLocaleDateString('en-US', { weekday: 'long' })}!</p>
            <h2 className="text-4xl font-headline font-bold text-kitchen-on-surface">Here's what's baking.</h2>
          </div>
          <div className="px-4 py-2 bg-kitchen-surface-container rounded-full flex items-center gap-2">
            <Calendar className="w-4 h-4 text-kitchen-primary" />
            <span className="text-sm font-semibold text-kitchen-on-surface">{formattedDate}</span>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div 
            className="bg-kitchen-surface-container-lowest rounded-3xl p-6 shadow-[0_12px_36px_rgba(146,74,55,0.08)] flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all"
            onClick={() => setShowSalesBreakdown(!showSalesBreakdown)}
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-kitchen-primary-fixed opacity-50 rounded-full blur-2xl group-hover:bg-kitchen-primary-container transition-colors duration-500"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-kitchen-secondary-container text-kitchen-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl font-bold bg-white/50 w-full h-full rounded-2xl flex items-center justify-center">$</span>
              </div>
              <span className="px-3 py-1 bg-kitchen-tertiary-fixed text-kitchen-on-tertiary-fixed-variant rounded-full text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> 12%
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-base text-kitchen-on-surface-variant mb-1">Daily Sales</p>
              <p className="text-3xl font-headline font-bold text-kitchen-on-surface">${totalSales.toFixed(2)}</p>
              {showSalesBreakdown && (
                <div className="mt-4 pt-4 border-t border-kitchen-surface-variant/50 text-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-kitchen-on-surface-variant">Dine In</span>
                    <span className="font-semibold text-kitchen-on-surface">${dineInSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kitchen-on-surface-variant">Takeaway</span>
                    <span className="font-semibold text-kitchen-on-surface">${takeawaySales.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div 
            className="bg-kitchen-surface-container-lowest rounded-3xl p-6 shadow-[0_12px_36px_rgba(146,74,55,0.08)] flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all"
            onClick={() => setShowOrdersBreakdown(!showOrdersBreakdown)}
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-kitchen-secondary-fixed opacity-50 rounded-full blur-2xl group-hover:bg-kitchen-secondary-container transition-colors duration-500"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-kitchen-primary-fixed text-kitchen-on-primary-fixed-variant flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-kitchen-tertiary-fixed text-kitchen-on-tertiary-fixed-variant rounded-full text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> 8%
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-base text-kitchen-on-surface-variant mb-1">Total Orders</p>
              <p className="text-3xl font-headline font-bold text-kitchen-on-surface">{todayOrders.length}</p>
              {showOrdersBreakdown && (
                <div className="mt-4 pt-4 border-t border-kitchen-surface-variant/50 text-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-kitchen-on-surface-variant">Dine In</span>
                    <span className="font-semibold text-kitchen-on-surface">{dineInOrders.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-kitchen-on-surface-variant">Takeaway</span>
                    <span className="font-semibold text-kitchen-on-surface">{takeawayOrders.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-kitchen-surface-container-lowest rounded-3xl p-6 shadow-[0_12px_36px_rgba(146,74,55,0.08)] flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-kitchen-tertiary-fixed opacity-50 rounded-full blur-2xl group-hover:bg-kitchen-tertiary-container transition-colors duration-500"></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-kitchen-surface-variant text-kitchen-on-surface-variant flex items-center justify-center">
                <span className="font-serif font-black text-xl italic bg-white/50 w-full h-full rounded-2xl flex items-center justify-center">=</span>
              </div>
              <span className="px-3 py-1 bg-kitchen-error-container text-kitchen-on-error-container rounded-full text-xs font-semibold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> 2%
              </span>
            </div>
            <div className="relative z-10">
              <p className="text-base text-kitchen-on-surface-variant mb-1">Average Ticket</p>
              <p className="text-3xl font-headline font-bold text-kitchen-on-surface">${avgTicket.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Lower Grid Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* Flow Chart mock */}
            <div className="bg-kitchen-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0_12px_36px_rgba(146,74,55,0.08)]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-headline font-bold text-kitchen-on-surface">Restaurant Flow</h3>
                <button className="text-xs font-semibold text-kitchen-primary flex items-center gap-1 hover:underline">
                  View details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="h-64 w-full relative flex items-end">
                <svg className="absolute bottom-0 w-full h-full text-kitchen-primary-container opacity-20" preserveAspectRatio="none" viewBox="0 0 1000 200">
                  <path d={flowData.fillPath} fill="currentColor"></path>
                </svg>
                <svg className="absolute bottom-0 w-full h-full text-kitchen-primary" preserveAspectRatio="none" viewBox="0 0 1000 200">
                  <path d={flowData.dPath} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4"></path>
                </svg>
                <div className="absolute inset-0 flex justify-between items-end px-4 pb-2">
                  {flowData.points.map((p, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group relative">
                      {/* Tooltip on Hover */}
                      <span className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-kitchen-surface text-kitchen-on-surface text-xs font-bold px-2 py-1 rounded shadow-sm transition-opacity whitespace-nowrap">
                        {p.count} Orders
                      </span>
                      
                      {i === flowData.currentBucketIdx ? (
                        <div className="w-2 h-2 bg-kitchen-primary rounded-full ring-4 ring-kitchen-primary-fixed"></div>
                      ) : (
                        <div className="w-1.5 h-1.5 bg-kitchen-outline-variant rounded-full border border-kitchen-outline-variant"></div>
                      )}
                      
                      <span className={`text-xs ${i === flowData.currentBucketIdx ? 'font-bold text-kitchen-primary' : 'font-semibold text-zinc-400'} flex shrink-0 whitespace-nowrap`}>
                        {p.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Selling Items */}
            <div className="bg-kitchen-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0_12px_36px_rgba(146,74,55,0.08)]">
              <h3 className="text-2xl font-headline font-bold text-kitchen-on-surface mb-6">Top Selling Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-kitchen-surface-container rounded-2xl p-4 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-200">
                  <div className="w-20 h-20 rounded-full mb-3 shadow-inner bg-white p-2">
                    <img alt="Almond Croissant" className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzuMJjUwqI3KuNnKPW1G8Nt5rD1d-HuenZb1UvKao3aUqcH4v_ey96o0l8-aAbRkIPburPTIhzmUoCxU_dD76mOP3HJy6IV2BKkhFST9WnbdEuKTQ2usMtGTf928h4bMlaBM_0mSRKBHZwHaYrFIgqjMg0rg8AoQaam5orUMfqyKTm0ooWxicn8TIn5pUQlQPx4SUXCx6_FJ0AFq8U2ioyjZm1OCXiFd8dC8OwCcFXE9RF_Y2BdoSQSCDWH7vLA8-B0DaCC0JUbyc" />
                  </div>
                  <h4 className="text-sm font-semibold text-kitchen-on-surface mb-1">Almond Croissant</h4>
                  <p className="text-sm text-kitchen-on-surface-variant mb-3">42 Orders today</p>
                  <span className="px-3 py-1 bg-kitchen-primary-fixed text-kitchen-on-primary-fixed-variant rounded-full text-xs font-semibold w-full">Popular</span>
                </div>
                
                <div className="bg-kitchen-surface-container rounded-2xl p-4 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-200">
                  <div className="w-20 h-20 rounded-full mb-3 shadow-inner bg-white p-2">
                    <img alt="Sourdough Loaf" className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyIgRcn3NkMK45J2zA3-gOoaSJLcwzt4TqUoQBzEeBIiefs6FBEhnDdqQlWSfOTQ41Jseg9KKiVXAXuwoPu7mjqPIZrou966awbBp8b90w74Sh1IoPXIPRTSvrhYwOTbpYwSIvow3HyK9c_5pZ3bo90XT8TSUOxJHXWmnrRUYBQYGiOc9quMvpfsGMEr_1flWXIqns1_RawsbEU_olcwlSTrP4QXrOCuQ4IepIeu511Ya0aNzmoNgHlPfAS5UlfZCdfQhpPZtvO7A" />
                  </div>
                  <h4 className="text-sm font-semibold text-kitchen-on-surface mb-1">Classic Sourdough</h4>
                  <p className="text-sm text-kitchen-on-surface-variant mb-3">38 Orders today</p>
                  <span className="px-3 py-1 bg-kitchen-secondary-fixed text-[#3d6072] rounded-full text-xs font-semibold w-full">Staple</span>
                </div>

                <div className="bg-kitchen-surface-container rounded-2xl p-4 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-200">
                  <div className="w-20 h-20 rounded-full mb-3 shadow-inner bg-white p-2">
                    <img alt="Latte" className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWNP3BPK5_PhHskPXosU4GanA-ydPoIoP1jquygZWxt5x_WYNWw7v8kH7aPPGTVsOBATJfcg2p1PU-wIeWunA8ESnRRXsEPpfuIyzSNKGSIDeYgedW0S2Vj4iyOcgM-xx88UfV9Rkxgyhv-yam9MrZbVu6ir3zfCRhNquyKfcm1L4rNpprdKimkfQLUKPwD8bahbl_iadkXfUT3zRMObjXFJpJ70nrqyTBleO4NeGnrcPbr7JPr3l6Rs1YHa5Qc91Yoi3CLfQcU2M" />
                  </div>
                  <h4 className="text-sm font-semibold text-kitchen-on-surface mb-1">Oat Milk Latte</h4>
                  <p className="text-sm text-kitchen-on-surface-variant mb-3">55 Orders today</p>
                  <span className="px-3 py-1 bg-kitchen-tertiary-fixed text-[#005066] rounded-full text-xs font-semibold w-full">Trending</span>
                </div>
              </div>
            </div>

          </div>

          {/* Recent Activity Panel */}
          <div className="bg-kitchen-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0_12px_36px_rgba(146,74,55,0.08)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-headline font-bold text-kitchen-on-surface">Recent Activity</h3>
              <button className="w-8 h-8 rounded-full hover:bg-kitchen-surface-container flex items-center justify-center text-zinc-400 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-6 relative">
              <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-kitchen-surface-variant"></div>
              
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex gap-4 relative z-10 group">
                  <div className="w-12 h-12 rounded-full bg-kitchen-primary-fixed text-kitchen-on-primary-fixed flex items-center justify-center flex-shrink-0 shadow-sm ring-4 ring-kitchen-surface-container-lowest group-hover:scale-110 transition-transform">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-kitchen-on-surface">Order {activity.tableId === 'takeaway' ? 'Takeaway' : `Table ${activity.tableNumber}`}</p>
                    <p className="text-sm text-kitchen-on-surface-variant mt-0.5 truncate max-w-[200px] lg:max-w-xs">{activity.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                    <p className="text-xs font-semibold text-zinc-400 mt-1">{getTimeAgo(activity.createdAt)}</p>
                  </div>
                </div>
              ))}
              
              {recentActivities.length === 0 && (
                <p className="text-kitchen-on-surface-variant text-center my-8">No recent activity.</p>
              )}
            </div>
            <button className="mt-6 w-full py-3 border-2 border-kitchen-surface-variant text-kitchen-on-surface-variant rounded-xl text-sm font-semibold hover:bg-kitchen-surface-variant hover:text-kitchen-on-surface transition-colors flex justify-center items-center gap-2">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
