'use client';

import {
    PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, ResponsiveContainer
} from 'recharts';
import { Activity } from 'lucide-react';

const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#64748b'];

interface AnalyticsDashboardProps {
    statusData: { name: string, value: number }[];
    categoryData: { name: string, value: number }[];
    priorityData: { name: string, value: number }[];
}

export default function AnalyticsDashboard({ statusData, categoryData, priorityData }: AnalyticsDashboardProps) {

    // Safeguard: If no data exists yet, show empty states
    const totalComplaints = statusData.reduce((acc, curr) => acc + curr.value, 0);

    if (totalComplaints === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <Activity className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No Analytics Data Yet</h3>
                <p className="text-slate-500 text-sm mt-1">Once complaints start arriving in your jurisdiction, interactive charts will appear here.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

            {/* Chart 1: Status Distribution (Pie Chart) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Current Status Breakdown</h2>
                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <PieTooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 2: Category Volume & Priority (Bar Chart) */}
            <div className="space-y-6 flex flex-col">

                {/* Category Bar Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 min-h-[250px]">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Issue Types by Volume</h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                            <BarTooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </div>
        </div>
    );
}
