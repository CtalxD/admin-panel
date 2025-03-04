import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Dashboard.css"; // Fix the relative path

const Dashboard = () => {
  const [position, setPosition] = useState(null); // User's location
  const [permissionGranted, setPermissionGranted] = useState(false); // Location access status
  const [loading, setLoading] = useState(true); // Loading state for location fetch

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          setPermissionGranted(true);
          setLoading(false); // Once the position is fetched, stop loading
        },
        (error) => {
          console.error("Error getting location: ", error);
          setPosition({ lat: 27.7172, lng: 85.3240 }); // Default to Kathmandu
          setPermissionGranted(false);
          setLoading(false); // Stop loading even if there's an error
        },
        { enableHighAccuracy: true } // Ensures more accurate readings
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setPosition({ lat: 27.7172, lng: 85.3240 }); // Default to Kathmandu
      setPermissionGranted(false);
      setLoading(false); // Stop loading
    }
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      {!permissionGranted && (
        <div className="warning">
          Location access denied. Showing default location.
        </div>
      )}
      <div className="map-container">
        <MapContainer
          center={position}
          zoom={15}
          className="map"
          zoomControl={false} // Disable default zoom control
        >
          {/* Custom Map TileLayer for inDrive-like UI */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {/* Custom CircleMarker for user's location */}
          <CircleMarker
            center={position}
            radius={10}
            fillColor="#0078ff"
            fillOpacity={0.6}
            stroke={false}
          />
          {/* Custom zoom control */}
          <div className="leaflet-control leaflet-bar custom-zoom-control">
            <button className="leaflet-control-zoom-in">+</button>
            <button className="leaflet-control-zoom-out">−</button>
          </div>
        </MapContainer>
      </div>
    </div>
  );
};

export default Dashboard;