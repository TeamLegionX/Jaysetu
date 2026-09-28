import React, { useEffect } from 'react';
import { 
  Droplets, 
  TrendingDown, 
  AlertTriangle, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  Crosshair,
  Map as MapIcon,
  Wrench,
  ArrowRight,
  MapPin,
  Layers,
  Sprout,
  BarChart2
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet icon issues if needed (though we're using CircleMarkers mostly)
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

// Helper to simulate heatmap blobs
const HeatmapBlob = ({ center, radius, color, opacity = 0.4 }: { center: [number, number], radius: number, color: string, opacity?: number }) => (
  <Circle 
    center={center} 
    radius={radius} 
    pathOptions={{ stroke: false, fillColor: color, fillOpacity: opacity }} 
    interactive={false}
  />
);

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  subtitle: string; 
  icon: React.ReactNode; 
  trend: string; 
  trendUp: boolean;
  iconBg: string;
  iconColor: string;
}> = ({ title, value, subtitle, icon, trend, trendUp, iconBg, iconColor }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {trendUp ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowUpRight size={12} strokeWidth={3} />}
          {trend}
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-800 mb-0.5">{title}</p>
      <p className="text-[11px] text-gray-500 font-medium truncate">{subtitle}</p>
    </div>
  </div>
);

const PrioritySpringRow: React.FC<{
  number: string;
  id: string;
  location: string;
  priority: 'High' | 'Medium' | 'Low';
}> = ({ number, id, location, priority }) => {
  const getPriorityStyles = () => {
    switch(priority) {
      case 'High': return 'bg-red-50 text-red-700';
      case 'Medium': return 'bg-orange-50 text-orange-700';
      case 'Low': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getPriorityIcon = () => {
    switch(priority) {
      case 'High': return <ArrowUpRight size={14} strokeWidth={2.5} />;
      case 'Medium': return <ArrowUpRight size={14} strokeWidth={2.5} className="rotate-45" />;
      case 'Low': return <ArrowDownRight size={14} strokeWidth={2.5} />;
      default: return null;
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 group cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-green-800">{number}</span>
        <div>
          <p className="text-sm font-bold text-gray-900 group-hover:text-[#115E41] transition-colors">{id}</p>
          <p className="text-[11px] text-gray-500">{location}</p>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold text-xs ${getPriorityStyles()}`}>
        {getPriorityIcon()}
        {priority}
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = React.useState<any>({
    total_springs: 1268,
    total_springs_trend: "+12%",
    declining_springs: 412,
    declining_springs_percent: "32%",
    declining_springs_trend: "-6%",
    priority_springs: 137,
    priority_springs_trend: "+18%",
    villages_covered: 286,
    villages_covered_trend: "+9%"
  });
  
  const [prioritySpringsList, setPrioritySpringsList] = React.useState<any[]>([
    { id: "SPR-JH-024", location: "Naiti Village, Munsyari", priority: "High" },
    { id: "SPR-JH-031", location: "Burfu, Munsyari", priority: "Medium" },
    { id: "SPR-JH-018", location: "Sarmoli, Munsyari", priority: "High" },
    { id: "SPR-JH-067", location: "Lilam, Munsyari", priority: "Medium" },
    { id: "SPR-JH-112", location: "Martoli, Pithoragarh", priority: "Low" }
  ]);

  React.useEffect(() => {
    // Docker is stuck due to virtualization, using realistic Mock Data for Demo
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full relative">
      
      {/* Background Graphic */}
      <div className="absolute right-0 bottom-0 pointer-events-none opacity-40 z-0">
        <img src="/mountain-bg.svg" alt="" className="w-[600px] mix-blend-multiply" />
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">
              Spring Intelligence for Resilient Communities
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-[#111827] tracking-tight">
            Spring <span className="text-[#115E41]">Intelligence</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Prioritise springs. Assess recharge potential. Plan interventions.
          </p>
        </div>
        
        <div className="hidden md:flex flex-col items-end text-right">
          <p className="text-2xl font-serif italic text-gray-400 mb-1">Mountains hold the future.</p>
          <div className="w-8 h-[1px] bg-gray-300 mb-2"></div>
          <p className="text-[9px] font-bold tracking-[0.2em] text-gray-400 uppercase">
            People &nbsp; Nature &nbsp; Resilient Communities
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 relative z-10">
        <StatCard 
          title="Total Springs" 
          value={stats ? stats.total_springs.toLocaleString() : "..."} 
          subtitle="Mapped across 4 districts" 
          icon={<Droplets size={24} strokeWidth={2.5} />} 
          trend={stats ? stats.total_springs_trend : "..."} 
          trendUp={true}
          iconBg="bg-green-50"
          iconColor="text-[#115E41]"
        />
        <StatCard 
          title="Declining Springs" 
          value={stats ? stats.declining_springs.toLocaleString() : "..."} 
          subtitle={stats ? `${stats.declining_springs_percent} of total springs` : "..."} 
          icon={<TrendingDown size={24} strokeWidth={2.5} />} 
          trend={stats ? stats.declining_springs_trend : "..."} 
          trendUp={true} 
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <StatCard 
          title="Priority Springs" 
          value={stats ? stats.priority_springs.toLocaleString() : "..."} 
          subtitle="High intervention need" 
          icon={<AlertTriangle size={24} strokeWidth={2.5} />} 
          trend={stats ? stats.priority_springs_trend : "..."} 
          trendUp={true} 
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatCard 
          title="Villages Covered" 
          value={stats ? stats.villages_covered.toLocaleString() : "..."} 
          subtitle="Across selected region" 
          icon={<Users size={24} strokeWidth={2.5} />} 
          trend={stats ? stats.villages_covered_trend : "..."} 
          trendUp={true}
          iconBg="bg-green-50"
          iconColor="text-[#115E41]"
        />
      </div>

      {/* Main Map & Sidebar Row */}
      <div className="flex flex-col xl:flex-row gap-6 mb-6 relative z-10">
        
        {/* Map Container */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative min-h-[500px]">
          
          {/* Top Left Floating Title */}
          <div className="absolute top-4 left-4 z-[1000] bg-[#111827]/80 backdrop-blur-md rounded-lg p-3 text-white shadow-lg flex items-start gap-3 border border-white/10 max-w-[320px]">
            <div className="bg-[#115E41] p-1.5 rounded-md mt-0.5 shrink-0">
              <Droplets size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Spring Risk & Recharge Map</h3>
              <p className="text-[11px] text-gray-300 font-medium mb-1">Visualise spring conditions, recharge potential and priority areas.</p>
              <div className="text-[9px] text-gray-400 leading-tight italic bg-white/5 p-1.5 rounded">
                * Note: Heatmap represents a hydrogeologically informed suitability assessment, not exact groundwater measurements.
              </div>
            </div>
          </div>

          {/* Map Type Toggle */}
          <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex text-xs font-semibold">
            <button className="px-4 py-2 bg-[#115E41] text-white">Map</button>
            <button className="px-4 py-2 text-gray-700 hover:bg-gray-50 border-l border-gray-200">Satellite</button>
            <button className="px-4 py-2 text-gray-700 hover:bg-gray-50 border-l border-gray-200">Terrain</button>
          </div>

          {/* Map Controls */}
          <div className="absolute top-16 right-4 z-[1000] flex flex-col gap-2">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
              <button className="p-2 text-gray-700 hover:bg-gray-50 border-b border-gray-200"><Plus size={18} /></button>
              <button className="p-2 text-gray-700 hover:bg-gray-50"><Minus size={18} /></button>
            </div>
            <button className="p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50">
              <Crosshair size={18} />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-[#111827]/80 backdrop-blur-md rounded-lg p-4 text-white shadow-lg border border-white/10">
            <div className="flex flex-col gap-2 text-[11px] font-medium">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-white bg-blue-500"></div> Spring</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-white bg-red-500"></div> Priority Spring</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-[2px] bg-gradient-to-r from-blue-400 via-green-400 to-yellow-400"></div> Recharge Potential
              </div>
              <div className="flex items-center gap-2"><div className="w-3 h-1 bg-blue-400"></div> River / Drainage</div>
              <div className="flex items-center gap-2"><div className="w-3 h-0 border-t border-dashed border-gray-400"></div> District Boundary</div>
            </div>
          </div>

          {/* React Leaflet Map */}
          <MapContainer 
            center={[30.0869, 80.2366]} // Munsyari approx
            zoom={11} 
            zoomControl={false}
            className="w-full h-full z-0"
          >
            {/* Using a nice satellite/terrain like tile layer, or standard OSM */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            />
            
            {/* Fake Heatmap Overlay - Green/Blue base */}
            <HeatmapBlob center={[30.0869, 80.2366]} radius={4000} color="#10b981" opacity={0.3} />
            <HeatmapBlob center={[30.1069, 80.2066]} radius={5000} color="#10b981" opacity={0.25} />
            <HeatmapBlob center={[30.0569, 80.2566]} radius={4500} color="#3b82f6" opacity={0.2} />
            <HeatmapBlob center={[30.1269, 80.1866]} radius={3000} color="#10b981" opacity={0.3} />
            <HeatmapBlob center={[30.0269, 80.2866]} radius={3500} color="#3b82f6" opacity={0.25} />
            
            {/* Fake Heatmap Overlay - Yellow/Orange (Medium) */}
            <HeatmapBlob center={[30.0869, 80.2366]} radius={2000} color="#eab308" opacity={0.4} />
            <HeatmapBlob center={[30.1069, 80.2066]} radius={2500} color="#eab308" opacity={0.35} />
            <HeatmapBlob center={[30.1269, 80.1866]} radius={1500} color="#eab308" opacity={0.4} />

            {/* Fake Heatmap Overlay - Red (High priority/Low recharge) */}
            <HeatmapBlob center={[30.1069, 80.2066]} radius={800} color="#ef4444" opacity={0.5} />
            <HeatmapBlob center={[30.1269, 80.1866]} radius={600} color="#ef4444" opacity={0.5} />
            <HeatmapBlob center={[30.0769, 80.2166]} radius={700} color="#ef4444" opacity={0.5} />

            {/* Dummy Springs */}
            <CircleMarker center={[30.1069, 80.2066]} radius={6} pathOptions={{ color: 'white', weight: 2, fillColor: '#ef4444', fillOpacity: 1 }}>
              <Popup className="custom-popup">
                <div className="p-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm text-gray-900">SPR-JH-024</h4>
                    <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold">High Priority</span>
                  </div>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 mb-3"><MapPin size={10} /> Naiti Village, Munsyari Block</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Discharge</p>
                      <p className="font-bold text-xs text-gray-900">18 L/min</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Trend</p>
                      <p className="font-bold text-xs text-red-600 flex items-center"><ArrowDownRight size={12}/> Declining</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Last Observation</p>
                      <p className="font-bold text-xs text-gray-900">12 Sep 2026</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Recharge Potential</p>
                      <p className="font-bold text-xs text-[#115E41]">High</p>
                    </div>
                  </div>
                  
                  <button className="w-full bg-[#115E41] text-white py-1.5 rounded text-xs font-semibold hover:bg-[#0e4b34] transition-colors">
                    View Spring Twin →
                  </button>
                </div>
              </Popup>
            </CircleMarker>
            
            <CircleMarker center={[30.0569, 80.2566]} radius={5} pathOptions={{ color: 'white', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 1 }} />
            <CircleMarker center={[30.1269, 80.1866]} radius={5} pathOptions={{ color: 'white', weight: 1.5, fillColor: '#ef4444', fillOpacity: 1 }} />
            <CircleMarker center={[30.0269, 80.2866]} radius={5} pathOptions={{ color: 'white', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 1 }} />

          </MapContainer>

        </div>

        {/* Right Sidebar List */}
        <div className="w-full xl:w-[380px] shrink-0 flex flex-col gap-4">
          
          {/* Priority Springs List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Priority Springs</h2>
              <a href="#" className="text-xs font-bold text-[#115E41] hover:underline">View All →</a>
            </div>
            
            <div className="flex flex-col">
              {prioritySpringsList.length > 0 ? prioritySpringsList.map((spring, index) => (
                <PrioritySpringRow 
                  key={spring.id} 
                  number={`0${index + 1}`.slice(-2)} 
                  id={spring.id} 
                  location={spring.location} 
                  priority={spring.priority} 
                />
              )) : (
                <div className="text-sm text-gray-500 py-4 text-center">Loading priority springs...</div>
              )}
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-[#115E41] rounded-xl shadow-sm p-6 text-white cursor-pointer hover:bg-[#0e4b34] transition-colors relative overflow-hidden group">
            {/* Background design */}
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Wrench size={100} />
            </div>
            
            <div className="relative z-10 flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-lg shrink-0">
                <Wrench size={24} />
              </div>
              <div className="pr-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-lg leading-tight">Create Revival Plan</h3>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-white/80 text-[11px] font-medium leading-snug">
                  Select springs, compare options and plan interventions.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Card 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg shrink-0">
              <Layers size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Recharge Assessment</h4>
              <p className="text-xl font-bold text-gray-900 leading-none mb-1">18 <span className="text-sm font-semibold text-gray-600">candidate zones</span></p>
              <p className="text-[11px] text-gray-400">Based on terrain, lithology and rainfall data</p>
            </div>
          </div>
          <div className="text-xs font-bold text-[#115E41] flex items-center gap-1 group">
            Explore <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-green-50 text-green-600 p-3 rounded-lg shrink-0">
              <Sprout size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Interventions</h4>
              <p className="text-xl font-bold text-gray-900 leading-none mb-1">32 <span className="text-sm font-semibold text-gray-600">candidate sites</span></p>
              <p className="text-[11px] text-gray-400">Check suitable intervention types</p>
            </div>
          </div>
          <div className="text-xs font-bold text-[#115E41] flex items-center gap-1 group">
            Compare <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-teal-50 text-teal-600 p-3 rounded-lg shrink-0">
              <BarChart2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Budget</h4>
              <p className="text-xl font-bold text-gray-900 leading-none mb-1">₹50 L <span className="text-sm font-semibold text-gray-600">available</span></p>
              <p className="text-[11px] text-gray-400">For planned interventions (demo data)</p>
            </div>
          </div>
          <div className="text-xs font-bold text-[#115E41] flex items-center gap-1 group">
            Plan <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Footer text */}
      <div className="absolute right-8 bottom-6 text-right opacity-60 z-10 pointer-events-none hidden md:block">
        <p className="text-lg font-serif italic text-[#115E41] leading-tight">Sustainable<br/>mountains,<br/>stronger communities.</p>
      </div>

    </div>
  );
};

export default Dashboard;
