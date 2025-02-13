import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Signup.css'; // Import the Signup.css file for styling

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    if (password === confirmPassword) {
      // Replace with actual signup logic, e.g., calling API to create the user
      navigate('/login');
    } else {
      alert('Passwords do not match');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="signup-form">
        <div className="signup-form-inner">
          <h2 className="text-2xl font-bold mb-6">Admin Signup</h2>
          <form onSubmit={handleSignup}>
            <div className="mb-4">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Email"
                required
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Password"
                required
              />
            </div>
            <div className="mb-6">
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="confirm-password"
                placeholder="Confirm Password"
                required
              />
            </div>
            <button
              type="submit"
              className="signup-btn"
            >
              Signup
            </button>
          </form>
          <a href="/login" className="link">Already have an account? Login</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
