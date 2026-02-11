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

    // Custom Shop Marker Icon
    const createShopIcon = () => {
        return L.divIcon({
            className: 'bg-transparent',
            html: `
                <div class="relative group">
                    <div class="absolute -inset-1 bg-primary-500/30 rounded-full blur-sm group-hover:bg-primary-500/50 transition-all"></div>
                    <div class="relative flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-primary-600 shadow-lg transform transition-transform group-hover:scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-600"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                    </div>
                    <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-primary-600"></div>
                </div>
            `,
            iconSize: [40, 48],
            iconAnchor: [20, 48],
            popupAnchor: [0, -48]
        });
    };

    // Pulsing User Location Icon
    const userIcon = L.divIcon({
        className: 'bg-transparent',
        html: `
            <div class="relative flex items-center justify-center w-6 h-6">
                <span class="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-white shadow-sm"></span>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: height, width: '100%', borderRadius: '1rem', zIndex: 0 }}
            className="shadow-xl border-4 border-white"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapUpdater center={center} zoom={zoom} />

            {/* User Location Marker */}
            {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                    <Popup className="custom-popup">
                        <div className="font-semibold text-gray-800">Sizin Konumunuz</div>
                    </Popup>
                </Marker>
            )}

            {/* Shop Markers */}
            {shops.map(shop => (
                shop.latitude && shop.longitude ? (
                    <Marker key={shop.id} position={[shop.latitude, shop.longitude]} icon={createShopIcon()}>
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <h3 className="font-bold text-gray-900 text-base mb-1">{shop.name}</h3>
                                <div className="flex items-center text-gray-500 text-xs mb-2">
                                    <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                                        {shop.district}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-xs mb-3 line-clamp-2">{shop.description || 'Hizmetlerimiz için detayları inceleyin.'}</p>
                                <a href={`/shop/${shop.id}`} className="block w-full text-center bg-primary-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                                    Randevu Al
                                </a>
                            </div>
                        </Popup>
                    </Marker>
                ) : null
            ))}
        </MapContainer>
    );
};
