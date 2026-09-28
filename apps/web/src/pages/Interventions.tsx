import React, { useState } from 'react';
import {
  AlertTriangle, MapPin, CheckCircle, Target, Shield, Coins,
  Leaf, Info, ChevronRight, Check, X, AlertCircle, Mountain,
  Waves, Fence, Lightbulb, FileText, BarChart2
} from 'lucide-react';

const Interventions: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState('A');

  return (
    <div className="h-[calc(100vh-60px)] xl:h-[calc(100vh-72px)] flex flex-col bg-[#f8fafc] overflow-hidden animate-fade-in-up">
      
      {/* ── TOP HEADER ── */}
      <div className="bg-white px-4 xl:px-6 pt-5 pb-5 shrink-0 relative overflow-hidden shadow-sm z-10">
        {/* Mountain watermark */}
        <div className="absolute top-0 right-0 w-[400px] h-[150px] pointer-events-none z-0" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1543881473-b3c990b79df7?auto=format&fit=crop&w=800&q=80)',
          backgroundPosition: 'center', backgroundSize: 'cover',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 100%), linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)',
          WebkitMaskComposite: 'source-in', opacity: 0.35
        }} />
        <div className="absolute top-5 right-6 z-10 text-right hidden xl:block">
          <p className="text-xl font-serif italic text-[#115E41] leading-tight shadow-white drop-shadow-md">"Analyse. Plan. Restore."</p>
        </div>

        {/* Header Title */}
        <div className="relative z-10 mb-5">
          <p className="text-[10px] font-bold text-[#115E41] uppercase tracking-[0.2em] mb-1">INTERVENTIONS</p>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-gray-900 tracking-tight mb-1">Interventions</h1>
          <p className="text-sm font-medium text-gray-500">Find and compare suitable recharge interventions for selected sites.</p>
        </div>

        {/* Spring Identity Strip + Stats */}
        <div className="flex flex-col lg:flex-row items-stretch gap-4 relative z-10">
          
          {/* Spring Profile */}
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm shrink-0 w-full lg:w-[340px]">
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-100">
              <img src="https://images.unsplash.com/photo-1543881473-b3c990b79df7?auto=format&fit=crop&w=150&q=80" alt="Spring" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-sm font-extrabold text-gray-900 truncate">SPR-JH-024</h2>
                <span className="bg-red-50 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                  <AlertTriangle size={9} /> High Priority
                </span>
              </div>
              <p className="text-[10px] font-medium text-gray-500 flex items-center gap-1 truncate">
                <MapPin size={10} className="shrink-0" /> Naiti Village, Munsyari Block
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex-1 flex gap-3 overflow-x-auto snap-x pb-2 lg:pb-0">
            {/* Stat 1 */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm min-w-[160px] snap-start shrink-0 lg:flex-1">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                <Target size={18} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-gray-900 leading-tight">3</p>
                <p className="text-[10px] font-bold text-gray-400">Candidate Sites</p>
              </div>
            </div>
            {/* Stat 2 */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm min-w-[160px] snap-start shrink-0 lg:flex-1">
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                <Coins size={18} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-gray-900 leading-tight">₹50 L</p>
                <p className="text-[10px] font-bold text-gray-400">Available Budget</p>
              </div>
            </div>
            {/* Stat 3 */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm min-w-[160px] snap-start shrink-0 lg:flex-1">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                <Leaf size={18} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-gray-900 leading-tight">2</p>
                <p className="text-[10px] font-bold text-gray-400">Suitable Sites</p>
              </div>
            </div>
            {/* Stat 4 */}
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm min-w-[160px] snap-start shrink-0 lg:flex-1">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-gray-900 leading-tight">1</p>
                <p className="text-[10px] font-bold text-gray-400">High-Risk Site</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-y-auto p-4 xl:p-6 flex flex-col lg:flex-row gap-4 xl:gap-6">
        
        {/* ── LEFT COLUMN (Lists & Compare) ── */}
        <div className="w-full lg:w-[500px] xl:w-[550px] flex flex-col gap-4 xl:gap-6 shrink-0">
          
          {/* Candidate Intervention Sites */}
          <div>
            <h2 className="text-[15px] font-extrabold text-gray-900 mb-1">Candidate Intervention Sites</h2>
            <p className="text-xs font-medium text-gray-500 mb-4">Select a site to view details and compare options.</p>

            <div className="space-y-3">
              {/* SITE A */}
              <button 
                onClick={() => setSelectedSite('A')}
                className={`w-full text-left bg-white border rounded-xl p-4 transition-all flex items-center gap-4 ${selectedSite === 'A' ? 'border-[#115E41] shadow-[0_4px_12px_rgba(17,94,65,0.12)] ring-1 ring-[#115E41]' : 'border-gray-200 shadow-sm hover:border-gray-300'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-extrabold shrink-0 ${selectedSite === 'A' ? 'bg-[#e6f2ed] text-[#115E41]' : 'bg-green-50 text-green-600'}`}>A</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-0.5">Upper Slope Zone</h3>
                  <p className="text-[10px] font-medium text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin size={10} /> 1.2 km from spring
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-bold bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded">High Suitability</span>
                    <span className="text-[9px] font-bold bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded">Low Risk</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-green-600 mb-1">Recommended</div>
                  <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2 justify-end">
                    ₹ 8,00,000 <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              </button>

              {/* SITE B */}
              <button 
                onClick={() => setSelectedSite('B')}
                className={`w-full text-left bg-white border rounded-xl p-4 transition-all flex items-center gap-4 ${selectedSite === 'B' ? 'border-[#115E41] shadow-[0_4px_12px_rgba(17,94,65,0.12)] ring-1 ring-[#115E41]' : 'border-gray-200 shadow-sm hover:border-gray-300'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-extrabold shrink-0 bg-blue-50 text-blue-600`}>B</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-0.5">Mid Catchment</h3>
                  <p className="text-[10px] font-medium text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin size={10} /> 2.8 km from spring
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-100 px-1.5 py-0.5 rounded">Medium Suitability</span>
                    <span className="text-[9px] font-bold bg-orange-50 text-orange-700 border border-orange-100 px-1.5 py-0.5 rounded">Medium Risk</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-orange-500 mb-1 flex items-center gap-1 justify-end"><AlertTriangle size={10}/> Review</div>
                  <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2 justify-end">
                    ₹ 13,00,000 <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              </button>

              {/* SITE C */}
              <button 
                onClick={() => setSelectedSite('C')}
                className={`w-full text-left bg-white border rounded-xl p-4 transition-all flex items-center gap-4 ${selectedSite === 'C' ? 'border-[#115E41] shadow-[0_4px_12px_rgba(17,94,65,0.12)] ring-1 ring-[#115E41]' : 'border-gray-200 shadow-sm hover:border-gray-300'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-extrabold shrink-0 bg-red-50 text-red-600`}>C</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-0.5">Stream Channel</h3>
                  <p className="text-[10px] font-medium text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin size={10} /> 4.1 km from spring
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-bold bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded">Low Suitability</span>
                    <span className="text-[9px] font-bold bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded">High Risk</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-red-500 mb-1">Not Recommended</div>
                  <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2 justify-end">
                    ₹ 17,00,000 <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Compare Interventions */}
          <div className="mt-2">
            <h2 className="text-[15px] font-extrabold text-gray-900 mb-3">Compare Interventions</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
              {/* Option 1 */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 min-w-[160px] flex-1 shadow-sm snap-start shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Mountain size={16} className="text-gray-500 shrink-0" />
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-900 leading-tight">Contour Trench</h4>
                    <p className="text-[8px] text-gray-400 leading-none mt-0.5">Suitable for upper slopes</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px] font-bold mt-3">
                  <span className="text-green-600 bg-green-50 px-1.5 rounded">High</span>
                  <span className="text-green-600 bg-green-50 px-1.5 rounded">Low</span>
                  <span className="text-gray-900">₹8L</span>
                </div>
              </div>
              {/* Option 2 */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 min-w-[160px] flex-1 shadow-sm snap-start shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Waves size={16} className="text-blue-500 shrink-0" />
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-900 leading-tight">Percolation Pond</h4>
                    <p className="text-[8px] text-gray-400 leading-none mt-0.5">Suitable for mid catchment</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px] font-bold mt-3">
                  <span className="text-orange-500 bg-orange-50 px-1.5 rounded">Medium</span>
                  <span className="text-orange-500 bg-orange-50 px-1.5 rounded">Medium</span>
                  <span className="text-gray-900">₹13L</span>
                </div>
              </div>
              {/* Option 3 */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 min-w-[160px] flex-1 shadow-sm snap-start shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Fence size={16} className="text-gray-500 shrink-0" />
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-900 leading-tight">Check Dam</h4>
                    <p className="text-[8px] text-gray-400 leading-none mt-0.5">Suitable for stream channel</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[9px] font-bold mt-3">
                  <span className="text-red-500 bg-red-50 px-1.5 rounded">Low</span>
                  <span className="text-red-500 bg-red-50 px-1.5 rounded">High</span>
                  <span className="text-gray-900">₹17L</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Details Panel) ── */}
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-w-0">
          
          {selectedSite === 'A' && (
            <div className="flex flex-col h-full animate-fade-in">
              {/* Panel Header */}
              <div className="p-4 xl:p-6 border-b border-gray-100 flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#115E41] text-white flex items-center justify-center text-xl font-extrabold shrink-0 shadow-inner">
                  Site A
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-extrabold text-gray-900 mb-1">Upper Slope Zone</h2>
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                    <span className="text-gray-400">~</span> 1.2 km from spring
                  </p>
                </div>
                <div className="bg-[#e6f2ed] border border-[#cce5d9] text-[#115E41] text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0">
                  <CheckCircle size={12} /> Recommended
                </div>
              </div>

              <div className="p-4 xl:p-6 flex-1 overflow-y-auto">
                {/* 3 Mini Cards */}
                <div className="grid grid-cols-3 gap-3 xl:gap-4 mb-6">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 xl:p-4 text-center">
                    <Target size={16} className="text-green-600 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">Suitability</p>
                    <p className="text-sm font-extrabold text-gray-900">High</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 xl:p-4 text-center">
                    <Shield size={16} className="text-orange-500 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">Risk</p>
                    <p className="text-sm font-extrabold text-gray-900">Low</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 xl:p-4 text-center">
                    <Coins size={16} className="text-blue-500 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">Estimated Cost</p>
                    <p className="text-sm font-extrabold text-gray-900">₹8,00,000</p>
                  </div>
                </div>

                {/* Two Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-8 mb-6">
                  {/* Why this intervention? */}
                  <div>
                    <h3 className="text-[11px] font-bold text-gray-900 mb-3">Why this intervention?</h3>
                    <ul className="space-y-2.5">
                      {['Suitable slope and terrain', 'Good infiltration potential', 'Within accessible area', 'No major land constraints'].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] font-semibold text-gray-700">
                          <CheckCircle size={14} className="text-[#115E41] shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Risk Screening */}
                  <div>
                    <h3 className="text-[11px] font-bold text-gray-900 mb-3">Risk Screening</h3>
                    <ul className="space-y-2.5">
                      {['Slope risk', 'Flood exposure', 'Drainage conflict', 'Land constraint'].map((item, i) => (
                        <li key={i} className="flex items-center justify-between text-[11px] font-semibold text-gray-700">
                          <span className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-[#115E41] shrink-0" /> {item}
                          </span>
                          <span className="text-[9px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Pass</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Conclusion Box */}
                <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                  <Lightbulb size={20} className="text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-gray-900 mb-1 leading-snug">Good fit for the selected site with high suitability and low identified risk.</p>
                    <p className="text-[10px] text-gray-600 font-medium">Based on terrain, drainage, land use and field observations.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 xl:p-5 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3">
                <button className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#115E41] hover:bg-[#0e4b34] px-5 py-2.5 rounded-lg transition-colors shadow-sm flex-1 justify-center whitespace-nowrap">
                  <FileText size={16} /> Add to Revival Plan
                </button>
                <button className="flex items-center gap-1.5 text-xs font-bold text-[#115E41] bg-white border border-gray-200 hover:bg-gray-50 px-5 py-2.5 rounded-lg transition-colors flex-1 justify-center whitespace-nowrap">
                  <FileText size={16} /> View Details
                </button>
                <button className="flex items-center gap-1.5 text-xs font-bold text-[#115E41] bg-white border border-gray-200 hover:bg-gray-50 px-5 py-2.5 rounded-lg transition-colors flex-1 justify-center whitespace-nowrap">
                  <BarChart2 size={16} /> Compare Options
                </button>
              </div>
            </div>
          )}

          {selectedSite !== 'A' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <Mountain size={48} className="text-gray-200 mb-4" />
              <h2 className="text-lg font-extrabold text-gray-900 mb-2">Select Site {selectedSite}</h2>
              <p className="text-sm font-medium text-gray-500 max-w-sm">Click on Site A to view the full details as per the reference design. Other sites are placeholders.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Interventions;
