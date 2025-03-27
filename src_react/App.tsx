import React, { useState, createContext, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Shared/Common/Navbar';
import Intake from './components/Pages/Intake';
import Optimization from './components/Pages/Optimization';
import Automations from './components/Pages/Automations';
import Home from './components/Pages/Home/Home';
import OandM from './components/Pages/OandM';
import CancelledOOP from './components/Pages/CancelledOOP';
import Completed from './components/Pages/Completed';
import Surveys from './components/Pages/Surveys';

import ApiDataService from './components/Utils/ApiDataService';
import { useAsyncEffect } from './components/Utils/ReactUtils';
import LoadingScreen from './components/Shared/Common/LoadingScreen';
import ProjectTreeModal from './components/Shared/Modals/ProjectTreeModal';
import FeedbackComponent from './components/Shared/Common/FeedbackComponent';
import ScrollToTop from './components/Utils/ScrollToTop';

// Define default values for AppContext
const defaultContext = {
  inputData: [],
  supportTickets:[],
  ideas:[],
  alerts: [],
  userEmail: '',
  isLoaded: false,
  dbConfig: {},
  highlights:[],
  refreshData: async () => {}
};

export const AppContext = createContext(defaultContext);


function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [inputData, setInputData] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [ideas, setIdeasData] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [dbConfig, setDBConfig] = useState({ tabs: [], metadata: {} });
  const [isAppLoaded, setIsAppLoaded] = useState(false);
  const [userAccess, setUserAccess] = useState({});

  // Refresh data function for updating all data
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const { 
        inputData: fetchedInputData, 
        supportTickets: fetchedSupportTicketsData,
        ideas: fetchedIdeasData,
        dbConfig: fetchedDbConfig, 
        highlights: fetchedHighlights,
        userAccess: fetchedUserAccess,
        alerts: fetchedAlerts
      } = await ApiDataService.fetchData();

      const processedInputData = fetchedInputData ? fetchedInputData.map(row => ({
        ...row,
        search: Object.values(row).join(" ").replace(/[\{\}"']/g, ""),
      })) : [];

      const processedSupportTicketsData = fetchedSupportTicketsData ? fetchedSupportTicketsData.map(row => ({
        ...row,
        search: Object.values(row).join(" ").replace(/[\{\}"']/g, ""),
      })) : [];

      const processedIdeasData = fetchedIdeasData ? fetchedIdeasData.map(row => ({
        ...row,
        search: Object.values(row).join(" ").replace(/[\{\}"']/g, ""),
      })) : [];

      setIdeasData(processedIdeasData);
      setInputData(processedInputData);
      setSupportTickets(processedSupportTicketsData);
      setHighlights(fetchedHighlights || []);
      setAlerts(fetchedAlerts || []);
      setDBConfig(fetchedDbConfig || { tabs: [], metadata: {}, columnSorting:{} });
      setUserAccess(fetchedUserAccess || {});
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch and setup
  useAsyncEffect(async () => {
    try {
      const fetchedUserEmail = await ApiDataService.getUserEmail();
      setUserEmail(fetchedUserEmail);

      await refreshData();
    } catch (error) {
      console.error("Error during initial data fetch:", error);
    } finally {
      setIsAppLoaded(true);
    }
  }, []);

  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({inputData, supportTickets, ideas, userEmail, dbConfig,highlights, userAccess, alerts,isLoaded: isAppLoaded, refreshData}),
   [inputData, supportTickets, ideas, userEmail, dbConfig, highlights, userAccess, alerts, isAppLoaded]);

  return (
    <Router>
      <AppContext.Provider value={contextValue}>
      <ProjectTreeModal /> 
        <div className="App">
          <LoadingScreen title={"Loading Data"} isLoading={isLoading} />
          <Navbar />
          <div className="content-container">
            <Routes>
              <Route path="*" element={<Home key="home" />} />
              <Route path="/intake" element={<Intake />} />
              <Route path="/optimization" element={<Optimization />} />
              <Route path="/automations" element={<Automations key="automations-page" />} />
              <Route path="/completed" element={<Completed />} />
              <Route path="/o-and-m" element={<OandM />} />
              <Route path="/cancelled-oop" element={<CancelledOOP />} />
              <Route path="/surveys" element={<Surveys />} />
              {/* <Route path="*" element={<div className="container mt-5"><h1>Page Not Found</h1></div>} /> */}
            </Routes>
          </div>
          {/* Feedback Component */}
          <FeedbackComponent />
          <ScrollToTop  />
        </div>
      </AppContext.Provider>
    </Router>
  );
}

export default App;