import React, { useState } from 'react';
import {
  ArrowLeft, AlertTriangle, MapPin, Info, CheckCircle,
  Droplets, Leaf, TrendingDown, Calendar, Shield,
  BarChart2, Users, Mountain, Layers, Map as MapIcon,
  ChevronRight, ArrowRight, ExternalLink, Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ─── DATA ──────────────────────────────────────────────────────────────────

const chartData = [
  { month: 'Jan 2023', discharge: 15.6, rainfall: 12 },
  { month: 'Feb 23',   discharge: 15.3, rainfall: 8 },
  { month: 'Mar 23',   discharge: 15.1, rainfall: 15 },
  { month: 'Apr 23',   discharge: 14.9, rainfall: 22 },
  { month: 'May 23',   discharge: 14.7, rainfall: 45 },
  { month: 'Jun 23',   discharge: 14.5, rainfall: 180 },
  { month: 'Jul 2023', discharge: 14.2, rainfall: 320 },
  { month: 'Aug 23',   discharge: 14.0, rainfall: 290 },
  { month: 'Sep 23',   discharge: 13.8, rainfall: 210 },
  { month: 'Oct 23',   discharge: 13.6, rainfall: 65 },
  { month: 'Nov 23',   discharge: 13.3, rainfall: 18 },
  { month: 'Dec 23',   discharge: 13.1, rainfall: 9 },
  { month: 'Jan 2024', discharge: 13.0, rainfall: 10 },
  { month: 'Feb 24',   discharge: 12.8, rainfall: 7 },
  { month: 'Mar 24',   discharge: 12.6, rainfall: 14 },
  { month: 'Apr 24',   discharge: 12.5, rainfall: 30 },
  { month: 'May 24',   discharge: 12.3, rainfall: 55 },
  { month: 'Jun 24',   discharge: 12.0, rainfall: 160 },
  { month: 'Jul 2024', discharge: 11.8, rainfall: 300 },
  { month: 'Aug 24',   discharge: 11.6, rainfall: 270 },
  { month: 'Sep 24',   discharge: 11.3, rainfall: 190 },
  { month: 'Oct 24',   discharge: 11.0, rainfall: 50 },
  { month: 'Nov 24',   discharge: 10.7, rainfall: 14 },
  { month: 'Dec 24',   discharge: 10.5, rainfall: 8 },
  { month: 'Jan 2025', discharge: 10.4, rainfall: 9 },
  { month: 'Feb 25',   discharge: 10.2, rainfall: 6 },
  { month: 'Mar 25',   discharge: 10.0, rainfall: 12 },
  { month: 'Apr 25',   discharge: 9.8,  rainfall: 28 },
  { month: 'May 25',   discharge: 9.6,  rainfall: 50 },
  { month: 'Jun 25',   discharge: 9.4,  rainfall: 140 },
  { month: 'Jul 2025', discharge: 9.2,  rainfall: 255 },
  { month: 'Aug 25',   discharge: 9.0,  rainfall: 235 },
  { month: 'Sep 25',   discharge: 8.9,  rainfall: 160 },
  { month: 'Oct 25',   discharge: 8.7,  rainfall: 40 },
  { month: 'Nov 25',   discharge: 8.6,  rainfall: 11 },
  { month: 'Dec 25',   discharge: 8.4,  rainfall: 7 },
  { month: 'Jan 2026', discharge: 8.4,  rainfall: 8 },
  { month: 'Feb 26',   discharge: 8.3,  rainfall: 5 },
  { month: 'Mar 26',   discharge: 8.3,  rainfall: 10 },
  { month: 'Apr 26',   discharge: 8.2,  rainfall: 20 },
  { month: 'May 26',   discharge: 8.2,  rainfall: 38 },
  { month: 'Jun 26',   discharge: 8.2,  rainfall: 120 },
  { month: 'Jul 2026', discharge: 8.2,  rainfall: 200 },
];

const HeatmapBlob = ({ center, radius, color, opacity = 0.4 }: { center: [number, number]; radius: number; color: string; opacity?: number }) => (
  <Circle center={center} radius={radius} pathOptions={{ stroke: false, fillColor: color, fillOpacity: opacity }} interactive={false} />
);

// ─── CUSTOM TOOLTIP ────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xl text-xs">
        <p className="font-bold text-gray-900 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value} {p.dataKey === 'discharge' ? 'L/min' : 'mm'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── FACTOR ROW ────────────────────────────────────────────────────────────

const FactorRow = ({
  icon, label, level, desc, levelColor
}: { icon: React.ReactNode; label: string; level: string; desc: string; levelColor: string }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-b-0">
    <div className="shrink-0 mt-0.5">{icon}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="text-xs font-bold text-gray-900">{label}</span>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ${levelColor}`}>{level}</span>
      </div>
      <p className="text-[10px] text-gray-500 font-medium leading-snug">{desc}</p>
    </div>
  </div>
);

// ─── INTERVENTION ROW ──────────────────────────────────────────────────────

const InterventionRow = ({
  name, suitability, risk, cost
}: { name: string; suitability: string; risk: string; cost: string }) => {
  const sColor = suitability === 'High' ? 'text-green-600' : suitability === 'Medium' ? 'text-orange-500' : 'text-red-500';
  const rColor = risk === 'Low' ? 'text-green-600' : risk === 'Medium' ? 'text-orange-500' : 'text-red-500';
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="py-2 px-3 text-xs font-semibold text-gray-800">{name}</td>
      <td className={`py-2 px-3 text-xs font-bold ${sColor}`}>{suitability}</td>
      <td className={`py-2 px-3 text-xs font-bold ${rColor}`}>{risk}</td>
      <td className="py-2 px-3 text-xs font-semibold text-gray-700">{cost}</td>
      <td className="py-2 px-3">
        <button className="text-[10px] font-bold text-[#115E41] border border-[#115E41]/30 bg-green-50 px-2 py-0.5 rounded hover:bg-green-100 transition-colors whitespace-nowrap">
          View Details
        </button>
      </td>
    </tr>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────

const SpringTwin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [chartPeriod, setChartPeriod] = useState('3Y');

  const tabs = ['Overview', 'Trend', 'Recharge Area', 'Interventions', 'Field Data'];

  return (
    <div className="h-[calc(100vh-60px)] xl:h-[calc(100vh-72px)] flex flex-col bg-[#f8fafc] overflow-hidden">

      {/* ── TOP HEADER ── */}
      <div className="bg-white border-b border-gray-200 px-4 xl:px-6 pt-3 pb-0 shrink-0 relative overflow-hidden">
        {/* Mountain watermark */}
        <div className="absolute top-0 right-0 w-72 h-28 pointer-events-none z-0" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1543881473-b3c990b79df7?auto=format&fit=crop&w=800&q=80)',
          backgroundPosition: 'center', backgroundSize: 'cover',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 100%), linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
          WebkitMaskComposite: 'source-in', opacity: 0.35
        }} />
        <div className="absolute top-4 right-6 z-10 text-right hidden xl:block">
          <p className="text-xl font-serif italic text-[#115E41] leading-tight">"Healthy Springs</p>
          <p className="text-xl font-serif italic text-[#115E41] leading-tight">Resilient Communities"</p>
          <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase mt-1">DATA &nbsp; INSIGHTS &nbsp; ACTION</p>
        </div>

        {/* Back link */}
        <button onClick={() => navigate('/springs/priority')} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-gray-700 transition-colors mb-2">
          <ArrowLeft size={13} /> Back to Priority Springs
        </button>

        {/* Spring identity row */}
        <div className="flex items-start gap-4 mb-3 relative z-10">
          <div className="w-16 xl:w-20 h-14 xl:h-16 rounded-lg overflow-hidden shadow-md shrink-0">
            <img src="https://images.unsplash.com/photo-1543881473-b3c990b79df7?auto=format&fit=crop&w=200&q=80" alt="Spring" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h1 className="text-2xl xl:text-3xl font-extrabold text-gray-900 tracking-tight">SPR-JH-024</h1>
              <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <AlertTriangle size={10} /> High Priority
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-0.5">
              <MapPin size={11} className="text-gray-400 shrink-0" /> Naiti Village · Munsyari Block · Pithoragarh · Uttarakhand
            </p>
            <p className="text-[10px] font-medium text-gray-400">A vital perennial spring supporting the local community</p>
          </div>

          {/* Demo data badge */}
          <div className="ml-auto bg-green-50 border border-green-100 rounded-lg p-2.5 w-52 shrink-0 hidden lg:block">
            <p className="text-[10px] font-bold text-green-800 mb-0.5">Demo Data</p>
            <p className="text-[9px] font-medium text-green-700/80 leading-tight">This is an illustrative dataset for prototype and demonstration purposes only.</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-stretch gap-0 border border-gray-200 rounded-xl overflow-hidden mb-3 bg-white shadow-sm">
          {/* Stat 1 */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 flex-1 border-r border-gray-100">
            <div className="bg-green-100 p-1.5 rounded-lg shrink-0"><Leaf size={16} className="text-green-600" /></div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Spring Type</p>
              <p className="text-sm font-extrabold text-gray-900">Perennial</p>
            </div>
          </div>
          {/* Stat 2 */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 flex-1 border-r border-gray-100">
            <div className="bg-blue-100 p-1.5 rounded-lg shrink-0"><Droplets size={16} className="text-blue-500" /></div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Current Discharge</p>
              <p className="text-sm font-extrabold text-gray-900">8.2 L/min</p>
            </div>
          </div>
          {/* Stat 3 */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 flex-1 border-r border-gray-100">
            <div className="bg-red-100 p-1.5 rounded-lg shrink-0"><TrendingDown size={16} className="text-red-500" /></div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">3 Year Trend</p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-extrabold text-red-600">Declining</p>
                <span className="text-[10px] font-bold text-red-400">(-22%)</span>
              </div>
            </div>
          </div>
          {/* Stat 4 */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 flex-1 border-r border-gray-100">
            <div className="bg-gray-100 p-1.5 rounded-lg shrink-0"><Calendar size={16} className="text-gray-500" /></div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Last Observation</p>
              <p className="text-sm font-extrabold text-gray-900">12 Sep 2026</p>
            </div>
          </div>
          {/* Stat 5 */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 flex-1">
            <div className="bg-yellow-50 p-1.5 rounded-lg shrink-0"><Shield size={16} className="text-yellow-600" /></div>
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase">Confidence</p>
              <p className="text-sm font-extrabold text-yellow-600">Moderate</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 px-1 mr-6 text-xs xl:text-sm font-bold border-b-2 whitespace-nowrap transition-colors shrink-0 ${activeTab === tab ? 'border-[#115E41] text-[#115E41]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-y-auto p-4 xl:p-6">
        <div className="flex gap-4 xl:gap-6 h-full min-h-0">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">

            {/* Discharge Trend Chart */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 xl:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-900">Discharge Trend</h3>
                  <Info size={13} className="text-gray-400" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 rounded p-0.5">
                    {['1Y', '3Y', '5Y', 'All'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setChartPeriod(p)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${chartPeriod === p ? 'bg-[#115E41] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500">
                  <div className="w-3 h-0.5 bg-[#115E41] rounded"></div> Discharge (L/min)
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500">
                  <div className="w-3 h-2 bg-blue-200 rounded-sm opacity-70"></div> Rainfall (mm)
                </div>
              </div>

              <div className="h-44 xl:h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 40, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} 
                      dy={4}
                      interval={5}
                      tickFormatter={(val) => {
                        const labels = ['Jan 2023','Jul 2023','Jan 2024','Jul 2024','Jan 2025','Jul 2025','Jan 2026','Jul 2026'];
                        return labels.includes(val) ? val : '';
                      }}
                    />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} domain={[0, 20]} label={{ value: 'Discharge (L/min)', angle: -90, position: 'insideLeft', offset: 15, style: { fontSize: 8, fill: '#9CA3AF', fontWeight: 600 } }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 600 }} domain={[0, 400]} label={{ value: 'Rainfall (mm)', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 8, fill: '#9CA3AF', fontWeight: 600 } }} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar yAxisId="right" dataKey="rainfall" fill="#BFDBFE" opacity={0.6} radius={[2, 2, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="discharge" stroke="#115E41" strokeWidth={2.5} dot={{ r: 3.5, fill: '#115E41', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Mini milestone stats */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                <div>
                  <p className="text-sm font-extrabold text-gray-900">15.6 L/min</p>
                  <p className="text-[9px] font-medium text-gray-400">Jan 2023</p>
                </div>
                <div className="text-gray-300">→</div>
                <div>
                  <p className="text-sm font-extrabold text-gray-900">10.4 L/min</p>
                  <p className="text-[9px] font-medium text-gray-400">Jan 2025</p>
                </div>
                <div className="text-gray-300">→</div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-extrabold text-gray-900">8.2 L/min</p>
                    <span className="text-[9px] font-bold text-red-500 flex items-center gap-0.5">↓ -47%</span>
                  </div>
                  <p className="text-[9px] font-medium text-gray-400">Sep 2026</p>
                </div>
              </div>
            </div>

            {/* Recharge Assessment + Basis */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 xl:p-5">
              <div className="flex items-center gap-1.5 mb-3">
                <h3 className="text-sm font-bold text-gray-900">Probable Recharge Assessment</h3>
                <Info size={13} className="text-gray-400" />
              </div>

              <div className="flex gap-4">
                {/* Map */}
                <div className="w-36 xl:w-44 h-36 xl:h-40 rounded-lg overflow-hidden border border-gray-200 shrink-0 relative z-0">
                  <MapContainer center={[30.1069, 80.2066]} zoom={12} zoomControl={false} className="w-full h-full" attributionControl={false}>
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                    <HeatmapBlob center={[30.1069, 80.2066]} radius={2500} color="#10b981" opacity={0.35} />
                    <HeatmapBlob center={[30.1169, 80.2166]} radius={1200} color="#eab308" opacity={0.45} />
                    <HeatmapBlob center={[30.0969, 80.1966]} radius={800} color="#f97316" opacity={0.45} />
                    <CircleMarker center={[30.1069, 80.2066]} radius={5} pathOptions={{ color: 'white', weight: 2, fillColor: '#ef4444', fillOpacity: 1 }} />
                  </MapContainer>
                  {/* Scale */}
                  <div className="absolute bottom-2 left-2 z-[999] bg-black/40 backdrop-blur-sm rounded text-[8px] text-white font-bold px-1.5 py-0.5">0 1 2 · 5 km</div>
                </div>

                {/* Legend + Basis */}
                <div className="flex-1 flex gap-4 min-w-0">
                  {/* Legend */}
                  <div className="shrink-0">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Recharge Potential</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-700"><div className="w-3 h-3 rounded-sm bg-[#10b981]"></div> High</div>
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-700"><div className="w-3 h-3 rounded-sm bg-[#eab308]"></div> Moderate</div>
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-700"><div className="w-3 h-3 rounded-sm bg-[#f97316]"></div> Low</div>
                    </div>
                  </div>

                  {/* Basis for Assessment */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-2">Basis for Assessment</p>
                    <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                      {[
                        { label: 'Terrain', sub: '(DEM)', ok: true },
                        { label: 'Geology', sub: '(Lithology)', ok: true },
                        { label: 'Rainfall', sub: '(IMD)', ok: true },
                        { label: 'Land Use', sub: '(LULC)', ok: true },
                        { label: 'Drainage', sub: '(Network)', ok: true },
                      ].map(({ label, sub, ok }) => (
                        <div key={label} className="flex flex-col items-center gap-0.5">
                          <CheckCircle size={14} className={ok ? 'text-[#115E41]' : 'text-gray-300'} />
                          <span className="text-[9px] font-bold text-gray-700 leading-none text-center">{label}</span>
                          <span className="text-[8px] text-gray-400 leading-none text-center">{sub}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="w-[320px] xl:w-[360px] 2xl:w-[400px] flex flex-col gap-4 shrink-0">

            {/* Possible Contributing Factors */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 xl:p-5">
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm font-bold text-gray-900">Possible Contributing Factors</h3>
                <Info size={13} className="text-gray-400" />
              </div>
              <div className="divide-y divide-gray-50">
                <FactorRow
                  icon={<BarChart2 size={14} className="text-red-500" />}
                  label="Discharge Trend"
                  level="High Concern"
                  levelColor="bg-red-50 text-red-600"
                  desc="Significant decline in discharge over 3 years"
                />
                <FactorRow
                  icon={<Layers size={14} className="text-blue-400" />}
                  label="Rainfall Signal"
                  level="Moderate"
                  levelColor="bg-orange-50 text-orange-600"
                  desc="Recent rainfall lower than long-term average"
                />
                <FactorRow
                  icon={<Mountain size={14} className="text-orange-500" />}
                  label="Recharge-area Stress"
                  level="High"
                  levelColor="bg-red-50 text-red-600"
                  desc="High slope runoff and land-use pressure"
                />
                <FactorRow
                  icon={<Users size={14} className="text-green-600" />}
                  label="Land-use Pressure"
                  level="Moderate"
                  levelColor="bg-orange-50 text-orange-600"
                  desc="Agriculture and settlement expansion nearby"
                />
              </div>
              {/* Field verification note */}
              <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-blue-800 mb-0.5">Field verification recommended</p>
                  <p className="text-[9px] font-medium text-blue-700/80 leading-snug">Validate spring condition and surrounding factors through on-ground survey.</p>
                </div>
              </div>
            </div>

            {/* Spring Photo */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-900">Spring Photo</h3>
                </div>
                <button className="text-[10px] font-bold text-[#115E41] hover:underline flex items-center gap-0.5">View All <ChevronRight size={11} /></button>
              </div>
              <div className="h-28 xl:h-32 rounded-lg overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80" alt="Spring" className="w-full h-full object-cover" />
              </div>
              <p className="text-[9px] font-medium text-gray-400 mt-1.5 flex items-center gap-1">
                <Camera size={10} /> Spring outlet (12 Sep 2026)
              </p>
            </div>

            {/* Location & Catchment */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-gray-900">Location & Catchment</h3>
                  <Info size={13} className="text-gray-400" />
                </div>
                <button className="text-[9px] font-bold text-[#115E41] bg-green-50 border border-green-100 px-2 py-0.5 rounded flex items-center gap-0.5 hover:bg-green-100">
                  <ExternalLink size={10} /> Open in Map
                </button>
              </div>
              <div className="h-28 xl:h-32 rounded-lg overflow-hidden border border-gray-100 relative z-0">
                <MapContainer center={[30.1069, 80.2066]} zoom={11} zoomControl={false} className="w-full h-full" attributionControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <HeatmapBlob center={[30.1069, 80.2066]} radius={5000} color="#10b981" opacity={0.2} />
                  <CircleMarker center={[30.1069, 80.2066]} radius={5} pathOptions={{ color: 'white', weight: 2, fillColor: '#ef4444', fillOpacity: 1 }} />
                </MapContainer>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-3 mt-2 text-[9px] font-semibold text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Spring Location</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-200 inline-block"></span> Catchment Area</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-300 inline-block"></span> Drainage</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── INTERVENTION CANDIDATES (full width bottom) ── */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mt-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 xl:px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-gray-900">Intervention Candidates</h3>
              <Info size={13} className="text-gray-400" />
            </div>
            <button className="text-[10px] font-bold text-[#115E41] hover:underline flex items-center gap-0.5">View on Map <MapIcon size={11} /></button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-4 text-[10px] font-bold text-gray-500 uppercase">Intervention Type</th>
                <th className="py-2 px-4 text-[10px] font-bold text-gray-500 uppercase">Suitability</th>
                <th className="py-2 px-4 text-[10px] font-bold text-gray-500 uppercase">Risk</th>
                <th className="py-2 px-4 text-[10px] font-bold text-gray-500 uppercase">Estimated Cost</th>
                <th className="py-2 px-4 text-[10px] font-bold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              <InterventionRow name="Contour Trench" suitability="High" risk="Low" cost="₹ 8,00,000" />
              <InterventionRow name="Percolation Pond" suitability="Medium" risk="Medium" cost="₹ 13,00,000" />
              <InterventionRow name="Check Dam" suitability="Low" risk="High" cost="₹ 17,00,000" />
            </tbody>
          </table>
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div className="bg-white border-t border-gray-100 px-4 xl:px-6 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('/springs/priority')} className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5 hover:text-gray-800 transition-colors">
          <ArrowLeft size={14} /> Back to Priority Springs
        </button>
        <div className="ml-auto flex gap-2.5">
          <button className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#115E41] hover:bg-[#0e4b34] px-4 py-2 rounded-lg transition-colors shadow-sm">
            <Layers size={14} /> Explore Recharge Area
          </button>
          <button className="flex items-center gap-1.5 text-xs font-bold text-[#115E41] bg-green-50 border border-green-100 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors">
            <CheckCircle size={14} /> Add to Revival Plan
          </button>
          <button className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
            <MapIcon size={14} /> View in Map
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpringTwin;
