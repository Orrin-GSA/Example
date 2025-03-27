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


const Automations = () => {
  // Get data and mappings from the App-level context
  const {
    inputData,userEmail,dbConfig,userAccess,isLoaded,refreshData
  } = useContext(AppContext);
  
  // Create automations-specific context value
  // const automationsContextValue = 
  //   {inputData,userEmail,dbConfig,
  //   userAccess,isLoaded,refreshData};  
  const [key, setKey] = useState('Backlog');
  
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

  const backlogData = useMemo( () =>{
    if (!inputData || inputData.length === 0) return [];

    return inputData.filter(row => row.status === "Under Evaluation");
  },[inputData])

  const devData = useMemo( () =>{
    if (!inputData || inputData.length === 0) return [];
    
    return inputData.filter(row => row.status === "In Development");
  },[inputData])

  const sortingObjBacklog = useMemo( ()=>{
    return dbConfig?.columnSorting?.Backlog
  },[dbConfig])

    const sortingObjInDev = useMemo( ()=>{
      return dbConfig?.columnSorting?.activeDev
    },[dbConfig])

  return (
    <div className="Automations">
      {/* <AutomationsContext.Provider value={automationsContextValue}> */}
        <div className="wrapper">
        </div>
        <div>
          <h1 className="text-center">Automations</h1>
          <Tabs id="controlled-tab-example" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
            <Tab eventKey="Backlog" title="Backlog">
              <MainTable 
                tableName={"Backlog"} 
                inputData={backlogData} 
                chartElements={[{"chartName":"Projects in Backlog","colName":"projectType"}]}
                sortingObj={sortingObjBacklog}
                />
                
            </Tab>
            <Tab eventKey="ActiveDev" title="Active Dev">
              <MainTable 
                tableName={"activeDev"} 
                inputData={devData} 
                chartElements={[{"chartName":"Projects In Development","colName":"projectType"},{"chartName":"Projects per Developer","colName":"dev_id","stackedName":"projectType"}]}
                sortingObj={sortingObjInDev}
              />
            </Tab>
          </Tabs>
        </div>
        {/* <QuillModal /> */}
        <ToastContainer />
      {/* </AutomationsContext.Provider> */}
    </div>
  );
};

export default Automations;