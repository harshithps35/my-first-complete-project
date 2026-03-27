import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import SensorCards from '../components/SensorCards';
import WaterChart from '../components/WaterChart';
import AIPrediction from '../components/AIPrediction';
import './Dashboard.css';

const TABS = [
  { id: 'map', label: '🗺 Map View', desc: 'Live geospatial monitoring' },
  { id: 'analytics', label: '📊 Analytics', desc: 'Water level trends' },
  { id: 'sensors', label: '📡 IoT Sensors', desc: 'Live sensor readings' },
  { id: 'ai', label: '🤖 AI Predictor', desc: 'Recharge zone analysis' },
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('map');
  const [sensors, setSensors] = useState([]);
  const [zones, setZones] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, critical: 0, warning: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorsRes, zonesRes, statsRes] = await Promise.all([
          axios.get('/api/sensors'),
          axios.get('/api/zones'),
          axios.get('/api/sensors/stats/summary'),
        ]);
        setSensors(sensorsRes.data);
        setZones(zonesRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Poll for live sensor updates every 12 seconds
    const interval = setInterval(async () => {
      try {
        const res = await axios.get('/api/sensors');
        setSensors(res.data);
      } catch (_) {}
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const avgWaterLevel = sensors.length > 0
    ? (sensors.reduce((s, sen) => {
        const last = sen.readings?.[sen.readings.length - 1];
        return s + (last?.waterLevel || 0);
      }, 0) / sensors.length).toFixed(1)
    : 0;

  if (loading) return (
    <div className="loading-screen">
      <div style={{ textAlign: 'center' }}>
        <div className="loader" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading AquaSense Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-root">
      <Navbar user={user} onLogout={logout} />

      {/* Top Stats Bar */}
      <div className="stats-bar">
        {[
          { label: 'Total Sensors', value: stats.total, icon: '📡', color: 'blue' },
          { label: 'Active', value: stats.active, icon: '✅', color: 'green' },
          { label: 'Warning', value: stats.warning, icon: '⚠️', color: 'orange' },
          { label: 'Critical', value: stats.critical, icon: '🔴', color: 'red' },
          { label: 'Avg Water Level', value: `${avgWaterLevel}m`, icon: '💧', color: 'blue' },
          { label: 'Recharge Zones', value: zones.length, icon: '🗺', color: 'purple' },
        ].map(s => (
          <div key={s.label} className={`stat-card stat-${s.color}`}>
            <div className="stat-card-icon">{s.icon}</div>
            <div className="stat-card-body">
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-label">{tab.label}</span>
            <span className="tab-desc">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'map' && <MapView sensors={sensors} zones={zones} userArea={user?.area} userLat={user?.lat} userLng={user?.lng} />}
        {activeTab === 'analytics' && <WaterChart sensors={sensors} />}
        {activeTab === 'sensors' && <SensorCards sensors={sensors} />}
        {activeTab === 'ai' && <AIPrediction userArea={user?.area} />}
      </div>
    </div>
  );
};

export default Dashboard;
