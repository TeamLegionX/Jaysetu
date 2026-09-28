import React, { useState } from 'react';
import {
  ArrowLeft, AlertTriangle, MapPin, Info, CheckCircle,
  Droplets, Leaf, TrendingDown, Target, Square, Mountain,
  CloudRain, Wind, Shield, ChevronRight, FileText, ArrowRight,
  Maximize
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const chartData = [
  { month: 'Jan 2023', discharge: 15.6 },
  { month: 'Jul 2023', discharge: 14.2 },
  { month: 'Jan 2024', discharge: 13.0 },
  { month: 'Jul 2024', discharge: 12.5 },
  { month: 'Jan 2025', discharge: 10.4 },
  { month: 'Jul 2025', discharge: 10.0 },
  { month: 'Jan 2026', discharge: 8.8 },
  { month: 'Jul 2026', discharge: 8.2 },
];

const RechargeAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Recharge Assessment');
  const [chartPeriod, setChartPeriod] = useState('3Y');

  const tabs = ['Recharge Assessment', 'Contributing Factors', 'Data Used', 'Candidate Sites'];

  return (
    <div className="h-[calc(100vh-60px)] xl:h-[calc(100vh-72px)] flex flex-col bg-[#f8fafc] overflow-hidden">
      
      {/* ── TOP HEADER ── */}
      <div className="bg-white border-b border-gray-200 px-4 xl:px-6 pt-4 pb-0 shrink-0 relative overflow-hidden">
        {/* Mountain watermark */}
        <div className="absolute top-0 right-0 w-72 h-32 pointer-events-none z-0" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1543881473-b3c990b79df7?auto=format&fit=crop&w=800&q=80)',
          backgroundPosition: 'center', backgroundSize: 'cover',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 100%), linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
          WebkitMaskComposite: 'source-in', opacity: 0.35
        }} />
        <div className="absolute top-4 right-6 z-10 text-right hidden xl:block">
          <p className="text-xl font-serif italic text-[#115E41] leading-tight">"Understand the Source,</p>
          <p className="text-xl font-serif italic text-[#115E41] leading-tight">Plan a Stronger Tomorrow."</p>
        </div>

        {/* Header Title */}
        <div className="flex items-start justify-between relative z-10 mb-4">
          <div>
            <button onClick={() => navigate('/springs/twin/SPR-JH-024')} className="flex items-center gap-1.5 text-[10px] font-bold text-[#115E41] hover:underline mb-2">
              <ArrowLeft size={13} /> Back to Spring Twin
            </button>
            <h1 className="text-2xl xl:text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Recharge Assessment</h1>
            <p className="text-xs xl:text-sm font-medium text-gray-500">Analyse the potential recharge area and contributing factors for this spring.</p>
          </div>
          
          <div className="bg-green-50/80 border border-green-100 rounded-lg p-2.5 w-52 shrink-0 hidden lg:block mt-6">
            <p className="text-[10px] font-bold text-green-800 mb-0.5 flex items-center gap-1">
              <Leaf size={10} /> Demo Data <Info size={10} className="text-green-600" />
            </p>
            <p className="text-[9px] font-medium text-green-700/80 leading-tight">This is an illustrative dataset for prototype and demonstration purposes only.</p>
          </div>
        </div>

        {/* Spring Identity Strip */}
        <div className="flex items-center gap-0 border border-gray-200 rounded-xl overflow-hidden mb-4 bg-white shadow-sm flex-wrap xl:flex-nowrap">
          <div className="flex items-center gap-3 px-4 py-2 border-b xl:border-b-0 xl:border-r border-gray-100 min-w-[300px]">
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
              <img src="https://images.unsplash.com/photo-1543881473-b3c990b79df7?auto=format&fit=crop&w=150&q=80" alt="Spring" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-sm font-extrabold text-gray-900">SPR-JH-024</h2>
                <span className="bg-red-50 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <AlertTriangle size={9} /> High Priority
                </span>
              </div>
              <p className="text-[9px] font-medium text-gray-500 flex items-center gap-1 mb-1">
                <MapPin size={9} /> Naiti Village, Munsyari Block, Pithoragarh
              </p>
              <div className="flex items-center gap-2 text-[9px] font-medium text-gray-400">
                <span className="bg-green-50 text-green-600 border border-green-100 px-1.5 py-0.5 rounded font-bold">Perennial</span>
                <span>Last observed: 12 Sep 2026</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 flex-1 border-r border-gray-100 min-w-[150px]">
            <div className="bg-blue-50 p-1.5 rounded-lg text-blue-500 shrink-0"><Droplets size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Current Discharge</p>
              <p className="text-xs font-extrabold text-gray-900">8.2 L/min</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 flex-1 border-r border-gray-100 min-w-[150px]">
            <div className="bg-red-50 p-1.5 rounded-lg text-red-500 shrink-0"><TrendingDown size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">3 Year Trend</p>
              <div className="flex items-center gap-1">
                <p className="text-xs font-extrabold text-red-600">Declining</p>
                <span className="text-[9px] font-bold text-red-400">(-22%)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 flex-1 min-w-[150px]">
            <div className="bg-yellow-50 p-1.5 rounded-lg text-yellow-600 shrink-0"><Shield size={14} /></div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Confidence</p>
              <p className="text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">Moderate</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 px-1 mr-6 text-[11px] xl:text-xs font-bold border-b-2 whitespace-nowrap transition-colors shrink-0 ${activeTab === tab ? 'border-[#115E41] text-[#115E41]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-y-auto p-4 xl:p-6 pb-24">
        
        {/* Top Row Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          
          {/* Recharge Potential */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 xl:p-5 shadow-sm flex flex-col justify-between">
            <h3 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5 mb-3">
              Recharge Potential <Info size={12} className="text-gray-400" />
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-3">
                <Leaf size={20} className="text-[#115E41]" />
                <div>
                  <p className="text-lg font-extrabold text-[#115E41] leading-none">High</p>
                  <p className="text-[9px] font-medium text-green-700 mt-1">Recharge suitability</p>
                </div>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 flex flex-col justify-center gap-1 items-center w-24 shrink-0">
                <Target size={16} className="text-orange-500" />
                <p className="text-[8px] font-bold text-orange-400 uppercase">Confidence</p>
                <p className="text-[10px] font-bold bg-white text-orange-700 px-1.5 py-0.5 rounded shadow-sm">Moderate</p>
              </div>
            </div>
          </div>

          {/* Area Estimate */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 xl:p-5 shadow-sm flex flex-col justify-between">
            <h3 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5 mb-3">
              Area Estimate <Info size={12} className="text-gray-400" />
            </h3>
            <div className="flex-1 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-green-600 shrink-0">
                <Maximize size={20} className="text-[#115E41]" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-gray-900 leading-none">12.4 km²</p>
                <p className="text-[10px] font-medium text-gray-500 mt-1.5">Probable recharge area</p>
              </div>
            </div>
          </div>

          {/* Why this area? */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 xl:p-5 shadow-sm flex flex-col">
            <h3 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5 mb-2">
              Why this area? <Info size={12} className="text-gray-400" />
            </h3>
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium mt-auto">
              The upper catchment shows favourable terrain and drainage characteristics, with supporting geological and rainfall signals, making it a suitable probable recharge zone for this spring.
            </p>
          </div>
        </div>

        {/* Middle Row Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          
          {/* Contributing Factors */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 xl:p-5 shadow-sm">
            <h3 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5 mb-4">
              Contributing Factors <Info size={12} className="text-gray-400" />
            </h3>
            <div className="space-y-4">
              {/* Factor 1 */}
              <div className="flex items-center gap-3">
                <div className="w-32 flex items-center gap-2 text-[10px] font-bold text-gray-700 shrink-0">
                  <Mountain size={14} className="text-gray-500" /> Terrain (DEM)
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#115E41] w-[80%] rounded-full"></div>
                </div>
                <div className="w-28 text-right shrink-0">
                  <span className="text-[9px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded">Strong Contribution</span>
                </div>
              </div>
              {/* Factor 2 */}
              <div className="flex items-center gap-3">
                <div className="w-32 flex items-center gap-2 text-[10px] font-bold text-gray-700 shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M12 2l-9 5v10l9 5 9-5V7l-9-5z"/><path d="M12 22V12"/><path d="M12 12l9-5"/><path d="M12 12L3 7"/></svg>
                  Geology & Lithology
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#115E41] w-[80%] rounded-full"></div>
                </div>
                <div className="w-28 text-right shrink-0">
                  <span className="text-[9px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded">Strong Contribution</span>
                </div>
              </div>
              {/* Factor 3 */}
              <div className="flex items-center gap-3">
                <div className="w-32 flex items-center gap-2 text-[10px] font-bold text-gray-700 shrink-0">
                  <CloudRain size={14} className="text-gray-500" /> Rainfall
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#3b82f6] w-[50%] rounded-full"></div>
                </div>
                <div className="w-28 text-right shrink-0">
                  <span className="text-[9px] font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded">Moderate Contribution</span>
                </div>
              </div>
              {/* Factor 4 */}
              <div className="flex items-center gap-3">
                <div className="w-32 flex items-center gap-2 text-[10px] font-bold text-gray-700 shrink-0">
                  <Leaf size={14} className="text-gray-500" /> Land Use / Cover
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#3b82f6] w-[50%] rounded-full"></div>
                </div>
                <div className="w-28 text-right shrink-0">
                  <span className="text-[9px] font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded">Moderate Contribution</span>
                </div>
              </div>
              {/* Factor 5 */}
              <div className="flex items-center gap-3">
                <div className="w-32 flex items-center gap-2 text-[10px] font-bold text-gray-700 shrink-0">
                  <Wind size={14} className="text-gray-500" /> Drainage Network
                </div>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#115E41] w-[80%] rounded-full"></div>
                </div>
                <div className="w-28 text-right shrink-0">
                  <span className="text-[9px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded">Strong Contribution</span>
                </div>
              </div>
            </div>
          </div>

          {/* Discharge Trend (Last 3 Years) */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 xl:p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5">
                Discharge Trend (Last 3 Years) <Info size={12} className="text-gray-400" />
              </h3>
              <div className="flex bg-gray-100 rounded p-0.5">
                <button className="text-[9px] font-bold bg-[#115E41] text-white px-2 py-0.5 rounded shadow-sm">3Y</button>
                <button className="text-[9px] font-bold text-gray-500 px-2 py-0.5 hover:text-gray-700">5Y</button>
                <button className="text-[9px] font-bold text-gray-500 px-2 py-0.5 hover:text-gray-700">All</button>
              </div>
            </div>

            <div className="flex-1 h-40 w-full mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="colorDischarge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#115E41" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#115E41" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} dy={4} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} domain={[0, 20]} />
                  <Area 
                    type="monotone" 
                    dataKey="discharge" 
                    stroke="#115E41" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorDischarge)" 
                    dot={{ r: 3.5, fill: '#115E41', strokeWidth: 2, stroke: '#fff' }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex -mt-[140px] -ml-[5px] rotate-[-90deg] origin-bottom-left w-[120px] justify-center text-[8px] text-gray-400 font-bold whitespace-nowrap">
                Discharge (L/min)
              </div>
            </div>

            {/* Mini milestone stats */}
            <div className="flex items-center gap-4 mt-auto pt-3 border-t border-gray-50">
              <div className="bg-gray-50 rounded-lg p-2 flex-1 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-gray-900">15.6 L/min</p>
                  <p className="text-[9px] font-medium text-gray-400">Jan 2023</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 flex-1 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-gray-900">10.4 L/min</p>
                  <p className="text-[9px] font-medium text-gray-400">Jan 2025</p>
                </div>
                <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">↓ -22%</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 flex-1 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-gray-900">8.2 L/min</p>
                  <p className="text-[9px] font-medium text-gray-400">Sep 2026</p>
                </div>
                <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5">↓ -47%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Assessment Basis */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-4 xl:p-5 shadow-sm">
            <h3 className="text-[11px] font-bold text-gray-900 flex items-center gap-1.5 mb-4">
              Assessment Basis <Info size={12} className="text-gray-400" />
            </h3>
            <div className="flex items-center justify-between flex-wrap gap-4">
              {[
                { icon: <Mountain size={18} className="text-gray-400 mb-1" />, label: 'Terrain', sub: '(DEM)' },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-1"><path d="M12 2l-9 5v10l9 5 9-5V7l-9-5z"/><path d="M12 22V12"/><path d="M12 12l9-5"/><path d="M12 12L3 7"/></svg>, label: 'Geology', sub: '(Lithology)' },
                { icon: <CloudRain size={18} className="text-gray-400 mb-1" />, label: 'Rainfall', sub: '(IMD)' },
                { icon: <Leaf size={18} className="text-gray-400 mb-1" />, label: 'Land Use', sub: '(LULC)' },
                { icon: <Wind size={18} className="text-gray-400 mb-1" />, label: 'Drainage', sub: '(Network)' },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center relative min-w-[70px]">
                  <div className="absolute -top-1 -right-1 bg-white rounded-full"><CheckCircle size={12} className="text-green-500" /></div>
                  {icon}
                  <span className="text-[9px] font-bold text-gray-700 leading-none text-center mt-1">{label}</span>
                  <span className="text-[8px] text-gray-400 leading-none text-center mt-0.5">{sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Important Note */}
          <div className="lg:w-[400px] bg-[#f0f9f6] border border-[#d1fae5] rounded-xl p-4 xl:p-5 flex items-start gap-3 shadow-sm shrink-0">
            <Info size={20} className="text-[#115E41] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-bold text-gray-900 mb-1">Important Note</h4>
              <p className="text-[10px] text-gray-700 leading-relaxed font-medium">
                This is a probable recharge suitability assessment based on available spatial data and spring observations. It is not a direct groundwater detection map. Field verification is recommended.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 xl:px-6 py-3 flex items-center justify-end gap-3 z-50">
        <button className="flex items-center gap-1.5 text-xs font-bold text-[#115E41] bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
          <FileText size={14} /> View Full Report
        </button>
        <button className="flex items-center gap-1.5 text-xs font-bold text-[#115E41] bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
          <MapPin size={14} /> View Candidate Sites
        </button>
        <button className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#115E41] hover:bg-[#0e4b34] px-5 py-2 rounded-lg transition-colors shadow-sm">
          Proceed to Interventions <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
};

export default RechargeAssessment;
