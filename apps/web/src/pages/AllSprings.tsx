import React, { useState } from 'react';
import { 
  Search, ArrowUpRight, ArrowDownRight, ArrowRight, Info, 
  RefreshCw, ChevronDown, List, Grid, Download, MoreVertical, 
  ChevronLeft, ChevronRight, AlertTriangle, MapPin, Leaf, Droplets,
  Calendar, Users, Target, Map as MapIcon, FileText, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const dummyData = [
  { id: 'SPR-JH-024', location: 'Naiti Village', type: 'Perennial', discharge: '8.2 L/min', trend: 'Declining', priority: 'High' },
  { id: 'SPR-JH-031', location: 'Burfu', type: 'Seasonal', discharge: '5.8 L/min', trend: 'Declining', priority: 'High' },
  { id: 'SPR-JH-018', location: 'Sarmoli', type: 'Perennial', discharge: '11.4 L/min', trend: 'Declining', priority: 'High' },
  { id: 'SPR-JH-067', location: 'Lilam', type: 'Seasonal', discharge: '4.1 L/min', trend: 'Stable', priority: 'Medium' },
  { id: 'SPR-JH-112', location: 'Martoli', type: 'Perennial', discharge: '3.6 L/min', trend: 'Declining', priority: 'Medium' },
  { id: 'SPR-JH-089', location: 'Rilkot', type: 'Seasonal', discharge: '6.9 L/min', trend: 'Improving', priority: 'Low' },
  { id: 'SPR-JH-140', location: 'Dharchula', type: 'Perennial', discharge: '12.1 L/min', trend: 'Stable', priority: 'Low' },
  { id: 'SPR-JH-156', location: 'Munsyari', type: 'Perennial', discharge: '9.3 L/min', trend: 'Declining', priority: 'Medium' },
  { id: 'SPR-JH-201', location: 'Madkot', type: 'Seasonal', discharge: '2.8 L/min', trend: 'Declining', priority: 'High' },
  { id: 'SPR-JH-244', location: 'Baluwakot', type: 'Perennial', discharge: '10.5 L/min', trend: 'Stable', priority: 'Low' },
];

const chartData = [
  { year: '2023', discharge: 16.5 },
  { year: '2024', discharge: 12.0 },
  { year: '2025', discharge: 9.5 },
  { year: '2026', discharge: 7.0 },
];

const FilterDropdown = ({ label }: { label: string }) => (
  <div className="bg-white border border-gray-200 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-700 flex items-center justify-between gap-2 cursor-pointer hover:bg-gray-50 min-w-0">
    <span className="truncate">{label}</span>
    <ChevronDown size={13} className="text-gray-400 shrink-0" />
  </div>
);

const AllSprings: React.FC = () => {
  const navigate = useNavigate();
  const [springs, setSprings] = useState<any[]>(dummyData);
  const [selectedSpring, setSelectedSpring] = useState(dummyData[0]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/v1/inventory/springs/accepted')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const mapped = data.map((d: any, i: number) => ({
            id: `SPR-${d.village_code || 'UN'}-${100 + i}`,
            location: d.village_code || 'Unknown',
            type: d.typology === 'contact_spring' ? 'Perennial' : 'Seasonal',
            discharge: (d.discharge_readings && d.discharge_readings.length > 0) 
              ? `${d.discharge_readings[d.discharge_readings.length - 1].reading_lps.toFixed(1)} L/min` 
              : 'N/A',
            trend: 'Declining',
            priority: i % 3 === 0 ? 'High' : (i % 2 === 0 ? 'Medium' : 'Low')
          }));
          setSprings(mapped);
          setSelectedSpring(mapped[0]);
        }
      })
      .catch(err => console.error('Failed to fetch from backend:', err))
      .finally(() => setLoading(false));
  }, []);

  const getTypeStyle = (type: string) =>
    type === 'Perennial'
      ? 'bg-blue-50 text-blue-600 border border-blue-100'
      : 'bg-orange-50 text-orange-600 border border-orange-100';

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-50 text-red-600 border border-red-100';
      case 'Medium': return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
      case 'Low': return 'bg-green-50 text-green-600 border border-green-100';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTrendStyle = (trend: string) => {
    switch (trend) {
      case 'Declining': return 'text-red-500';
      case 'Improving': return 'text-green-500';
      case 'Stable': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'Declining': return <ArrowDownRight size={13} className="shrink-0" />;
      case 'Improving': return <ArrowUpRight size={13} className="shrink-0" />;
      case 'Stable': return <ArrowRight size={13} className="shrink-0" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-72px)] bg-[#f8fafc] w-full overflow-hidden relative">

      {/* Left Column */}
      <div className="flex-1 flex flex-col p-4 xl:p-6 overflow-hidden z-10 relative min-w-0">

        {/* Header */}
        <div className="mb-4 flex flex-wrap justify-between items-start gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#115E41] uppercase mb-1">SPRINGS</p>
            <h1 className="text-2xl xl:text-3xl font-extrabold text-[#111827] tracking-tight mb-1">All Springs</h1>
            <p className="text-gray-500 text-xs xl:text-sm font-medium">Explore and manage all mapped springs across selected region.</p>
          </div>
          <div className="bg-green-50/80 border border-green-100 rounded-lg p-2.5 flex gap-2 max-w-[220px] xl:max-w-[260px] shrink-0">
            <Info size={13} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-green-800 mb-0.5">Demo Data</p>
              <p className="text-[9px] font-medium text-green-700/80 leading-tight">Illustrative dataset for prototype purposes only.</p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-3 flex items-center gap-2 shrink-0 overflow-x-auto">
          <div className="relative min-w-[160px] xl:min-w-[200px] border-r border-gray-100 pr-2 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 bg-transparent text-sm text-gray-700 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FilterDropdown label="Spring Type" />
            <FilterDropdown label="Status" />
            <FilterDropdown label="Trend" />
            <FilterDropdown label="Priority" />
          </div>
          <button className="text-xs font-bold text-[#115E41] flex items-center gap-1 px-2 hover:opacity-80 shrink-0 whitespace-nowrap">
            <RefreshCw size={13} /> Reset
          </button>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between mb-3 shrink-0 flex-wrap gap-2">
          <p className="text-sm font-bold text-gray-800">1,268 springs found</p>
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500">
              Sort by <span className="font-bold text-gray-800 flex items-center cursor-pointer">Priority <ChevronDown size={13} className="ml-0.5" /></span>
            </div>
            <div className="flex bg-gray-100 p-0.5 rounded-lg">
              <button className="p-1 bg-white shadow-sm rounded-md"><List size={15} className="text-gray-700" /></button>
              <button className="p-1 rounded-md text-gray-400"><Grid size={15} /></button>
            </div>
            <button className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b border-gray-100">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center"><input type="checkbox" className="rounded border-gray-300" /></th>
                  <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">Spring ID</th>
                  <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase">Location</th>
                  <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase hidden md:table-cell">Type</th>
                  <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">Discharge</th>
                  <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase hidden lg:table-cell">Trend (3yr)</th>
                  <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase">Priority</th>
                  <th className="py-2.5 px-3 text-[10px] font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {springs.map((spring) => (
                  <tr
                    key={spring.id}
                    onClick={() => setSelectedSpring(spring)}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedSpring.id === spring.id ? 'bg-green-50/30' : ''}`}
                  >
                    <td className="py-3 px-3 text-center"><input type="checkbox" className="rounded border-gray-300" onClick={e => e.stopPropagation()} /></td>
                    <td className="py-3 px-3 font-bold text-gray-900 text-sm whitespace-nowrap">{spring.id}</td>
                    <td className="py-3 px-3 text-xs font-medium text-gray-600 max-w-[120px] truncate">{spring.location}</td>
                    <td className="py-3 px-3 hidden md:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getTypeStyle(spring.type)}`}>
                        {spring.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs font-extrabold text-gray-900 whitespace-nowrap">{spring.discharge}</td>
                    <td className={`py-3 px-3 text-[11px] font-bold hidden lg:table-cell ${getTrendStyle(spring.trend)}`}>
                      <span className="flex items-center gap-1">{getTrendIcon(spring.trend)} {spring.trend}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize ${getPriorityStyle(spring.priority)}`}>
                        {spring.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-bold text-[#115E41] flex items-center hover:underline whitespace-nowrap"
                          onClick={(e) => { e.stopPropagation(); navigate(`/springs/twin/${spring.id}`); }}
                        >
                          View <ArrowRight size={11} className="ml-0.5" />
                        </span>
                        <button className="text-gray-400 hover:text-gray-600 hidden xl:block"><MoreVertical size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex items-center justify-between shrink-0">
            <p className="text-xs font-medium text-gray-500 hidden sm:block">Showing 1-10 of 1,268</p>
            <div className="flex items-center gap-1">
              <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#115E41] text-white text-xs font-bold shadow-sm">1</button>
              {[2, 3, 4, 5].map(n => (
                <button key={n} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 text-xs font-medium hidden sm:flex">{n}</button>
              ))}
              <span className="w-7 h-7 flex items-center justify-center text-gray-400 text-xs hidden sm:flex">...</span>
              <button className="w-8 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 text-xs font-medium hidden md:flex">127</button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 border border-gray-200"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — responsive width */}
      <div className="w-[340px] xl:w-[400px] 2xl:w-[420px] bg-white border-l border-gray-200 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] flex flex-col z-20 shrink-0 relative">

        {/* Top */}
        <div className="p-4 pb-3">
          <div className="flex justify-between items-start mb-3">
            <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100">
              <ChevronLeft size={16} />
            </button>
            <div className="w-28 xl:w-32 h-16 xl:h-20 bg-gray-200 rounded-lg overflow-hidden relative shadow-sm">
              <img src="https://images.unsplash.com/photo-1543881473-b3c990b79df7?auto=format&fit=crop&w=300&q=80" alt="Spring" className="w-full h-full object-cover" />
              <div className="absolute top-1 right-1 text-[9px] font-bold text-white bg-black/40 backdrop-blur-sm px-1 py-0.5 rounded flex items-center gap-0.5">
                1 of 1,268 <ChevronRight size={9} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="text-lg xl:text-xl font-extrabold text-gray-900">{selectedSpring.id}</h2>
            <div className="bg-red-50 text-red-600 border border-red-100 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <AlertTriangle size={9} /> {selectedSpring.priority} Priority
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <MapPin size={11} className="text-gray-400 shrink-0" /> {selectedSpring.location}, Munsyari Block
          </p>
        </div>

        {/* Tabs */}
        <div className="flex px-4 border-b border-gray-100 overflow-x-auto">
          {['Overview', 'Trend', 'Recharge Area', 'Interventions', 'Field Data'].map((tab, i) => (
            <button key={tab} className={`pb-2 mr-3 text-[10px] font-bold whitespace-nowrap border-b-2 ${i === 0 ? 'text-[#115E41] border-[#115E41]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">

          {/* 2x2 Metrics */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex gap-2.5">
              <div className="bg-green-100 p-1.5 rounded-lg text-green-600 shrink-0"><Leaf size={14} /></div>
              <div><p className="text-[8px] font-bold text-gray-400 uppercase">Spring Type</p><p className="text-xs font-bold text-gray-900 mt-0.5">{selectedSpring.type}</p></div>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 flex gap-2.5">
              <div className="bg-blue-100 p-1.5 rounded-lg text-blue-500 shrink-0"><Droplets size={14} /></div>
              <div><p className="text-[8px] font-bold text-gray-400 uppercase">Discharge</p><p className="text-xs font-extrabold text-gray-900 mt-0.5">{selectedSpring.discharge}</p></div>
            </div>
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-2.5 flex gap-2.5">
              <div className="bg-red-100 p-1.5 rounded-lg text-red-500 shrink-0"><ArrowDownRight size={14} /></div>
              <div><p className="text-[8px] font-bold text-gray-400 uppercase">Trend</p><p className="text-xs font-bold text-gray-900 mt-0.5">{selectedSpring.trend}</p></div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex gap-2.5">
              <div className="bg-gray-200 p-1.5 rounded-lg text-gray-600 shrink-0"><Calendar size={14} /></div>
              <div><p className="text-[8px] font-bold text-gray-400 uppercase">Last Obs.</p><p className="text-xs font-bold text-gray-900 mt-0.5">12 Sep 2026</p></div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-white border border-gray-100 rounded-xl p-2.5 shadow-sm flex flex-col items-center text-center">
              <Users size={14} className="text-[#115E41] mb-1" />
              <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Community</p>
              <p className="text-xs font-bold text-gray-900">High</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 shadow-sm flex flex-col items-center text-center">
              <AlertTriangle size={14} className="text-red-500 mb-1" />
              <p className="text-[8px] font-bold text-red-400 uppercase mb-0.5">Priority</p>
              <p className="text-xs font-bold text-red-900">{selectedSpring.priority}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-2.5 shadow-sm flex flex-col items-center text-center">
              <Target size={14} className="text-green-500 mb-1" />
              <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Confidence</p>
              <p className="text-[9px] font-bold bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">Moderate</p>
            </div>
          </div>

          {/* Chart */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-gray-900">Discharge Trend (3 Years)</h3>
              <div className="flex bg-gray-100 rounded p-0.5">
                <button className="text-[9px] font-bold bg-[#115E41] text-white px-2 py-0.5 rounded shadow-sm">3Y</button>
                <button className="text-[9px] font-bold text-gray-500 px-2 py-0.5">5Y</button>
                <button className="text-[9px] font-bold text-gray-500 px-2 py-0.5">All</button>
              </div>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="colorDis2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#115E41" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#115E41" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} dy={4} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} domain={[0, 20]} />
                  <Area type="monotone" dataKey="discharge" stroke="#115E41" strokeWidth={2} fillOpacity={1} fill="url(#colorDis2)" dot={{ r: 3, fill: '#115E41', strokeWidth: 2, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100 flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 text-[10px] xl:text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors">
            <MapIcon size={13} /> <span className="hidden xl:inline">View on</span> Map
          </button>
          <button
            onClick={() => navigate(`/springs/twin/${selectedSpring.id}`)}
            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] xl:text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors"
          >
            <FileText size={13} /> <span className="hidden xl:inline">Open</span> Twin
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 text-[10px] xl:text-xs font-bold text-white bg-[#115E41] hover:bg-[#0e4b34] rounded-lg py-2 transition-colors shadow-md">
            <Plus size={13} /> Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllSprings;
