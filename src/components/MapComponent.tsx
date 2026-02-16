import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Shop } from '../types/shop';


// Fix for default marker icon in Leaflet with React
// Use a custom icon or fix the default one
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
    shops: Shop[];
    userLocation?: { lat: number; lng: number } | null;
    height?: string;
}

// Component to update map view when props change
const MapUpdater: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export const MapComponent: React.FC<MapComponentProps> = ({ shops, userLocation, height = '450px' }) => {
    // Default center (Istanbul) if no user location
    const defaultCenter: [number, number] = [41.0082, 28.9784];
    const [center, setCenter] = useState<[number, number]>(defaultCenter);
    const [zoom, setZoom] = useState(10);

    useEffect(() => {
        if (userLocation) {
            setCenter([userLocation.lat, userLocation.lng]);
            setZoom(13);
        }
    }, [userLocation]);

    // Custom Shop Marker Icon - Premium Rose Pin
    const createShopIcon = (avgRating: number) => {
        return L.divIcon({
            className: 'bg-transparent',
            html: `
                <div class="relative group">
                    <div class="absolute -inset-2 bg-secondary-500/20 rounded-full blur-md group-hover:bg-secondary-500/40 transition-all duration-500"></div>
                    <div class="relative flex flex-col items-center transition-transform duration-300 group-hover:-translate-y-2">
                        <div class="flex items-center justify-center w-10 h-10 bg-secondary-500 rounded-full shadow-lg border-2 border-white ring-2 ring-secondary-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                        <div class="mt-1 px-2 py-0.5 bg-white rounded-full shadow-md border border-gray-100 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute -bottom-6 whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            <span class="text-[10px] font-bold text-gray-800">${avgRating.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            `,
            iconSize: [40, 50],
            iconAnchor: [20, 45],
            popupAnchor: [0, -45]
        });
    };

    // Pulsing User Location Icon - Slate & Blue
    const userIcon = L.divIcon({
        className: 'bg-transparent',
        html: `
            <div class="relative flex items-center justify-center w-8 h-8">
                <span class="absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-30 animate-ping"></span>
                <div class="relative flex items-center justify-center w-4 h-4 bg-primary-600 rounded-full border-2 border-white shadow-lg ring-2 ring-primary-600/20"></div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: height, width: '100%', borderRadius: '1.5rem', zIndex: 0 }}
            className="shadow-inner bg-gray-100" // Removed thick border
            zoomControl={false} // Clean look, add control manually if needed or let user scroll
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <MapUpdater center={center} zoom={zoom} />

            {/* User Location Marker */}
            {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                    <Popup className="custom-popup" closeButton={false}>
                        <div className="px-3 py-1 font-bold text-primary-800 text-sm">📍 Buradasınız</div>
                    </Popup>
                </Marker>
            )}

            {/* Shop Markers */}
            {shops.map(shop => (
                shop.latitude && shop.longitude ? (
                    <Marker key={shop.id} position={[shop.latitude, shop.longitude]} icon={createShopIcon(shop.averageRating || 5.0)}>
                        <Popup className="premium-popup" closeButton={false} maxWidth={280} minWidth={260}>
                            <div className="overflow-hidden rounded-xl bg-white shadow-sm border-0">
                                {/* Cover Image in Popup */}
                                <div className="h-24 w-full relative bg-gray-100">
                                    <img
                                        src={shop.coverImagePath ? (shop.coverImagePath.startsWith('http') ? shop.coverImagePath : `http://localhost:5000${shop.coverImagePath}`) : `https://source.unsplash.com/random/400x200/?salon,${shop.id}`}
                                        alt={shop.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560066984-12186d30b435?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'; }}
                                    />
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-md flex items-center shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="#facc15" stroke="none" className="mr-1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                        <span className="text-[10px] font-bold text-gray-800">{shop.averageRating?.toFixed(1) || '5.0'}</span>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-bold text-primary-900 text-sm mb-1 truncate">{shop.name}</h3>
                                    <div className="flex items-center text-gray-500 text-[10px] mb-2">
                                        <span className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-md font-medium border border-primary-100">
                                            {shop.district}
                                        </span>
                                        <span className="mx-1">•</span>
                                        <span className="truncate">{shop.city}</span>
                                    </div>
                                    <a href={`/shop/${shop.id}`} className="block w-full text-center bg-secondary-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-secondary-600 transition-colors shadow-md shadow-secondary-200">
                                        İncele & Randevu Al
                                    </a>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ) : null
            ))}
        </MapContainer>
    );
};
