import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css'; // Import the Login.css file for styling
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Add the icons for password visibility toggle

const Login = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Replace with actual login logic, e.g., calling API to verify credentials
    if (email === 'admin@example.com' && password === 'password') {
      setIsLoggedIn(true); // Update the logged-in status in the parent
      navigate('/dashboard'); // Redirect to the dashboard after successful login
    } else {
      alert('Invalid credentials');
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="Enter your email"
            required
          />
          <div className="password-wrapper">
            <input
              type={passwordVisible ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter your password"
              required
            />
            <span className="password-icon" onClick={togglePasswordVisibility}>
              {passwordVisible ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
        <a href="/signup" className="link">
          Don't have an account? Sign Up
        </a>
      </div>
    </div>
  );
};

export default Login;
