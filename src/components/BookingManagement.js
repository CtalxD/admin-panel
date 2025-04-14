import React, { useEffect, useState } from 'react';
import '../styles/bookingManagement.css';

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState({
    id: '',
    busNumberPlate: '',
    from: '',
    to: '',
    estimatedTime: '',
    totalPrice: '',
    passengerNames: [],
    paymentStatus: 'PENDING'
  });
  const [newPassenger, setNewPassenger] = useState('');

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/tickets');
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings
    .filter((booking) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        booking.busNumberPlate.toLowerCase().includes(searchLower) ||
        booking.from.toLowerCase().includes(searchLower) ||
        booking.to.toLowerCase().includes(searchLower) ||
        booking.id.toLowerCase().includes(searchLower) ||
        booking.passengerNames.some(name => name.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleAddBooking = () => {
    setCurrentBooking({
      id: '',
      busNumberPlate: '',
      from: '',
      to: '',
      estimatedTime: '',
      totalPrice: '',
      passengerNames: [],
      paymentStatus: 'PENDING'
    });
    setShowModal(true);
  };

  const handleEditBooking = (booking) => {
    setCurrentBooking({
      ...booking,
      estimatedTime: booking.estimatedTime ? new Date(booking.estimatedTime).toISOString().slice(0, 16) : ''
    });
    setShowModal(true);
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/tickets/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete booking');
        }
        
        fetchBookings();
      } catch (error) {
        console.error('Error deleting booking:', error);
        setError(error.message);
      }
    }
  };

  const handleAddPassenger = () => {
    if (newPassenger.trim()) {
      setCurrentBooking({
        ...currentBooking,
        passengerNames: [...currentBooking.passengerNames, newPassenger.trim()]
      });
      setNewPassenger('');
    }
  };

  const handleRemovePassenger = (index) => {
    const updatedPassengers = [...currentBooking.passengerNames];
    updatedPassengers.splice(index, 1);
    setCurrentBooking({
      ...currentBooking,
      passengerNames: updatedPassengers
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const requiredFields = ['busNumberPlate', 'from', 'to', 'estimatedTime', 'totalPrice'];
    const missingFields = requiredFields.filter(field => !currentBooking[field]);
    
    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    if (currentBooking.passengerNames.length === 0) {
      setError('At least one passenger is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const bookingData = {
        ...currentBooking,
        totalPrice: parseFloat(currentBooking.totalPrice),
        estimatedTime: new Date(currentBooking.estimatedTime).toISOString()
      };

      let response;
      if (currentBooking.id) {
        response = await fetch(`http://localhost:5000/tickets/${currentBooking.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        });
      } else {
        response = await fetch('http://localhost:5000/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        });
      }
      
      if (!response.ok) {
        throw new Error(currentBooking.id ? 'Failed to update booking' : 'Failed to create booking');
      }
      
      setShowModal(false);
      fetchBookings();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  const updateBookingStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/tickets/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }
      
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PAID':
        return 'status-paid';
      case 'PENDING':
        return 'status-pending';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  return (
    <div className="booking-management-container">
      <div className="header-section">
        <h2 className="booking-management-title">Booking Management</h2>
        <div className="controls">
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search bookings by bus, route, or passenger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>
                <svg viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
          <button onClick={fetchBookings} className="refresh-button">
            <svg className="refresh-icon" viewBox="0 0 24 24">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Refresh
          </button>
          <button onClick={handleAddBooking} className="add-button">
            <svg className="add-icon" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Add Booking
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-value">{bookings.length}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookings.filter(b => b.paymentStatus === 'PAID').length}</div>
          <div className="stat-label">Paid</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookings.filter(b => b.paymentStatus === 'PENDING').length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bookings.filter(b => b.paymentStatus === 'CANCELLED').length}</div>
          <div className="stat-label">Cancelled</div>
        </div>
      </div>

      <div className="table-container">
        {isLoading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Loading bookings...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <svg className="error-icon" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p>{error}</p>
            <button onClick={fetchBookings} className="retry-button">Retry</button>
          </div>
        ) : (
          <table className="booking-table">
            <thead>
              <tr>
                <th className="col-id">Ticket ID</th>
                <th className="col-bus">Bus Number</th>
                <th className="col-route">Route</th>
                <th className="col-passengers">Passengers</th>
                <th className="col-price">Price</th>
                <th className="col-status">Status</th>
                <th className="col-booked">Date</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="booking-id">#{booking.id.substring(0, 8)}</td>
                    <td>{booking.busNumberPlate}</td>
                    <td className="route-cell">
                      <div className="route-from-to">
                        <div className="route-from">{booking.from.split(',').slice(0, 2).join(',')}</div>
                        <svg className="route-arrow" viewBox="0 0 24 24">
                          <path d="M5.88 4.12L13.76 12l-7.88 7.88L8 22l10-10L8 2z"/>
                        </svg>
                        <div className="route-to">{booking.to.split(',').slice(0, 2).join(',')}</div>
                      </div>
                      <div className="route-full-details">
                        <div className="tooltip">
                          <strong>From:</strong> {booking.from}
                        </div>
                        <div className="tooltip">
                          <strong>To:</strong> {booking.to}
                        </div>
                      </div>
                    </td>
                    <td className="passengers-cell">
                      <div className="passengers-list">
                        {booking.passengerNames.slice(0, 2).map((name, i) => (
                          <span key={i} className="passenger-tag">{name}</span>
                        ))}
                        {booking.passengerNames.length > 2 && (
                          <span className="passenger-more">+{booking.passengerNames.length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="price-cell">Rs {parseFloat(booking.totalPrice).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <div className="date-cell">
                        <div className="date">{new Date(booking.createdAt).toLocaleDateString()}</div>
                        <div className="time">{new Date(booking.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </div>
                    </td>
                    <td className="actions-cell">
                      <div className="actions-container">
                        <button 
                          className="action-button edit-button" 
                          title="Edit booking"
                          onClick={() => handleEditBooking(booking)}
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </button>
                        <button 
                          className="action-button delete-button" 
                          title="Delete booking"
                          onClick={() => handleDeleteBooking(booking.id)}
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                          </svg>
                        </button>
                        {booking.paymentStatus === 'PENDING' && (
                          <>
                            <button 
                              className="action-button approve-button" 
                              title="Mark as Paid"
                              onClick={() => updateBookingStatus(booking.id, 'PAID')}
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                              </svg>
                            </button>
                            <button 
                              className="action-button cancel-button" 
                              title="Cancel Booking"
                              onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                              </svg>
                            </button>
                          </>
                        )}
                        {booking.paymentStatus === 'PAID' && (
                          <button 
                            className="action-button cancel-button" 
                            title="Cancel Booking"
                            onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                          >
                            <svg viewBox="0 0 24 24">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                          </button>
                        )}
                        {booking.paymentStatus === 'CANCELLED' && (
                          <button 
                            className="action-button undo-button" 
                            title="Reinstate Booking"
                            onClick={() => updateBookingStatus(booking.id, 'PENDING')}
                          >
                            <svg viewBox="0 0 24 24">
                              <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="no-data-row">
                  <td colSpan="8">
                    <div className="no-data">
                      <svg className="no-data-icon" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-2.5-8.5v-1h5v1h-5z"/>
                      </svg>
                      <p>No bookings found {searchTerm && `matching "${searchTerm}"`}</p>
                      {searchTerm && (
                        <button className="clear-search-btn" onClick={() => setSearchTerm('')}>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentBooking.id ? 'Edit Booking' : 'Add New Booking'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="modal-error">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="busNumberPlate">Bus Number Plate</label>
                    <input
                      type="text"
                      id="busNumberPlate"
                      value={currentBooking.busNumberPlate}
                      onChange={(e) => setCurrentBooking({...currentBooking, busNumberPlate: e.target.value})}
                      placeholder="Enter bus number plate"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="totalPrice">Total Price (Rs)</label>
                    <input
                      type="number"
                      id="totalPrice"
                      value={currentBooking.totalPrice}
                      onChange={(e) => setCurrentBooking({...currentBooking, totalPrice: e.target.value})}
                      placeholder="Enter total price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="from">From</label>
                    <input
                      type="text"
                      id="from"
                      value={currentBooking.from}
                      onChange={(e) => setCurrentBooking({...currentBooking, from: e.target.value})}
                      placeholder="Departure location"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="to">To</label>
                    <input
                      type="text"
                      id="to"
                      value={currentBooking.to}
                      onChange={(e) => setCurrentBooking({...currentBooking, to: e.target.value})}
                      placeholder="Arrival location"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="estimatedTime">Estimated Arrival Time</label>
                  <input
                    type="datetime-local"
                    id="estimatedTime"
                    value={currentBooking.estimatedTime}
                    onChange={(e) => setCurrentBooking({...currentBooking, estimatedTime: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Passengers</label>
                  <div className="passenger-input-container">
                    <input
                      type="text"
                      value={newPassenger}
                      onChange={(e) => setNewPassenger(e.target.value)}
                      placeholder="Add passenger name"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddPassenger()}
                    />
                    <button 
                      type="button" 
                      className="add-passenger-button"
                      onClick={handleAddPassenger}
                    >
                      Add
                    </button>
                  </div>
                  <div className="passenger-tags">
                    {currentBooking.passengerNames.map((name, index) => (
                      <span key={index} className="passenger-tag">
                        {name}
                        <button 
                          type="button"
                          className="remove-passenger"
                          onClick={() => handleRemovePassenger(index)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="paymentStatus">Payment Status</label>
                  <select
                    id="paymentStatus"
                    value={currentBooking.paymentStatus}
                    onChange={(e) => setCurrentBooking({...currentBooking, paymentStatus: e.target.value})}
                    required
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  {currentBooking.id ? 'Save Changes' : 'Create Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;