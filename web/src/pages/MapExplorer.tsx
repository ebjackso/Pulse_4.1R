import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, Badge } from '../components/Common';
import { Button } from '../components/Button';
import { useSummaryStore } from '../stores/summaryStore';
import { useLocationStore } from '../stores/locationStore';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapExplorer: React.FC = () => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // Default to San Francisco
  const [sliderRadius, setSliderRadius] = useState(2);

  const { currentLocation } = useLocationStore();
  const { currentSummary, isLoading, error, fetchSummary } = useSummaryStore();

  // Set map center to user's current location if available
  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.latitude, currentLocation.longitude]);
      fetchSummary(currentLocation, sliderRadius);
    }
  }, [currentLocation]);

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseFloat(e.target.value);
    setSliderRadius(newRadius);
  };

  const handleViewSummary = () => {
    fetchSummary(
      {
        latitude: mapCenter[0],
        longitude: mapCenter[1],
      },
      sliderRadius
    );
  };

  const handleCenterToCurrentLocation = () => {
    if (currentLocation) {
      setMapCenter([currentLocation.latitude, currentLocation.longitude]);
      fetchSummary(currentLocation, sliderRadius);
    }
  };

  const radiusKm = sliderRadius * 1.60934; // Convert miles to km

  return (
    <div className="space-y-6 h-full">
      <div className="grid grid-cols-3 gap-4">
        {/* Map */}
        <div className="col-span-2" style={{ height: '500px' }}>
          <Card className="p-0 overflow-hidden" style={{ height: '100%' }}>
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Circle
                center={mapCenter}
                radius={radiusKm * 1000} // Convert to meters
                color="#0A66C2"
                fillColor="#0A66C2"
                fillOpacity={0.1}
              />
              <Marker position={mapCenter}>
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold">Selected Location</p>
                    <p className="text-sm text-gray-600">
                      {mapCenter[0].toFixed(4)}°, {mapCenter[1].toFixed(4)}°
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </Card>
        </div>

        {/* Controls Sidebar */}
        <div className="col-span-1 space-y-4">
          {/* Radius Slider */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Radius</h3>
            <div className="space-y-2">
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={sliderRadius}
                onChange={handleRadiusChange}
                className="w-full"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {sliderRadius} miles ({radiusKm.toFixed(1)} km)
              </p>
            </div>
          </Card>

          {/* Buttons */}
          <div className="space-y-2">
            <Button
              variant="primary"
              onClick={handleViewSummary}
              className="w-full"
              isLoading={isLoading}
            >
              View Summary
            </Button>
            {currentLocation && (
              <Button variant="secondary" onClick={handleCenterToCurrentLocation} className="w-full">
                📍 Current Location
              </Button>
            )}
          </div>

          {/* Summary Panel */}
          {currentSummary && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h3>
              <div className="space-y-2">
                <Badge label={`${currentSummary.reportCount} reports`} color="#0A66C2" />
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {currentSummary.text}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {currentSummary.generatedAt.toLocaleTimeString()}
                </p>
              </div>
            </Card>
          )}

          {error && (
            <Card>
              <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapExplorer;
