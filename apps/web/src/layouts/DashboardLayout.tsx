import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  Home, 
  Map, 
  Droplets, 
  Layers, 
  Sprout, 
  BarChart2, 
  ClipboardCheck, 
  Users, 
  FileText,
  Search,
  MapPin,
  Map as MapIcon,
  Mountain,
  Bell,
  Calendar,
  ChevronDown
} from 'lucide-react';
import Logo from '../assets/Logo.png';

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; to: string; active?: boolean }> = ({ icon, label, to, active }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive || active ? 'bg-[#EBF1ED] text-[#115E41]' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
    >
      <div className={`${active ? 'text-[#115E41]' : 'text-gray-500'}`}>
        {icon}
      </div>
      {label}
    </NavLink>
  );
};

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#FDFDFD] font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-[220px] xl:w-[250px] 2xl:w-[260px] border-r border-gray-200 flex flex-col h-full bg-white relative z-20 shrink-0 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.1)]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 pt-6 pb-6 cursor-pointer">
          <img src={Logo} alt="Jal-Setu Logo" className="h-8 object-contain" />
          <div className="flex flex-col">
            <span className="font-bold text-[#111827] text-[15px] leading-tight tracking-tight">JAL-SETU</span>
            <span className="text-[9px] text-gray-500 font-medium">Spring Intelligence Platform</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <SidebarItem to="/dashboard" label="Dashboard" icon={<Home size={20} strokeWidth={2.2} />} active />
          <SidebarItem to="/map" label="Map Explorer" icon={<Map size={20} strokeWidth={2.2} />} />
          
          <div className="pt-2 pb-1">
            <SidebarItem to="/springs/all" label="Springs" icon={<Droplets size={20} strokeWidth={2.2} />} />
            {/* Sub-items for Springs */}
            <div className="flex flex-col ml-[32px] mt-1 space-y-1 border-l border-gray-200 pl-3">
              <NavLink 
                to="/springs/all" 
                className={({ isActive }) => `text-[13px] py-1 transition-colors relative before:content-[''] before:absolute before:-left-[13px] before:top-1/2 before:w-2 before:h-[1px] before:bg-gray-200 ${isActive ? 'text-[#115E41] font-bold' : 'text-gray-500 hover:text-[#115E41]'}`}
              >
                All Springs
              </NavLink>
              <NavLink 
                to="/springs/priority" 
                className={({ isActive }) => `text-[13px] py-1 transition-colors relative before:content-[''] before:absolute before:-left-[13px] before:top-1/2 before:w-2 before:h-[1px] before:bg-gray-200 ${isActive ? 'text-[#115E41] font-bold' : 'text-gray-500 hover:text-[#115E41]'}`}
              >
                Priority Springs
              </NavLink>
              <NavLink 
                to="/springs/twin" 
                className={({ isActive }) => `text-[13px] py-1 transition-colors relative before:content-[''] before:absolute before:-left-[13px] before:top-1/2 before:w-2 before:h-[1px] before:bg-gray-200 ${isActive ? 'text-[#115E41] font-bold' : 'text-gray-500 hover:text-[#115E41]'}`}
              >
                Spring Twin
              </NavLink>
            </div>
          </div>

          <SidebarItem to="/recharge" label="Recharge Assessment" icon={<Layers size={20} strokeWidth={2.2} />} />
          <SidebarItem to="/interventions" label="Interventions" icon={<Sprout size={20} strokeWidth={2.2} />} />
          <SidebarItem to="/risk-budget" label="Risk & Budget" icon={<BarChart2 size={20} strokeWidth={2.2} />} />
          <SidebarItem to="/field" label="Field Validation" icon={<ClipboardCheck size={20} strokeWidth={2.2} />} />
          <SidebarItem to="/village-plans" label="Village Plans" icon={<Users size={20} strokeWidth={2.2} />} />
          <SidebarItem to="/reports" label="Reports" icon={<FileText size={20} strokeWidth={2.2} />} />
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 mt-auto border-t border-gray-100 relative overflow-hidden bg-gradient-to-t from-[#F4F8F6] to-white">
           {/* Abstract mountain silhouette inside sidebar footer */}
           <div className="absolute -bottom-4 -left-4 -right-4 h-24 bg-cover bg-no-repeat opacity-20 pointer-events-none" style={{ backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48cGF0aCBkPSJNMCAxMDBMMjAgNjBMMzAgODBMNjAgMzBMOTAgODBMMTAwIDcwVjEwMEgwWiIgZmlsbD0iIzExNUU0MSIvPjwvc3ZnPg==)' }}></div>
           
           <div className="relative z-10 text-[10px] text-gray-500 font-medium leading-relaxed">
             Cleaner Springs<br/>
             Healthier Communities<br/>
             Stronger Tomorrows.
           </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFBFB]">
        
        {/* Top Header */}
        <header className="h-[60px] xl:h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-4 xl:px-6 shrink-0 z-10 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
          {/* Search */}
          <div className="flex items-center flex-1 max-w-xs xl:max-w-lg">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search spring ID, village..." 
                className="w-full pl-9 pr-4 py-1.5 xl:py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#115E41]/20 focus:border-[#115E41] transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 xl:gap-4 shrink-0">
            {/* Filters — only on xl+ */}
            <div className="hidden xl:flex items-center gap-2">
              <div className="relative">
                <select className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 focus:outline-none focus:border-[#115E41]">
                  <option>Uttarakhand</option>
                  <option>Himachal Pradesh</option>
                  <option>Sikkim</option>
                </select>
                <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 focus:outline-none focus:border-[#115E41]">
                  <option>Pithoragarh</option>
                  <option>Almora</option>
                  <option>Chamoli</option>
                </select>
                <MapIcon size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 focus:outline-none focus:border-[#115E41]">
                  <option>Munsyari</option>
                  <option>Dharchula</option>
                  <option>Berinag</option>
                </select>
                <Mountain size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 hidden 2xl:flex">
                <Calendar size={14} className="text-gray-400" />
                Latest Data
                <ChevronDown size={14} className="text-gray-400 ml-0.5" />
              </div>
            </div>

            <div className="w-[1px] h-6 bg-gray-200 hidden xl:block"></div>

            {/* Notification */}
            <button className="relative p-1.5 text-gray-500 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100">
              <Bell size={18} />
              <div className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></div>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-[#115E41] flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:bg-[#0e4b34] transition-colors">
                N
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="text-xs font-bold text-gray-900 leading-tight">Naseer Pasha</span>
                <span className="text-[10px] text-gray-500 font-medium">Project Team</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hidden lg:block"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto min-h-0">
          <Outlet />
        </div>

      </div>
    </div>
  );
};

export default DashboardLayout;
