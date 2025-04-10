import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import BusManagement from './components/BusManagement';
import PaymentManagement from './components/PaymentManagement';
import BookingManagement from './components/BookingManagement';
import DocumentManagement from './components/DocumentManagement';
import Login from './components/Login';
import './styles/App.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <div className="app">
        {isLoggedIn ? (
          <>
            <Sidebar />
            <div className="content">
              <Header />
              <div className="main-content">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/user-management" element={<UserManagement />} />
                  <Route path="/bus-management" element={<BusManagement />} />
                  <Route path="/payment-management" element={<PaymentManagement />} />
                  <Route path="/booking-management" element={<BookingManagement />} />
                  <Route path="/document-management" element={<DocumentManagement />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;