import React from 'react';
import { AlertCircle, Clock, ShieldAlert } from 'lucide-react';

interface Escalation {
    _id: string;
    title: string;
    assignedToLevel: string;
    updatedAt: string;
    priority: string;
}

interface EscalationListProps {
    data: Escalation[];
    loading?: boolean;
    onItemClick?: (complaint: Escalation) => void;
}

const EscalationList: React.FC<EscalationListProps> = ({ data, loading, onItemClick }) => {

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex gap-4 p-4 border-[0.5px] border-slate-100 dark:border-slate-800 rounded-xl">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded"></div>
                            <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const getSeverityStyles = (priority: string) => {
        switch (priority) {
            case 'Critical': return { bg: 'bg-[#D85A30]/10', text: 'text-[#D85A30]', icon: ShieldAlert };
            case 'High': return { bg: 'bg-[#BA7517]/10', text: 'text-[#BA7517]', icon: AlertCircle };
            default: return { bg: 'bg-[#378ADD]/10', text: 'text-[#378ADD]', icon: Clock };
        }
    };

    return (
        <div className="space-y-3">
            {data.map((esc) => {
                const styles = getSeverityStyles(esc.priority);
                const timeAgo = new Date(esc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                    <div 
                        key={esc._id} 
                        onClick={() => onItemClick?.(esc)}
                        className="flex gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/50 border-[0.5px] border-slate-200/60 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors group cursor-pointer"
                    >
                        <div className={`w-10 h-10 ${styles.bg} ${styles.text} rounded-xl flex items-center justify-center shrink-0 border-[0.5px] border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105`}>
                            <styles.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[13px] font-medium text-slate-900 dark:text-white truncate mb-0.5 tracking-tight">{esc.title}</h4>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{esc.assignedToLevel} Level</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-600 font-medium tracking-tight">Escalated at {timeAgo}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
            {data.length === 0 && (
                <div className="py-10 text-center">
                    <p className="text-xs text-slate-400 font-medium">No active escalations found in territory.</p>
                </div>
            )}
        </div>
    );
};

export default EscalationList;
