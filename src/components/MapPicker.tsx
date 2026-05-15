import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '../api/axios';

// Leaflet default icon fix
L.Marker.prototype.options.icon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export interface MapPickerProps {
    latitude: number | null;
    longitude: number | null;
    onLocationChange: (lat: number, lng: number) => void;
    city?: string;
    district?: string;
    neighborhood?: string;
    street?: string;
}

type PrecisionLevel = 'street' | 'neighborhood' | 'district' | 'city' | null;

const TURKEY_CENTER: [number, number] = [39.1, 35.7];
const DEFAULT_ZOOM = 6;
const PIN_ZOOM = 19;

const PRECISION_MESSAGES: Record<Exclude<PrecisionLevel, null>, { text: string; color: string }> = {
    street:       { text: 'Sokak bazında konumlandırıldı. Pini kontrol edip hassas ayarlayın.',              color: 'text-green-700 bg-green-50 border-green-200' },
    neighborhood: { text: 'Mahalle bazında konumlandırıldı. Pini sokağa sürükleyerek hassaslaştırın.',       color: 'text-blue-700 bg-blue-50 border-blue-200' },
    district:     { text: 'İlçe bazında konumlandırıldı. Pini doğru sokağa sürükleyin.',                     color: 'text-amber-700 bg-amber-50 border-amber-200' },
    city:         { text: 'Yalnızca şehir bazında bulunabildi. Pini tam konuma sürüklemeniz gerekiyor.',      color: 'text-orange-700 bg-orange-50 border-orange-200' },
};

async function searchNominatim(q: string): Promise<[number, number] | null> {
    const res = await api.get('/Geocoding/search', { params: { q } });
    const data = res.data;
    if (!Array.isArray(data) || data.length === 0) return null;
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
}

async function geocodeProgressive(
    city?: string, district?: string, neighborhood?: string, street?: string
): Promise<{ lat: number; lng: number; precision: PrecisionLevel } | null> {
    const attempts: Array<{ query: string; precision: PrecisionLevel }> = [];

    if (street && neighborhood && district && city)
        attempts.push({ query: `${street}, ${neighborhood}, ${district}, ${city}`, precision: 'street' });
    if (neighborhood && district && city)
        attempts.push({ query: `${neighborhood}, ${district}, ${city}`, precision: 'neighborhood' });
    if (district && city)
        attempts.push({ query: `${district}, ${city}`, precision: 'district' });
    if (city)
        attempts.push({ query: city, precision: 'city' });

    for (const attempt of attempts) {
        const result = await searchNominatim(attempt.query);
        if (result) return { lat: result[0], lng: result[1], precision: attempt.precision };
    }
    return null;
}

// Haritayı belirtilen koordinata animasyonla taşır
const FlyTo: React.FC<{ target: [number, number] | null }> = ({ target }) => {
    const map = useMap();
    useEffect(() => {
        if (target) map.flyTo(target, PIN_ZOOM, { duration: 1 });
    }, [target, map]);
    return null;
};

// Haritaya tıklanınca pin koy
const ClickHandler: React.FC<{ onClick: (lat: number, lng: number) => void }> = ({ onClick }) => {
    useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
    return null;
};

const MapPicker: React.FC<MapPickerProps> = ({
    latitude, longitude, onLocationChange,
    city, district, neighborhood, street,
}) => {
    const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [precision, setPrecision] = useState<PrecisionLevel>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const markerRef = useRef<L.Marker>(null);

    const hasPin = latitude !== null && longitude !== null;
    const pinPosition: [number, number] | null = hasPin ? [latitude!, longitude!] : null;

    const handleDragEnd = () => {
        const latlng = markerRef.current?.getLatLng();
        if (latlng) {
            onLocationChange(latlng.lat, latlng.lng);
            setPrecision('street');
        }
    };

    const handleMapClick = (lat: number, lng: number) => {
        onLocationChange(lat, lng);
        setPrecision('street');
        setErrorMsg(null);
    };

    const handleGeocode = async () => {
        if (!city && !district) { setErrorMsg('Önce en az il bilgisini doldurun.'); return; }
        setIsGeocoding(true);
        setErrorMsg(null);
        setPrecision(null);
        try {
            const result = await geocodeProgressive(city, district, neighborhood, street);
            if (!result) { setErrorMsg('Konum bulunamadı. Pini haritaya kendiniz yerleştirin.'); return; }
            onLocationChange(result.lat, result.lng);
            setFlyTarget([result.lat, result.lng]);
            setPrecision(result.precision);
        } catch {
            setErrorMsg('Sunucuya ulaşılamadı. Pini haritaya kendiniz yerleştirin.');
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            setErrorMsg('Tarayıcınız konum özelliğini desteklemiyor.');
            return;
        }
        setIsLocating(true);
        setErrorMsg(null);
        setPrecision(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                onLocationChange(lat, lng);
                setFlyTarget([lat, lng]);
                setPrecision('street');
                setIsLocating(false);
            },
            (error) => {
                setErrorMsg('Konum alınamadı. Lütfen tarayıcı izinlerini kontrol edin.');
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const precisionInfo = precision ? PRECISION_MESSAGES[precision] : null;

    return (
        <div className="mt-6 border border-gray-200 bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header - Toggleable */}
            <div 
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsMapOpen(!isMapOpen)}
            >
                <div>
                    <p className="text-sm font-semibold text-gray-800">Haritada Konumu İşaretle {hasPin && <span className="text-green-600 ml-1">✓</span>}</p>
                    <p className="text-xs text-gray-500">Koordinat belirlemek için haritayı kullanın</p>
                </div>
                <div className="text-gray-400">
                    {isMapOpen ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Expandable Content */}
            {isMapOpen && (
                <div className="p-5 border-t border-gray-100 space-y-4">
                    {/* Hata mesajı */}
                    {errorMsg && (
                        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorMsg}</p>
                    )}

                    {/* Hassasiyet uyarısı */}
                    {precisionInfo && (
                        <p className={`text-xs border rounded-lg px-3 py-2 ${precisionInfo.color}`}>
                            📍 {precisionInfo.text}
                        </p>
                    )}

                    {/* Harita */}
                    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '460px' }}>
                        <MapContainer
                            center={pinPosition ?? TURKEY_CENTER}
                            zoom={pinPosition ? PIN_ZOOM : DEFAULT_ZOOM}
                            maxZoom={19}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                maxZoom={19}
                            />
                            <FlyTo target={flyTarget} />
                            <ClickHandler onClick={handleMapClick} />
                            {pinPosition && (
                                <Marker
                                    position={pinPosition}
                                    draggable
                                    ref={markerRef}
                                    eventHandlers={{ dragend: handleDragEnd }}
                                />
                            )}
                        </MapContainer>
                    </div>

                    {/* Koordinat gösterimi ve Butonlar (Alt Kısım) */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={handleGeocode}
                                disabled={isGeocoding || isLocating}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-3 py-2 rounded-lg transition-colors"
                            >
                                {isGeocoding ? (
                                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                    </svg>
                                )}
                                {isGeocoding ? 'Aranıyor...' : 'Adresimden Bul'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCurrentLocation}
                                disabled={isGeocoding || isLocating}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white px-3 py-2 rounded-lg transition-colors"
                            >
                                {isLocating ? (
                                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 8.2c0 7.3-8 11.8-8 11.8z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                )}
                                {isLocating ? 'Bulunuyor...' : 'Anlık Konumdan Bul'}
                            </button>
                        </div>

                        {hasPin && (
                            <p className="text-xs text-gray-400 font-mono">
                                {latitude!.toFixed(6)}° K &nbsp;{longitude!.toFixed(6)}° D
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPicker;
