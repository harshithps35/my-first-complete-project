import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import './Address.css';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const customMarkerIcon = L.divIcon({
  html: `<div class="custom-marker"><div class="marker-pin"></div><div class="marker-pulse"></div></div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const NORTH_BANGALORE_AREAS = [
  { name: 'Yelahanka', lat: 13.1007, lng: 77.5963, desc: 'Major suburb — moderate water table' },
  { name: 'Hebbal', lat: 13.0453, lng: 77.5946, desc: 'Lakeside area — good recharge potential' },
  { name: 'Devanahalli', lat: 13.2468, lng: 77.7107, desc: 'Airport area — sandy soil, high percolation' },
  { name: 'Kogilu', lat: 13.0847, lng: 77.6048, desc: 'Residential — critical stagnation zones' },
  { name: 'Rachenahalli', lat: 13.0628, lng: 77.6214, desc: 'Lake zone — surface water monitoring' },
  { name: 'Bagalur', lat: 13.2089, lng: 77.6734, desc: 'Industrial belt — road gap opportunities' },
  { name: 'Rajanukunte', lat: 13.1654, lng: 77.5789, desc: 'Village area — check dam sites identified' },
  { name: 'Doddaballapur', lat: 13.2941, lng: 77.5375, desc: 'Silk town — good aquifer depth' },
  { name: 'Thanisandra', lat: 13.0662, lng: 77.6273, desc: 'Growing suburb — mixed recharge zones' },
  { name: 'Jakkur', lat: 13.0874, lng: 77.5762, desc: 'Lake and aerodrome area' },
];

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

const Address = () => {
  const [selected, setSelected] = useState(null);
  const [clickedPos, setClickedPos] = useState(null);
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: select area, 2: confirm
  const { saveLocation, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAreaSelect = (area) => {
    setSelected(area);
    setClickedPos({ lat: area.lat, lng: area.lng });
    setStep(2);
  };

  const handleMapClick = useCallback((latlng) => {
    setClickedPos(latlng);
    setSelected(null);
    setStep(2);
  }, []);

  const handleConfirm = async () => {
    if (!clickedPos) return;
    setLoading(true);
    try {
      const areaName = selected?.name || customName || 'Custom Location';
      await saveLocation(areaName, clickedPos.lat, clickedPos.lng);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="address-root">
      {/* Header */}
      <header className="address-header glass-card">
        <div className="header-brand">
          <div className="header-logo">💧</div>
          <span className="header-brand-name">AquaSense</span>
        </div>
        <div className="header-user">
          <span className="header-greeting">👋 Hello, <strong>{user?.name}</strong></span>
          <button className="btn btn-ghost header-logout" onClick={logout} id="logout-btn">Logout</button>
        </div>
      </header>

      <div className="address-container">
        {/* Left: Area Selector */}
        <div className="area-panel">
          <div className="panel-head">
            <div className="step-badge">Step 1 of 2</div>
            <h1 className="panel-title">Select Your Area</h1>
            <p className="panel-subtitle">
              Choose a North Bangalore locality from the list or click anywhere on the map to pin your location.
            </p>
          </div>

          <div className="area-list">
            {NORTH_BANGALORE_AREAS.map(area => (
              <button
                key={area.name}
                id={`area-${area.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`area-item ${selected?.name === area.name ? 'active' : ''}`}
                onClick={() => handleAreaSelect(area)}
              >
                <div className="area-item-left">
                  <div className="area-dot"></div>
                  <div>
                    <div className="area-item-name">{area.name}</div>
                    <div className="area-item-desc">{area.desc}</div>
                  </div>
                </div>
                <svg className="area-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>

          {/* Step 2: Confirm */}
          {step === 2 && clickedPos && (
            <div className="confirm-panel glass-card slide-in">
              <div className="confirm-title">📍 Location Selected</div>
              <div className="confirm-coords">
                {selected ? (
                  <><strong>{selected.name}</strong><br />{selected.desc}</>
                ) : (
                  <>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Name this location (optional)"
                        value={customName}
                        onChange={e => setCustomName(e.target.value)}
                        id="custom-location-name"
                      />
                    </div>
                    Lat: {clickedPos.lat.toFixed(4)}, Lng: {clickedPos.lng.toFixed(4)}
                  </>
                )}
              </div>
              <button
                id="confirm-location-btn"
                className="btn btn-primary confirm-btn"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? <><span className="btn-loader"></span> Saving...</> : '→ Go to Dashboard'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div className="map-panel">
          <div className="map-hint">
            <span>🖱️</span> Click anywhere on the map to drop a custom pin
          </div>
          <div className="map-wrapper">
            <MapContainer
              center={[13.1007, 77.5963]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapClickHandler onMapClick={handleMapClick} />

              {/* Area markers */}
              {NORTH_BANGALORE_AREAS.map(area => (
                <Marker
                  key={area.name}
                  position={[area.lat, area.lng]}
                  eventHandlers={{ click: () => handleAreaSelect(area) }}
                >
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <strong style={{ color: '#0ea5e9', fontSize: 14 }}>{area.name}</strong>
                      <p style={{ fontSize: 12, marginTop: 4, color: '#94a3b8' }}>{area.desc}</p>
                      <button
                        onClick={() => handleAreaSelect(area)}
                        style={{ marginTop: 8, padding: '6px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, width: '100%' }}
                      >
                        Select this area
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Custom click marker */}
              {clickedPos && !selected && (
                <Marker position={[clickedPos.lat, clickedPos.lng]} icon={customMarkerIcon}>
                  <Popup>
                    <div>
                      <strong style={{ color: '#0ea5e9' }}>Custom Location</strong>
                      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                        {clickedPos.lat.toFixed(4)}, {clickedPos.lng.toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Address;
