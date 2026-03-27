import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import './MapView.css';

const { BaseLayer, Overlay } = LayersControl;

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createSensorIcon = (status) => {
  const colors = { active: '#10b981', warning: '#f59e0b', critical: '#ef4444', inactive: '#475569' };
  const color = colors[status] || '#0ea5e9';
  return L.divIcon({
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color}22;border:2px solid ${color};
      display:flex;align-items:center;justify-content:center;
      font-size:14px;box-shadow:0 0 12px ${color}66;
      animation:${status==='critical'?'blink 0.8s infinite':'none'}
    ">📡</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createZoneIcon = (type) => {
  const icons = {
    percolation_pond: '🏞',
    recharge_trench: '⛏',
    check_dam: '🌊',
    road_gap: '🛣',
    stagnation_risk: '⚠️',
    rooftop_harvesting: '🏠',
  };
  return L.divIcon({
    html: `<div style="font-size:20px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${icons[type] || '📍'}</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const ZONE_COLORS = {
  percolation_pond: '#10b981',
  recharge_trench: '#0ea5e9',
  check_dam: '#06b6d4',
  road_gap: '#f59e0b',
  stagnation_risk: '#ef4444',
  rooftop_harvesting: '#8b5cf6',
};

const ZONE_LABELS = {
  percolation_pond: 'Percolation Pond',
  recharge_trench: 'Recharge Trench',
  check_dam: 'Check Dam',
  road_gap: 'Road Gap Site',
  stagnation_risk: 'Stagnation Risk',
  rooftop_harvesting: 'Rooftop Harvesting',
};

const MapView = ({ sensors, zones, userLat, userLng, userArea }) => {
  const [legendOpen, setLegendOpen] = useState(true);

  const centerLat = userLat || 13.1007;
  const centerLng = userLng || 77.5963;

  return (
    <div className="mapview-root">
      {/* Map Legend */}
      <div className={`map-legend glass-card ${legendOpen ? 'open' : ''}`}>
        <div className="legend-header" onClick={() => setLegendOpen(o => !o)}>
          <span>Map Legend</span>
          <span className="legend-toggle">{legendOpen ? '▼' : '▶'}</span>
        </div>
        {legendOpen && (
          <div className="legend-body">
            <div className="legend-section">
              <div className="legend-title">IoT Sensors</div>
              {[
                { color: '#10b981', label: 'Active' },
                { color: '#f59e0b', label: 'Warning' },
                { color: '#ef4444', label: 'Critical' },
              ].map(l => (
                <div key={l.label} className="legend-item">
                  <div className="legend-dot" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }}></div>
                  <span>{l.label}</span>
                </div>
              ))}
            </div>
            <div className="legend-section">
              <div className="legend-title">Recharge Zones</div>
              {Object.entries(ZONE_LABELS).map(([k, v]) => (
                <div key={k} className="legend-item">
                  <div className="legend-square" style={{ background: ZONE_COLORS[k] + '44', border: `1px solid ${ZONE_COLORS[k]}` }}></div>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <LayersControl position="topright">
          <BaseLayer checked name="Street Map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© OpenStreetMap contributors'
            />
          </BaseLayer>
          <BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='© Esri, Maxar, GeoEye — Satellite'
            />
          </BaseLayer>
          <BaseLayer name="Terrain">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='© OpenTopoMap'
            />
          </BaseLayer>

          {/* Sensor Overlay */}
          <Overlay checked name="IoT Sensors">
            <>
              {sensors.map(s => {
                const lastReading = s.readings?.[s.readings.length - 1] || {};
                return (
                  <Marker key={s.sensorId} position={[s.lat, s.lng]} icon={createSensorIcon(s.status)}>
                    <Popup maxWidth={260}>
                      <div className="map-popup">
                        <div className="popup-header">
                          <strong>{s.name}</strong>
                          <span className={`badge badge-${s.status === 'active' ? 'green' : s.status === 'warning' ? 'orange' : 'red'}`}>
                            {s.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="popup-area">📍 {s.area}</div>
                        <div className="popup-grid">
                          <div className="popup-metric">
                            <div className="pm-label">Water Level</div>
                            <div className="pm-value">{lastReading.waterLevel?.toFixed(1) ?? '--'}m</div>
                          </div>
                          <div className="popup-metric">
                            <div className="pm-label">pH</div>
                            <div className="pm-value">{lastReading.ph?.toFixed(1) ?? '--'}</div>
                          </div>
                          <div className="popup-metric">
                            <div className="pm-label">TDS</div>
                            <div className="pm-value">{lastReading.tds?.toFixed(0) ?? '--'} ppm</div>
                          </div>
                          <div className="popup-metric">
                            <div className="pm-label">Recharge Rate</div>
                            <div className="pm-value">{lastReading.rechargeRate?.toFixed(0) ?? '--'} L/h</div>
                          </div>
                        </div>
                        <div className="popup-time">
                          🕐 {lastReading.timestamp ? new Date(lastReading.timestamp).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              {/* Sensor pulse circles */}
              {sensors.filter(s => s.status === 'active').map(s => (
                <Circle
                  key={`c-${s.sensorId}`}
                  center={[s.lat, s.lng]}
                  radius={300}
                  pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.05, weight: 1 }}
                />
              ))}
            </>
          </Overlay>

          {/* Zones Overlay */}
          <Overlay checked name="Recharge Zones">
            <>
              {zones.map(z => {
                const color = ZONE_COLORS[z.type] || '#0ea5e9';
                const coords = z.coordinates?.map(c => [c.lat, c.lng]) || [];
                return (
                  <React.Fragment key={z.zoneId}>
                    {coords.length >= 3 && (
                      <Polygon
                        positions={coords}
                        pathOptions={{
                          color,
                          fillColor: color,
                          fillOpacity: 0.2,
                          weight: 2,
                          dashArray: z.type === 'stagnation_risk' ? '6,4' : null
                        }}
                      >
                        <Popup maxWidth={280}>
                          <div className="map-popup">
                            <div className="popup-header">
                              <strong>{z.name}</strong>
                              <span className={`badge badge-${z.priority === 'high' ? 'red' : z.priority === 'medium' ? 'orange' : 'green'}`}>
                                {z.priority} priority
                              </span>
                            </div>
                            <div className="popup-area">📍 {z.area} — {ZONE_LABELS[z.type]}</div>
                            <div className="popup-grid">
                              <div className="popup-metric">
                                <div className="pm-label">AI Confidence</div>
                                <div className="pm-value" style={{ color }}>{z.aiConfidence}%</div>
                              </div>
                              <div className="popup-metric">
                                <div className="pm-label">Capacity</div>
                                <div className="pm-value">{(z.capacityLiters / 1000000).toFixed(1)}M L</div>
                              </div>
                              <div className="popup-metric">
                                <div className="pm-label">Soil Type</div>
                                <div className="pm-value">{z.soilType}</div>
                              </div>
                              <div className="popup-metric">
                                <div className="pm-label">Status</div>
                                <div className="pm-value">{z.status}</div>
                              </div>
                            </div>
                            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, lineHeight: 1.5 }}>{z.description}</p>
                          </div>
                        </Popup>
                      </Polygon>
                    )}
                    {z.center && (
                      <Marker position={[z.center.lat, z.center.lng]} icon={createZoneIcon(z.type)} />
                    )}
                  </React.Fragment>
                );
              })}
            </>
          </Overlay>

          {/* User Location */}
          {userLat && userLng && (
            <Overlay checked name="Your Location">
              <Circle
                center={[userLat, userLng]}
                radius={800}
                pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.08, weight: 2, dashArray: '8,4' }}
              >
                <Popup>
                  <div>
                    <strong style={{ color: '#8b5cf6' }}>📍 Your Location</strong>
                    <p style={{ fontSize: 12, marginTop: 4, color: '#94a3b8' }}>{userArea} — Monitoring radius: 800m</p>
                  </div>
                </Popup>
              </Circle>
            </Overlay>
          )}
        </LayersControl>
      </MapContainer>
    </div>
  );
};

export default MapView;
