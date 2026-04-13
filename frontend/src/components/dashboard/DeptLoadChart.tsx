import React from 'react';
import { motion } from 'framer-motion';

interface DeptData {
    name: string;
    count: number;
}

interface DeptLoadChartProps {
    data: DeptData[];
    loading?: boolean;
}

const DeptLoadChart: React.FC<DeptLoadChartProps> = ({ data, loading }) => {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    
    // Design spec colors
    const colors = ['#378ADD', '#1D9E75', '#BA7517', '#D85A30', '#7C3AED'];

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="animate-pulse">
                        <div className="h-2 w-20 bg-slate-100 dark:bg-slate-800 rounded mb-2"></div>
                        <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {data.map((dept, index) => (
                <div key={dept.name} className="group">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{dept.name}</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{dept.count}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden border-[0.5px] border-slate-200 dark:border-slate-800">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(dept.count / maxCount) * 100}%` }}
                            transition={{ duration: 1, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: colors[index % colors.length] }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DeptLoadChart;
