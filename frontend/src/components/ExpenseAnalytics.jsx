// src/components/ExpenseAnalytics.jsx
import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function ExpenseAnalytics({ expenses }) {
  if (!expenses || expenses.length === 0) {
    return null;
  }

  // 1. DATA PROCESSING: Category Breakdown
  const categoryMap = {};
  expenses.forEach((exp) => {
    const cat = exp.category || 'General';
    const amount = Number(exp.total_amount) || 0;
    categoryMap[cat] = (categoryMap[cat] || 0) + amount;
  });

  const categoryLabels = Object.keys(categoryMap);
  const categoryValues = Object.values(categoryMap);

  const doughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
        borderWidth: 2,
      },
    ],
  };

  // 2. DATA PROCESSING: Spending Trends by Date / Month
  const dateMap = {};
  expenses.forEach((exp) => {
    const rawDate = exp.date ? exp.date.substring(0, 10) : 'Unknown';
    const amount = Number(exp.total_amount) || 0;
    dateMap[rawDate] = (dateMap[rawDate] || 0) + amount;
  });

  const sortedDates = Object.keys(dateMap).sort();
  const barLabels = sortedDates;
  const barValues = sortedDates.map((d) => dateMap[d]);

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Spent (₹)',
        data: barValues,
        backgroundColor: 'rgba(54, 162, 235, 0.75)',
        borderColor: '#36A2EB',
        borderRadius: 6,
      },
    ],
  };

  // 3. DATA PROCESSING: Top Vendors Widget
  const vendorMap = {};
  expenses.forEach((exp) => {
    const vendor = exp.merchant_name || 'Unknown';
    const amount = Number(exp.total_amount) || 0;
    vendorMap[vendor] = (vendorMap[vendor] || 0) + amount;
  });

  const sortedVendors = Object.entries(vendorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4); // Top 4 vendors

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white fw-bold py-3">
        <i className="bi bi-graph-up text-primary me-2"></i>Expense Analytics & Insights
      </div>

      <div className="card-body">
        {/* Top Vendors Section */}
        <div className="mb-4">
          <h6 className="fw-bold text-secondary mb-3">
            <i className="bi bi-shop me-1 text-danger"></i> Top Spending Vendors
          </h6>
          <div className="row g-2">
            {sortedVendors.map(([vendor, total], idx) => (
              <div className="col-md-3 col-sm-6" key={vendor}>
                <div className="p-3 border rounded bg-light text-center shadow-sm">
                  <span className="badge bg-dark rounded-pill mb-1">Rank #{idx + 1}</span>
                  <h6 className="fw-bold text-truncate mb-1">{vendor}</h6>
                  <span className="fw-bold text-success fs-5">₹{total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="my-4" />

        {/* Charts Row */}
        <div className="row g-4 align-items-center">
          {/* Doughnut Chart: Category Breakdown */}
          <div className="col-lg-5 col-md-6 text-center border-end">
            <h6 className="fw-bold text-secondary mb-3">
              <i className="bi bi-pie-chart-fill me-1 text-info"></i> Category Breakdown
            </h6>
            <div style={{ maxHeight: '280px', position: 'relative' }}>
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Bar Chart: Spending Trends */}
          <div className="col-lg-7 col-md-6">
            <h6 className="fw-bold text-secondary mb-3">
              <i className="bi bi-bar-chart-fill me-1 text-primary"></i> Daily Spending Trends
            </h6>
            <div style={{ maxHeight: '280px', position: 'relative' }}>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (val) => `₹${val}`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}