import React, { useState, useMemo, useContext } from 'react';
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
// export const context = createContext({});

const Completed = () => {
  // Get data and mappings from the App-level context
  const {
    inputData,userEmail,dbConfig,userAccess,isLoaded,refreshData
  } = useContext(AppContext);
    
  const [key, setKey] = useState('online');
  
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


  const onlineData = useMemo( () =>{
    if (!inputData || inputData.length === 0) return [];
    
    return inputData.filter(row => row.online_offline === "ONLINE" && ["RPA","SCR"].includes(row.projectType));
  },[inputData])
  
  const offlineData = useMemo( () =>{
    if (!inputData || inputData.length === 0) return [];
    
    return inputData.filter(row => row.online_offline === "OFFLINE" && ["RPA","SCR"].includes(row.projectType));
  },[inputData])

    const sortingObjOnline = useMemo( ()=>{
      return dbConfig?.columnSorting?.online
    },[dbConfig])

    const sortingObjOffline = useMemo( ()=>{
      return dbConfig?.columnSorting?.offline
    },[dbConfig])



  return (
    <div className="completed">
      {/* <omContext.Provider value={omContextValue}> */}
        <div className="wrapper">
        </div>
        <div>
          <h1 className="text-center">Completed Projects</h1>
          <Tabs id="controlled-tab-example" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
            <Tab eventKey="online" title="Online Projects">
              <MainTable 
                tableName={"online"} 
                inputData={onlineData} 
                chartElements={[{"chartName":"Online Projects","colName":"projectType"}]}
                sortingObj={sortingObjOnline}
              />
            </Tab>
            <Tab eventKey="offline" title="Offline Projects">
              <MainTable 
                tableName={"offline"} 
                inputData={offlineData} 
                chartElements={[{"chartName":"Offline Projects","colName":"projectType"}]}
                sortingObj={sortingObjOffline}
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

export default Completed;