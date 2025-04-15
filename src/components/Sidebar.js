import React from 'react';
import { Link } from 'react-router-dom';

const sidebarStyles = {
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '280px',
    height: '100vh',
    backgroundColor: '#2c3e50',
    color: 'white',
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease',
    zIndex: 1000,
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
    overflowY: 'auto'
  },
  sidebarOpen: {
    transform: 'translateX(0)'
  },
  sidebarHeader: {
    padding: '20px',
    backgroundColor: '#1a252f',
    borderBottom: '1px solid #34495e'
  },
  sidebarMenu: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  menuItem: {
    borderBottom: '1px solid #34495e'
  },
  menuLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    color: '#ecf0f1',
    textDecoration: 'none',
    transition: 'all 0.2s'
  },
  menuLinkHover: {
    backgroundColor: '#34495e',
    color: '#fff'
  },
  menuIcon: {
    marginRight: '12px',
    fontSize: '1.1rem'
  },
  sidebarFooter: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: '15px',
    textAlign: 'center',
    fontSize: '0.8rem',
    color: '#7f8c8d',
    borderTop: '1px solid #34495e'
  }
};

const Sidebar = ({ isOpen, toggle }) => {
  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/user-management", label: "User Management", icon: "👥" },
    { path: "/document-management", label: "Document Management", icon: "📄" },
    { path: "/bus-management", label: "Bus Management", icon: "🚌" },
    { path: "/booking-management", label: "Booking Management", icon: "📅" },
    { path: "/payment-management", label: "Payment Management", icon: "💳" },
    { path: "/driver-management", label: "Driver Management", icon: "👨" },
  ];

  return (
    <div style={{ ...sidebarStyles.sidebar, ...(isOpen ? sidebarStyles.sidebarOpen : {}) }}>
      <div style={sidebarStyles.sidebarHeader}>
        <h3>Admin Panel</h3>
      </div>
      <ul style={sidebarStyles.sidebarMenu}>
        {menuItems.map((item, index) => (
          <li key={index} style={sidebarStyles.menuItem}>
            <Link 
              to={item.path} 
              onClick={toggle}
              style={sidebarStyles.menuLink}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#34495e'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
            >
              <span style={sidebarStyles.menuIcon}>{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;