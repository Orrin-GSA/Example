import React, { useMemo, useLayoutEffect, useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { AppContext } from '../../../App';
import NotificationComponent from './NotificationComponent';

function Navbar() {
  const {
    inputData, supportTickets, ideas, userEmail, dbConfig, userAccess, isLoaded, refreshData
  } = useContext(AppContext);

  const [isDark, setIsDark] = useState(false);

  const name = useMemo(() => {
    if(!userEmail) {
        return '';
    }

    let username = userEmail.split('@')[0];
    let names = username.split('.')[0];
    let cleanName = names.charAt(0).toUpperCase() + names.slice(1);
    return cleanName;
  }, [userEmail]);

  // Move event listeners to useEffect to prevent issues during rendering
  useEffect(() => {
    let btns = document.getElementsByClassName("nav-link");
    // Loop through the buttons and add the active class to the current/clicked button
    const handleClick = function() {
      var current = document.getElementsByClassName("active");

      // If there's no active class
      if (current.length > 0) {
        current[0].className = current[0].className.replace(" active", "");
      }

      // Add the active class to the current/clicked button
      this.className += " active";
    };

    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", handleClick);
    }

    // Cleanup function to prevent memory leaks
    return () => {
      for (var i = 0; i < btns.length; i++) {
        btns[i].removeEventListener("click", handleClick);
      }
    };
  }, []);

  // Check if there are already settings for the color mode
  useLayoutEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  }, [isDark]);

  function toDark() {
    setIsDark(true);
  }

  function toLight() {
    setIsDark(false);
  }

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary">
      <div className="container-fluid">
        <span className="navbar-brand">
          <Link to="/home" className="nav-link">
            <img src="https://www.gsa.gov/sites/gsa.gov/themes/custom/gsa/logo.png" alt="GSA Logo" width="30" height="30" className="d-inline-block align-text-top mx-2" />
            Project Monitor Tracker
          </Link>
        </span>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        {/* part that will collapse when the navbar gets too small */}
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link to="/intake" className="nav-link">Intake</Link>
            </li>
            <li className="nav-item">
              <Link to="/optimization" className="nav-link">Optimization</Link>
            </li>
            <li className="nav-item">
              <Link to="/automations" className="nav-link">Automations</Link>
            </li>
            <li className="nav-item">
              <Link to="/completed" className="nav-link">Completed</Link>
            </li>
            <li className="nav-item">
              <Link to="/o-and-m" className="nav-link">O&M</Link>
            </li>
            <li className="nav-item">
              <Link to="/cancelled-oop" className="nav-link">Cancelled/OOP</Link>
            </li>
            <li className="nav-item">
              <Link to="/surveys" className="nav-link">Surveys</Link>
            </li>
          </ul>
          
          <div className="d-flex align-items-center">
            {/* Notification Component */}
            
            
            <p className="mx-2 mb-0">Hello {name}</p>
            <NotificationComponent />
          {/* Dark mode toggle icon without button styling */}
          <div 
            onClick={isDark ? toLight : toDark}
            title={isDark ? "Change to light mode" : "Change to dark mode"} 
            aria-label={isDark ? "Change to light mode" : "Change to dark mode"}
            style={{ cursor: 'pointer', marginLeft: '10px' }}
          >
            <FontAwesomeIcon 
              icon={isDark ? faSun : faMoon} 
              style={{ fontSize: '20px' }} 
            />
          </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;