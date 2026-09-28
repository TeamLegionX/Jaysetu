import React, { useState } from 'react';
import { 
  AlertTriangle, Users, Droplets, Target, ChevronDown, Search, 
  MapPin, Leaf, ArrowDownRight, ArrowUpRight, Calendar, Map as MapIcon, 
  Info, ArrowRight, BarChart2, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const dummyData = [
  { id: 'SPR-JH-024', location: 'Naiti Village, Munsyari', type: 'Perennial', trendNum: '↓ 22%', trendDir: 'down', recharge: 'High', community: 'High', priority: 'High Priority' },
  { id: 'SPR-JH-031', location: 'Burfu Village, Munsyari', type: 'Seasonal', trendNum: '↓ 14%', trendDir: 'down', recharge: 'Medium', community: 'High', priority: 'High Priority' },
  { id: 'SPR-JH-018', location: 'Sarmoli, Munsyari', type: 'Perennial', trendNum: '↓ 18%', trendDir: 'down', recharge: 'High', community: 'Medium', priority: 'High Priority' },
  { id: 'SPR-JH-067', location: 'Lilam, Munsyari', type: 'Seasonal', trendNum: '↑ 12%', trendDir: 'up', recharge: 'Medium', community: 'High', priority: 'Medium Priority' },
  { id: 'SPR-JH-112', location: 'Martoli, Pithoragarh', type: 'Perennial', trendNum: '↓ 16%', trendDir: 'down', recharge: 'Medium', community: 'Medium', priority: 'Medium Priority' },
  { id: 'SPR-JH-089', location: 'Rilkot, Munsyari', type: 'Seasonal', trendNum: '↓ 19%', trendDir: 'down', recharge: 'High', community: 'High', priority: 'Medium Priority' },
  { id: 'SPR-JH-140', location: 'Dharchula', type: 'Perennial', trendNum: '↑ 8%', trendDir: 'up', recharge: 'Low', community: 'Low', priority: 'Low Priority' },
  { id: 'SPR-JH-156', location: 'Munsyari', type: 'Perennial', trendNum: '↓ 20%', trendDir: 'down', recharge: 'Medium', community: 'Medium', priority: 'Low Priority' },
];

const chartData = [
  { year: '2023', discharge: 16.5 },
  { year: '2024', discharge: 12.0 },
  { year: '2025', discharge: 9.5 },
  { year: '2026', discharge: 7.0 },
];

const PrioritySprings: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSpring, setSelectedSpring] = useState(dummyData[0]);
  const [activeFilter, setActiveFilter] = useState('All (137)');

  const getTypeStyle = (type: string) =>
    type === 'Perennial'
      ? 'bg-blue-50 text-blue-600 border border-blue-100'
      : 'bg-orange-50 text-orange-600 border border-orange-100';

  const getPriorityStyle = (priority: string) => {
    if (priority.includes('High')) return 'bg-red-50 text-red-600';
    if (priority.includes('Medium')) return 'bg-yellow-50 text-yellow-600';
    return 'bg-green-50 text-green-600';
  };

  const getLevelColor = (level: string, type: 'recharge' | 'community' = 'recharge') => {
    if (level === 'High') return type === 'recharge' ? 'text-green-600' : 'text-red-600';
    if (level === 'Medium') return 'text-orange-500';
    return 'text-green-600';
  };

  return (
    <div className="flex h-[calc(100vh-72px)] bg-[#f8fafc] w-full overflow-hidden relative">

      {/* Left Column */}
      <div className="flex-1 flex flex-col p-4 xl:p-6 overflow-hidden z-10 relative min-w-0">

        {/* Header */}
        <div className="mb-4 flex flex-wrap items-start gap-3 justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#115E41] uppercase mb-1">SPRINGS</p>
            <h1 className="text-2xl xl:text-3xl font-extrabold text-[#111827] tracking-tight mb-1">Priority Springs</h1>
            <p className="text-gray-500 text-xs xl:text-sm font-medium">Springs requiring closer assessment or intervention planning.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 flex gap-2 w-48 xl:w-56 items-start shrink-0">
              <Target size={16} className="text-[#115E41] mt-0.5 shrink-0" />
              <div>
                <p className="text-[9px] font-medium text-gray-700 leading-tight mb-1">Priority based on spring condition, trend, water dependence and intervention suitability.</p>
                <a href="#" className="text-[9px] font-bold text-[#115E41] flex items-center gap-0.5 hover:underline">Learn more <ArrowRight size={9} /></a>
              </div>
            </div>

            <div className="bg-white border border-gray-100 shadow-sm rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="bg-red-50 p-1.5 rounded-lg"><AlertTriangle size={16} className="text-red-500" /></div>
              <div>
                <p className="text-sm font-extrabold text-gray-900 leading-none">137</p>
                <p className="text-[9px] font-medium text-gray-500 mt-0.5">Priority</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 shadow-sm rounded-xl px-3 py-2 flex items-center gap-2 hidden lg:flex">
              <div className="bg-green-50 p-1.5 rounded-lg"><Users size={16} className="text-[#115E41]" /></div>
              <div>
                <p className="text-sm font-extrabold text-gray-900 leading-none">286</p>
                <p className="text-[9px] font-medium text-gray-500 mt-0.5">Villages</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 shadow-sm rounded-xl px-3 py-2 flex items-center gap-2 hidden xl:flex">
              <div className="bg-blue-50 p-1.5 rounded-lg"><Droplets size={16} className="text-blue-500" /></div>
              <div>
                <p className="text-sm font-extrabold text-gray-900 leading-none">412</p>
                <p className="text-[9px] font-medium text-gray-500 mt-0.5">Declining</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-3 shrink-0">
          <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm overflow-x-auto">
            {['All (137)', 'High (52)', 'Medium (61)', 'Field Review (24)'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 text-[10px] xl:text-xs font-bold rounded-md transition-colors whitespace-nowrap ${activeFilter === tab ? 'bg-[#115E41] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 hidden lg:flex">
            {['State', 'District', 'Block'].map(f => (
              <div key={f} className="bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-[10px] xl:text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer w-20 xl:w-24">
                {f} <ChevronDown size={12} className="text-gray-400" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-gray-500 whitespace-nowrap">
              Sort by <span className="font-bold text-gray-800 flex items-center cursor-pointer bg-white border border-gray-200 px-2 py-1 rounded">Priority (High → Low) <ChevronDown size={11} className="ml-1" /></span>
            </div>
            <div className="relative w-36 xl:w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input type="text" placeholder="Search..." className="w-full pl-7 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] xl:text-xs text-gray-700 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-2.5 min-h-0">
          {dummyData.map((spring, index) => {
            const isActive = selectedSpring.id === spring.id;
            return (
              <div
                key={spring.id}
                onClick={() => setSelectedSpring(spring)}
                className={`bg-white border rounded-xl p-3 xl:p-4 flex items-center justify-between cursor-pointer transition-all ${isActive ? 'border-[#115E41] bg-green-50/20 shadow-sm' : 'border-gray-200 hover:border-gray-300 shadow-sm'}`}
              >
                {/* Left: index + thumbnail + info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-extrabold text-gray-300 w-5 shrink-0 text-center">{String(index + 1).padStart(2, '0')}</span>
                  <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1543881473-b3c990b79df7?auto=format&fit=crop&w=100&q=80" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs xl:text-sm font-extrabold text-[#111827] truncate">{spring.id}</h3>
                    <p className="text-[9px] font-medium text-gray-500 flex items-center gap-0.5 mt-0.5 truncate"><MapPin size={9} /> {spring.location}</p>
                    <span className={`inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-[8px] font-bold ${getTypeStyle(spring.type)}`}>
                      {spring.type}
                    </span>
                  </div>
                </div>

                {/* Middle stats — hide on small screens */}
                <div className="hidden lg:flex flex-1 items-center justify-around px-3 gap-2">
                  <div className="flex flex-col items-center">
                    <span className={`text-xs font-extrabold flex items-center gap-0.5 ${spring.trendDir === 'down' ? 'text-red-500' : 'text-green-500'}`}>
                      {spring.trendDir === 'down' ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />} {spring.trendNum}
                    </span>
                    <span className="text-[8px] font-bold text-gray-400 mt-0.5 uppercase">Discharge</span>
                  </div>
                  <div className="flex flex-col items-center hidden xl:flex">
                    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${getLevelColor(spring.recharge, 'recharge')}`}>
                      <BarChart2 size={11} /> {spring.recharge}
                    </span>
                    <span className="text-[8px] font-bold text-gray-400 mt-0.5 uppercase">Recharge</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-[10px] font-bold flex items-center gap-0.5 ${getLevelColor(spring.community, 'community')}`}>
                      <Users size={11} /> {spring.community}
                    </span>
                    <span className="text-[8px] font-bold text-gray-400 mt-0.5 uppercase">Community</span>
                  </div>
                </div>

                {/* Right: priority + view */}
                <div className="flex flex-col items-end gap-1.5 border-l border-gray-100 pl-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${getPriorityStyle(spring.priority)}`}>
                    {spring.priority}
                  </span>
                  <button className="text-[10px] font-bold text-[#115E41] flex items-center gap-0.5 hover:underline">
                    View <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="pt-3 flex items-center justify-between shrink-0">
          <div className="text-[10px] font-medium text-gray-500 hidden sm:block">Showing 1-8 of 137 priority springs</div>
          <div className="flex items-center gap-1">
            <button className="w-7 h-7 flex items-center justify-center rounded bg-[#115E41] text-white text-xs font-bold shadow-sm">1</button>
            {[2, 3, 4, 5].map(n => (
              <button key={n} className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 text-xs font-medium hidden sm:flex">{n}</button>
            ))}
            <span className="w-6 h-7 flex items-center justify-center text-gray-400 text-xs hidden sm:flex">...</span>
            <button className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 text-xs font-medium hidden md:flex">18</button>
            <button className="w-7 h-7 flex items-center justify-center rounded bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"><ArrowRight size={11} /></button>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-[320px] xl:w-[390px] 2xl:w-[420px] bg-white border-l border-gray-200 shadow-[-4px_0_15px_rgba(0,0,0,0.03)] flex flex-col z-20 shrink-0 relative">

        {/* Top header */}
        <div className="p-4 pb-3 flex gap-3">
          <div className="w-20 xl:w-24 h-16 xl:h-20 bg-gray-200 rounded-lg overflow-hidden shadow-sm shrink-0">
            <img src="https://images.unsplash.com/photo-1543881473-b3c990b79df7?auto=format&fit=crop&w=300&q=80" alt="Spring" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <h2 className="text-base xl:text-lg font-extrabold text-gray-900 truncate">{selectedSpring.id}</h2>
              <div className="bg-red-50 text-red-600 border border-red-100 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                <AlertTriangle size={9} /> {selectedSpring.priority}
              </div>
            </div>
            <p className="text-[9px] font-medium text-gray-500 flex items-center gap-0.5 mb-1 truncate">
              <MapPin size={9} className="text-gray-400 shrink-0" /> {selectedSpring.location} Block
            </p>
            <p className="text-[8px] font-medium text-gray-400 mb-2">30.067° N, 80.231° E</p>
            <button className="text-[9px] font-bold text-[#115E41] bg-green-50 border border-green-100 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-green-100 transition-colors">
              <MapIcon size={11} /> Open in Map
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 border-b border-gray-100 overflow-x-auto">
          {['Overview', 'Trend', 'Recharge Area', 'Interventions', 'Field Data'].map((tab, i) => (
            <button key={tab} className={`pb-2 mr-3 text-[9px] xl:text-[10px] font-bold whitespace-nowrap border-b-2 ${i === 0 ? 'text-[#115E41] border-[#115E41]' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">

          {/* 4-col metrics */}
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {[
              { icon: <Droplets size={14} className="text-blue-500" />, label: 'Discharge', value: '8.2 L/min' },
              { icon: <ArrowDownRight size={14} className="text-red-500" />, label: '3yr Change', value: '-22%' },
              { icon: <Leaf size={14} className="text-green-600" />, label: 'Type', value: 'Perennial' },
              { icon: <Calendar size={14} className="text-gray-500" />, label: 'Last Obs.', value: '12 Sep' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex flex-col items-center text-center border-r border-gray-100 last:border-r-0 px-1">
                {icon}
                <p className="text-[7px] font-bold text-gray-400 uppercase mt-0.5">{label}</p>
                <p className="text-[9px] font-bold text-gray-900 mt-0.5 leading-tight">{value}</p>
              </div>
            ))}
          </div>

          {/* Why Flagged + Gauge */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-3">
              <h4 className="text-[10px] font-bold text-gray-900 flex items-center gap-1 mb-2">
                Why Flagged? <Info size={11} className="text-gray-400" />
              </h4>
              <ul className="text-[9px] font-medium text-gray-700 space-y-1.5">
                {[
                  { color: 'bg-green-500', text: 'Discharge trend shows 22% decline' },
                  { color: 'bg-red-500', text: 'High community dependence' },
                  { color: 'bg-red-500', text: 'High recharge suitability' },
                  { color: 'bg-red-500', text: 'Recent rainfall deficit in region' },
                ].map(({ color, text }) => (
                  <li key={text} className="flex items-start gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${color} mt-0.5 shrink-0`}></div> {text}</li>
                ))}
              </ul>
            </div>

            <div className="w-28 xl:w-32 bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col items-center shrink-0">
              <h4 className="text-[9px] font-bold text-gray-900 mb-2 text-center">Priority Assessment</h4>
              <div className="relative w-10 h-10 flex items-center justify-center mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-100" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-orange-500" strokeWidth="3.5" strokeDasharray="78, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xs font-extrabold text-gray-900 leading-none">78</span>
                  <span className="text-[6px] font-bold text-gray-400">/100</span>
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="flex items-center gap-1 justify-center"><span className="text-[8px] text-gray-500">Priority</span><span className="text-[8px] font-bold text-red-500">High</span></div>
                <span className="text-[8px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Moderate</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-gray-900">Discharge Trend (3 Years)</h3>
              <div className="flex bg-gray-100 rounded p-0.5">
                <button className="text-[9px] font-bold bg-[#115E41] text-white px-2 py-0.5 rounded shadow-sm">3Y</button>
                <button className="text-[9px] font-bold text-gray-500 px-1.5 py-0.5">5Y</button>
                <button className="text-[9px] font-bold text-gray-500 px-1.5 py-0.5">All</button>
              </div>
            </div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="psDis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#115E41" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#115E41" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} dy={4} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} domain={[0, 20]} />
                  <Area type="monotone" dataKey="discharge" stroke="#115E41" strokeWidth={2} fillOpacity={1} fill="url(#psDis)" dot={{ r: 3, fill: '#115E41', strokeWidth: 2, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100 flex gap-1.5">
          <button
            onClick={() => navigate(`/springs/twin/${selectedSpring.id}`)}
            className="flex-1 flex items-center justify-center gap-1 text-[9px] xl:text-[10px] font-bold text-white bg-[#115E41] hover:bg-[#0e4b34] rounded-lg py-2 transition-colors shadow-md"
          >
            Open Spring Twin <ArrowRight size={11} />
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 text-[9px] xl:text-[10px] font-bold text-[#115E41] bg-green-50 border border-green-100 rounded-lg py-2 hover:bg-green-100 transition-colors">
            <MapIcon size={12} /> Recharge Area
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 text-[9px] xl:text-[10px] font-bold text-gray-700 bg-white border border-gray-200 rounded-lg py-2 hover:bg-gray-50 transition-colors">
            <Plus size={12} /> Revival Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrioritySprings;
