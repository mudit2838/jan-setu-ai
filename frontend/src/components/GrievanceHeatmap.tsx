'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { Loader2, Map as MapIcon, Layers, Filter } from 'lucide-react';
import axios from 'axios';
import API_ROUTES from '@/lib/apiConfig';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

interface HeatmapPoint {
    lat: number;
    lng: number;
    district: string;
    weight: number;
    dept: string;
}

export default function GrievanceHeatmap() {
    const [points, setPoints] = useState<HeatmapPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [L, setL] = useState<typeof import('leaflet') | null>(null);

    useEffect(() => {
        // Initialize Leaflet icons on client side
        import('leaflet').then((leaflet) => {
            setL(leaflet);
            delete (leaflet.Icon.Default.prototype as typeof leaflet.Icon.Default.prototype & { _getIconUrl?: string })._getIconUrl;
            leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
        });

        // Fetch heatmap data
        const fetchHeatmap = async () => {
            try {
                const token = localStorage.getItem('token');
                const { data } = await axios.get(API_ROUTES.HEATMAP, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPoints(data);
            } catch (error) {
                console.error('Heatmap fetch failed', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHeatmap();
    }, []);

    if (loading || !L) {
        return (
            <div className="h-[400px] w-full bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-3 border border-slate-800">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm font-medium animate-pulse">Aggregating State Surveillance Data...</p>
            </div>
        );
    }

    // Centered over Uttar Pradesh
    const upCenter: [number, number] = [26.8467, 80.9462];

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <MapIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold tracking-tight text-lg">Grievance Intensity Command Center</h3>
                        <p className="text-xs text-slate-400 tracking-wide uppercase">Live surveillance across 75 districts of Uttar Pradesh</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-extrabold rounded-full uppercase tracking-widest animate-pulse">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Live Stream
                    </span>
                </div>
            </div>

            <div className="h-[450px] w-full relative z-0">
                <MapContainer center={upCenter} zoom={7} style={{ height: '100%', width: '100%', background: '#0f172a' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTO'
                    />
                    
                    {points.map((p, idx) => (
                        <Marker key={idx} position={[p.lat, p.lng]}>
                            <Popup className="custom-popup">
                                <div className="p-1">
                                    <h4 className="font-bold text-slate-900 text-sm mb-1">{p.district} District</h4>
                                    <div className="flex flex-col gap-1 mb-2">
                                        <span className={`text-[10px] w-fit px-2 py-0.5 rounded-full font-bold ${p.weight === 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {p.weight === 3 ? 'CRITICAL' : 'HIGH'} INTENSITY
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-medium">Department: {p.dept || 'Admin'}</span>
                                    </div>
                                    <button className="w-full bg-slate-900 text-white text-[10px] py-1.5 rounded-lg font-bold hover:bg-slate-800 transition">Analyze Zone</button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Overlays */}
                <div className="absolute bottom-6 left-6 z-[1000] bg-slate-950/90 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-2xl">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Status Legend</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 group">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] group-hover:scale-110 transition-transform"></div>
                            <span className="text-xs text-slate-300 font-medium tracking-tight">Critical Escalation</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.7)] group-hover:scale-110 transition-transform"></div>
                            <span className="text-xs text-slate-300 font-medium tracking-tight">High Volume Zone</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.7)] group-hover:scale-110 transition-transform"></div>
                            <span className="text-xs text-slate-300 font-medium tracking-tight">Standard Priority</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                .leaflet-container {
                    background: #0f172a !important;
                }
                .custom-popup .leaflet-popup-content-wrapper {
                    border-radius: 12px;
                    padding: 0;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
                }
                .custom-popup .leaflet-popup-content {
                    margin: 12px;
                    width: 190px !important;
                }
                .leaflet-bar {
                    border: none !important;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.5) !important;
                }
                .leaflet-bar a {
                    background: #1e293b !important;
                    color: white !important;
                    border: 1px solid #334155 !important;
                }
            `}</style>
        </div>
    );
}
