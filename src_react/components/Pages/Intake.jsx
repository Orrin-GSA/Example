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
// export const omContext = createContext({});

const Intake = () => {
  // Get data and mappings from the App-level context
  const {
    ideas,userEmail,dbConfig,userAccess,isLoaded,refreshData
  } = useContext(AppContext);
    
  const [key, setKey] = useState('intake');
  
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

  
  const data = useMemo( () =>{
    if (!ideas || ideas.length === 0) return [];
    let ideaData = ideas.filter(row => typeof row.submitter === 'string' && row.submitter !== "" && row.status!="Optimization");
    return ideaData;
  },[ideas])

  const sortingObj = useMemo( ()=>{
    return dbConfig?.columnSorting?.intake
  },[dbConfig])


  return (
    <div className="intake">
      {/* <omContext.Provider value={omContextValue}> */}
        <div className="wrapper">
        </div>
        <div>
          <h1 className="text-center">Intake</h1>
          <Tabs id="controlled-tab-example" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
            <Tab eventKey="intake" title="Submitted Ideas">
              <MainTable 
                tableName={"intake"} 
                inputData={data} 
                chartElements={[{"chartName":"Breakdown of Ideas Statuses","colName":"status"},{"chartName":"Breakdown of Ideas Outcomes","colName":"outcome"},{"chartName":"Monthly Ideas Submissions","colName":"submitted_date"}]}
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

export default Intake;