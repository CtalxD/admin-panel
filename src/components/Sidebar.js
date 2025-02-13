import React, { useState } from 'react';
import { FaBars, FaUsers, FaBus, FaCreditCard, FaClipboardList } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`app`}>
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <button className="hamburger" onClick={toggleSidebar}>
          <FaBars size={30} />
        </button>
        <div className={`sidebar-menu ${isOpen ? 'block' : 'hidden'}`}>
          <ul>
            <li>
              <Link to="/dashboard">
                <FaUsers /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/user-management">
                <FaUsers /> User Management
              </Link>
            </li>
            <li>
              <Link to="/document-management">
                <FaUsers /> DocumentManagement
              </Link>
            </li>
            <li>
              <Link to="/bus-management">
                <FaBus /> Bus Management
              </Link>
            </li>
            <li>
              <Link to="/payment-management">
                <FaCreditCard /> Payment Management
              </Link>
            </li>
            <li>
              <Link to="/booking-management">
                <FaClipboardList /> Booking Management
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className={`main-content ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Main content goes here */}
      </div>
    </div>
  );
};

export default Sidebar;
