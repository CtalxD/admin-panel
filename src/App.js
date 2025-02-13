import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'; // 'Navigate' is used for redirection
import Login from './components/Login';
import Signup from './components/Signup';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import BusManagement from './components/BusManagement';
import PaymentManagement from './components/PaymentManagement';
import BookingManagement from './components/BookingManagement';
import DocumentManagement from './components/DocumentManagement';
import './styles/App.css';

const App = () => {
  // Track whether the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <div className="app">
        {/* Only show Sidebar and Header if the user is logged in */}
        {isLoggedIn && (
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
                  <Route path="/" element={<Dashboard />} />
                </Routes>
              </div>
            </div>
          </>
        )}

        {/* Define routes for Login, Signup, and Forgot Password */}
        <Routes>
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Redirect to login page if not logged in */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
