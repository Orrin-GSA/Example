import NavBar from './components/util/Navbar';
import { Routes, Route, useSearchParams } from "react-router-dom";
import Automations from "./components/pages/Automations/Automations";
import Optimization from "./components/pages/Optimization";
import Cancelled from './components/pages/Cancelled';
import Intake from './components/pages/Intake';
import OverallMetrics from './components/pages/OverallMetrics';
import ProcessOwner from './components/pages/ProcessOwner';
import CustomerExp from './components/pages/CustomerExp';
import Footer from './components/util/Footer';
import DevTools from './components/util/DevTools';
import LoadingScreen from './components/util/LoadingScreen';
import { useOnMountUnsafeAsync } from './components/util/ReactUtils';
import ApiDataService from './components/util/ApiDataService';
import { useSelector, useDispatch } from 'react-redux';
import { setUsername, setEmail, setIsAdmin, selectEmail } from './components/util/UserSettingsSlice';
import { createContext, useState } from 'react';
import ConfirmModal from './components/shared/ConfirmModal';
import InputModal from './components/shared/InputModal';
import DetailsModal from './components/shared/DetailsModal';
import ProjectPreviewModal from './components/shared/ProjectPreviewModal';
import FormModal from './components/shared/FormModal';
import React, { useMemo } from 'react';
import { selectApiPoaUsers, selectApiUsers, selectApiOffices, selectApiTools, selectApiSystems} from './components/util/ApiDataSlice';
import { DirtyProvider, useDirtyContext } from './components/util/DirtyProvider';
import { selectLoaded as selectLoaded } from './components/util/LoadingSlice';

const defaultUser: PoaUser = { ID: 'USER-000000', name: '', email: '', status: 'Inactive', roles: '' };
// App-wide cached data can go here.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const AppContext = createContext({ devTools: <></>, setDevTools(arg) { }, employeeMapping: new Map<string, EmployeeUser>(), poaMapping: new Map<string, PoaUser>(), officeMapping: new Map<string, Office>(), toolsMapping: new Map<string, Tools>(), systemMapping: new Map<string, System>(),setIsDirty: (arg) => { }, activeUser: defaultUser });


function App() {
    const dispatch = useDispatch();
    const { isDirty, setIsDirty } = useDirtyContext();
    const [_searchParams, setSearchParams] = useSearchParams();
    const [devTools, setDevTools] = useState(<></>);
    const employeeUsers = useSelector(selectApiUsers);
    const poaUsers = useSelector(selectApiPoaUsers);
    const offices = useSelector(selectApiOffices);
    const tools = useSelector(selectApiTools);
    const systems = useSelector(selectApiSystems);
    const userEmail = useSelector(selectEmail);
    const apiLoaded = useSelector(selectLoaded);
    const [appLoaded, setAppLoaded] = useState(false);

    const isLoaded = useMemo(() => {
        return appLoaded && apiLoaded;
    }, [appLoaded, apiLoaded])

    // Cache these, they rarely change and future-proofs the project if we make any fields on the RpaProject with these IDs editable in WALDO.
    /** 
     * ID to employee_user mapping.
     * @type {Map<string, EmployeeUser>} 
     * */
    const employeeMapping = useMemo(() => {
        const map = new Map();
        for (const user of employeeUsers) {
            map.set(user.ID, user);
        }
        return map;
    }, [employeeUsers]);

    /** 
     * ID to poa_user mapping.
     * @type {Map<string, PoaUser>} 
     * */
    const poaMapping = useMemo(() => {
        const map = new Map();
        for (const user of poaUsers) {
            map.set(user.ID, user);
        }
        return map;
    }, [poaUsers]);

        /** 
     * ID to system mapping.
     * @type {Map<string, Tools>} 
     * */
    const toolsMapping = useMemo(() => {
        const map = new Map();
        for (const tool of tools) {
          map.set(tool.ID, tool);
        }
        return map;
      }, [tools]);

      /** 
     * ID to tools mapping.
     * @type {Map<string, System>} 
     * */
    const systemMapping = useMemo(() => {
    const map = new Map();
    for (const system of systems) {
        map.set(system.ID, system);
    }
    return map;
    }, [systems]);
      
    /**
     * ID to office mapping.
     * @example { 'OFF-001' => { Id: 'OFF-001', ... }, 'OFF-002' => { Id: 'OFF-002', ... }, 'OFF-003' => { Id: 'OFF-003', ... } }
     *  @type {Map<string, Office>} 
     * */
    const officeMapping = useMemo(() => {
        return offices.reduce((map, office) => map.set(office.ID, office), new Map());
    }, [offices]);

    const activeUser = useMemo(() => {
        if (!userEmail || !apiLoaded || poaUsers.length === 0) {
            return defaultUser;
        }

        const lowerEmail = userEmail.trim().toLocaleLowerCase();
        let user = poaUsers.find(x => x.email.trim().toLocaleLowerCase() === lowerEmail);

        if (!user) {
            user = defaultUser;
            console.error('User not found: ' + lowerEmail);
        }

        return user;
    }, [apiLoaded, userEmail, poaUsers]);

    useOnMountUnsafeAsync(async () => {
        ApiDataService.getUserDetails()
            .then(details => {
                dispatch(setUsername(details.name));
                dispatch(setEmail(details.email));
                dispatch(setIsAdmin(details.isAdmin));
                setAppLoaded(true);
            })
            .catch(error => {
                dispatch(setIsAdmin(false));
                console.error(error);
            });

        // Google doesn't pass the search params correctly, so we manually update them to ensure it works across the app.
        setSearchParams(ApiDataService.getUrlParams());

        await ApiDataService.logAuditAction('Entered application.');
    });

    return <div>
        <AppContext.Provider value={{ devTools, setDevTools, employeeMapping, poaMapping, officeMapping, toolsMapping, systemMapping, setIsDirty, activeUser }}>
            <LoadingScreen title={"Loading"} />
            <NavBar />
            <div className='mx-3 mt-3' style={{ marginBottom: '40px' }}>
                <DevTools />
                <Routes>
                    <Route path='/' element={<Automations />} />
                    <Route path='automations' element={<Automations />} />
                    <Route path='optimization' element={<Optimization />} />
                    <Route path='cancelled' element={<Cancelled />} />
                    <Route path='intake' element={<Intake />} />
                    <Route path='overallmetrics' element={<OverallMetrics />} />
                    <Route path='processowner' element={<ProcessOwner />} />
                    <Route path='customerexperience' element={<CustomerExp />} />
                    <Route path='*' element={<Automations />} />
                </Routes>
            </div>
            <Footer />
            <ConfirmModal />
            <InputModal />
            <DetailsModal />
            <ProjectPreviewModal />
            <FormModal />
        </AppContext.Provider>
    </div>
}

export default App;