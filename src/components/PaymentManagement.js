import React, { useState, useEffect } from 'react';
import '../styles/paymentManagement.css';

const PaymentManagement = () => {
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'payments'

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/getAllUsers');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/payment/payments');
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchPayments();
    }
  }, [activeTab]);

  const updatePaymentStatus = async (userId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/updatePaymentStatus/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      fetchUsers();
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError(error.message);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="Payments">
      <h2>Payment Management</h2>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User Payments
        </button>
        <button 
          className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Khalti Transactions
        </button>
      </div>
      
      {isLoading && <p>Loading data...</p>}
      {error && <p className="error">Error: {error}</p>}
      
      {activeTab === 'users' ? (
        users.length > 0 ? (
          <table className="payments-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user._id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`status-badge ${user.paymentStatus?.toLowerCase()}`}>
                      {user.paymentStatus || 'N/A'}
                    </span>
                  </td>
                  <td>
                    {user.paymentStatus === 'pending' && (
                      <button 
                        onClick={() => updatePaymentStatus(user._id, 'paid')}
                        className="approve-btn"
                      >
                        Mark as Paid
                      </button>
                    )}
                    {(user.paymentStatus === 'paid' || !user.paymentStatus) && (
                      <button 
                        onClick={() => updatePaymentStatus(user._id, 'pending')}
                        className="reject-btn"
                      >
                        Mark as Pending
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !isLoading && <p>No users found.</p>
        )
      ) : (
        payments.length > 0 ? (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Purchase Order</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.pidx}>
                  <td>{payment.pidx}</td>
                  <td>Rs. {(payment.amount / 100).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${payment.status.toLowerCase()}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td>{payment.purchase_order_name}</td>
                  <td>{formatDate(payment.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !isLoading && <p>No payment transactions found.</p>
        )
      )}
    </div>
  );
};

export default PaymentManagement;