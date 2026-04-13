import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    delta?: {
        value: number;
        isGood: boolean;
        label: string;
    };
    loading?: boolean;
    color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, delta, loading, color = '#378ADD' }) => {
    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 border-[0.5px] border-slate-200 dark:border-slate-800 rounded-[12px] p-5 h-32 animate-pulse">
                <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded mb-4"></div>
                <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 border-[0.5px] border-slate-200 dark:border-slate-800 rounded-[12px] p-5 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
            <div className="flex flex-col h-full justify-between">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">{value}</h3>
                </div>
                
                {delta && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className={`flex items-center text-[10px] font-bold ${delta.isGood ? 'text-[#1D9E75]' : 'text-[#D85A30]'}`}>
                            {delta.value > 0 ? (delta.isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />) : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(delta.value)}%
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-600 font-medium tracking-tight whitespace-nowrap">{delta.label}</span>
                    </div>
                )}
            </div>

            {/* Bottom load bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-50 dark:bg-slate-800/50">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '70%' }}
                    className="h-full"
                    style={{ backgroundColor: color }}
                />
            </div>
        </div>
    );
};

export default MetricCard;
