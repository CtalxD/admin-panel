"use client"

import { useEffect, useState } from "react"
import "../styles/busManagement.css"

const BusManagement = () => {
  const [buses, setBuses] = useState([])
  const [drivers, setDrivers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [currentBus, setCurrentBus] = useState({
    busId: "",
    busNumber: "",
    userId: null,
    driverName: "",
  })
  const [modalMode, setModalMode] = useState("add") // 'add', 'edit', or 'assign'

  const fetchBuses = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:5000/buses")
      if (!response.ok) {
        throw new Error("Failed to fetch buses")
      }
      const data = await response.json()
      setBuses(data)
    } catch (error) {
      console.error("Error fetching buses:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:5000/documents/drivers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch drivers")
      }

      const data = await response.json()
      setDrivers(data)
    } catch (error) {
      console.error("Error fetching drivers:", error)
    }
  }

  const filteredBuses = buses
    .filter(
      (bus) =>
        bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bus.driverName && bus.driverName.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const handleAddBus = () => {
    setModalMode("add")
    setCurrentBus({ busId: "", busNumber: "", userId: null, driverName: "" })
    setShowModal(true)
  }

  const handleEditBus = (bus) => {
    setModalMode("edit")
    setCurrentBus({
      busId: bus.busId,
      busNumber: bus.busNumber,
      userId: bus.userId,
      driverName: bus.driverName || "",
    })
    setShowModal(true)
  }

  const handleAssignDriver = (bus) => {
    setModalMode("assign")
    setCurrentBus({
      busId: bus.busId,
      busNumber: bus.busNumber,
      userId: bus.userId,
      driverName: bus.driverName || "",
    })
    fetchDrivers()
    setShowModal(true)
  }

  const handleRemoveDriver = async (busId) => {
    if (window.confirm("Are you sure you want to remove the driver from this bus?")) {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`http://localhost:5000/buses/${busId}/remove-driver`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to remove driver from bus")
        }

        fetchBuses()
      } catch (error) {
        console.error("Error removing driver:", error)
        setError(error.message)
      }
    }
  }

  const handleDeleteBus = async (busId) => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`http://localhost:5000/buses/${busId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to delete bus")
        }

        fetchBuses()
      } catch (error) {
        console.error("Error deleting bus:", error)
        setError(error.message)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const token = localStorage.getItem("token")
      let response

      if (modalMode === "add") {
        const { busNumber } = currentBus

        if (!busNumber.trim()) {
          setError("Bus number is required")
          return
        }

        response = await fetch("http://localhost:5000/buses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ busNumber }),
        })
      } else if (modalMode === "edit") {
        const { busId, busNumber } = currentBus

        if (!busNumber.trim()) {
          setError("Bus number is required")
          return
        }

        response = await fetch(`http://localhost:5000/buses/${busId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ busNumber }),
        })
      } else if (modalMode === "assign") {
        const { busId, userId } = currentBus

        if (!userId) {
          setError("Please select a driver")
          return
        }

        response = await fetch(`http://localhost:5000/buses/${busId}/assign-driver`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: Number.parseInt(userId) }),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Operation failed")
      }

      setShowModal(false)
      fetchBuses()
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    }
  }

  useEffect(() => {
    fetchBuses()
  }, [])

  return (
    <div className="bus-management-container">
      <div className="header-section">
        <h2 className="bus-management-title">Bus Management</h2>
        <div className="controls">
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              placeholder="Search buses by number or driver..."
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
          <button onClick={fetchBuses} className="refresh-button">
            <svg className="refresh-icon" viewBox="0 0 24 24">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            Refresh
          </button>
          <button onClick={handleAddBus} className="add-button">
            <svg className="add-icon" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Add Bus
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-value">{buses.length}</div>
          <div className="stat-label">Total Buses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{buses.filter((bus) => bus.userId).length}</div>
          <div className="stat-label">Assigned Buses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{buses.filter((bus) => !bus.userId).length}</div>
          <div className="stat-label">Unassigned Buses</div>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading buses...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <svg className="error-icon" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <p>{error}</p>
            <button onClick={fetchBuses} className="retry-button">
              Retry
            </button>
          </div>
        ) : (
          <table className="bus-table">
            <thead>
              <tr>
                <th>Bus Number</th>
                <th>Driver</th>
                <th>Driver ID</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuses.length > 0 ? (
                filteredBuses.map((bus) => (
                  <tr key={bus.busId}>
                    <td className="bus-number">{bus.busNumber}</td>
                    <td>
                      {bus.driverName ? (
                        <span className="driver-name">{bus.driverName}</span>
                      ) : (
                        <span className="no-driver">Not assigned</span>
                      )}
                    </td>
                    <td>
                      {bus.userId ? (
                        <span className="driver-id">{bus.userId}</span>
                      ) : (
                        <span className="no-driver">-</span>
                      )}
                    </td>
                    <td>
                      <div className="date-cell">
                        <div className="date">{new Date(bus.createdAt).toLocaleDateString()}</div>
                        <div className="time">
                          {new Date(bus.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <div className="date">{new Date(bus.updatedAt).toLocaleDateString()}</div>
                        <div className="time">
                          {new Date(bus.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </td>
                    <td className="actions-cell">
                      <button className="action-button edit-button" title="Edit bus" onClick={() => handleEditBus(bus)}>
                        <svg viewBox="0 0 24 24">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                      <button
                        className="action-button assign-button"
                        title="Assign driver"
                        onClick={() => handleAssignDriver(bus)}
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </button>
                      {bus.userId && (
                        <button
                          className="action-button remove-driver-button"
                          title="Remove driver"
                          onClick={() => handleRemoveDriver(bus.busId)}
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M14 8c0-2.21-1.79-4-4-4S6 5.79 6 8s1.79 4 4 4 4-1.79 4-4zm3 2v2h6v-2h-6zM2 18v2h16v-2c0-2.66-5.33-4-8-4s-8 1.34-8 4z" />
                          </svg>
                        </button>
                      )}
                      <button
                        className="action-button delete-button"
                        title="Delete bus"
                        onClick={() => handleDeleteBus(bus.busId)}
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data-row">
                  <td colSpan="6">
                    <div className="no-data">
                      <svg className="no-data-icon" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-2.5-8.5v-1h5v1h-5z" />
                      </svg>
                      <p>No buses found {searchTerm && `matching "${searchTerm}"`}</p>
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

      {/* Add/Edit/Assign Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {modalMode === "add" ? "Add New Bus" : modalMode === "edit" ? "Edit Bus" : "Assign Driver to Bus"}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="modal-error">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {(modalMode === "add" || modalMode === "edit") && (
                  <div className="form-group">
                    <label htmlFor="busNumber">Bus Number</label>
                    <input
                      type="text"
                      id="busNumber"
                      value={currentBus.busNumber}
                      onChange={(e) => setCurrentBus({ ...currentBus, busNumber: e.target.value })}
                      placeholder="Enter bus number"
                      required
                    />
                  </div>
                )}

                {modalMode === "assign" && (
                  <>
                    <div className="form-group">
                      <label>Bus Number</label>
                      <div className="static-field">{currentBus.busNumber}</div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="driverId">Select Driver</label>
                      <select
                        id="driverId"
                        value={currentBus.userId || ""}
                        onChange={(e) => setCurrentBus({ ...currentBus, userId: e.target.value })}
                        required
                      >
                        <option value="">-- Select a driver --</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName} ({driver.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  {modalMode === "add" ? "Add Bus" : modalMode === "edit" ? "Save Changes" : "Assign Driver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BusManagement