import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square,
  Maximize,
  LocateFixed,
  Plus,
  Minus,
  Map as MapIcon,
  X,
  Droplets,
  TrendingDown,
  Calendar,
  Info,
  ArrowRight,
  AlertTriangle,
  ClipboardCheck,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Circle, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon issues if needed
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const HeatmapBlob = ({ center, radius, color, opacity = 0.4 }: { center: [number, number], radius: number, color: string, opacity?: number }) => (
  <Circle 
    center={center} 
    radius={radius} 
    pathOptions={{ stroke: false, fillColor: color, fillOpacity: opacity }} 
    interactive={false}
  />
);

const CheckboxItem = ({ label, checked }: { label: string, checked?: boolean }) => (
  <div className="flex items-center gap-3 py-1 cursor-pointer hover:opacity-80 transition-opacity">
    {checked ? <CheckSquare size={16} className="text-[#10b981]" /> : <Square size={16} className="text-gray-400" />}
    <span className="text-xs font-medium text-gray-200">{label}</span>
  </div>
);

const LegendItem = ({ label, icon }: { label: string, icon: React.ReactNode }) => (
  <div className="flex items-center gap-3 py-1">
    <div className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</div>
    <span className="text-xs font-medium text-gray-300">{label}</span>
  </div>
);

const MapExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full flex flex-col h-[calc(100vh-72px)] overflow-hidden">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[10px] font-bold tracking-[0.1em] text-gray-500 uppercase">
              MAP EXPLORER
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-[#111827] tracking-tight mb-1">
            Explore. Analyse. <span className="text-[#115E41]">Plan.</span>
          </h1>
          <p className="text-gray-500 font-medium text-sm">
            Visualise springs, recharge potential and environmental layers to support data-driven decisions.
          </p>
        </div>
        
        <div className="hidden md:flex flex-col items-end text-right">
          <p className="text-2xl font-serif italic text-gray-400 mb-1">From Mountains to Brighter Tomorrows.</p>
          <div className="w-8 h-[1px] bg-gray-300 mb-2"></div>
          <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            PEOPLE &nbsp; NATURE &nbsp; DATA &nbsp; ACTION
          </p>
        </div>
      </div>

      {/* Main Content Area (Map + Side Panel) */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden mb-6">
        
        {/* Map Container */}
        <div className="flex-1 bg-gray-900 rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          
          {/* Left Panel: Map Layers & Legend */}
          <div className="absolute top-4 left-4 z-[1000] bottom-4 w-64 bg-[#111827]/90 backdrop-blur-md rounded-xl border border-white/10 flex flex-col overflow-hidden text-white shadow-2xl">
            {/* Layers */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm">Map Layers</h3>
                <button className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 font-medium transition-colors">
                  <span className="text-lg leading-none mt-[-2px]">↺</span> Reset
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <CheckboxItem label="Springs" checked />
                <CheckboxItem label="Priority Springs" checked />
                <CheckboxItem label="Recharge Potential" checked />
                <CheckboxItem label="Drainage Network" checked />
                <CheckboxItem label="Terrain (DEM)" />
                <CheckboxItem label="Geology & Lithology" />
                <CheckboxItem label="Land Use / Land Cover" />
                <CheckboxItem label="Administrative Boundary" />
                <CheckboxItem label="Risk Layer" />
              </div>
            </div>

            {/* Legend */}
            <div className="p-4 flex-1 overflow-y-auto">
              <h3 className="font-bold text-sm mb-3">Legend</h3>
              <div className="flex flex-col gap-1.5 mb-4">
                <LegendItem label="Spring" icon={<div className="w-3 h-3 rounded-full border-2 border-white bg-blue-500"></div>} />
                <LegendItem label="Priority Spring" icon={<div className="w-3 h-3 rounded-full border-2 border-white bg-red-500"></div>} />
              </div>
              
              <div className="mb-4">
                <LegendItem label="Recharge Potential" icon={<div className="w-3 h-3 rounded-[2px] bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400"></div>} />
                <div className="pl-7 mt-1 text-[10px] text-gray-400 font-medium flex flex-col gap-0.5">
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-[#10b981]"></div> High</span>
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-[#eab308]"></div> Moderate</span>
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-sm bg-[#ef4444]"></div> Low</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <LegendItem label="River / Drainage" icon={<div className="w-3 h-1 bg-blue-400"></div>} />
                <LegendItem label="Block Boundary" icon={<div className="w-3 h-0 border-t border-dashed border-gray-400"></div>} />
                <LegendItem label="Village Boundary" icon={<div className="w-3 h-0 border-t border-gray-500"></div>} />
              </div>
            </div>
            
            {/* Minimap Box (bottom left inside panel) */}
            <div className="h-24 m-4 bg-gray-800 rounded-lg border border-white/20 relative overflow-hidden flex items-center justify-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Uttarakhand_locator_map.svg/500px-Uttarakhand_locator_map.svg.png" className="w-full h-full object-contain opacity-50 grayscale" alt="Minimap" />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white tracking-widest drop-shadow-md">
                Uttarakhand
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex text-xs font-bold text-gray-700">
            <button className="px-3 py-1.5 bg-[#115E41] text-white">Map</button>
            <button className="px-3 py-1.5 hover:bg-gray-50 border-l border-gray-200">Satellite</button>
            <button className="px-3 py-1.5 hover:bg-gray-50 border-l border-gray-200">Terrain</button>
          </div>

          <div className="absolute top-16 right-4 z-[1000] flex flex-col gap-2">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
              <button className="p-1.5 text-gray-700 hover:bg-gray-50 border-b border-gray-200"><Plus size={16} /></button>
              <button className="p-1.5 text-gray-700 hover:bg-gray-50"><Minus size={16} /></button>
            </div>
            <button className="p-1.5 bg-white rounded-lg shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50">
              <LocateFixed size={16} />
            </button>
            <button className="p-1.5 bg-white rounded-lg shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 mt-2">
              <Maximize size={16} />
            </button>
          </div>

          {/* Dummy Center Label */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] flex flex-col items-center">
             <div className="bg-[#111827] text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg mb-1 flex items-center gap-2">
                SPR-JH-024
             </div>
             <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                <div className="w-3.5 h-3.5 bg-red-500 rounded-full border border-white"></div>
             </div>
          </div>

          {/* Leaflet Map */}
          <MapContainer 
            center={[30.0869, 80.2366]} 
            zoom={11} 
            zoomControl={false}
            className="w-full h-full z-0"
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri'
            />
            {/* Fake Heatmap Overlay - Green/Blue base */}
            <HeatmapBlob center={[30.0869, 80.2366]} radius={6000} color="#10b981" opacity={0.3} />
            <HeatmapBlob center={[30.1069, 80.2066]} radius={7000} color="#10b981" opacity={0.25} />
            <HeatmapBlob center={[30.1269, 80.1866]} radius={4000} color="#10b981" opacity={0.3} />
            <HeatmapBlob center={[30.0269, 80.2866]} radius={5000} color="#10b981" opacity={0.25} />
            <HeatmapBlob center={[30.1569, 80.1566]} radius={4500} color="#10b981" opacity={0.3} />
            
            {/* Fake Heatmap Overlay - Yellow/Orange (Medium) */}
            <HeatmapBlob center={[30.0869, 80.2366]} radius={3000} color="#eab308" opacity={0.4} />
            <HeatmapBlob center={[30.1069, 80.2066]} radius={3500} color="#eab308" opacity={0.35} />
            <HeatmapBlob center={[30.1269, 80.1866]} radius={2000} color="#eab308" opacity={0.4} />
            <HeatmapBlob center={[30.0269, 80.2866]} radius={2500} color="#eab308" opacity={0.4} />

            {/* Fake Heatmap Overlay - Red (High priority/Low recharge) */}
            <HeatmapBlob center={[30.1069, 80.2066]} radius={1200} color="#ef4444" opacity={0.5} />
            <HeatmapBlob center={[30.1269, 80.1866]} radius={900} color="#ef4444" opacity={0.5} />
            <HeatmapBlob center={[30.0569, 80.2566]} radius={1000} color="#ef4444" opacity={0.5} />
            <HeatmapBlob center={[30.0269, 80.2866]} radius={1100} color="#ef4444" opacity={0.5} />

            {/* Dummy other markers */}
            <CircleMarker center={[30.0569, 80.2566]} radius={4} pathOptions={{ color: 'white', weight: 1.5, fillColor: '#ef4444', fillOpacity: 1 }} />
            <CircleMarker center={[30.1269, 80.1866]} radius={4} pathOptions={{ color: 'white', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 1 }} />
            <CircleMarker center={[30.0269, 80.2866]} radius={4} pathOptions={{ color: 'white', weight: 1.5, fillColor: '#ef4444', fillOpacity: 1 }} />
            <CircleMarker center={[30.1569, 80.1566]} radius={4} pathOptions={{ color: 'white', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 1 }} />
            
          </MapContainer>
        </div>

        {/* Right Info Panel */}
        <div className="w-[380px] shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
          {/* Close button */}
          <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-white/80 rounded-full p-1 z-10 backdrop-blur-sm shadow-sm transition-colors">
            <X size={16} />
          </button>

          {/* Spring Details Header */}
          <div className="p-5 pb-0 flex gap-4">
            <div className="w-20 h-24 rounded-lg bg-gray-200 overflow-hidden shrink-0 shadow-sm relative">
              {/* Dummy nature image */}
              <img src="https://images.unsplash.com/photo-1543881473-b3c990b79df7?auto=format&fit=crop&w=300&q=80" alt="Spring" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col pt-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
                <span className="cursor-pointer hover:text-gray-800">&lt;</span>
                1 of 5
                <span className="cursor-pointer hover:text-gray-800">&gt;</span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 leading-none mb-2">SPR-JH-024</h2>
              <div className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit mb-2">
                <ArrowRight size={10} className="-rotate-45" /> High Priority
              </div>
              <p className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
                <MapIcon size={10} /> Naiti Village, Munsyari Block
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 mt-4 px-5">
            {['Overview', 'Trends', 'Recharge Area', 'Interventions'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 mr-4 text-xs font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-[#115E41] text-[#115E41]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5 flex-1 overflow-y-auto">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm flex items-start gap-3">
                <div className="text-green-600 bg-green-50 p-1.5 rounded-md shrink-0"><Droplets size={16} /></div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Spring Type</p>
                  <p className="text-xs font-bold text-gray-900">Perennial</p>
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm flex items-start gap-3">
                <div className="text-blue-500 bg-blue-50 p-1.5 rounded-md shrink-0"><Droplets size={16} /></div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Current Discharge</p>
                  <p className="text-xs font-bold text-gray-900">8.2 L/min</p>
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm flex items-start gap-3">
                <div className="text-red-600 bg-red-50 p-1.5 rounded-md shrink-0"><TrendingDown size={16} /></div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Trend (3 years)</p>
                  <p className="text-xs font-bold text-gray-900">Declining</p>
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm flex items-start gap-3">
                <div className="text-gray-500 bg-gray-50 p-1.5 rounded-md shrink-0"><Calendar size={16} /></div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Last Observation</p>
                  <p className="text-xs font-bold text-gray-900">12 Sep 2026</p>
                </div>
              </div>
            </div>

            {/* Why Flagged Box */}
            <div className="bg-red-50/50 border border-red-100 rounded-lg p-4 mb-5 flex gap-4">
              <div className="flex-1">
                <h4 className="text-[11px] font-bold text-red-800 flex items-center gap-1.5 mb-2">
                  <AlertTriangle size={12} /> Why Flagged?
                </h4>
                <ul className="text-[10px] font-medium text-gray-700 space-y-1.5 pl-3 list-disc marker:text-red-400">
                  <li>Discharge trend shows 22% decline</li>
                  <li>High community dependence</li>
                  <li>High recharge suitability</li>
                  <li>Rainfall deficit in recent years</li>
                </ul>
              </div>
              
              <div className="w-[1px] bg-red-100 mx-2"></div>
              
              <div className="flex flex-col items-center justify-start shrink-0">
                <p className="text-[9px] font-bold text-gray-500 flex items-center gap-1 mb-1">
                  Confidence <Info size={10} className="text-gray-400" />
                </p>
                <div className="bg-yellow-100 text-yellow-800 text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div> Moderate
                </div>
              </div>
            </div>

            {/* Main Action Button */}
            <button className="w-full bg-[#115E41] hover:bg-[#0e4b34] text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors mb-3">
              Explore Recharge Area <ArrowRight size={14} />
            </button>

            {/* Secondary Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors">
                <TrendingDown size={14} className="text-gray-400" /> View Spring Twin
              </button>
              <button className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors">
                <Plus size={14} className="text-green-600" /> Add to Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Row */}
      <div className="shrink-0 flex items-stretch gap-4 h-20">
        
        {/* Stat Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 flex items-center gap-4 flex-1">
          <Droplets size={20} className="text-[#115E41]" strokeWidth={2.5} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-gray-900 leading-none">1,268</span>
              <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ArrowUpRight size={10}/> 12%</span>
            </div>
            <p className="text-[10px] font-semibold text-gray-500 mt-1">Total Springs</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 flex items-center gap-4 flex-1">
          <TrendingDown size={20} className="text-red-500" strokeWidth={2.5} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-gray-900 leading-none">412</span>
              <span className="text-[9px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ArrowDownRight size={10}/> 6%</span>
            </div>
            <p className="text-[10px] font-semibold text-gray-500 mt-1">Declining Springs</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 flex items-center gap-4 flex-1">
          <AlertTriangle size={20} className="text-red-600" strokeWidth={2.5} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-gray-900 leading-none">137</span>
              <span className="text-[9px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ArrowUpRight size={10}/> 18%</span>
            </div>
            <p className="text-[10px] font-semibold text-gray-500 mt-1">Priority Springs</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 flex items-center gap-4 flex-1">
          <LocateFixed size={20} className="text-[#115E41]" strokeWidth={2.5} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-gray-900 leading-none">48</span>
            </div>
            <p className="text-[10px] font-semibold text-gray-500 mt-1">Candidate Recharge Zones</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 flex items-center gap-4 flex-1">
          <ClipboardCheck size={20} className="text-blue-500" strokeWidth={2.5} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-gray-900 leading-none">24</span>
            </div>
            <p className="text-[10px] font-semibold text-gray-500 mt-1">Pending Field Validation</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50/80 rounded-xl border border-blue-100 p-3 flex-1 lg:max-w-[280px] flex flex-col justify-center relative">
          <Info size={12} className="text-blue-400 absolute top-3 right-3" />
          <h4 className="text-[10px] font-bold text-blue-700 mb-1">Demo Data</h4>
          <p className="text-[9px] font-medium text-gray-500 leading-snug pr-4">
            This is an illustrative dataset for prototype and demonstration purposes only.
          </p>
        </div>

      </div>

    </div>
  );
};

export default MapExplorer;
