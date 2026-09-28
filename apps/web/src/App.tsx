import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import MapExplorer from './pages/MapExplorer';
import AllSprings from './pages/AllSprings';
import PrioritySprings from './pages/PrioritySprings';
import SpringTwin from './pages/SpringTwin';

import RechargeAssessment from './pages/RechargeAssessment';
import Interventions from './pages/Interventions';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="map" element={<MapExplorer />} />
            <Route path="springs/all" element={<AllSprings />} />
            <Route path="springs/priority" element={<PrioritySprings />} />
            <Route path="springs/twin/:id" element={<SpringTwin />} />
            {/* Fallback twin route for dummy data */}
            <Route path="springs/twin" element={<SpringTwin />} />
            <Route path="recharge" element={<RechargeAssessment />} />
            <Route path="interventions" element={<Interventions />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
