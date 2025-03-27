import React, { useMemo, useLayoutEffect } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { Button } from 'react-bootstrap';
import { isDevelopment, isLocal } from "../../../src_shared/AppConfig";
import { useSelector } from "react-redux";
import { selectEmail, selectIsDark, setIsDark } from "./UserSettingsSlice";
import { openFormAsync } from "../shared/FormModal";
import ToastUtils from "./ToastUtils";
import ApiDataService from "./ApiDataService";

function Navbar() {
  // Determine which Nav item is active
  // Get all buttons with className="btn" inside the container
  const dispatch = useDispatch();
  let btns = document.getElementsByClassName("nav-link");
  const email = useSelector(selectEmail);
  const isDark = useSelector(selectIsDark);

  const name = useMemo(() => {
    if(!email) {
        return '';
    }

    let username = email.split('@')[0];
    let names = username.split('.')[0];
    let cleanName = names.charAt(0).toUpperCase() + names.slice(1);
    return cleanName;
  }, [email]);

  // Loop through the buttons and add the active class to the current/clicked button
  for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function () {
      var current = document.getElementsByClassName("active");

      // If there's no active class
      if (current.length > 0) {
        current[0].className = current[0].className.replace(" active", "");
      }

      // Add the active class to the current/clicked button
      this.className += " active";
    });
  }

  //check if there are already settings for the color mode
  useLayoutEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-bs-theme', 'light');
    }
  }, [isDark]);

  function toDark() {
    dispatch(setIsDark(true));
  }

  function toLight() {
    dispatch(setIsDark(false));
  }

  function openFeedbackModal() {
    const initialFormData = {
      feedbackType: 'suggestion',
      feedbackText: ''
    };
    
    const formConfig = {
      settings: {
        title: 'Provide Feedback',
        useLarge: true
      },
      rows: [
        {
          type: 'select',
          field: 'feedbackType',
          title: 'Feedback Type',
          options: [
            { label: 'Suggestion', value: 'suggestion' },
            { label: 'Bug Report', value: 'bug' },
            { label: 'Feature Request', value: 'feature' },
            { label: 'Other', value: 'other' }
          ],
          required: (value) => value ? '' : 'Please select a feedback type'  
        },
        {
          type: 'textarea',
          field: 'feedbackText',
          title: 'Feedback Description',
          placeholder: 'Please describe your feedback in detail...',
          required: (value) => value?.trim() ? '' : 'Please provide feedback details' 
        }
      ]
    };
  
    openFormAsync(initialFormData, formConfig)
    .then(([canceled, formResult]) => {
      if (canceled) {
        return;
      }
      
      if (!formResult.feedbackText?.trim()) {
        ToastUtils.showError("Please complete all required fields.");
        return;
      }
      
      // Show immediate feedback to the user
      ToastUtils.show("Thank you for your feedback!");
      
      // Submit the feedback
      ApiDataService.saveFeedback(formResult.feedbackText, formResult.feedbackType)
        .then(() => {
          console.log('Feedback submitted successfully');
        })
        .catch(error => {
          console.error('Error submitting feedback:', error);
          ToastUtils.showError("There was an issue submitting your feedback, but we've saved it locally.");
        });
    });
  }

  return (
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid">

          <span className="navbar-brand">
            <img src="https://www.gsa.gov/sites/gsa.gov/themes/custom/gsa/logo.png" alt="GSA Logo" width="30" height="30" className="d-inline-block align-text-top mx-2" />
            Project Monitor { isLocal ? 'Local' : isDevelopment ? 'Test' : ''}
          </span>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          {/* part that will collapse when the navbar gets too small */}
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link to="automations" className="nav-link">Automations</Link>
              </li>
              <li className="nav-item">
                <Link to="optimization" className="nav-link disabled">Optimization</Link>
              </li>
              <li className="nav-item">
                <Link to="cancelled" className="nav-link disabled">Cancelled/OOP</Link>
              </li>
              <li className="nav-item">
                <Link to="processowner" className="nav-link disabled">Process Owner</Link>
              </li>
              <li className="nav-item">
                <Link to="overallmetrics" className="nav-link">Overall Metrics</Link>
              </li>
              <li className="nav-item">
                <Link to="intake" className="nav-link disabled">Intake</Link>
              </li>
            </ul>
              {/* Feedback Button */}
            * <Button 
              className="btn btn-outline-primary mx-2 text-white" 
              onClick={openFeedbackModal}
              title="Provide Feedback">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" className="bi bi-chat-dots" viewBox="0 0 16 16">
                <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                <path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9.06 9.06 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 0 1-.524 2.318l-.003.011a10.722 10.722 0 0 1-.244.637c-.079.186.074.394.273.362a21.673 21.673 0 0 0 .693-.125zm.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6c0 3.193-3.004 6-7 6a8.06 8.06 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a10.97 10.97 0 0 0 .398-2z"/>
              </svg>
              <span className="ms-2">Feedback</span>
            </Button> 
            <p className="mx-2 mb-2 mb-lg-0">Hello {name}</p>
            {(isDark == true) ?
              //light mode icon
              <Button className="btn bg-secondary" title="Change to light mode" aria-label="Change to light mode" onClick={() => toLight()} onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // console.log("e.key", e.key)
                  toLight();
                } else {
                  // console.log("e.key", e.key)
                }
              }} >
                <><svg className="dark-mode-size" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#FFFFFF" d="M361.5 1.2c5 2.1 8.6 6.6 9.6 11.9L391 121l107.9 19.8c5.3 1 9.8 4.6 11.9 9.6s1.5 10.7-1.6 15.2L446.9 256l62.3 90.3c3.1 4.5 3.7 10.2 1.6 15.2s-6.6 8.6-11.9 9.6L391 391 371.1 498.9c-1 5.3-4.6 9.8-9.6 11.9s-10.7 1.5-15.2-1.6L256 446.9l-90.3 62.3c-4.5 3.1-10.2 3.7-15.2 1.6s-8.6-6.6-9.6-11.9L121 391 13.1 371.1c-5.3-1-9.8-4.6-11.9-9.6s-1.5-10.7 1.6-15.2L65.1 256 2.8 165.7c-3.1-4.5-3.7-10.2-1.6-15.2s6.6-8.6 11.9-9.6L121 121 140.9 13.1c1-5.3 4.6-9.8 9.6-11.9s10.7-1.5 15.2 1.6L256 65.1 346.3 2.8c4.5-3.1 10.2-3.7 15.2-1.6zM160 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z" /></svg></>
              </Button>

              :
              //dark mode icon
              <Button className="btn bg-secondary" title="Change to dark mode" aria-label="Change to dark mode" onClick={() => toDark()} onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // console.log("e.key", e.key)
                  toDark();
                } else {
                  // console.log("e.key", e.key)
                }
              }} >
                <><svg className="dark-mode-size" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M144.7 98.7c-21 34.1-33.1 74.3-33.1 117.3c0 98 62.8 181.4 150.4 211.7c-12.4 2.8-25.3 4.3-38.6 4.3C126.6 432 48 353.3 48 256c0-68.9 39.4-128.4 96.8-157.3zm62.1-66C91.1 41.2 0 137.9 0 256C0 379.7 100 480 223.5 480c47.8 0 92-15 128.4-40.6c1.9-1.3 3.7-2.7 5.5-4c4.8-3.6 9.4-7.4 13.9-11.4c2.7-2.4 5.3-4.8 7.9-7.3c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-3.7 .6-7.4 1.2-11.1 1.6c-5 .5-10.1 .9-15.3 1c-1.2 0-2.5 0-3.7 0c-.1 0-.2 0-.3 0c-96.8-.2-175.2-78.9-175.2-176c0-54.8 24.9-103.7 64.1-136c1-.9 2.1-1.7 3.2-2.6c4-3.2 8.2-6.2 12.5-9c3.1-2 6.3-4 9.6-5.8c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-3.6-.3-7.1-.5-10.7-.6c-2.7-.1-5.5-.1-8.2-.1c-3.3 0-6.5 .1-9.8 .2c-2.3 .1-4.6 .2-6.9 .4z" /></svg></>
              </Button>
            }
          </div>
        </div>
      </nav>
  )
}

export default Navbar