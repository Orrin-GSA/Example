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

const OandM = () => {
  // Get data and mappings from the App-level context
  const {
    inputData,supportTickets,userEmail,dbConfig,userAccess,isLoaded,refreshData
  } = useContext(AppContext);
    
  const [key, setKey] = useState('o&m');
  
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
    if (!supportTickets || supportTickets.length === 0) return [];
    
    return supportTickets;
  },[supportTickets])

    const sortingObj = useMemo( ()=>{
      return dbConfig?.columnSorting?.oandm
    },[dbConfig])


  return (
    <div className="o&m">
      {/* <omContext.Provider value={omContextValue}> */}
        <div className="wrapper">
        </div>
        <div>
          <h1 className="text-center">O&M</h1>
          <Tabs id="controlled-tab-example" activeKey={key} onSelect={(k) => setKey(k)} className="mb-3">
            <Tab eventKey="o&m" title="Support Tickets">
              <MainTable 
                tableName={"o&m"} 
                inputData={data} 
                chartElements={[{"chartName":"Number of Tickets","colName":"status"},{"chartName":"Monthly Breakdown of Ticket Submission","colName":"open_date"},{"chartName":"Monthly Breakdown of Ticket Closed","colName":"closed_date"}]}
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

export default OandM;