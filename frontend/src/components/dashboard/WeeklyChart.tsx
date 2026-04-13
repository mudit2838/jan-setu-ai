import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface WeeklyData {
    name: string;
    value: number;
}

interface WeeklyChartProps {
    data: WeeklyData[];
    loading?: boolean;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ data, loading }) => {
    if (loading || data.length === 0) {
        return (
            <div className="h-[250px] w-full bg-slate-50 dark:bg-slate-900 border-[0.5px] border-slate-200 dark:border-slate-800 rounded-[12px] flex items-center justify-center animate-pulse">
                <span className="text-xs text-slate-400 font-medium">Crunching volume data...</span>
            </div>
        );
    }

    return (
        <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'medium' }}
                        interval={data.length - 2} // Only show start and end
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: 'none', 
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: '#fff' 
                        }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={index === data.length - 1 ? '#1D9E75' : '#E1F5EE'} // Highlight current week
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WeeklyChart;
