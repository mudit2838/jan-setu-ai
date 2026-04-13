'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons throwing 404s in Webpack/Next.js environments
const icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

export default function MapDisplay({ latitude, longitude, height = '200px' }: { latitude: string | number, longitude: string | number, height?: string }) {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) return null;

    return (
        <div style={{ height, width: '100%', zIndex: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }} className="shadow-sm">
            <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 10 }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                />
                <Marker position={[lat, lng]} icon={icon}>
                    <Popup>
                        <div className="font-semibold text-slate-800">Tagged Location</div>
                        <div className="text-xs text-slate-500">{lat.toFixed(5)}, {lng.toFixed(5)}</div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
