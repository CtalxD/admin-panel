// components/Dashboard.js
import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Dashboard.css";
import Sidebar from "./Sidebar";
import HamburgerButton from "./hamburgerButton";
import L from "leaflet";
import { io } from "socket.io-client";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const API_URL = "http://localhost:5000";

const DriverMarker = ({ driver }) => {
  const icon = L.icon({
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <Marker
      position={[driver.latitude, driver.longitude]}
      icon={icon}
    >
      <Popup>
        <div className="driver-popup">
          <h3>{driver.driver?.name || "Driver"}</h3>
          <p>Vehicle: {driver.driver?.vehicleNumber || "N/A"}</p>
          <p>Phone: {driver.driver?.phone || "N/A"}</p>
          <p>Status: {driver.isOnline ? "Online" : "Offline"}</p>
          <p>
            Last updated: {new Date(driver.lastUpdated).toLocaleTimeString()}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

const Dashboard = () => {
  const [position, setPosition] = useState({ lat: 27.7172, lng: 85.324 });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const mapRef = useRef();
  const socketRef = useRef();

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

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to admin socket");
    });

    socket.on("driver-location-update", (data) => {
      setDrivers(prev => {
        const existing = prev.find(d => d.userId === data.userId);
        if (existing) {
          return prev.map(d => 
            d.userId === data.userId ? { ...d, ...data, lastUpdated: new Date() } : d
          );
        }
        return [...prev, { ...data, lastUpdated: new Date() }];
      });
    });

    socket.on("driver-status-changed", (data) => {
      setDrivers(prev => {
        const existing = prev.find(d => d.userId === data.userId);
        if (existing) {
          return prev.map(d => 
            d.userId === data.userId ? { ...d, isOnline: data.status } : d
          );
        }
        return prev;
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Fetch initial online drivers
  useEffect(() => {
    const fetchOnlineDrivers = async () => {
      try {
        const response = await fetch(`${API_URL}/locations/online`, {
          credentials: "include",
        });
        const data = await response.json();
        setDrivers(data.map(driver => ({
          ...driver,
          lastUpdated: new Date(driver.lastUpdated)
        })));                    
      } catch (error) {
        console.error("Error fetching online drivers:", error);
      }
    };

    fetchOnlineDrivers();
  }, []);

  // Get admin's current location
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
          setPermissionGranted(false);
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.log("Geolocation not supported");
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
          
          {/* Current admin position */}
          <CircleMarker
            center={position}
            radius={10}
            fillColor="#0078ff"
            fillOpacity={0.6}
            stroke={false}
          />
          
          {/* Online drivers */}
          {drivers
            .filter(driver => driver.isOnline)
            .map(driver => (
              <DriverMarker key={driver.userId} driver={driver} />
            ))}
          
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