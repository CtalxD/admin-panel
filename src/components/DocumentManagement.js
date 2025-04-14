import { useEffect, useState } from "react";
import "../styles/documentManagement.css";

const DocumentManagement = () => {
    const [documents, setDocuments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");

    const fetchDocuments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const response = await fetch("http://localhost:5000/document", {
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
                throw new Error("Failed to fetch documents");
            }

            const data = await response.json();
            setDocuments(data);
        } catch (error) {
            console.error("Error fetching documents:", error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredDocuments = documents
        .filter((doc) => {
            const matchesSearch =
                searchTerm === "" ||
                `${doc.user?.firstName} ${doc.user?.lastName || ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.licenseNumber.toString().includes(searchTerm);

            const matchesStatus = statusFilter === "" || doc.status === statusFilter;

            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleApprove = async (documentId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/document/${documentId}/approve`, {
                method: "PUT",
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to approve document");
            }

            fetchDocuments();
        } catch (error) {
            console.error("Error approving document:", error);
            setError(error.message);
        }
    };

    const handleReject = async (documentId) => {
        const comment = prompt("Enter rejection reason:");
        if (!comment) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/document/${documentId}/reject`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ adminComment: comment }),
            });

            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to reject document");
            }

            fetchDocuments();
        } catch (error) {
            console.error("Error rejecting document:", error);
            setError(error.message);
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
                return "";
        }
    };

    // const previewImage = (imageUrl) => {
    //     const fullImageUrl = imageUrl.startsWith("http") ? imageUrl : `http://localhost:5000${imageUrl}`;
    //     window.open(fullImageUrl, "_blank");
    // };

    return (
        <div className="document-management-container">
            <div className="header-section">
                <h2 className="document-management-title">Document Management</h2>
                <div className="controls">
                    <div className="search-container">
                        <svg className="search-icon" viewBox="0 0 24 24">
                            <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name, email or license..."
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
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                    <button onClick={fetchDocuments} className="refresh-button">
                        <svg className="refresh-icon" viewBox="0 0 24 24">
                            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-value">{documents.length}</div>
                    <div className="stat-label">Total Documents</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{documents.filter((d) => d.status === "PENDING").length}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{documents.filter((d) => d.status === "APPROVED").length}</div>
                    <div className="stat-label">Approved</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{documents.filter((d) => d.status === "REJECTED").length}</div>
                    <div className="stat-label">Rejected</div>
                </div>
            </div>

            <div className="table-container">
                {isLoading ? (
                    <div className="loading-overlay">
                        <div className="spinner"></div>
                        <p>Loading documents...</p>
                    </div>
                ) : error ? (
                    <div className="error-message">
                        <svg className="error-icon" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        <p>{error}</p>
                        <button onClick={fetchDocuments} className="retry-button">
                            Retry
                        </button>
                    </div>
                ) : (
                    <table className="document-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>License Number</th>
                                <th>Status</th>
                                <th>Role</th>
                                <th>Submitted</th>
                                <th>Actions</th>
                                <th>Comments</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDocuments.length > 0 ? (
                                filteredDocuments.map((doc) => (
                                    <tr key={doc.id}>
                                        <td className="user-name">
                                            {doc.user?.firstName} {doc.user?.lastName || ""}
                                        </td>
                                        <td className="user-email">
                                            <a href={`mailto:${doc.user?.email}`}>{doc.user?.email}</a>
                                        </td>
                                        <td>{doc.licenseNumber}</td>
                                        {/* <td className="document-images">
                                            {doc.blueBookImage?.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    className="thumbnail-container"
                                                    onClick={() => previewImage(img)}
                                                    title="Click to view full image"
                                                >
                                                    <img
                                                        src={`http://localhost:5000${img}`}
                                                        alt={`Blue Book Page ${idx + 1}`}
                                                        className="document-thumbnail"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/placeholder-image.png";
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </td>
                                        <td className="document-images">
                                            {doc.vehicleImage?.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    className="thumbnail-container"
                                                    onClick={() => previewImage(img)}
                                                    title="Click to view full image"
                                                >
                                                    <img
                                                        src={`http://localhost:5000${img}`}
                                                        alt={`Vehicle Image ${idx + 1}`}
                                                        className="document-thumbnail"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/placeholder-image.png";
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </td> */}
                                        <td>
                                            <span className={`status-badge ${getStatusBadgeClass(doc.status)}`}>{doc.status}</span>
                                            {doc.adminComment && (
                                                <div className="admin-comment">
                                                    <strong>Comment:</strong> {doc.adminComment}
                                                </div>
                                            )}
                                        </td>
                                        <td className="Role">
                                            {doc.user?.role === "DRIVER" ? "Driver" : doc.user?.role === "ADMIN" ? "Admin" : "User"}
                                        </td>
                                        <td>
                                            {new Date(doc.createdAt).toLocaleDateString()} at{" "}
                                            {new Date(doc.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </td>

                                        <td className="actions-cell">
                                            {doc.status === "PENDING" && (
                                                <>
                                                    <button
                                                        className="action-button approve-button"
                                                        onClick={() => handleApprove(doc.id)}
                                                        title="Approve"
                                                    >
                                                        <svg viewBox="0 0 24 24">
                                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="action-button reject-button"
                                                        onClick={() => handleReject(doc.id)}
                                                        title="Reject"
                                                    >
                                                        <svg viewBox="0 0 24 24">
                                                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                        <td className="comments-cell">
                                            {doc.adminComment && (
                                                <div className="admin-comment">
                                                    <strong>Comment:</strong> {doc.adminComment}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr className="no-data-row">
                                    <td colSpan="8">
                                        <div className="no-data">
                                            <svg className="no-data-icon" viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2.5 8.5v-1h5v1h-5z" />
                                            </svg>
                                            <p>No documents found {searchTerm && `matching "${searchTerm}"`}</p>
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

export default DocumentManagement;