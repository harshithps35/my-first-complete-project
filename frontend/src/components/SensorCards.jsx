import React from 'react';
import './SensorCards.css';

const STATUS_CONFIG = {
  active:   { color: '#10b981', label: 'Active',   bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)' },
  warning:  { color: '#f59e0b', label: 'Warning',  bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  critical: { color: '#ef4444', label: 'Critical', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)' },
  inactive: { color: '#475569', label: 'Inactive', bg: 'rgba(71,85,105,0.1)',  border: 'rgba(71,85,105,0.3)' },
};

const Metric = ({ label, value, unit, color }) => (
  <div className="metric-cell">
    <div className="metric-label">{label}</div>
    <div className="metric-value" style={{ color }}>
      {value ?? '--'}<span className="metric-unit">{unit}</span>
    </div>
  </div>
);

const WaterBar = ({ level, max = 30 }) => {
  const pct = Math.min(100, (level / max) * 100);
  const color = pct < 30 ? '#ef4444' : pct < 60 ? '#f59e0b' : '#10b981';
  return (
    <div className="water-bar-wrap">
      <div className="water-bar-track">
        <div className="water-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="water-bar-label" style={{ color }}>{level?.toFixed(1)}m</span>
    </div>
  );
};

const SensorCard = ({ sensor }) => {
  const cfg = STATUS_CONFIG[sensor.status] || STATUS_CONFIG.inactive;
  const last = sensor.readings?.[sensor.readings.length - 1] || {};

  return (
    <div className="sensor-card glass-card" style={{ '--status-color': cfg.color, '--status-bg': cfg.bg, '--status-border': cfg.border }}>
      <div className="sc-header">
        <div className="sc-id-group">
          <span className="sc-pulse-ring" />
          <span className="sc-dot" style={{ background: cfg.color }} />
          <code className="sc-id">{sensor.sensorId}</code>
        </div>
        <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
          {cfg.label.toUpperCase()}
        </span>
      </div>

      <div className="sc-name">{sensor.name}</div>
      <div className="sc-area">📍 {sensor.area}</div>

      <div className="sc-water-section">
        <div className="sc-water-label">Groundwater Level</div>
        <WaterBar level={last.waterLevel} />
      </div>

      <div className="sc-metrics">
        <Metric label="Depth" value={last.depth?.toFixed(0)} unit="m" color="#0ea5e9" />
        <Metric label="pH" value={last.ph?.toFixed(1)} unit="" color="#06b6d4" />
        <Metric label="TDS" value={last.tds?.toFixed(0)} unit=" ppm" color="#8b5cf6" />
        <Metric label="Recharge" value={last.rechargeRate?.toFixed(0)} unit=" L/h" color="#10b981" />
        <Metric label="Temperature" value={last.temperature?.toFixed(1)} unit="°C" color="#f59e0b" />
        <Metric label="Type" value={sensor.type} unit="" color="#94a3b8" />
      </div>

      <div className="sc-footer">
        <span className="sc-update">🕐 {sensor.lastUpdated ? new Date(sensor.lastUpdated).toLocaleTimeString() : 'N/A'}</span>
        <span className="sc-readings">{sensor.readings?.length || 0} readings</span>
      </div>
    </div>
  );
};

const SensorCards = ({ sensors }) => {
  if (!sensors.length) return (
    <div className="sensors-empty">
      <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
      <p>No sensors found. Make sure the database is seeded.</p>
    </div>
  );

  const criticalSensors = sensors.filter(s => s.status === 'critical');

  return (
    <div className="sensors-root">
      {criticalSensors.length > 0 && (
        <div className="alert alert-error sensors-alert">
          ⚠️ <strong>{criticalSensors.length} critical sensor{criticalSensors.length > 1 ? 's' : ''} detected:</strong>{' '}
          {criticalSensors.map(s => s.area).join(', ')} — Immediate attention required.
        </div>
      )}
      <div className="sensors-grid">
        {sensors.map(s => <SensorCard key={s.sensorId} sensor={s} />)}
      </div>
    </div>
  );
};

export default SensorCards;
