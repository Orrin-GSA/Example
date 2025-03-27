// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { createContext, useState, useEffect, useMemo, useRef, useContext } from 'react';
import { useAsyncEffect, useDebounceEffectAsync, useOnMountUnsafeAsync } from './ReactUtils';
import { useDispatch, useSelector } from 'react-redux';
import { hideLoading, showLoading } from './LoadingSlice';
import { changeRanking, selectApiRankings, setApiData, setRankings } from './ApiDataSlice';
import ApiDataService from './ApiDataService';
import ToastUtils from './ToastUtils';
import { retry, setTimeoutAsync } from './PromiseUtils';
import { AppContext } from '../../App';

const timeTillReload = 300000;

export type ApiContext = {
    refreshApiBlocking(): Promise<void>;
    setLockUpdates(lock);
    updateRanking(ranking: Ranking): void;
    triggerRankingSave(): void;

    rankingHasChanges: boolean;
    rankingIsSaving: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ApiProviderContext = createContext<ApiContext>({ refreshApiBlocking: () => Promise.resolve(), setLockUpdates: (lock) => { }, updateRanking: (ranking) => { }, triggerRankingSave: () => { }, rankingHasChanges: false, rankingIsSaving: false });

interface Props {
    children: JSX.Element
}

export const ApiDataProvider = ({ children }: Props) => {
    const dispatch = useDispatch();
    const [dataLoading, setDataLoading] = useState(false);
    const [lockUpdates, setLockUpdates] = useState(false);
    const promiseRef = useRef(null);
    const rankings = useSelector(selectApiRankings);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const { setIsDirty } = useContext(AppContext);

    const canUpdate = useMemo(() => {
        return !dataLoading && !lockUpdates;
    }, [dataLoading, lockUpdates]);

    const updateRanking = (ranking: Ranking) => {
        dispatch(changeRanking(ranking));
        setIsDirty(true);
        setHasChanges(true);
        retriggerDebounce();
        console.log('Update ranking called.');
    }

    // Call update method after 10 seconds, and block any
    const [triggerRankingSave, retriggerDebounce] = useDebounceEffectAsync(async () => {
        setIsDirty(false);
        setIsSaving(true);
        try {
            const result = await ApiDataService.updateRankings(rankings);
            ToastUtils.show('Ranking updated successfully.');
            setHasChanges(false);
            if (result.updates?.length) {
                dispatch(setRankings(result.updates));
            }
        }
        catch (error) {
            ToastUtils.showDevError(error);
        }
        finally {
            setIsSaving(false);
        }
    }, 10000);

    // // Call update method after 10 seconds, and block any
    const [triggerRefreshImmediate, retriggerRefresh] = useDebounceEffectAsync(startRefreshAsync, timeTillReload, { resetOnRetrigger: false });

    // useEffect to set up the initial timer and event listener when the component mounts
    useEffect(() => {
        // Event listener to start the timer on any click, if not already started.
        window.addEventListener('click', retriggerRefresh);

        // Cleanup function to remove the event listener and clear the timer when component unmounts
        return () => window.removeEventListener('click', retriggerRefresh);
    });

    /** The entry point for starting a data load. Ensures that if a load is ongoing any caller will simply be given the promise of the existing call rather than starting a new one. */
    function startRefreshAsync() {
        let promise: Promise<any>;
        if (dataLoading && promiseRef.current) {
            promise = promiseRef.current;
        }
        else {
            promise = retrieveApiDataAsync();
        }

        return promise;
    }

    // TODO: I'd still like to find a way to fallback to a total page refresh in the event of an error. However, it shouldn't be handled directly in the useAsyncEffect, otherwise it could get stuck in a refresh loop on load.
    //Google Server function - GET request for the main rpa_projects and other tables
    async function retrieveApiDataAsync() {
        try {
            setDataLoading(true);

            if (promiseRef.current) {
                console.error('Tried to do the server fetch, but another fetch was already in process.')
                return;
            }
            console.log('Refresh started.');

            let rpa_projects = null;
            let employee_users = null;
            let offices = null;
            let milestones = null;
            let poa_users = null;
            let systems = null;
            let enhancements = null;
            let ideas = null;
            let npe = null;
            let documents = null;
            let tools = null;
            let bugs = null;
            let scripts = null;
            let rankings = null;

            //check if the data is already cached
            /*if (!useLocalData && sessionStorage.getItem("rpaDevData") !== null) {
                console.log("(ApiDataProvider.js) Cache was found: " + sessionStorage.getItem("rpaDevData"));
                try {
                    [rpa_projects, employee_users, offices] = JSON.parse(sessionStorage.getItem("rpaDevData"));
                } catch (err) {
                    console.log("(ApiDataProvider.js) There was an error fetching the rpa session cache or it didn't exist: " + err.message + "\n" + "Clearing it.");
                    sessionStorage.removeItem("rpaDevData");
                    rpa_projects = null;
                }
            }*/

            if (rpa_projects == null) {
                const result = await (promiseRef.current = retry(ApiDataService.server_fetchRpaDataProcessed));
                [rpa_projects, employee_users, offices, milestones, poa_users, systems, enhancements, ideas, npe, documents, tools, bugs, scripts, rankings] = result;
            }

            dispatch(setApiData({ rpa_projects, employee_users, offices, milestones, poa_users, systems, enhancements, ideas, npe, documents, tools, bugs, scripts, rankings }));
        }
        catch (error) {
            console.error(error);
            ToastUtils.showError('Unable to refresh data, connection to API may be down. Page will need to be refreshed to try again.');
        }
        finally {
            console.log('Refresh ended.');
            setDataLoading(false);
            promiseRef.current = null;
        }
    }

    /** Starts page refresh and blocks webpage with a loading screen until refresh is complete. Blocking ignores locked state and starts the loading immediately. */
    const refreshApiBlocking = async () => {
        if(!canUpdate) {
            return;
        }

        dispatch(showLoading());
        try {
            await triggerRefreshImmediate();
        }
        finally {
            setTimeout(() => dispatch(hideLoading()), 200);
        }
    };

    useOnMountUnsafeAsync(refreshApiBlocking);

    return (
        <ApiProviderContext.Provider value={{ refreshApiBlocking, setLockUpdates, updateRanking, triggerRankingSave, rankingHasChanges: hasChanges, rankingIsSaving: isSaving }}>
            {children}
        </ ApiProviderContext.Provider>
    );
};