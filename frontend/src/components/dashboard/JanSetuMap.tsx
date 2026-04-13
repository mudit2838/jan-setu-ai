'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface ComplaintMapData {
    _id: string;
    title: string;
    department: string;
    priority: string;
    status: string;
    description?: string;
    assignedToLevel?: string;
    isActionable?: boolean;
    citizen?: {
        name: string;
        mobile?: string;
        email?: string;
    };
    block?: string;
    village?: string;
    createdAt?: string;
    slaDueDate?: string;
    issueImage?: string;
    latitude?: string;
    longitude?: string;
    [key: string]: unknown;
}

interface JanSetuMapProps {
    complaints: ComplaintMapData[];
    onMarkerClick: (complaint: ComplaintMapData) => void;
}

const JanSetuMap: React.FC<JanSetuMapProps> = ({ complaints, onMarkerClick }) => {
    // Default center to Lucknow
    const center: [number, number] = [26.8467, 80.9462];

    return (
        <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border-[0.5px] border-slate-200 shadow-inner bg-slate-50 relative z-0">
            <MapContainer 
                center={center} 
                zoom={11} 
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {complaints
                    .filter(c => c.latitude && c.longitude)
                    .map((c) => (
                        <Marker 
                            key={c._id} 
                            position={[parseFloat(c.latitude!), parseFloat(c.longitude!)]}
                            icon={icon}
                            eventHandlers={{
                                click: () => onMarkerClick(c)
                            }}
                        >
                            <Popup>
                                <div className="p-1">
                                    <h4 className="text-[12px] font-bold text-slate-900 mb-1">{c.title}</h4>
                                    <p className="text-[10px] text-slate-500 mb-2">{c.department}</p>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                        c.priority === 'High' || c.priority === 'Critical' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {c.priority} Priority
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
            </MapContainer>
            
            <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur px-3 py-2 rounded-lg border-[0.5px] border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Live Coverage</p>
                <p className="text-[12px] font-bold text-slate-900">{complaints.length} Grievances Active</p>
            </div>
        </div>
    );
};

export default JanSetuMap;
