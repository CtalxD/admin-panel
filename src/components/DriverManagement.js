import { useEffect, useState } from "react";
 import "../styles/driverManagement.css";
 
 const DriverManagement = () => {
     const [drivers, setDrivers] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState(null);
     const [statusFilter, setStatusFilter] = useState("");
     const [confirmRevoke, setConfirmRevoke] = useState(null);
     const [notification, setNotification] = useState(null);
 
     const fetchDrivers = async () => {
         setIsLoading(true);
         setError(null);
         try {
             const token = localStorage.getItem("token");
             if (!token) {
                 throw new Error("No authentication token found");
             }
 
             const response = await fetch("http://localhost:5000/document/drivers", {
                 headers: {
                     Authorization: `Bearer ${token}`,
                     "Content-Type": "application/json",
                 },
             });
 
             if (response.status === 401) {
                 localStorage.removeItem("token");
                 window.location.href = "/login";
                 return;
             }
 
             if (response.status === 403) {
                 throw new Error("You do not have permission to access this resource");
             }
 
             if (!response.ok) {
                 throw new Error("Failed to fetch drivers");
             }
 
             const data = await response.json();
             setDrivers(data);
         } catch (error) {
             console.error("Error fetching drivers:", error);
             setError(error.message);
         } finally {
             setIsLoading(false);
         }
     };
 
     const filteredDrivers = drivers
         .filter((driver) => {
             const matchesSearch =
                 searchTerm === "" ||
                 `${driver.firstName} ${driver.lastName || ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 driver.id.toString().includes(searchTerm) ||
                 (driver.document?.licenseNumber?.toString().includes(searchTerm) || false);
 
             const matchesStatus = statusFilter === "" || 
                 (driver.document?.status === statusFilter) || 
                 (statusFilter === "NO_DOCUMENT" && !driver.document);
 
             return matchesSearch && matchesStatus;
         })
         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
 
     useEffect(() => {
         fetchDrivers();
     }, []);
 
     // Add a notification display effect
     useEffect(() => {
         if (notification) {
             const timer = setTimeout(() => {
                 setNotification(null);
             }, 3000);
             return () => clearTimeout(timer);
         }
     }, [notification]);
 
     const handleRevokeDriver = async (userId) => {
         try {
             const token = localStorage.getItem("token");
             const response = await fetch(`http://localhost:5000/users/${userId}/role`, {
                 method: "PUT",
                 headers: {
                     Authorization: `Bearer ${token}`,
                     "Content-Type": "application/json",
                 },
                 body: JSON.stringify({ role: "USER" }),
             });
 
             if (response.status === 401) {
                 localStorage.removeItem("token");
                 window.location.href = "/login";
                 return;
             }
 
             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.message || "Failed to revoke driver status");
             }
 
             // Update local state to reflect the change immediately
             setDrivers(drivers.map(driver => 
                 driver.id === userId ? { ...driver, role: "USER" } : driver
             ));
             
             setConfirmRevoke(null);
             setNotification({ type: "success", message: "Driver status revoked successfully" });
         } catch (error) {
             console.error("Error revoking driver status:", error);
             setError(error.message);
             setNotification({ type: "error", message: error.message });
         }
     };
 
     const getStatusBadgeClass = (status) => {
         switch (status) {
             case "APPROVED":
                 return "status-approved";
             case "PENDING":
                 return "status-pending";
             case "REJECTED":
                 return "status-rejected";
             default:
                 return "status-pending";
         }
     };
 
     return (
         <div className="document-management-container">
             {notification && (
                 <div className={`notification ${notification.type}`}>
                     {notification.message}
                 </div>
             )}
             <div className="header-section">
                 <h2 className="document-management-title">Driver Management</h2>
                 <div className="controls">
                     <div className="search-container">
                         <svg className="search-icon" viewBox="0 0 24 24">
                             <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                         </svg>
                         <input
                             type="text"
                             placeholder="Search by ID, name, email or license..."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className="search-input"
                         />
                         {searchTerm && (
                             <button className="clear-search" onClick={() => setSearchTerm("")}>
                                 <svg viewBox="0 0 24 24">
                                     <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                 </svg>
                             </button>
                         )}
                     </div>
                     <div className="filter-dropdown">
                         <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="status-filter">
                             <option value="">All Statuses</option>
                             <option value="APPROVED">Approved</option>
                             <option value="PENDING">Pending</option>
                             <option value="REJECTED">Rejected</option>
                             <option value="NO_DOCUMENT">No Document</option>
                         </select>
                     </div>
                     <button onClick={fetchDrivers} className="refresh-button">
                         <svg className="refresh-icon" viewBox="0 0 24 24">
                             <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                         </svg>
                         Refresh
                     </button>
                 </div>
             </div>
 
             <div className="stats-bar">
                 <div className="stat-card">
                     <div className="stat-value">{drivers.length}</div>
                     <div className="stat-label">Total Drivers</div>
                 </div>
                 <div className="stat-card">
                     <div className="stat-value">{drivers.filter(d => d.role === "DRIVER").length}</div>
                     <div className="stat-label">Active Drivers</div>
                 </div>
                 <div className="stat-card">
                     <div className="stat-value">{drivers.filter(d => d.document?.status === "PENDING").length}</div>
                     <div className="stat-label">Pending Approval</div>
                 </div>
                 <div className="stat-card">
                     <div className="stat-value">{drivers.filter(d => !d.document).length}</div>
                     <div className="stat-label">No Documents</div>
                 </div>
             </div>
 
             <div className="table-container">
                 {isLoading ? (
                     <div className="loading-overlay">
                         <div className="spinner"></div>
                         <p>Loading drivers...</p>
                     </div>
                 ) : error ? (
                     <div className="error-message">
                         <svg className="error-icon" viewBox="0 0 24 24">
                             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                         </svg>
                         <p>{error}</p>
                         <button onClick={fetchDrivers} className="retry-button">
                             Retry
                         </button>
                     </div>
                 ) : (
                     <table className="document-table">
                         <thead>
                             <tr>
                                 <th>Driver ID</th>
                                 <th>Driver Name</th>
                                 <th>Email</th>
                                 <th>License Number</th>
                                 <th>Document Status</th>
                                 <th>Role</th>
                                 <th>Registered</th>
                                 <th>Actions</th>
                                 <th>Admin Comments</th>
                             </tr>
                         </thead>
                         <tbody>
                             {filteredDrivers.length > 0 ? (
                                 filteredDrivers.map((driver) => (
                                     <tr key={driver.id}>
                                         <td className="driver-id">{driver.id}</td>
                                         <td className="user-name">
                                             {driver.firstName} {driver.lastName || ""}
                                         </td>
                                         <td className="user-email">
                                             <a href={`mailto:${driver.email}`}>{driver.email}</a>
                                         </td>
                                         <td>{driver.document?.licenseNumber || "N/A"}</td>
                                         <td>
                                             {driver.document ? (
                                                 <>
                                                     <span className={`status-badge ${getStatusBadgeClass(driver.document.status)}`}>
                                                         {driver.document.status}
                                                     </span>
                                                 </>
                                             ) : (
                                                 <span className="status-badge status-pending">NO DOCUMENT</span>
                                             )}
                                         </td>
                                         <td className="Role">
                                             <span className={`role-badge ${driver.role.toLowerCase()}-badge`}>
                                                 {driver.role === "DRIVER" ? "Driver" : driver.role === "ADMIN" ? "Admin" : "User"}
                                             </span>
                                         </td>
                                         <td>
                                             {new Date(driver.createdAt).toLocaleDateString()} at{" "}
                                             {new Date(driver.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                         </td>
                                         <td className="actions-cell">
                                             {driver.role === "DRIVER" && (
                                                 <>
                                                     {confirmRevoke === driver.id ? (
                                                         <div className="confirmation-dialog">
                                                             <button 
                                                                 className="confirm-button"
                                                                 onClick={() => handleRevokeDriver(driver.id)}
                                                             >
                                                                 Confirm
                                                             </button>
                                                             <button 
                                                                 className="cancel-button"
                                                                 onClick={() => setConfirmRevoke(null)}
                                                             >
                                                                 Cancel
                                                             </button>
                                                         </div>
                                                     ) : (
                                                         <button
                                                             className="action-button revoke-button"
                                                             onClick={() => setConfirmRevoke(driver.id)}
                                                             title="Revoke Driver Status"
                                                         >
                                                             <svg viewBox="0 0 24 24">
                                                                 <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                                                             </svg>
                                                             Revoke
                                                         </button>
                                                     )}
                                                 </>
                                             )}
                                         </td>
                                         <td className="comments-cell">
                                             {driver.document?.adminComment && (
                                                 <div className="admin-comment">
                                                     <strong>Comment:</strong> {driver.document.adminComment}
                                                 </div>
                                             )}
                                         </td>
                                     </tr>
                                 ))
                             ) : (
                                 <tr className="no-data-row">
                                     <td colSpan="9">
                                         <div className="no-data">
                                             <svg className="no-data-icon" viewBox="0 0 24 24">
                                                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2.5 8.5v-1h5v1h-5z" />
                                             </svg>
                                             <p>No drivers found {searchTerm && `matching "${searchTerm}"`}</p>
                                             {searchTerm && (
                                                 <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
                                                     Clear search
                                                 </button>
                                             )}
                                         </div>
                                     </td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 )}
             </div>
         </div>
     );
 };
 
 export default DriverManagement;