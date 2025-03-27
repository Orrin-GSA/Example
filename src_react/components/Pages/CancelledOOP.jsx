import React, { useState, createContext, useContext, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import MainTable from '../Shared/Table/MainTable';
import QuillModal from '../Shared/Modals/QuillModal';
import { ToastContainer, toast } from 'react-toastify';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { AppContext } from '../../App';

// Create a context specifically for Automations components
export const oopContext = createContext({});

const CancelledOOP = () => {
  // Get data and mappings from the App-level context
  const {
    inputData,userEmail,dbConfig,userAccess,isLoaded,refreshData
  } = useContext(AppContext);
    
  const [key, setKey] = useState('oop');
  
  // Get current time for "last refreshed" display
  const getCurrentTime = () => {
    return new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  };
  
  const [time, setTime] = useState(getCurrentTime());
  
  // Handle refresh button click
  const handleRefresh = async () => {
    await refreshData();
    setTime(getCurrentTime());
    toast.success("Data refreshed successfully");
  };

  
  // Get filtered data for the active dev tab - items in production
  const getOOPData = () => {
    if (!inputData || inputData.length === 0) return [];
    console.log(inputData.filter(row => ["Cancelled","Denied","On Hold"].includes(row.status)))
    return inputData.filter(row => ["Cancelled","Denied","On Hold"].includes(row.status));
  };

  const data = useMemo( () =>{
    if (!inputData || inputData.length === 0) return [];
    return inputData.filter(row => ["Cancelled","Denied","On Hold"].includes(row.status));
  },[inputData])

  const sortingObj = useMemo( ()=>{
    return dbConfig?.columnSorting?.oop
  },[dbConfig])

  return (
    <div className="oop">
      {/* <omContext.Provider value={omContextValue}> */}
        <div className="wrapper">
        </div>
        <div>
          <h1 className="text-center">Cancelled / Denied / On Hold Projects</h1>
          <Tabs id="controlled-tab-example" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
            <Tab eventKey="oop" title="Projects">
              <MainTable 
                tableName={"oop"} 
                inputData={data} 
                sortingObj={sortingObj}
              />
            </Tab>
          </Tabs>
        </div>
        {/* <QuillModal /> */}
        <ToastContainer />
      {/* </omContext.Provider> */}
    </div>
  );
};

export default CancelledOOP;