import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Dashboard.css";
import Sidebar from "./Sidebar";
import HamburgerButton from "./hamburgerButton";

const Dashboard = () => {
  const [position, setPosition] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mapRef = useRef();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const ZoomToLocation = ({ position }) => {
    const map = useMap();
  
    useEffect(() => {
      if (position) {
        map.flyTo(position, 15, {
          duration: 1,
        });
      }
    }, [position, map]);
  
    return null;
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          setPermissionGranted(true);
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location: ", error);
          setPosition({ lat: 27.7172, lng: 85.3240 });
          setPermissionGranted(false);
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setPosition({ lat: 27.7172, lng: 85.3240 });
      setPermissionGranted(false);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <HamburgerButton isOpen={sidebarOpen} toggle={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      
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
          zoomControl={false}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <CircleMarker
            center={position}
            radius={10}
            fillColor="#0078ff"
            fillOpacity={0.6}
            stroke={false}
          />
          <ZoomToLocation position={position} />
          <div className="leaflet-control leaflet-bar custom-zoom-control">
            <button onClick={() => mapRef.current.zoomIn()}>+</button>
            <button onClick={() => mapRef.current.zoomOut()}>−</button>
          </div>
        </MapContainer>
      </div>
    </div>
  );
};

export default Dashboard;