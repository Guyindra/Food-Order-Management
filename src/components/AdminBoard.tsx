import React, { useState } from 'react';
import { 
  Settings, QrCode as QrCodeIcon, Plus, Trash2, AlertCircle, 
  MenuSquare, Grid, Tag, MoreHorizontal, Edit, ImagePlus, CheckCircle,
  Filter, QrCode, Printer
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Table, MenuItem } from '../types';
import { addMenuItem, deleteMenuItem, addTable, deleteTable, initDemo } from '../services/store';

interface AdminBoardProps {
  tables: Table[];
  menuItems: MenuItem[];
  baseUrl: string;
  showToast: (message: string) => void;
}

export const AdminBoard: React.FC<AdminBoardProps> = ({ tables, menuItems, baseUrl, showToast }) => {
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const [customIpTarget, setCustomIpTarget] = useState(baseUrl);
  const [activeTab, setActiveTab] = useState<'menu' | 'table' | 'promotions'>('menu');
  const [activeFilter, setActiveFilter] = useState('All Items');
  
  // States for adding new item
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Pastry');
  const [newItemDesc, setNewItemDesc] = useState('');
  
  // States for Table Management
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [newTableNumber, setNewTableNumber] = useState('');
  
  const handleAddNewItem = async () => {
    if (!newItemName || !newItemPrice || isNaN(parseFloat(newItemPrice))) return;
    
    await addMenuItem({
      name: newItemName,
      price: parseFloat(newItemPrice),
      category: newItemCategory,
      description: newItemDesc || 'House special recipe. Perfectly prepared.',
      isAvailable: true
    });
    
    setNewItemName('');
    setNewItemPrice('');
    setNewItemDesc('');
    showToast('Menu item added successfully');
  };

  const categories = ['All Items', 'Pastry', 'Bread', 'Beverage', 'Savory', 'Main'];
  
  const filteredItems = activeFilter === 'All Items' 
    ? menuItems 
    : menuItems.filter(m => m.category === activeFilter);

  return (
    <div className="flex bg-kitchen-bg text-kitchen-on-surface p-4 md:p-8 h-full gap-6">
      
      {/* Side Navigation for Admin */}
      <aside className="w-64 bg-white/80 backdrop-blur-md rounded-[32px] border-2 border-[#FCEEE9] shadow-[0_8px_32px_rgba(227,139,117,0.08)] flex flex-col p-4 shrink-0 h-[calc(100vh-140px)] sticky top-0">
        <div className="px-4 py-6 flex flex-col gap-1 mb-2">
          <h1 className="text-xl font-black text-[#9c442e] font-headline tracking-tight">Admin Console</h1>
          <p className="font-headline text-sm font-semibold text-[#86523a]">Store Settings</p>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-headline font-bold transition-all duration-200 ${
              activeTab === 'menu' 
                ? 'bg-[#FFF1EC] text-[#9c442e] border-r-4 border-[#9c442e] shadow-sm' 
                : 'text-[#86523a] hover:bg-[#FFF1EC]/50 hover:translate-x-1'
            }`}
          >
            <MenuSquare className="w-5 h-5" /> Menu Management
          </button>
          
          <button 
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-headline font-bold transition-all duration-200 ${
              activeTab === 'table' 
                ? 'bg-[#FFF1EC] text-[#9c442e] border-r-4 border-[#9c442e] shadow-sm' 
                : 'text-[#86523a] hover:bg-[#FFF1EC]/50 hover:translate-x-1'
            }`}
          >
            <Grid className="w-5 h-5" /> Table Management
          </button>
          
          <button 
            onClick={() => setActiveTab('promotions')}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-headline font-bold transition-all duration-200 ${
              activeTab === 'promotions' 
                ? 'bg-[#FFF1EC] text-[#9c442e] border-r-4 border-[#9c442e] shadow-sm' 
                : 'text-[#86523a] hover:bg-[#FFF1EC]/50 hover:translate-x-1'
            }`}
          >
            <Tag className="w-5 h-5" /> Promotions
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-140px)] pr-2 scrollbar-none">
        
        {/* ========================================= */}
        {/* MENU MANAGEMENT TAB */}
        {/* ========================================= */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left Area: Menu Grid (Spans 8 columns) */}
            <div className="xl:col-span-8 flex flex-col gap-8">
              {/* Section Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-headline text-3xl font-bold text-[#512712]">Current Offerings</h2>
                  <p className="font-body text-[#86523a] mt-1 font-medium">Manage your active bakery items and specials.</p>
                </div>
                {/* Filter Chips */}
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className={`font-body text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                        activeFilter === cat 
                          ? 'bg-[#9c442e] text-[#fff7f6] shadow-md' 
                          : 'bg-[#ffe9e1] text-[#512712] hover:bg-[#ffdbcc]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bento Grid for Menu Items */}
              {filteredItems.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border-2 border-[#ffe9e1]">
                  <p className="font-headline font-bold text-xl text-[#86523a]">No items found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredItems.map(item => (
                    <div key={item.id} className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(187,91,67,0.06)] border-2 border-[#ffe9e1] overflow-hidden group hover:border-[#e5a386] transition-colors flex flex-col min-h-[300px]">
                      <div className="aspect-[4/3] w-full bg-[#fff1ec] overflow-hidden relative">
                        <img 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          src={item.image || `https://picsum.photos/seed/${item.id}/400/300`} 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm cursor-pointer hover:bg-white text-[#512712]">
                          <MoreHorizontal className="w-5 h-5" />
                        </div>
                        {item.category && item.category !== 'Main' && (
                          <div className="absolute top-4 left-4 bg-[#61d4ff] text-[#00313f] font-headline text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-widest">
                            {item.category}
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-headline text-xl font-bold text-[#512712] mb-2">{item.name}</h3>
                        <p className="font-body text-sm text-[#86523a] line-clamp-2 mb-6 flex-1 font-medium leading-relaxed">
                          {item.description}
                        </p>
                        
                        <div className="flex items-end justify-between mt-auto">
                          <span className="font-headline text-2xl font-black text-[#9c442e]">
                            RM {item.price.toFixed(2)}
                          </span>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                if(confirm(`Delete ${item.name}?`)) deleteMenuItem(item.id);
                              }}
                              className="w-10 h-10 rounded-full bg-[#ffe9e1] flex items-center justify-center text-[#ac3149] hover:bg-[#ffdbcc] hover:scale-105 transition-all"
                              title="Delete Item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-[#ffe9e1] flex items-center justify-center text-[#86523a] hover:bg-[#ffdbcc] hover:scale-105 transition-all">
                              <Edit className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Area: Add Item Form (Sticky) */}
            <aside className="xl:col-span-4 bg-white rounded-[32px] shadow-[0_8px_32px_rgba(187,91,67,0.08)] border-2 border-[#ffe9e1] p-8 sticky top-0">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-[#ffac98] text-[#6f220f] flex items-center justify-center shadow-inner">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-headline text-xl font-bold text-[#512712] leading-tight">Add New Item</h2>
                  <p className="font-body text-sm font-medium text-[#86523a] mt-0.5">Expand your cozy kitchen menu.</p>
                </div>
              </div>
              
              <form className="flex flex-col gap-5">
                {/* Image Upload */}
                <div className="border-2 border-dashed border-[#e5a386] bg-[#fff8f6] hover:bg-[#fff1ec] transition-colors rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group">
                  <div className="w-14 h-14 rounded-full bg-[#ffe9e1] flex items-center justify-center mb-3 group-hover:bg-[#ffac98] group-hover:text-[#520d00] text-[#a66d53] transition-colors">
                    <ImagePlus className="w-6 h-6" />
                  </div>
                  <p className="font-headline font-bold text-sm text-[#512712] mb-1">Upload Item Photo</p>
                  <p className="font-body text-xs font-semibold text-[#86523a]">PNG, JPG up to 5MB</p>
                </div>

                {/* Item Name */}
                <div className="flex flex-col gap-2">
                  <label className="font-body text-sm font-bold text-[#86523a] ml-1">Item Name</label>
                  <input 
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    className="bg-white border-2 border-[#ffdbcc] rounded-xl px-4 py-3 font-headline font-semibold text-[#512712] focus:border-[#9c442e] focus:ring-4 focus:ring-[#ffac98]/20 outline-none transition-all placeholder:text-[#86523a]/50" 
                    placeholder="e.g. Cinnamon Swirl Brioche" 
                    type="text"
                  />
                </div>

                {/* Row: Price & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="font-body text-sm font-bold text-[#86523a] ml-1">Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86523a] font-headline font-bold">RM</span>
                      <input 
                        value={newItemPrice}
                        onChange={e => setNewItemPrice(e.target.value)}
                        className="w-full bg-white border-2 border-[#ffdbcc] rounded-xl pl-8 pr-4 py-3 font-headline font-bold text-[#512712] focus:border-[#9c442e] focus:ring-4 focus:ring-[#ffac98]/20 outline-none transition-all" 
                        placeholder="0.00" 
                        step="0.01" 
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-body text-sm font-bold text-[#86523a] ml-1">Category</label>
                    <div className="relative">
                      <select 
                        value={newItemCategory}
                        onChange={e => setNewItemCategory(e.target.value)}
                        className="w-full appearance-none bg-white border-2 border-[#ffdbcc] rounded-xl pl-4 pr-10 py-3 font-headline font-semibold text-[#512712] focus:border-[#9c442e] focus:ring-4 focus:ring-[#ffac98]/20 outline-none transition-all cursor-pointer"
                      >
                        <option value="Pastry">Pastry</option>
                        <option value="Bread">Bread</option>
                        <option value="Beverage">Beverage</option>
                        <option value="Savory">Savory</option>
                        <option value="Main">Main</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label className="font-body text-sm font-bold text-[#86523a] ml-1">Description</label>
                  <textarea 
                    value={newItemDesc}
                    onChange={e => setNewItemDesc(e.target.value)}
                    className="bg-white border-2 border-[#ffdbcc] rounded-xl px-4 py-3 font-body font-medium text-[#512712] focus:border-[#9c442e] focus:ring-4 focus:ring-[#ffac98]/20 outline-none transition-all placeholder:text-[#86523a]/50 resize-none leading-relaxed" 
                    placeholder="Describe the flavors, ingredients, and craft..." 
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <button 
                  onClick={handleAddNewItem}
                  type="button"
                  className="mt-2 bg-[#9c442e] text-[#fff7f6] font-headline font-bold text-lg rounded-2xl py-4 px-6 w-full shadow-[0_8px_20px_rgba(156,68,46,0.25)] hover:bg-[#8d3823] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Publish to Menu
                </button>
              </form>
            </aside>
          </div>
        )}


        {/* ========================================= */}
        {/* TABLE MANAGEMENT TAB */}
        {/* ========================================= */}
        {activeTab === 'table' && (
          <div className="flex flex-col gap-8 w-full">
            {/* Page Header & Actions */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div>
                <h2 className="font-headline text-[40px] leading-tight font-bold text-[#512712] mb-2">Table Configuration</h2>
                <p className="font-body text-[#86523a] text-base">Manage your dining floor layout and table capacities.</p>
              </div>
              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-[#ffe9e1] text-[#512712] font-semibold text-sm rounded-xl hover:bg-[#ffdbcc] transition-colors border border-[#ffdbcc]">
                  <Filter className="w-5 h-5" />
                  Filter Views
                </button>
                <button 
                  onClick={() => setSelectedTableId('new')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#9c442e] text-[#fff7f6] font-semibold text-sm rounded-xl shadow-[0_8px_32px_rgba(187,91,67,0.08)] hover:-translate-y-0.5 transition-transform active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  Add New Table
                </button>
              </div>
            </div>

            {isLocalhost && (
              <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 p-6 rounded-[24px] flex items-start gap-4 shadow-sm max-w-3xl">
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-yellow-600" />
                <div>
                  <p className="font-headline font-bold text-base">Action Required for Mobile Scanning</p>
                  <p className="font-body text-sm font-medium mt-1 leading-relaxed">
                    You are viewing this app on <b>localhost</b>. Phones cannot scan QR codes that point to localhost. 
                    To fix this, change the "QR Host URL" to your computer's local Wi-Fi IP address.
                  </p>
                </div>
              </div>
            )}

            {/* Bento Grid Layout for Floor Plan & Details */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
              
              {/* Floor Plan Canvas (Takes up 2 columns) */}
              <div className="xl:col-span-2 bg-[#fff8f6] rounded-2xl shadow-[0_8px_32px_rgba(187,91,67,0.08)] p-6 flex flex-col border border-[#ffdbcc] relative overflow-hidden">
                {/* Canvas Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-headline text-2xl font-semibold text-[#512712]">Floor Plan Overview</h3>
                  <div className="flex gap-2 bg-[#fff1ec] p-1 rounded-lg border border-[#ffe9e1]">
                    <button className="px-3 py-1.5 bg-[#fff8f6] rounded shadow-sm text-sm font-semibold text-[#9c442e]">Floor 1</button>
                    <button className="px-3 py-1.5 text-[#86523a] text-sm font-medium hover:text-[#512712] transition-colors">Patio</button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="font-body text-sm font-bold text-[#86523a] ml-1 mb-2 block">QR Host URL (Required if testing on LAN)</label>
                  <input 
                    type="text" 
                    value={customIpTarget} 
                    onChange={(e) => setCustomIpTarget(e.target.value)} 
                    className="w-full bg-white border border-[#ffdbcc] rounded-xl px-5 py-3 font-headline font-bold text-[#512712] focus:border-[#9c442e] outline-none transition-all" 
                  />
                </div>

                {/* The 'Grid' Area (Simulated visual layout with real tables) */}
                <div className="flex-1 overflow-y-auto bg-white rounded-xl border-2 border-dashed border-[#ffdbcc] p-6 relative">
                  <div className="flex flex-wrap gap-6 items-start content-start min-h-full">
                    {tables.map(t => {
                      const isSelected = selectedTableId === t.id;
                      return (
                        <div 
                          key={t.id} 
                          onClick={() => setSelectedTableId(t.id)}
                          className={`w-28 h-28 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer group shadow-sm
                            ${isSelected 
                              ? 'border-2 border-[#9c442e] bg-[#fff8f6] ring-4 ring-[#ffac98]/20 shadow-[0_8px_32px_rgba(187,91,67,0.08)]' 
                              : 'border-2 border-[#ffdbcc] bg-[#fff1ec] hover:border-[#9c442e]'
                            }`}
                        >
                          <span className={`font-headline text-2xl font-bold ${isSelected ? 'text-[#9c442e]' : 'text-[#512712]'}`}>T{t.tableNumber}</span>
                          <span className={`mt-2 ${isSelected ? 'text-[#86523a]' : 'text-[#006783]'}`}>
                            {isSelected ? <QrCodeIcon className="w-5 h-5" /> : <CheckCircle className="w-5 h-5 text-[#006783]" />}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Table Configuration Panel */}
              <div className="bg-[#fff8f6] rounded-2xl shadow-[0_8px_32px_rgba(187,91,67,0.08)] flex flex-col border border-[#ffdbcc] overflow-hidden">
                <div className="p-6 border-b border-[#ffe9e1] bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline text-2xl font-semibold text-[#512712]">Table QR Settings</h3>
                    {selectedTableId && selectedTableId !== 'new' && (
                      <button 
                        onClick={async () => {
                          if (confirm(`Remove this table completely?`)) {
                            await deleteTable(selectedTableId);
                            setSelectedTableId(null);
                            showToast(`Table removed`);
                          }
                        }}
                        className="text-[#ac3149] hover:bg-[#f76a80]/20 p-2 rounded-full transition-colors" 
                        title="Delete Table"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
                  {selectedTableId === 'new' ? (
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="font-body text-sm font-bold text-[#512712]">New Table Number/Name</label>
                        <input 
                          value={newTableNumber}
                          onChange={e => setNewTableNumber(e.target.value)}
                          className="w-full bg-[#fff1ec] border-2 border-[#ffdbcc] rounded-xl px-4 py-3 font-headline text-lg font-bold text-[#512712] focus:border-[#9c442e] focus:ring-0 focus:bg-[#fff8f6] transition-all outline-none" 
                          type="text" 
                          placeholder="e.g. 10"
                        />
                      </div>
                      
                      <div className="aspect-square w-full bg-[#fff1ec] border-2 border-dashed border-[#ffdbcc] rounded-2xl flex flex-col items-center justify-center gap-2 p-8">
                        <QrCodeIcon className="w-12 h-12 text-[#86523a]" />
                        <span className="text-sm font-semibold text-[#86523a] text-center">Save to generate QR code</span>
                      </div>
                    </div>
                  ) : selectedTableId ? (
                    (() => {
                      const selectedTable = tables.find(t => t.id === selectedTableId);
                      if (!selectedTable) return null;
                      return (
                        <div className="flex flex-col gap-6">
                          <div className="flex flex-col gap-2">
                            <label className="font-body text-sm font-bold text-[#512712]">Selected Table</label>
                            <input 
                              disabled
                              className="w-full bg-[#fff1ec] border-2 border-[#ffdbcc] rounded-xl px-4 py-3 font-headline text-lg font-bold text-[#512712] transition-all outline-none opacity-80" 
                              type="text" 
                              value={`Table ${selectedTable.tableNumber}`}
                            />
                            <p className="font-body text-xs font-semibold text-[#86523a] mt-1 tracking-widest uppercase">ID: {selectedTable.id.slice(0, 8)}</p>
                          </div>
                          
                          <div className="aspect-square w-full bg-white border-2 border-[#ffdbcc] rounded-2xl flex flex-col items-center justify-center gap-2 p-8 relative shadow-sm">
                            <div className="bg-white p-4 rounded-xl border border-[#ffe9e1]">
                              <QRCodeSVG 
                                value={`${customIpTarget.replace(/\/$/, '')}/?tableId=${selectedTable.id}`} 
                                size={180}
                                level="H"
                                includeMargin={true}
                                fgColor="#512712"
                              />
                            </div>
                            <a 
                              href={`${customIpTarget.replace(/\/$/, '')}/?tableId=${selectedTable.id}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="mt-4 font-headline text-sm font-bold text-[#006783] hover:underline"
                            >
                              Test Ordering Link
                            </a>
                          </div>
                        </div>
                      )
                    })()
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#86523a]">
                      <Grid className="w-12 h-12 mb-4 opacity-50" />
                      <p className="font-headline font-bold text-lg text-[#512712]">No table selected</p>
                      <p className="font-body text-sm mt-1">Select a table from the floor plan or add a new one.</p>
                      
                      <button 
                        onClick={async () => {
                          if (!confirm("This will create sample tables and menu items. Continue?")) return;
                          await initDemo();
                          alert("Demo system initialized!");
                        }}
                        className="mt-8 bg-[#006783] text-[#f2faff] px-4 py-2.5 rounded-xl font-headline text-sm font-bold shadow-sm hover:bg-[#005a74] transition"
                      >
                        Initialize Demo Data
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-[#ffe9e1] bg-white flex gap-3">
                  {selectedTableId === 'new' ? (
                    <button 
                      onClick={async () => {
                        if (!newTableNumber) return;
                        await addTable({ tableNumber: newTableNumber });
                        setNewTableNumber('');
                        setSelectedTableId(null);
                        showToast('Table added successfully');
                      }}
                      className="flex-1 py-3 px-4 bg-[#9c442e] text-[#fff7f6] font-semibold text-[14px] rounded-xl shadow-[0_8px_32px_rgba(187,91,67,0.08)] hover:-translate-y-0.5 transition-transform active:scale-95"
                    >
                      Save New Table
                    </button>
                  ) : selectedTableId && (
                    <>
                      <button className="flex-1 py-3 px-4 bg-[#ffe9e1] text-[#512712] font-semibold text-[14px] rounded-xl hover:bg-[#ffdbcc] transition-colors flex items-center justify-center gap-2">
                        <Printer className="w-[18px] h-[18px]" />
                        Print QR
                      </button>
                      <button className="flex-1 py-3 px-4 bg-[#9c442e] text-[#fff7f6] font-semibold text-[14px] rounded-xl shadow-[0_8px_32px_rgba(187,91,67,0.08)] hover:-translate-y-0.5 transition-transform active:scale-95">
                        Download PNG
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* PROMOTIONS TAB */}
        {/* ========================================= */}
        {activeTab === 'promotions' && (
          <div className="flex flex-col gap-8 w-full max-w-[1400px]">
            {/* Page Header */}
            <div>
              <h2 className="font-headline text-[40px] leading-tight font-bold text-[#512712] mb-2">Promotions & Offers</h2>
              <p className="font-body text-[#86523a] text-base max-w-2xl">Create and manage discounts to delight your customers and boost sales during quiet hours.</p>
            </div>
            
            {/* Dashboard Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Create New Form (Bento Style) */}
              <section className="xl:col-span-5 bg-[#fff8f6] rounded-2xl shadow-[0_8px_32px_rgba(187,91,67,0.08)] border border-[#ffdbcc] overflow-hidden">
                <div className="p-6 border-b border-[#ffe9e1] bg-[#fff1ec]">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-[#ffac98] flex items-center justify-center text-[#520d00] shadow-inner">
                      <Plus className="w-6 h-6" />
                    </div>
                    <h3 className="font-headline text-2xl font-semibold text-[#512712]">Create New Offer</h3>
                  </div>
                  <p className="font-body text-sm font-medium text-[#86523a] ml-13">Configure a new discount or special combo.</p>
                </div>
                
                <form className="p-6 flex flex-col gap-6">
                  {/* Input: Title */}
                  <div className="flex flex-col gap-2">
                    <label className="font-body text-sm font-bold text-[#512712] ml-1">Offer Title</label>
                    <input 
                      className="w-full bg-white border-2 border-[#ffdbcc] rounded-xl px-4 py-3 font-headline text-lg font-bold text-[#512712] focus:border-[#9c442e] transition-all outline-none" 
                      placeholder="e.g., Weekend Sourdough Special" 
                      type="text"
                    />
                  </div>
                  
                  {/* Pill Tabs: Discount Type */}
                  <div className="flex flex-col gap-2">
                    <label className="font-body text-sm font-bold text-[#512712] ml-1">Discount Type</label>
                    <div className="flex flex-wrap gap-2">
                      <button className="flex-1 bg-[#c3e8fd] text-[#00313f] border-2 border-[#c3e8fd] rounded-xl px-4 py-3 font-headline text-sm font-bold transition-all shadow-sm" type="button">
                        Percentage
                      </button>
                      <button className="flex-1 bg-white border-2 border-[#ffdbcc] text-[#86523a] hover:bg-[#fff1ec] rounded-xl px-4 py-3 font-headline text-sm font-bold transition-all" type="button">
                        Fixed Amount
                      </button>
                      <button className="flex-1 bg-white border-2 border-[#ffdbcc] text-[#86523a] hover:bg-[#fff1ec] rounded-xl px-4 py-3 font-headline text-sm font-bold transition-all" type="button">
                        Item / BOGO
                      </button>
                    </div>
                  </div>
                  
                  {/* Value & Applies To Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="font-body text-sm font-bold text-[#512712] ml-1">Discount Value</label>
                      <div className="relative">
                        <input className="w-full bg-white border-2 border-[#ffdbcc] rounded-xl pl-4 pr-10 py-3 font-headline text-lg font-bold text-[#512712] focus:border-[#9c442e] transition-all outline-none" placeholder="10" type="number"/>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86523a] font-headline font-bold">%</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-body text-sm font-bold text-[#512712] ml-1">Applies To</label>
                      <select className="w-full bg-white border-2 border-[#ffdbcc] rounded-xl pl-4 pr-10 py-3 font-headline text-lg font-bold text-[#512712] appearance-none focus:border-[#9c442e] transition-all outline-none cursor-pointer">
                        <option>Entire Menu</option>
                        <option>Sourdough Breads</option>
                        <option>All Pastries</option>
                        <option>Coffee & Drinks</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Duration (Visual tactile input) */}
                  <div className="flex flex-col gap-2">
                    <label className="font-body text-sm font-bold text-[#512712] ml-1">Duration & Days</label>
                    <div className="bg-white border-2 border-[#ffdbcc] rounded-xl p-2 flex gap-1 overflow-x-auto snap-x scrollbar-none">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                        <button 
                          key={day}
                          className={`snap-start flex-shrink-0 w-12 h-14 rounded-lg flex flex-col items-center justify-center border-2 overflow-hidden relative transition-colors ${
                            i > 0 && i < 4 
                              ? 'bg-[#ffac98] text-[#520d00] border-[#9c442e] shadow-sm' 
                              : 'bg-white border-[#ffe9e1] text-[#86523a] hover:bg-[#fff1ec]'
                          }`}
                          type="button"
                        >
                          <span className="font-headline text-[10px] uppercase font-bold">{day}</span>
                          <span className="font-headline font-semibold mt-0.5">{12 + i}</span>
                          {i > 0 && i < 4 && <div className="absolute bottom-0 w-full h-1 bg-[#9c442e]"></div>}
                        </button>
                      ))}
                      <div className="w-8 flex items-center justify-center text-[#e5a386]">...</div>
                    </div>
                  </div>
                  
                  {/* CTA */}
                  <div className="pt-6 border-t border-[#ffe9e1]">
                    <button 
                      className="w-full bg-[#9c442e] text-[#fff7f6] font-headline text-lg font-bold py-4 rounded-xl shadow-[0_8px_32px_rgba(187,91,67,0.2)] hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2" 
                      type="button"
                    >
                      Publish Promotion
                    </button>
                  </div>
                </form>
              </section>

              {/* Right Column: Active Promotions Grid */}
              <section className="xl:col-span-7 flex flex-col gap-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-headline text-2xl font-bold text-[#512712]">Active & Scheduled</h3>
                  <button className="text-[#006783] font-headline text-sm font-bold hover:underline flex items-center gap-1">
                    Filter <Filter className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Promo Card 1: Active */}
                  <div className="bg-white rounded-2xl p-6 shadow-[0_8px_32px_rgba(187,91,67,0.06)] border border-[#ffe9e1] relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(187,91,67,0.1)] transition-shadow">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#006783]"></div>
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div className="w-12 h-12 rounded-full bg-[#c3e8fd]/50 text-[#006783] flex items-center justify-center">
                        <Tag className="w-6 h-6" />
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#c3e8fd] text-[#00313f] font-headline text-[11px] font-bold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#006783] animate-pulse"></span>
                        Active Now
                      </span>
                    </div>
                    <div className="pl-2">
                      <h4 className="font-headline text-[20px] font-bold leading-snug text-[#512712] mb-2 group-hover:text-[#9c442e] transition-colors">10% Off Sourdough Mondays</h4>
                      <p className="font-body text-sm font-medium text-[#86523a] mb-6 line-clamp-2">Automatically applied to all artisan sourdough loaves every Monday to clear weekend prep.</p>
                      
                      <div className="flex items-center justify-between border-t border-[#ffe9e1] pt-4">
                        <div className="flex flex-col">
                          <span className="font-headline text-[10px] font-bold text-[#a66d53] uppercase tracking-wide">Usage this week</span>
                          <span className="font-headline text-lg font-bold text-[#512712]">42 Orders</span>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-[#fff8f6] hover:bg-[#ffe9e1] text-[#86523a] flex items-center justify-center transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Promo Card 2: Active / Ending Soon */}
                  <div className="bg-white rounded-2xl p-6 shadow-[0_8px_32px_rgba(187,91,67,0.06)] border border-[#ffe9e1] relative overflow-hidden group hover:shadow-[0_12px_40px_rgba(187,91,67,0.1)] transition-shadow">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ac3149]"></div>
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div className="w-12 h-12 rounded-full bg-[#f76a80]/20 text-[#ac3149] flex items-center justify-center">
                        <Tag className="w-6 h-6" />
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#f76a80] text-[#fff7f7] font-headline text-[11px] font-bold uppercase tracking-wider">
                        <AlertCircle className="w-3 h-3" />
                        Ends Today
                      </span>
                    </div>
                    <div className="pl-2">
                      <h4 className="font-headline text-[20px] font-bold leading-snug text-[#512712] mb-2 group-hover:text-[#9c442e] transition-colors">Free Coffee with Pastry</h4>
                      <p className="font-body text-sm font-medium text-[#86523a] mb-6 line-clamp-2">Buy any 2 premium pastries and get a standard drip coffee on the house. Morning rush only.</p>
                      
                      <div className="flex items-center justify-between border-t border-[#ffe9e1] pt-4">
                        <div className="flex flex-col">
                          <span className="font-headline text-[10px] font-bold text-[#a66d53] uppercase tracking-wide">Usage this week</span>
                          <span className="font-headline text-lg font-bold text-[#512712]">128 Orders</span>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-[#fff8f6] hover:bg-[#ffe9e1] text-[#86523a] flex items-center justify-center transition-colors">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Promo Card 3: Scheduled */}
                  <div className="bg-[#fff8f6] rounded-2xl p-6 border-2 border-[#ffdbcc] border-dashed relative overflow-hidden opacity-90 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#ffe9e1] text-[#86523a] flex items-center justify-center">
                        <Tag className="w-6 h-6" />
                      </div>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#ffe9e1] text-[#512712] font-headline text-[11px] font-bold uppercase tracking-wider">
                        Starts Oct 1
                      </span>
                    </div>
                    <div>
                      <h4 className="font-headline text-[20px] font-bold leading-snug text-[#512712] mb-2">Holiday Box Pre-order</h4>
                      <p className="font-body text-sm font-medium text-[#86523a] mb-6 line-clamp-2">RM 5 off when customers pre-order the assorted holiday pastry box before November.</p>
                      
                      <div className="flex items-center justify-between border-t border-[#ffdbcc] pt-4">
                        <div className="flex flex-col">
                          <span className="font-headline text-[10px] font-bold text-[#a66d53] uppercase tracking-wide">Status</span>
                          <span className="font-headline text-sm font-bold text-[#86523a]">Scheduled</span>
                        </div>
                        <button className="font-headline text-sm font-bold text-[#9c442e] hover:underline">Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
