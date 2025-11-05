import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { HiEnvelope, HiUser, HiArrowRight, HiVideoCamera } from 'react-icons/hi2';
import './SignIn.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function SignIn() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      // Sign in with email (no password required - accepts any email)
      const response = await axios.post(`${API_URL}/api/auth/signin`, {
        email: email.trim(),
        name: name.trim()
      });

      // Store user data
      localStorage.setItem('userEmail', email.trim());
      localStorage.setItem('userName', name.trim());
      localStorage.setItem('userId', response.data.userId || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      localStorage.setItem('isAuthenticated', 'true');

      if (response.data.freePlanActivated) {
        toast.success(`Welcome, ${name.trim()}! Free plan activated. Upgrade to Pro for unlimited features!`);
      } else {
        toast.success(`Welcome, ${name.trim()}!`);
      }
      
      // Force page reload to update authentication state
      window.location.href = '/';
    } catch (error) {
      console.error('Sign in error:', error);
      
      // Check if it's a network error (server not running)
      if (!error.response && error.request) {
        toast.error('Cannot connect to server. Please make sure the backend server is running on port 5000.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to sign in. Please try again.');
      }
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSignIn(e);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <div className="signin-logo">
            <HiVideoCamera className="logo-icon" />
            <h1>Montty Zoom</h1>
          </div>
          <h2>Sign In</h2>
          <p className="signin-subtitle">Enter your email to access your meetings</p>
        </div>

        <form onSubmit={handleSignIn} className="signin-form">
          <div className="form-group">
            <label htmlFor="email">
              <HiEnvelope className="label-icon" />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="your.email@example.com"
              required
              autoFocus
            />
            <p className="form-hint">Use any email address (private, corporate, etc.)</p>
          </div>

          <div className="form-group">
            <label htmlFor="name">
              <HiUser className="label-icon" />
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              required
            />
          </div>

          <button 
            type="submit" 
            className="signin-button"
            disabled={isLoading || !email.trim() || !name.trim()}
          >
            {isLoading ? (
              <>
                <div className="btn-spinner"></div>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <HiArrowRight className="button-icon" />
              </>
            )}
          </button>
        </form>

        <div className="signin-footer">
          <p>No account? No problem! Just enter your email and name to get started.</p>
          <p style={{ marginTop: '16px' }}>
            <a 
              href="/pricing" 
              onClick={(e) => {
                e.preventDefault();
                navigate('/pricing');
              }}
              style={{ color: '#667eea', textDecoration: 'underline', cursor: 'pointer' }}
            >
              View Pricing Plans
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignIn;

