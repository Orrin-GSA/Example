/**
 * Basic tools to quickly spin up project monitor items
 * 03/01/2024
 */

import React, { useContext } from 'react'
import { Button } from 'react-bootstrap'
import GSA from './FetchUtils';
import { ApiProviderContext } from './ApiDataProvider';
import AppConfig from '../../../src_shared/AppConfig';
import AppConstants from '../../../src_shared/AppConstants';
import { AppContext } from '../../App';

function DevTools() {
    const { refreshApiBlocking } = useContext(ApiProviderContext);
    const { devTools } = useContext(AppContext);

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    async function randomize() {
        try {
            console.log("clicked randomize");
            await GSA.get("random");

            await refreshApiBlocking();
        } catch (err) {
            console.error(err);
        }
    }

    async function clear() {
        try {
            console.log("clicked clear");
            await GSA.delete("rpa_projects");
            await GSA.delete("enhancements");
            
            await refreshApiBlocking();
        } catch (err) {
            console.error(err)
        }
    }

    async function quickAdd() {
        try {
            console.log("clicked add");
            await GSA.post("rpa_projects", {
                name: `POST_TEST_NAME-${new Date().toString()}`,
                dev_stage: AppConstants.stageIds[getRandomInt(AppConstants.stageIds.length - 1)]
            })
            
            await refreshApiBlocking();
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div>
            {/* Dev tools should not be visible within the Google Container */}
            {AppConfig.inContainer ?
                <></>
                :
                <div>
                    DevTools:
                    <Button className='mx-1 btn-sm' onClick={() => { randomize() }}>Randomize</Button>
                    <Button className='mx-1 btn-sm' onClick={() => { clear() }}>Clear</Button>
                    <Button className='mx-1 btn-sm' onClick={() => { quickAdd() }}>Add</Button>
                    <Button className='mx-1 btn-sm' onClick={() => { sessionStorage.clear() }}>Delete Cache</Button>
                    {devTools}
                </div>
            }
        </div>
    )
}

export default DevTools