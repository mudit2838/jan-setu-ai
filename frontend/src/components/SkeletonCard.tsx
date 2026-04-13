import { motion } from 'framer-motion';

export default function SkeletonCard() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 animate-pulse flex flex-col gap-4"
        >
            <div className="flex justify-between items-start">
                <div className="w-1/3 h-5 bg-slate-200 rounded-md"></div>
                <div className="w-20 h-5 bg-slate-200 rounded-full"></div>
            </div>

            <div className="space-y-2 mt-2">
                <div className="w-full h-4 bg-slate-200 rounded-md"></div>
                <div className="w-5/6 h-4 bg-slate-200 rounded-md"></div>
            </div>

            <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
                <div className="w-full h-10 bg-slate-100 rounded-xl"></div>
                <div className="w-full h-10 bg-slate-100 rounded-xl"></div>
            </div>
        </motion.div>
    );
}
