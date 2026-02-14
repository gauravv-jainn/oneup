import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import Card from '../common/Card';
import { useTheme } from '../../context/ThemeContext';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

const DashboardCharts = ({ consumptionData, topComponentsData, productionData }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Chart Options
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: isDark ? '#94a3b8' : '#64748b',
                    font: { family: 'Inter', size: 11 }
                }
            },
            tooltip: {
                backgroundColor: isDark ? 'rgba(20, 20, 20, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                titleColor: isDark ? '#fff' : '#1e293b',
                bodyColor: isDark ? '#cbd5e1' : '#475569',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                titleFont: { family: 'Inter', weight: 600 },
            }
        },
        scales: {
            x: {
                grid: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
                ticks: { color: isDark ? '#94a3b8' : '#64748b' }
            },
            y: {
                grid: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
                ticks: { color: isDark ? '#94a3b8' : '#64748b' }
            }
        }
    };

    // Data - Monthly Consumption (Bar)
    const barData = {
        labels: consumptionData.labels || [],
        datasets: [
            {
                label: 'Consumption',
                data: consumptionData.values || [],
                backgroundColor: 'rgba(0, 150, 204, 0.8)',
                borderRadius: 4,
            },
        ],
    };

    // Data - Top Components (Doughnut)
    const doughnutData = {
        labels: topComponentsData.labels || [],
        datasets: [
            {
                data: topComponentsData.values || [],
                backgroundColor: [
                    'rgba(0, 212, 255, 0.8)', // Neon Blue
                    'rgba(0, 255, 135, 0.8)', // Neon Green
                    'rgba(255, 140, 0, 0.8)', // Neon Orange
                    'rgba(255, 59, 92, 0.8)', // Neon Red
                    'rgba(168, 85, 247, 0.8)', // Neon Purple
                ],
                borderWidth: 0,
                hoverOffset: 4,
            },
        ],
    };

    const doughnutOptions = {
        ...commonOptions,
        cutout: '65%',
        scales: { x: { display: false }, y: { display: false } }
    };

    // Data - Production Trend (Line)
    const lineData = {
        labels: productionData.labels || [],
        datasets: [
            {
                label: 'Production Output',
                data: productionData.values || [],
                fill: true,
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(0, 179, 104, 0.5)');
                    gradient.addColorStop(1, 'rgba(0, 179, 104, 0.0)');
                    return gradient;
                },
                borderColor: '#00b368',
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#00b368',
                pointRadius: 4,
                pointHoverRadius: 6
            },
        ],
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-blue-500/10">
                <h3 className="text-lg font-bold text-primary mb-4">Monthly Consumption</h3>
                <div className="h-64">
                    <Bar options={commonOptions} data={barData} />
                </div>
            </Card>

            <Card className="lg:col-span-1 border-purple-500/10">
                <h3 className="text-lg font-bold text-primary mb-4">Top Used Components</h3>
                <div className="h-64 relative">
                    <Doughnut options={doughnutOptions} data={doughnutData} />
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-primary opacity-50">5</span>
                    </div>
                </div>
            </Card>

            <Card className="lg:col-span-1 border-green-500/10">
                <h3 className="text-lg font-bold text-primary mb-4">Production Trend</h3>
                <div className="h-64">
                    <Line options={commonOptions} data={lineData} />
                </div>
            </Card>
        </div>
    );
};

export default DashboardCharts;
