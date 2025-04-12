// HamburgerButton.js
import React from "react";
import "../styles/HamburgerButton.css";

const HamburgerButton = ({ isOpen, toggle }) => {
  return (
    <button 
      className={`hamburger-button ${isOpen ? "open" : ""}`} 
      onClick={toggle}
      aria-label="Menu toggle"
      aria-expanded={isOpen}
    >
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </button>
  );
};

export default HamburgerButton;