import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AIPrediction.css';

const SOIL_TYPES = ['laterite', 'sandy', 'loamy', 'clay', 'rocky', 'alluvial'];
const LAND_USES = ['urban', 'semi-urban', 'rural', 'agricultural', 'industrial'];
const AREAS = ['Yelahanka','Hebbal','Devanahalli','Kogilu','Rachenahalli','Bagalur','Rajanukunte','Doddaballapur','Thanisandra','Jakkur'];

const TYPE_META = {
  percolation_pond:  { icon: '🏞', label: 'Percolation Pond',        color: '#10b981' },
  recharge_trench:   { icon: '⛏', label: 'Recharge Trench',          color: '#0ea5e9' },
  check_dam:         { icon: '🌊', label: 'Check Dam / Nala Bund',    color: '#06b6d4' },
  rooftop_harvesting:{ icon: '🏠', label: 'Rooftop Rain Harvesting',  color: '#8b5cf6' },
  stagnation_risk:   { icon: '⚠️', label: 'Stagnation Risk Zone',      color: '#ef4444' },
};

const ScoreRing = ({ score }) => {
  const r = 40, c = 2 * Math.PI * r;
  const fill = (score / 100) * c;
  const color = score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="score-ring-wrap">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${c - fill}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 1.2s ease' }}
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fill={color} fontSize="18" fontWeight="700" fontFamily="Space Grotesk">{score}</text>
        <text x="50" y="65" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="Inter">/ 100</text>
      </svg>
      <div className="score-label" style={{ color }}>
        {score > 70 ? 'Excellent' : score > 40 ? 'Moderate' : 'Poor'}
      </div>
    </div>
  );
};

const RecommendationCard = ({ rec, index }) => {
  const meta = TYPE_META[rec.type] || { icon: '📍', label: rec.type, color: '#0ea5e9' };
  return (
    <div className="rec-card glass-card" style={{ '--rec-color': meta.color, animationDelay: `${index * 0.1}s` }}>
      <div className="rec-header">
        <div className="rec-icon-wrap" style={{ background: meta.color + '22', border: `1px solid ${meta.color}44` }}>
          <span className="rec-icon">{meta.icon}</span>
        </div>
        <div className="rec-title-group">
          <div className="rec-name">{rec.name}</div>
          <div className="rec-type-label" style={{ color: meta.color }}>{meta.label}</div>
        </div>
        <div className="rec-confidence-badge" style={{ background: meta.color + '22', border: `1px solid ${meta.color}44`, color: meta.color }}>
          {rec.confidence}% AI confidence
        </div>
      </div>

      <p className="rec-description">{rec.description}</p>

      <div className="rec-details">
        <div className="rec-detail">
          <span className="rd-label">Capacity</span>
          <span className="rd-value">{(rec.capacity / 1000).toFixed(0)}K liters</span>
        </div>
        <div className="rec-detail">
          <span className="rd-label">Recharge potential</span>
          <span className="rd-value" style={{ color: '#10b981' }}>{rec.rechargePotential}</span>
        </div>
        <div className="rec-detail">
          <span className="rd-label">Estimated cost</span>
          <span className="rd-value" style={{ color: '#f59e0b' }}>{rec.estimatedCost}</span>
        </div>
        <div className="rec-detail">
          <span className="rd-label">Priority</span>
          <span className={`badge badge-${rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'orange' : 'green'}`}>
            {rec.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="rec-confidence-bar">
        <div className="rcb-track">
          <div className="rcb-fill" style={{ width: `${rec.confidence}%`, background: meta.color }} />
        </div>
      </div>
    </div>
  );
};

const StagnationCard = ({ zone }) => {
  const color = zone.riskLevel === 'high' ? '#ef4444' : '#f59e0b';
  return (
    <div className="stag-card glass-card" style={{ '--stag-color': color, borderColor: color + '44' }}>
      <div className="stag-header">
        <span style={{ fontSize: 18 }}>{zone.riskLevel === 'high' ? '🚨' : '⚠️'}</span>
        <div>
          <div className="stag-name">{zone.name}</div>
          <span className={`badge badge-${zone.riskLevel === 'high' ? 'red' : 'orange'}`}>{zone.riskLevel} risk</span>
        </div>
      </div>
      <div className="stag-details">
        <div><span className="rd-label">Water accumulation: </span><span style={{ color }}>{zone.waterAccumulation}</span></div>
        <div><span className="rd-label">Root cause: </span>{zone.cause}</div>
        <div><span className="rd-label">Road gap sites: </span><strong>{zone.roadGapOpportunities} identified</strong></div>
      </div>
    </div>
  );
};

const AIPrediction = ({ userArea }) => {
  const [form, setForm] = useState({
    area: userArea || 'Yelahanka',
    soilType: 'laterite',
    rainfall: 950,
    landUse: 'urban',
    population: 10000,
  });
  const [result, setResult] = useState(null);
  const [stagnation, setStagnation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('recommendations');

  useEffect(() => {
    axios.get('/api/predictions/stagnation-zones')
      .then(res => setStagnation(res.data))
      .catch(() => {});
    // Auto-run analysis on load
    runAnalysis();
  }, []);

  const runAnalysis = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/predictions/analyze', form);
      setResult(res.data);
      setActiveResultTab('recommendations');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-root">
      <div className="ai-layout">
        {/* Input Panel */}
        <div className="ai-input-panel">
          <div className="ai-panel-header">
            <div className="ai-badge">
              <span style={{ fontSize: 16 }}>🤖</span>
              AI Analysis Engine v2.1
            </div>
            <h2 className="section-title" style={{ margin: 0 }}>Recharge Zone Predictor</h2>
            <p className="section-subtitle" style={{ margin: 0 }}>
              Enter area parameters for AI-driven rainwater harvesting recommendations
            </p>
          </div>

          <form onSubmit={runAnalysis} className="ai-form">
            <div className="form-group">
              <label className="form-label">🏙 Target Area</label>
              <select
                id="ai-area-select"
                className="form-input"
                value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
              >
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">🪨 Soil Type</label>
              <select
                id="ai-soil-select"
                className="form-input"
                value={form.soilType}
                onChange={e => setForm(f => ({ ...f, soilType: e.target.value }))}
              >
                {SOIL_TYPES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">🌧 Annual Rainfall (mm): <strong style={{ color: 'var(--accent-blue)' }}>{form.rainfall}</strong></label>
              <input
                id="ai-rainfall-slider"
                type="range"
                className="ai-slider"
                min={400} max={1500} step={50}
                value={form.rainfall}
                onChange={e => setForm(f => ({ ...f, rainfall: +e.target.value }))}
              />
              <div className="slider-labels"><span>400mm</span><span>Drought</span><span>Normal</span><span>1500mm</span></div>
            </div>

            <div className="form-group">
              <label className="form-label">🏗 Land Use</label>
              <select
                id="ai-landuse-select"
                className="form-input"
                value={form.landUse}
                onChange={e => setForm(f => ({ ...f, landUse: e.target.value }))}
              >
                {LAND_USES.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">👥 Population Density: <strong style={{ color: 'var(--accent-blue)' }}>{form.population.toLocaleString()}</strong></label>
              <input
                id="ai-population-slider"
                type="range"
                className="ai-slider"
                min={1000} max={50000} step={1000}
                value={form.population}
                onChange={e => setForm(f => ({ ...f, population: +e.target.value }))}
              />
              <div className="slider-labels"><span>1K</span><span>Low</span><span>Dense</span><span>50K</span></div>
            </div>

            <button id="ai-analyze-btn" type="submit" className="btn btn-primary ai-analyze-btn" disabled={loading}>
              {loading ? <><span className="btn-loader"></span> Analyzing...</> : '🤖 Run AI Analysis'}
            </button>
          </form>

          {/* Data Sources */}
          <div className="data-sources glass-card">
            <div className="ds-title">📡 Data Sources</div>
            <div className="ds-items">
              <div className="ds-item"><span className="ds-dot active"></span>IoT Sensor Network (Live)</div>
              <div className="ds-item"><span className="ds-dot active"></span>Sentinel-2 Satellite (NDWI)</div>
              <div className="ds-item"><span className="ds-dot active"></span>IMD Rainfall Data 2024</div>
              <div className="ds-item"><span className="ds-dot active"></span>BBMP GIS Road Data</div>
              <div className="ds-item"><span className="ds-dot active"></span>CGWB Aquifer Maps</div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="ai-results-panel">
          {result ? (
            <>
              {/* Score Section */}
              <div className="score-section glass-card">
                <div className="score-content">
                  <ScoreRing score={result.overallRechargeScore} />
                  <div className="score-info">
                    <div className="score-title">Recharge Potential Score — {result.area}</div>
                    <div className="score-meta">
                      <span className={`badge badge-${result.riskLevel === 'low' ? 'green' : result.riskLevel === 'medium' ? 'orange' : 'red'}`}>
                        Depletion Risk: {result.riskLevel.toUpperCase()}
                      </span>
                      <span className={`badge badge-${result.stagnationRisk === 'high' ? 'red' : 'green'}`}>
                        Stagnation Risk: {result.stagnationRisk.toUpperCase()}
                      </span>
                    </div>
                    <div className="score-params">
                      Soil: <strong>{result.soilType}</strong> &nbsp;|&nbsp;
                      Rainfall: <strong>{result.rainfall}mm</strong> &nbsp;|&nbsp;
                      Model: <strong>{result.dataSource}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Tabs */}
              <div className="result-tabs">
                <button
                  className={`result-tab-btn ${activeResultTab === 'recommendations' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('recommendations')}
                  id="result-tab-recommendations"
                >
                  🎯 Recommendations ({result.recommendations.length})
                </button>
                <button
                  className={`result-tab-btn ${activeResultTab === 'stagnation' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('stagnation')}
                  id="result-tab-stagnation"
                >
                  🚨 Stagnation Zones ({stagnation.length})
                </button>
              </div>

              {activeResultTab === 'recommendations' && (
                <div className="rec-list">
                  {result.recommendations.length > 0
                    ? result.recommendations.map((r, i) => <RecommendationCard key={i} rec={r} index={i} />)
                    : <div className="ai-empty">No recommendations generated. Try adjusting the parameters.</div>
                  }
                </div>
              )}

              {activeResultTab === 'stagnation' && (
                <div className="stag-list">
                  {stagnation.map((z, i) => <StagnationCard key={i} zone={z} />)}
                  <div className="alert alert-info stag-info">
                    💡 <strong>{stagnation.reduce((s,z) => s + z.roadGapOpportunities, 0)} road gap sites</strong> identified across North Bangalore ideal for modular recharge trench installation during next road repair cycle.
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="ai-placeholder glass-card">
              <div style={{ fontSize: 64, marginBottom: 20 }}>🤖</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>AI Analysis Ready</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Configure parameters and run analysis to get recharge zone predictions</p>
              {loading && <div className="loader" style={{ margin: '24px auto 0' }}></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPrediction;
