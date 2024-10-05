import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import customMarkerIcon from '../../assets/icons/custom-marker.png';
import lostMarkerIcon from '../../assets/icons/lost-marker.png'; // Іконка для зниклого дрона

const customIcon = new L.Icon({
  iconUrl: customMarkerIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const lostIcon = new L.Icon({
  iconUrl: lostMarkerIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface Target {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}


interface MapProps {
  apiKey: string;
}

const ukraineCenter: LatLngExpression = [48.0, 31.0]; // Центр України

const Map: React.FC<MapProps> = ({ apiKey }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [lostTargets, setLostTargets] = useState<Target[]>([]);
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:8080?apiKey=${apiKey}`);

    socket.onopen = () => {
      setIsApiKeyValid(true);
    };

    socket.onmessage = (event) => {
      const updatedTargets: Target[] = JSON.parse(event.data);

      setTargets((prevTargets) => {
        const activeTargets = updatedTargets;

        const newlyLostTargets = prevTargets.filter(
          (t) => !updatedTargets.find((u) => u.id === t.id)
        );

        setLostTargets((prevLostTargets) => [
          ...prevLostTargets,
          ...newlyLostTargets.filter(
            (lostTarget) => !prevLostTargets.find((lt) => lt.id === lostTarget.id)
          ),
        ]);

        return activeTargets;
      });
    };

    socket.onerror = () => {
      setIsApiKeyValid(false);
    };

    socket.onclose = () => {
      if (isApiKeyValid === null) {
        setIsApiKeyValid(false);
      }
    };

    return () => {
      socket.close();
    };
  }, [apiKey]);

  useEffect(() => {
    const timers = lostTargets.map((target) =>
      setTimeout(() => {
        setLostTargets((prevLostTargets) => prevLostTargets.filter((t) => t.id !== target.id));
      }, 5 * 60 * 1000)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [lostTargets]);

  return (
    <div>
      <div style={{display: 'flex', alignItems: 'center'}}>
        <h1 style={{marginBlock: '0 15px'}}>Список дронів</h1>
        {isApiKeyValid === false && <span style={{ color: 'red' }}>Ключ невірний або сервер не відповідає</span>}
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', gap: '15px' }}>
        {targets.map((target) => (
          <li key={target.id} style={{ color: 'white' }}>
            {target.name} (ID: {target.id})
          </li>
        ))}
        {lostTargets.map((target) => (
          <li
            key={target.id}
            style={{
              color: 'red',
              textDecoration: 'line-through',
            }}
          >
            {target.name} (ID: {target.id})
          </li>
        ))}
      </ul>

      {isApiKeyValid !== false && (
        <MapContainer center={ukraineCenter} zoom={6} style={{ height: '75vh', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {targets.map((target) => (
            <Marker
              key={target.id}
              position={[target.latitude, target.longitude] as LatLngExpression}
              icon={customIcon}
            >
              <Popup>
                {target.name} <br /> Latitude: {target.latitude} <br /> Longitude: {target.longitude}
              </Popup>
            </Marker>
          ))}

          {lostTargets.map((target) => (
            <Marker
              key={target.id}
              position={[target.latitude, target.longitude] as LatLngExpression}
              icon={lostIcon}
            >
              <Popup>
                {target.name} <br /> Latitude: {target.latitude} <br /> Longitude: {target.longitude} <br /> Status: Lost
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
};

export default Map;
