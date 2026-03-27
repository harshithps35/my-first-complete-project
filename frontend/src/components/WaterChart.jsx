import React, { useMemo } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './WaterChart.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const COLORS = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6'];

const chartOptions = (title) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 1000, easing: 'easeInOutQuart' },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' }, padding: 12, boxWidth: 10 },
      display: true,
    },
    title: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15,23,42,0.95)',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#f8fafc',
      bodyColor: '#94a3b8',
      padding: 10,
    },
    filler: { propagate: true }
  },
  scales: {
    x: {
      ticks: { color: '#475569', font: { size: 10 } },
      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
    },
    y: {
      ticks: { color: '#475569', font: { size: 10 } },
      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
      beginAtZero: true,
    }
  }
});

const WaterChart = ({ sensors }) => {
  const { lineData, barData, monthLabels } = useMemo(() => {
    const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    const lineDatasets = sensors.map((s, i) => {
      const readings = s.readings || [];
      const monthly = months.map((_, mIdx) => {
        const monthReadings = readings.filter(r => {
          const d = new Date(r.timestamp);
          return d.getMonth() === (mIdx + 3) % 12;
        });
        if (!monthReadings.length) return null;
        return (monthReadings.reduce((sum, r) => sum + (r.waterLevel || 0), 0) / monthReadings.length).toFixed(2);
      });
      const color = COLORS[i % COLORS.length];
      return {
        label: s.area,
        data: monthly,
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        spanGaps: true,
      };
    });

    const latestLevels = sensors.map(s => {
      const last = s.readings?.[s.readings.length - 1];
      return parseFloat((last?.waterLevel || 0).toFixed(1));
    });

    const barDatasets = [{
      label: 'Current Water Level (m)',
      data: latestLevels,
      backgroundColor: latestLevels.map(v => v < 8 ? '#ef444488' : v < 15 ? '#f59e0b88' : '#10b98188'),
      borderColor: latestLevels.map(v => v < 8 ? '#ef4444' : v < 15 ? '#f59e0b' : '#10b981'),
      borderWidth: 1.5,
      borderRadius: 6,
    }];

    return {
      lineData: { labels: months, datasets: lineDatasets },
      barData: { labels: sensors.map(s => s.area), datasets: barDatasets },
      monthLabels: months,
    };
  }, [sensors]);

  const tdsData = useMemo(() => {
    const latestTDS = sensors.map(s => {
      const last = s.readings?.[s.readings.length - 1];
      return parseFloat((last?.tds || 0).toFixed(0));
    });
    return {
      labels: sensors.map(s => s.area),
      datasets: [{
        label: 'TDS (ppm)',
        data: latestTDS,
        backgroundColor: '#8b5cf688',
        borderColor: '#8b5cf6',
        borderWidth: 1.5,
        borderRadius: 6,
      }]
    };
  }, [sensors]);

  return (
    <div className="chart-root">
      <div className="chart-header">
        <h2 className="section-title">📊 Groundwater Analytics</h2>
        <p className="section-subtitle">Historical trends and real-time water level analysis — North Bangalore sensors</p>
      </div>

      <div className="chart-grid">
        {/* Main Line Chart */}
        <div className="chart-card glass-card chart-wide">
          <div className="chart-card-title">Water Level Trends (12 Months)</div>
          <div className="chart-card-subtitle">Monthly average groundwater levels per sensor — measured in meters</div>
          <div className="chart-canvas-wrap">
            <Line data={lineData} options={chartOptions('Water Level Trend')} />
          </div>
        </div>

        {/* Current Levels Bar Chart */}
        <div className="chart-card glass-card">
          <div className="chart-card-title">Current Water Levels</div>
          <div className="chart-card-subtitle">Live readings per area</div>
          <div className="chart-canvas-wrap">
            <Bar data={barData} options={{
              ...chartOptions(),
              plugins: { ...chartOptions().plugins, legend: { display: false } }
            }} />
          </div>
          <div className="chart-legend-row">
            <span className="chart-legend-item" style={{ color: '#10b981' }}>● Normal (&gt;15m)</span>
            <span className="chart-legend-item" style={{ color: '#f59e0b' }}>● Warning (8-15m)</span>
            <span className="chart-legend-item" style={{ color: '#ef4444' }}>● Critical (&lt;8m)</span>
          </div>
        </div>

        {/* TDS Chart */}
        <div className="chart-card glass-card">
          <div className="chart-card-title">Water Quality — TDS Levels</div>
          <div className="chart-card-subtitle">Total Dissolved Solids per sensor (ppm)</div>
          <div className="chart-canvas-wrap">
            <Bar data={tdsData} options={{
              ...chartOptions(),
              plugins: { ...chartOptions().plugins, legend: { display: false } }
            }} />
          </div>
          <div className="tds-note">
            <span className="badge badge-green">Below 300 ppm</span> Excellent quality &nbsp;
            <span className="badge badge-orange">300–600 ppm</span> Acceptable &nbsp;
            <span className="badge badge-red">Above 600 ppm</span> Treat before use
          </div>
        </div>

        {/* Summary Stats */}
        <div className="chart-card glass-card chart-summary">
          <div className="chart-card-title">Summary Metrics</div>
          <div className="summary-metrics">
            {sensors.map((s, i) => {
              const last = s.readings?.[s.readings.length - 1] || {};
              const level = last.waterLevel || 0;
              const status = level < 8 ? 'critical' : level < 15 ? 'warning' : 'good';
              return (
                <div key={s.sensorId} className={`summary-row summary-${status}`}>
                  <div className="summary-area">{s.area}</div>
                  <div className="summary-bar-wrap">
                    <div className="summary-bar">
                      <div
                        className="summary-bar-fill"
                        style={{
                          width: `${Math.min(100, (level / 30) * 100)}%`,
                          background: status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981'
                        }}
                      />
                    </div>
                    <span className="summary-level">{level.toFixed(1)}m</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterChart;
