import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './AdminAnalytics.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function AdminAnalytics({ analyticsData }) {
  const data = {
    labels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    datasets: [
      {
        label: 'Meetings',
        data: analyticsData?.dailyMeetings || [12, 19, 15, 25, 22, 18, 14],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(229, 231, 235, 0.8)',
          'rgba(229, 231, 235, 0.8)'
        ],
        borderRadius: 8,
        borderSkipped: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        borderRadius: 8,
        titleFont: {
          size: 14,
          weight: '600'
        },
        bodyFont: {
          size: 13
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    }
  };

  return (
    <div className="admin-analytics-card">
      <div className="admin-card-header">
        <h3 className="admin-card-title">Meeting Analytics</h3>
      </div>
      <div className="admin-chart-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default AdminAnalytics;

