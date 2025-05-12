import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/Dashboard.css";
import Sidebar from "./Sidebar";
import HamburgerButton from "./hamburgerButton";
import { io } from "socket.io-client";

// Create bus icon for active drivers
const busIcon = new L.DivIcon({
  html: `<div class="bus-marker">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bus">
            <path d="M8 6v6"></path>
            <path d="M15 6v6"></path>
            <path d="M2 12h19.6"></path>
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
            <circle cx="7" cy="18" r="2"></circle>
            <path d="M9 18h5"></path>
            <circle cx="16" cy="18" r="2"></circle>
          </svg>
        </div>`,
  className: 'bus-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

// Create bus stop icon
const busStopIcon = new L.DivIcon({
  html: `<div class="bus-stop-marker">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e91e63" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
          </svg>
        </div>`,
  className: 'bus-stop-div-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

const API_URL = "http://localhost:5000";

const Dashboard = () => {
  const [position, setPosition] = useState({ lat: 27.7172, lng: 85.3240 }); // Default to Kathmandu
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drivers, setDrivers] = useState({});
  const [busStops, setBusStops] = useState([]);
  const [busStopsLoading, setBusStopsLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showBusStops, setShowBusStops] = useState(true);
  const [selectedBusStop, setSelectedBusStop] = useState(null);
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const locationUpdateIntervalRef = useRef(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleBusStops = () => {
    setShowBusStops(!showBusStops);
  };

  // Component to fly to user's location when it changes
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

  // Initialize Socket.io connection
  useEffect(() => {
    // Clean up previous socket connection if exists
    if (socketRef.current) {
      socketRef.current.disconnect();
      clearInterval(locationUpdateIntervalRef.current);
    }

    setConnectionStatus("Connecting to server...");

    // Create new socket connection
    socketRef.current = io(API_URL, {
      withCredentials: true,
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    const socket = socketRef.current;

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to socket server with ID:", socket.id);
      setSocketConnected(true);
      setConnectionStatus("Connected");
      
      // Authenticate as admin
      socket.emit("authenticate", {
        userType: 'admin',
        userId: 'dashboard-user'
      });
      
      // Request current drivers immediately after connection
      socket.emit("get-current-drivers");

      // Set up interval to request location updates every 5 seconds
      locationUpdateIntervalRef.current = setInterval(() => {
        socket.emit("request-location-updates");
      }, 5000);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);
      setConnectionStatus("Connection error. Retrying...");
      clearInterval(locationUpdateIntervalRef.current);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setSocketConnected(false);
      setConnectionStatus(`Disconnected: ${reason}`);
      clearInterval(locationUpdateIntervalRef.current);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      setSocketConnected(true);
      setConnectionStatus("Reconnected");
      
      // Re-request current drivers on reconnection
      socket.emit("get-current-drivers");

      // Restart the location update interval
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = setInterval(() => {
        socket.emit("request-location-updates");
      }, 5000);
    });

    // Driver location and status events
    socket.on("driver-location-updated", (data) => {
      console.log("Driver location updated:", data);
      
      setDrivers(prev => {
        // Only update if the driver is not already in our state or if coordinates are different
        if (!prev[data.userId] || 
            prev[data.userId].latitude !== data.latitude || 
            prev[data.userId].longitude !== data.longitude) {
          return {
            ...prev,
            [data.userId]: {
              userId: data.userId,
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: data.accuracy || 0,
              isOnline: true,
              lastUpdated: Date.now(),
              userType: data.userType || 'driver',
              name: data.name || `Driver ${data.userId.slice(0, 5)}`,
              vehicle: data.vehicle || 'Bus',
              rating: data.rating || (Math.random() * 2 + 3).toFixed(1),
            },
          };
        }
        return prev;
      });
    });

    socket.on("location-updated", (data) => {
      if (data.isDriver) {
        console.log("Driver location update received:", data);
        setDrivers(prev => {
          const userId = data.userId || data.socketId;
          // Only update if the driver is not already in our state or if coordinates are different
          if (!prev[userId] || 
              prev[userId].latitude !== data.latitude || 
              prev[userId].longitude !== data.longitude) {
            return {
              ...prev,
              [userId]: {
                userId: userId,
                socketId: data.socketId,
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: data.accuracy || 0,
                isOnline: true,
                lastUpdated: Date.now(),
                userType: 'driver',
                name: data.name || `Driver ${userId.slice(0, 5)}`,
                vehicle: data.vehicle || 'Bus',
                rating: data.rating || (Math.random() * 2 + 3).toFixed(1),
              },
            };
          }
          return prev;
        });
      }
    });

    socket.on("driver-status-changed", (data) => {
      console.log("Driver status changed:", data.userId, data.status);
      
      if (!data.status) {
        // If driver is going offline, remove them completely
        setDrivers(prev => {
          const newDrivers = {...prev};
          delete newDrivers[data.userId];
          return newDrivers;
        });
      } else {
        // If driver is coming online, add them
        setDrivers(prev => ({
          ...prev,
          [data.userId]: {
            userId: data.userId,
            isOnline: data.status,
            latitude: data.latitude || 0,
            longitude: data.longitude || 0,
            accuracy: data.accuracy || 0,
            lastUpdated: Date.now(),
            name: data.name || `Driver ${data.userId.slice(0, 5)}`,
            vehicle: data.vehicle || 'Bus',
            rating: data.rating || (Math.random() * 2 + 3).toFixed(1),
          }
        }));
      }
    });

    socket.on("status-changed", (data) => {
      if (data.isDriver) {
        console.log("Driver status changed (via status-changed):", data);
        const userId = data.userId || data.socketId;
        
        if (!data.status) {
          // Driver is going offline - remove them
          setDrivers(prev => {
            const newDrivers = {...prev};
            delete newDrivers[userId];
            return newDrivers;
          });
        } else {
          // Driver is coming online - add them
          setDrivers(prev => ({
            ...prev,
            [userId]: {
              userId: userId,
              socketId: data.socketId,
              isOnline: data.status,
              lastUpdated: Date.now(),
              name: data.name || `Driver ${userId.slice(0, 5)}`,
              vehicle: data.vehicle || 'Bus',
              rating: data.rating || (Math.random() * 2 + 3).toFixed(1),
            }
          }));
        }
      }
    });

    socket.on("current-drivers", (drivers) => {
      console.log("Received current drivers:", drivers);
      const driversMap = {};
      
      drivers.forEach(driver => {
        // Only include online drivers
        if (driver.isOnline) {
          driversMap[driver.userId] = {
            ...driver,
            lastUpdated: Date.now(),
            name: driver.name || `Driver ${driver.userId.slice(0, 5)}`,
            vehicle: driver.vehicle || 'Bus',
            rating: driver.rating || (Math.random() * 2 + 3).toFixed(1),
          };
        }
      });
      
      setDrivers(driversMap);
    });

    socket.on("driver-disconnected", ({ userId, socketId }) => {
      const driverId = userId || socketId;
      console.log("Driver disconnected:", driverId);
      
      setDrivers(prev => {
        const newDrivers = {...prev};
        delete newDrivers[driverId];
        return newDrivers;
      });
    });

    socket.on("user-disconnected", ({ socketId }) => {
      console.log("User disconnected:", socketId);
      
      setDrivers(prev => {
        const newDrivers = {...prev};
        // Find and remove any driver with this socketId
        Object.keys(newDrivers).forEach(key => {
          if (newDrivers[key].socketId === socketId) {
            delete newDrivers[key];
          }
        });
        return newDrivers;
      });
    });

    // Clean up socket connection when component unmounts
    return () => {
      console.log("Cleaning up socket connection");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      clearInterval(locationUpdateIntervalRef.current);
    };
  }, []);

  // Get user location for the dashboard
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
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  }, []);

  // Fetch bus stops from OpenStreetMap - Kathmandu Valley
  useEffect(() => {
    const fetchBusStops = async () => {
      setBusStopsLoading(true);
      
      try {
        // Overpass API query for bus stops in Kathmandu Valley
        // Including the wider area to get stops on Ring Road and surrounding areas
        const overpassQuery = `
          [out:json];
          (
            // Get all bus stops in the area
            node["highway"="bus_stop"](27.6000,85.2000,27.8000,85.5000);
            node["public_transport"="stop_position"](27.6000,85.2000,27.8000,85.5000);
            node["public_transport"="platform"]["bus"="yes"](27.6000,85.2000,27.8000,85.5000);
          );
          out body;
        `;
        
        // Encode for URL
        const encodedQuery = encodeURIComponent(overpassQuery);
        
        // Use Overpass API
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodedQuery}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching bus stops: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process and extract relevant information
        const processedBusStops = data.elements.map(stop => {
          // Extract tags
          const tags = stop.tags || {};
          
          return {
            id: stop.id,
            lat: stop.lat,
            lon: stop.lon,
            name: tags.name || tags["name:en"] || tags["name:ne"] || "Unnamed Bus Stop",
            ref: tags.ref || "",
            operator: tags.operator || "",
            network: tags.network || "",
            routes: tags.route_ref || "",
            shelter: tags.shelter || "unknown",
            bench: tags.bench || "unknown"
          };
        });
        
        console.log(`Fetched ${processedBusStops.length} bus stops`);
        setBusStops(processedBusStops);
      } catch (error) {
        console.error("Error fetching bus stops:", error);
        alert("Failed to fetch bus stops. Please try again later.");
      } finally {
        setBusStopsLoading(false);
      }
    };
    
    fetchBusStops();
  }, []);

  const handleDriverClick = (driver) => {
    setSelectedDriver(driver);
    setSelectedBusStop(null);
    if (driver.latitude && driver.longitude && mapRef.current) {
      mapRef.current.flyTo([driver.latitude, driver.longitude], 16);
    }
  };

  const handleBusStopClick = (busStop) => {
    setSelectedBusStop(busStop);
    setSelectedDriver(null);
    if (mapRef.current) {
      mapRef.current.flyTo([busStop.lat, busStop.lon], 18);
    }
  };

  // Component to show connection statistics
  const ConnectionStatus = () => (
    <div className="connection-stats">
      <div className={`connection-indicator ${socketConnected ? 'connected' : 'disconnected'}`}></div>
      <span>{connectionStatus}</span>
      <span className="driver-count">
        Active Vehicles: {Object.values(drivers).length}
      </span>
      <span className="bus-stop-count">
        Bus Stops: {busStops.length}
      </span>
    </div>
  );

  if (loading) {
    return <div className="loading">Loading map...</div>;
  }

  return (
    <div className="dashboard">
      <HamburgerButton isOpen={sidebarOpen} toggle={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} toggle={toggleSidebar} />
      
      <ConnectionStatus />
      
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
          
          {/* User's own location */}
          <CircleMarker
            center={position}
            radius={10}
            fillColor="#0078ff"
            fillOpacity={0.6}
            stroke={false}
          >
            <Popup>
              Your location
            </Popup>
          </CircleMarker>
          
          {/* Render bus stops if enabled */}
          {showBusStops && busStops.map((stop) => (
            <Marker
              key={`stop-${stop.id}`}
              position={[stop.lat, stop.lon]}
              icon={busStopIcon}
              eventHandlers={{
                click: () => handleBusStopClick(stop)
              }}
            >
              <Popup className="bus-stop-popup">
                <div className="bus-stop-popup-content">
                  <h4>{stop.name}</h4>
                  {stop.ref && <div className="bus-stop-ref">Stop ID: {stop.ref}</div>}
                  {stop.routes && (
                    <div className="bus-stop-routes">
                      <strong>Routes:</strong> {stop.routes}
                    </div>
                  )}
                  {stop.operator && (
                    <div className="bus-stop-operator">
                      <strong>Operator:</strong> {stop.operator}
                    </div>
                  )}
                  <div className="bus-stop-amenities">
                    {stop.shelter === "yes" && <span className="amenity">Shelter</span>}
                    {stop.bench === "yes" && <span className="amenity">Bench</span>}
                  </div>
                  <div className="bus-stop-coords">
                    {stop.lat.toFixed(5)}, {stop.lon.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Render only online drivers */}
          {Object.values(drivers).map((driver) => {
            if (!driver.latitude || !driver.longitude) return null;
            
            return (
              <Marker
                key={driver.userId || driver.socketId}
                position={[driver.latitude, driver.longitude]}
                icon={busIcon}
                eventHandlers={{
                  click: () => handleDriverClick(driver)
                }}
              >
                <Popup className="uber-style-popup">
                  <div className="driver-popup">
                    <div className="driver-header">
                      <div className="driver-avatar">
                        {driver.name.charAt(0)}
                      </div>
                      <div className="driver-details">
                        <h4>{driver.name}</h4>
                        <div className="driver-rating">
                          <span className="star">★</span> {driver.rating}
                        </div>
                      </div>
                    </div>
                    <div className="driver-info-line">
                      <div className="info-label">Vehicle:</div>
                      <div className="info-value">{driver.vehicle}</div>
                    </div>
                    <div className="driver-status-line">
                      <div className="status-indicator online"></div>
                      <div className="status-text">Online</div>
                    </div>
                    <div className="driver-info-line">
                      <div className="info-label">Last Updated:</div>
                      <div className="info-value">{new Date(driver.lastUpdated).toLocaleTimeString()}</div>
                    </div>
                    <div className="driver-info-line">
                      <div className="info-label">Accuracy:</div>
                      <div className="info-value">{Math.round(driver.accuracy || 0)} meters</div>
                    </div>
                    <div className="driver-coords">
                      {driver.latitude.toFixed(5)}, {driver.longitude.toFixed(5)}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          <ZoomToLocation position={position} />
          
          {/* Map controls */}
          <div className="custom-controls">
            <button 
              className={`control-button toggle-bus-stops ${showBusStops ? 'active' : ''}`}
              onClick={toggleBusStops}
              title={showBusStops ? "Hide Bus Stops" : "Show Bus Stops"}
            >
              <span className="bus-stop-icon">🚏</span>
            </button>
          </div>
        </MapContainer>
      </div>
      
      {/* Split view for drivers and bus stops */}
      <div className="info-panels-container">
        {/* Driver list overlay - shows only online drivers */}
        <div className="driver-list-overlay">
          <div className="list-header">
            <h3>Available Vehicles ({Object.values(drivers).length})</h3>
          </div>
          <div className="driver-list">
            {Object.values(drivers).map(driver => (
              <div 
                key={driver.userId || driver.socketId}
                className={`driver-item ${selectedDriver && selectedDriver.userId === driver.userId ? 'selected' : ''}`}
                onClick={() => handleDriverClick(driver)}
              >
                <div className="driver-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bus">
                    <path d="M8 6v6"></path>
                    <path d="M15 6v6"></path>
                    <path d="M2 12h19.6"></path>
                    <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
                    <circle cx="7" cy="18" r="2"></circle>
                    <path d="M9 18h5"></path>
                    <circle cx="16" cy="18" r="2"></circle>
                  </svg>
                </div>
                <div className="driver-info">
                  <div className="driver-name-rating">
                    <div className="driver-name">{driver.name}</div>
                    <div className="driver-rating"><span className="star">★</span> {driver.rating}</div>
                  </div>
                  <div className="driver-updated">
                    <span className="vehicle-type">{driver.vehicle}</span> • Updated {new Date(driver.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {Object.values(drivers).length === 0 && (
              <div className="no-drivers">No vehicles available in this area</div>
            )}
          </div>
        </div>
        
        {/* Bus stops list panel */}
        {showBusStops && (
          <div className="bus-stops-overlay">
            <div className="list-header">
              <h3>Bus Stops ({busStops.length})</h3>
              {busStopsLoading && <div className="loading-indicator">Loading...</div>}
            </div>
            <div className="bus-stops-list">
              {busStops.map(stop => (
                <div 
                  key={stop.id}
                  className={`bus-stop-item ${selectedBusStop && selectedBusStop.id === stop.id ? 'selected' : ''}`}
                  onClick={() => handleBusStopClick(stop)}
                >
                  <div className="bus-stop-icon">🚏</div>
                  <div className="bus-stop-info">
                    <div className="bus-stop-name">{stop.name}</div>
                    <div className="bus-stop-details">
                      {stop.routes ? `Routes: ${stop.routes}` : 'No route info'}
                    </div>
                  </div>
                </div>
              ))}
              
              {busStops.length === 0 && !busStopsLoading && (
                <div className="no-bus-stops">No bus stops found in this area</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;