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

const Optimization = () => {
  // Get data and mappings from the App-level context
  const {
    ideas,userEmail,dbConfig,userAccess,isLoaded,refreshData
  } = useContext(AppContext);
    
  const [key, setKey] = useState('optimization');
  
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
    let ideaData = ideas.filter(row => row.status=="Optimization");
    return ideaData;
  },[ideas])

  const sortingObj = useMemo( ()=>{
    return dbConfig?.columnSorting?.optimization
  },[dbConfig])


  return (
    <div className="optimization">
      {/* <omContext.Provider value={omContextValue}> */}
        <div className="wrapper">
        </div>
        <div>
          <h1 className="text-center">Optimization</h1>
          <Tabs id="controlled-tab-example" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
            <Tab eventKey="optimization" title="Projects">
              <MainTable 
                tableName={"optimization"} 
                inputData={data} 
                chartElements={[]}
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

export default Optimization;