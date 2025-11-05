import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import './AdminProjectProgress.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

function AdminProjectProgress({ progressData }) {
  const data = {
    labels: ['Completed', 'In Progress', 'Pending'],
    datasets: [
      {
        data: progressData || [41, 35, 24],
        backgroundColor: [
          '#10b981',
          '#84cc16',
          '#e5e7eb'
        ],
        borderWidth: 0,
        cutout: '70%'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        borderRadius: 8
      }
    }
  };

  const total = progressData?.reduce((a, b) => a + b, 0) || 100;
  const completed = progressData?.[0] || 41;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="admin-progress-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Project Progress</h3>
      </div>
      <div className="admin-progress-content">
        <div className="admin-chart-wrapper">
          <div className="admin-chart-center">
            <div className="admin-progress-percentage">{percentage}%</div>
            <div className="admin-progress-label">Project Ended</div>
          </div>
          <Doughnut data={data} options={options} />
        </div>
        <div className="admin-progress-legend">
          <div className="admin-legend-item">
            <div className="admin-legend-dot" style={{ background: '#10b981' }}></div>
            <span>Completed</span>
          </div>
          <div className="admin-legend-item">
            <div className="admin-legend-dot" style={{ background: '#84cc16' }}></div>
            <span>In Progress</span>
          </div>
          <div className="admin-legend-item">
            <div className="admin-legend-dot" style={{ background: '#e5e7eb' }}></div>
            <span>Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProjectProgress;

