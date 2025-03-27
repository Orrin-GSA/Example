import { PayloadAction, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { assert, is } from '../../../src_shared/TypeUtils';
import { processEnhancementProject, processMilestone, processRpaProject, uuidv4, processScriptProject, processBugProject, fillRankings, fillRankingsApi } from './DataUtil';
import { RootState } from './StoreLoad';
import ApiDataService from './ApiDataService';

type ApiState = {
    loaded: boolean,
    offices: Office[],
    employeeUsers: EmployeeUser[],
    projects: RpaProjectProcessed[],
    enhancements: EnhancementProjectProcessed[],
    milestones: MilestoneProcessed[],
    poaUsers: PoaUser[],
    systems: System[],
    ideas: Idea[],
    npe: Npe[],
    documents: Documents[],
    tools: Tools[],
    bugs: BugProjectProcessed[],
    scripts: ScriptProjectProcessed[],
    rankings: Ranking[],
}

type RpaApiUpdateResponse = {
    action: string;
    table: string;
    updates: RpaUpdateResponseObject[];
}

type RpaApiRankingUpdateResponse = {
    updates: Ranking[];
}

type RpaApiNewResponse = {
    action: string;
    table: string;
    new_ids: string[];
}

const initialState = {
    loaded: false,
    offices: [] as Office[],
    employeeUsers: [] as EmployeeUser[],
    projects: [] as RpaProjectProcessed[],
    enhancements: [] as EnhancementProjectProcessed[],
    milestones: [] as MilestoneProcessed[],
    poaUsers: [] as PoaUser[],
    systems: [] as System[],
    ideas: [] as Idea[],
    npe: [] as Npe[],
    documents: [] as Documents[],
    tools: [] as Tools[],
    bugs: [] as BugProjectProcessed[],
    scripts: [] as ScriptProjectProcessed[],
    rankings: [] as Ranking[],
} as ApiState;

/** Basically just a shortcut to group multiple dispatches and still return a promise, rather than as the fully intended async thunk. See: https://redux-toolkit.js.org/api/createAsyncThunk */
export const updateRpaWithBlocking = createAsyncThunk<void, { ID: string, updates: RpaUpdateObject[], revertedUpdates?: RpaUpdateObject[] }, { state: RootState }>(
    'api/updateRpaWithBlocking',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (payload, { getState, dispatch }) => {
        const { ID, updates, revertedUpdates } = payload;
        assert.string(ID);
        assert.array(updates);
        assert.array(revertedUpdates);

        dispatch(updateRpa({ ID, updates: updates.concat({ field: 'saving', new_value: true }) }));
        return (ApiDataService.updateRpa(payload.ID, updates) as Promise<RpaApiUpdateResponse>)
            .then(
                result => {
                    dispatch(updateRpa({ ID, updates: result.updates }));
                }, 
                error => {
                    if (revertedUpdates.length > 0) {
                        dispatch(updateRpa({ ID, updates: revertedUpdates }));
                    }
                    throw error;
                })
            .finally(() => {
                dispatch(updateRpa({ ID, updates: updates.concat({ field: 'saving', new_value: false }) }));
            });
    }
)

/** Basically just a shortcut to group multiple dispatches and still return a promise, rather than as the fully intended async thunk. See: https://redux-toolkit.js.org/api/createAsyncThunk */
export const addRpaWithBlocking = createAsyncThunk<void, RpaProject, { state: RootState }>(
    'api/addProjectWithBlocking',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (payload, { getState, dispatch }) => {
        const project = payload;

        assert.check(!project.ID, 'Rpa Project already has ID, cannot add new.');

        const tempId = "RPA-" + uuidv4();
        project.ID = tempId;
        project.last_modified_date = new Date().toString();

        dispatch(addRpa(project));
        return (ApiDataService.addRpa(project) as Promise<RpaApiNewResponse>)
            .then(
                result => {
                    dispatch(updateRpa({ ID: tempId, updates: [{ field: 'ID', new_value: result.new_ids[0] }, { field: 'saving', new_value: false }] }));
                }, 
                error => {
                    dispatch(removeRpa({ ID: tempId }));
                    throw error;
                });
    }
)

/** Basically just a shortcut to group multiple dispatches and still return a promise, rather than as the fully intended async thunk. See: https://redux-toolkit.js.org/api/createAsyncThunk */
export const updateScriptWithBlocking = createAsyncThunk<void, { ID: string, updates: RpaUpdateObject[], revertedUpdates?: RpaUpdateObject[] }, { state: RootState }>(
    'api/updateScriptWithBlocking',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (payload, { getState, dispatch }) => {
        const { ID, updates, revertedUpdates } = payload;
        assert.string(ID);
        assert.array(updates);
        assert.array(revertedUpdates);

        dispatch(updateScript({ ID, updates: updates.concat({ field: 'saving', new_value: true }) }));
        return (ApiDataService.updateScript(payload.ID, updates) as Promise<RpaApiUpdateResponse>)
            .then(
                result => {
                    dispatch(updateScript({ ID, updates: result.updates }));
                }, 
                error => {
                    if (revertedUpdates.length > 0) {
                        dispatch(updateScript({ ID, updates: revertedUpdates }));
                    }
                    throw error;
                })
            .finally(() => {
                dispatch(updateScript({ ID, updates: updates.concat({ field: 'saving', new_value: false }) }));
            });
    }
)

/** Basically just a shortcut to group multiple dispatches and still return a promise, rather than as the fully intended async thunk. See: https://redux-toolkit.js.org/api/createAsyncThunk */
export const addScriptWithBlocking = createAsyncThunk<void, ScriptProject, { state: RootState }>(
    'api/addScriptWithBlocking',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (payload, { getState, dispatch }) => {
        const project = payload;

        assert.check(!project.ID, 'Script Project already has ID, cannot add new.');

        const tempId = "SCR-" + uuidv4();
        project.ID = tempId;
        project.last_modified_date = new Date().toString();

        dispatch(addScript(project));
        return (ApiDataService.addScript(project) as Promise<RpaApiNewResponse>)
            .then(
                result => {
                    dispatch(updateScript({ ID: tempId, updates: [{ field: 'ID', new_value: result.new_ids[0] }, { field: 'saving', new_value: false }] }));
                }, 
                error => {
                    dispatch(removeScript({ ID: tempId }));
                    throw error;
                });
    }
)

/** Basically just a shortcut to group multiple dispatches and still return a promise, rather than as the fully intended async thunk. See: https://redux-toolkit.js.org/api/createAsyncThunk */
export const addMilestoneWithBlocking = createAsyncThunk<void, Milestone, { state: RootState }>(
    'api/addMilestoneWithBlocking',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (payload, { getState, dispatch }) => {
        const milestone = payload;
        assert.check(milestone, 'Milestone object is missing.');
        assert.check(!milestone.ID, 'Milestone already has ID, cannot add new.');
        const tempId = "MS-"+uuidv4();
        milestone.ID = tempId;

        dispatch(addMilestone(milestone));

        return (ApiDataService.addMilestone(milestone) as Promise<RpaApiNewResponse>)
            .then(
                result => {
                    dispatch(updateMilestone({ ID: tempId, updates: [{ field: 'ID', new_value: result.new_ids[0] }, { field: 'saving', new_value: false }] }));
                }, 
                error => {
                    dispatch(removeMilestone({ ID: tempId }));
                    throw error;
                });
    }
)

/** Basically just a shortcut to group multiple dispatches and still return a promise, rather than as the fully intended async thunk. See: https://redux-toolkit.js.org/api/createAsyncThunk */
export const addEnhancementWithBlocking = createAsyncThunk<void, EnhancementProject, { state: RootState }>(
    'api/addEnhancementWithBlocking',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (payload, { getState, dispatch }) => {
        const project = payload;

        assert.check(!project.ID, 'Enhancement Project already has ID, cannot add new.');

        const tempId = "ENH-" + uuidv4();
        project.ID = tempId;
        project.last_modified_date = new Date().toString();

        dispatch(addEnhancement(project));
        return (ApiDataService.addEnhancement(project) as Promise<RpaApiNewResponse>)
            .then(
                result => {
                    dispatch(updateEnhancement({ ID: tempId, updates: [{ field: 'ID', new_value: result.new_ids[0] }, { field: 'saving', new_value: false }] }));
                }, 
                error => {
                    dispatch(removeEnhancement({ ID: tempId }));
                    throw error;
                });
    }
)

/** Basically just a shortcut to group multiple dispatches and still return a promise, rather than as the fully intended async thunk. See: https://redux-toolkit.js.org/api/createAsyncThunk */
export const updateEnhancementWithBlocking = createAsyncThunk<void, { ID: string, updates: RpaUpdateObject[], revertedUpdates?: RpaUpdateObject[] }, { state: RootState }>(
    'api/updateEnhancementWithBlocking',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (payload, { getState, dispatch }) => {
        const { ID, updates, revertedUpdates } = payload;

        assert.string(ID);
        assert.array(updates);
        assert.array(revertedUpdates);

        dispatch(updateEnhancement({ ID, updates: updates.concat({ field: 'saving', new_value: true }) }));
        return (ApiDataService.updateEnhancement(ID, updates) as Promise<RpaApiUpdateResponse>)
            .then(
                result => {
                    dispatch(updateEnhancement({ ID, updates: result.updates }));
                }, 
                error => {
                    if (revertedUpdates.length > 0) {
                        dispatch(updateEnhancement({ ID, updates: revertedUpdates }));
                    }
                    throw error;
                })
            .finally(() => {
                dispatch(updateEnhancement({ ID, updates: updates.concat({ field: 'saving', new_value: false }) }));
            });
    }
)

/** Basically just a shortcut to group multiple dispatches and still return a promise, rather than as the fully intended async thunk. See: https://redux-toolkit.js.org/api/createAsyncThunk */
export const addBugWithBlocking = createAsyncThunk<void, BugProject, { state: RootState }>(
    'api/addBugWithBlocking',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (payload, { getState, dispatch }) => {
        const project = payload;

        assert.check(!project.ID, 'Rpa Project already has ID, cannot add new.');

        const tempId = "BUG-" + uuidv4();
        project.ID = tempId;
        project.last_modified_date = new Date().toString();

        dispatch(addBug(project));
        return (ApiDataService.addBug(project) as Promise<RpaApiNewResponse>)
            .then(
                result => {
                    dispatch(updateBug({ ID: tempId, updates: [{ field: 'ID', new_value: result.new_ids[0] }, { field: 'saving', new_value: false }] }));
                }, 
                error => {
                    dispatch(removeEnhancement({ ID: tempId }));
                    throw error;
                });
    }
)

/** Basically just a shortcut to group multiple dispatches and still return a promise, rather than as the fully intended async thunk. See: https://redux-toolkit.js.org/api/createAsyncThunk */
export const updateBugWithBlocking = createAsyncThunk<void, { ID: string, updates: RpaUpdateObject[], revertedUpdates?: RpaUpdateObject[] }, { state: RootState }>(
    'api/updateBugWithBlocking',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (payload, { getState, dispatch }) => {
        const { ID, updates, revertedUpdates } = payload;
        
        assert.string(ID);
        assert.array(updates);
        assert.array(revertedUpdates);

        dispatch(updateBug({ ID, updates: updates.concat({ field: 'saving', new_value: true }) }));
        return (ApiDataService.updateBug(ID, updates) as Promise<RpaApiUpdateResponse>)
            .then(
                result => {
                    dispatch(updateBug({ ID, updates: result.updates }));
                }, 
                error => {
                    if (revertedUpdates.length > 0) {
                        dispatch(updateBug({ ID, updates: revertedUpdates }));
                    }
                    throw error;
                })
            .finally(() => {
                dispatch(updateBug({ ID, updates: updates.concat({ field: 'saving', new_value: false }) }));
            });
    }
)

/** Basically just a shortcut to group multiple dispatches and still return a promise, rather than as the fully intended async thunk. See: https://redux-toolkit.js.org/api/createAsyncThunk */
export const updateMilestoneWithBlocking = createAsyncThunk<void, { ID: string, updates: RpaUpdateObject[], revertedUpdates: RpaUpdateObject[] }, { state: RootState }>(
    'api/updateMilestoneWithBlocking',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (payload, { getState, dispatch }) => {
        const { ID, updates, revertedUpdates } = payload;
        assert.check(!!ID, 'ID is required to update Milestone.');
        assert.array(updates);
        assert.array(revertedUpdates);

        dispatch(updateMilestone({ ID, updates: updates.concat({ field: 'saving', new_value: true }) }));
        return (ApiDataService.updateMilestone(payload.ID, updates) as Promise<RpaApiUpdateResponse>)
            .then(
                result => {
                    dispatch(updateMilestone({ ID, updates: result.updates }));
                },
                error => {
                    if (revertedUpdates.length > 0) {
                        dispatch(updateMilestone({ ID, updates: revertedUpdates }));
                    }
                    throw error;
                })
            .finally(() => {
                dispatch(updateMilestone({ ID, updates: updates.concat({ field: 'saving', new_value: false }) }));
            });
    }
)

export const apiDataSlice = createSlice({
    name: 'api',
    initialState: initialState,
    reducers: {
        addRpa: (state, action: PayloadAction<RpaProject>) => {
            // It is not technically processed yet, but casting it here makes it easier.
            const addedProject = action.payload as RpaProjectProcessed;
            // ID is required, otherwise we have no way to lookup and remove the object unless we added some kind of temporary IDs locally. (Which we could in fact do)
            assert.check(addedProject.ID, 'Cannot add a Project without an Id.');
            processRpaProject(addedProject, state.employeeUsers, state.offices, state.poaUsers);

            state.projects.push(addedProject); 
        },
        updateRpa: (state, action: PayloadAction<{ ID, updates: RpaUpdateObject[] }>) => {
            const { ID, updates } = action.payload;
            assert.array(updates, 'updateRpa did not receive an array of updates');
            
            const currProject = state.projects.find(x => x.ID === ID); 
            assert.object(currProject, 'Could not find the RPA project object to update for ' + ID);

            for(const update of updates) {
                currProject[update.field] = update.new_value;
            }
        },
        removeRpa: (state, action: PayloadAction<{ ID: string }>) => {
            const { ID } = action.payload;

            const projectIdx = state.projects.findIndex(x => x.ID === ID); 
            assert.check(projectIdx > -1, 'Could not find the RPA project object to remove for ' + ID);

            state.projects.splice(projectIdx, 1);
        },
        addEnhancement: (state, action: PayloadAction<EnhancementProject>) => {
            // It is not technically processed yet, but casting it here makes it easier.
            const addedEnhancement = action.payload as EnhancementProjectProcessed;
            // ID is required, otherwise we have no way to lookup and remove the object unless we added some kind of temporary IDs locally. (Which we could in fact do)
            assert.check(addedEnhancement.ID, 'Cannot add a Enhancement without an Id.');
            processEnhancementProject(addedEnhancement, state.projects, state.scripts, state.poaUsers, state.offices);

            state.enhancements.push(addedEnhancement); 
        },
        updateEnhancement: (state, action: PayloadAction<{ ID, updates: RpaUpdateObject[] }>) => {
            const { ID, updates } = action.payload;
            assert.array(updates, 'updateEnhancement did not receive an array of updates');

            const currEnhancement = state.enhancements.find(x => x.ID === ID);
            assert.object(currEnhancement, 'Could not find the Enhancement object to update for ' + ID);

            for (const update of updates) {
                currEnhancement[update.field] = update.new_value;
            }
        },
        removeEnhancement: (state, action: PayloadAction<{ ID: string }>) => {
            const { ID } = action.payload;

            const enhancementIdx = state.enhancements.findIndex(x => x.ID === ID); 
            assert.check(enhancementIdx > -1, 'Could not find the Enhancement object to remove for ' + ID);

            state.enhancements.splice(enhancementIdx, 1);
        },
        addBug: (state, action: PayloadAction<BugProject>) => {
            // It is not technically processed yet, but casting it here makes it easier.
            const addedBug = action.payload as BugProjectProcessed;
            // ID is required, otherwise we have no way to lookup and remove the object unless we added some kind of temporary IDs locally. (Which we could in fact do)
            assert.check(addedBug.ID, 'Cannot add a Bug without an Id.');
            processBugProject(addedBug, state.employeeUsers, state.offices);

            state.bugs.push(addedBug); 
        },
        updateBug: (state, action: PayloadAction<{ ID, updates: RpaUpdateObject[] }>) => {
            const { ID, updates } = action.payload;
            assert.array(updates, 'updateBug did not receive an array of updates');

            const currBug = state.bugs.find(x => x.ID === ID);
            assert.object(currBug, 'Could not find the Bug object to update for ' + ID);

            for (const update of updates) {
                currBug[update.field] = update.new_value;
            }
        },
        removeBug: (state, action: PayloadAction<{ ID: string }>) => {
            const { ID } = action.payload;

            const bugIdx = state.bugs.findIndex(x => x.ID === ID); 
            assert.check(bugIdx > -1, 'Could not find the Bug object to remove for ' + ID);

            state.bugs.splice(bugIdx, 1);
        },
        addScript: (state, action: PayloadAction<ScriptProject>) => {
            // It is not technically processed yet, but casting it here makes it easier.
            const addedScript = action.payload as ScriptProjectProcessed;
            // ID is required, otherwise we have no way to lookup and remove the object unless we added some kind of temporary IDs locally. (Which we could in fact do)
            assert.check(addedScript.ID, 'Cannot add a Project without an Id.');
            processScriptProject(addedScript, state.employeeUsers, state.offices, state.poaUsers);

            state.scripts.push(addedScript); 
        },
        updateScript: (state, action: PayloadAction<{ ID, updates: RpaUpdateObject[] }>) => {
            const { ID, updates } = action.payload;
            assert.array(updates, 'updateRpa did not receive an array of updates');
            
            const currScript = state.scripts.find(x => x.ID === ID); 
            assert.object(currScript, 'Could not find the RPA project object to update for ' + ID);

            for(const update of updates) {
                currScript[update.field] = update.new_value;
            }
        },
        removeScript: (state, action: PayloadAction<{ ID: string }>) => {
            const { ID } = action.payload;

            const scriptIdx = state.scripts.findIndex(x => x.ID === ID); 
            assert.check(scriptIdx > -1, 'Could not find the RPA project object to remove for ' + ID);

            state.scripts.splice(scriptIdx, 1);
        },
        addMilestone: (state, action: PayloadAction<Milestone>) => {
            const addedMilestone = action.payload;
            assert.check(!!addedMilestone.ref_id, 'Cannot add a milestone w/o an Ref Id.');
            processMilestone(addMilestone);

            state.milestones.push(addedMilestone as MilestoneProcessed);            
        },
        updateMilestone: (state, action: PayloadAction<{ ID, updates: RpaUpdateObject[] }>) => {
            const { ID, updates } = action.payload;
            assert.array(updates, 'updateMilestone did not receive an array of updates');
            
            const currMilestone = state.milestones.find(x => x.ID === ID); 
            assert.object(currMilestone, 'Could not find the milestone object for ' + ID);

            for(const update of updates) {
                currMilestone[update.field] = update.new_value;
            }
        },
        updateMilestoneByRefId: (state, action: PayloadAction<{ ref_id, updates: RpaUpdateObject[] }>) => {
            const { ref_id, updates } = action.payload;
            assert.array(updates, 'updateMilestoneByRefId: Did not receive an array of updates');
            assert.check(!!ref_id, 'updateMilestoneByRefId: "ref_id" is required for update.');
            
            const currMilestone = state.milestones.find(x => x.ref_id === ref_id); 
            assert.object(currMilestone, 'updateMilestoneByRefId: Could not find the RPA milestone object for Ref ID ' + ref_id);

            for(const update of updates) {
                currMilestone[update.field] = update.new_value;
            }
        },
        removeMilestoneByRefId: (state, action: PayloadAction<string>) => {
            const ref_id = action.payload;
            assert.check(!!ref_id, 'updateMilestoneByRefId: "ref_id" is required for update.');

            const milestoneIdx = state.milestones.findIndex(x => x.ref_id === ref_id); 
            assert.check(milestoneIdx > -1, 'Milestone not found to remove.');
            
            state.milestones.splice(milestoneIdx, 1);
        },
        removeMilestone: (state, action: PayloadAction<{ ID: string }>) => {
            const { ID } = action.payload;

            const milestoneIdx = state.milestones.findIndex(x => x.ID === ID); 
            assert.check(milestoneIdx > -1, 'Could not find the Milestone object to remove for ' + ID);

            state.milestones.splice(milestoneIdx, 1);
        },
        removeRanking: (state, action: PayloadAction<{ project_id: string }>) => {
            const { project_id } = action.payload;

            const rankingIdx = state.rankings.findIndex(x => x.project_id === project_id); 
            assert.check(rankingIdx > -1, 'Could not find the Ranking object to remove for ' + project_id);

            state.rankings.splice(rankingIdx, 1);
        },
        setRankings: (state, action: PayloadAction<Ranking[]>) => {
            const rankings = action.payload;

            fillRankingsApi(rankings, state.projects, state.scripts, state.enhancements, state.bugs);
            
            state.rankings = rankings;
        },
        removeRankings: (state, action: PayloadAction<Ranking[]>) => {
            const rankings = action.payload;

            for(let i = 0; i < rankings.length; i++) {
                const project_id = rankings[i].project_id;
                const rankingIdx = state.rankings.findIndex(x => x.project_id === project_id); 
                assert.check(rankingIdx > -1, 'Could not find the Ranking object to remove for ' + project_id);
    
                state.rankings.splice(rankingIdx, 1);
            }
        },
        changeRanking: (state, action: PayloadAction<Ranking>) => {
            const updatingRanking = action.payload;
            const rankings = state.rankings;

            let currRanking = rankings.find(x => x.project_id === updatingRanking.project_id);
            let newRanking = false;
            if(!currRanking) {
                currRanking = { project_id: updatingRanking.project_id, rank: 100000 };
                newRanking = true;
            }
            let maxRank = 0;
            let minRank = 100000;
            let raisingRank: boolean;
    
            if (updatingRanking.rank < currRanking.rank) {
                raisingRank = true;
                minRank = updatingRanking.rank;
                maxRank = currRanking.rank;
            }
            else if (updatingRanking.rank > currRanking.rank) {
                raisingRank = false;
                minRank = currRanking.rank;
                maxRank = updatingRanking.rank;
            }
            else {
                console.error('Rank is equal, unable to update (from/to):', updatingRanking, currRanking);
                return;
            }            
    
            const shiftingRankings = rankings.filter(x => x.rank >= minRank && x.rank <= maxRank && updatingRanking.project_id !== x.project_id);

            for(let i = 0; i < shiftingRankings.length; i++) {
                const shiftingRanking = shiftingRankings[i];
                if(raisingRank) {
                    shiftingRanking.rank += 1;
                }
                else {
                    shiftingRanking.rank -= 1;
                }
            }            
            
            currRanking.rank = updatingRanking.rank;
            if(newRanking) {
                state.rankings.push(currRanking);
            }
        },
        cleanRanking: (state) => {
            const rankings = state.rankings.sort(x => x.rank);
            for (let i = 0; i < rankings.length; i++) {
                const ranking = rankings[i];
                ranking.rank = i + 1;
            }

            state.rankings = rankings;
        },
        setApiData: (state, action) => {
            state.loaded = true;
            assert.array(action.payload.offices, 'Invalid Office received.');
            assert.array(action.payload.employee_users, 'Invalid Employee Users received.');
            assert.array(action.payload.rpa_projects, 'Invalid RPA Projects received.');
            assert.array(action.payload.milestones, 'Invalid Milestones received.');
            assert.array(action.payload.poa_users, 'Invalid Poa Users received.');
            assert.array(action.payload.enhancements, 'Invalid Enhancements received.');
            assert.array(action.payload.systems, 'Invalid Systems received.');
            assert.array(action.payload.ideas, 'Invalid Ideas received.');
            assert.array(action.payload.npe, 'Invalid Npe received.');
            assert.array(action.payload.documents, 'Invalid Documents received.');
            assert.array(action.payload.tools, 'Invalid Tools received.');
            assert.array(action.payload.bugs, 'Invalid Ideas received.');
            assert.array(action.payload.scripts, 'Invalid Ideas received.');
            assert.array(action.payload.rankings, 'Invalid Rankings received.');

            state.offices = is.array(action.payload.offices) ? action.payload.offices : [];
            state.employeeUsers = is.array(action.payload.employee_users) ? action.payload.employee_users : [];
            state.projects = is.array(action.payload.rpa_projects) ? action.payload.rpa_projects : [];
            state.milestones = is.array(action.payload.milestones) ? action.payload.milestones : [];
            state.poaUsers = is.array(action.payload.poa_users) ? action.payload.poa_users : [];
            state.enhancements = is.array(action.payload.enhancements) ? action.payload.enhancements : [];
            state.systems = is.array(action.payload.systems) ? action.payload.systems : [];
            state.ideas = is.array(action.payload.ideas) ? action.payload.ideas : [];
            state.npe = is.array(action.payload.npe) ? action.payload.npe : [];
            state.documents = is.array(action.payload.npe) ? action.payload.documents : [];
            state.tools = is.array(action.payload.tools) ? action.payload.tools : [];
            state.bugs = is.array(action.payload.bugs) ? action.payload.bugs : [];
            state.scripts = is.array(action.payload.scripts) ? action.payload.scripts : [];
            state.rankings = is.array(action.payload.rankings) ? action.payload.rankings : [];
        },
        clearApiData: state => {
            state.loaded = false;

            state.offices = [];
            state.employeeUsers = [];
            state.projects = [];
            state.milestones = [];
            state.poaUsers = [];
            state.enhancements = [];
            state.systems = [];
            state.ideas = [];
            state.npe = [];
            state.documents = [];
            state.tools = [];
            state.bugs = [];
            state.scripts = [];
            state.rankings = [];
        }
    },
});

export const { 
    setApiData, clearApiData, 
    addRpa, updateRpa, removeRpa, 
    addEnhancement, updateEnhancement, removeEnhancement, 
    addMilestone, updateMilestone, removeMilestoneByRefId, updateMilestoneByRefId, removeMilestone,
    addScript, updateScript, removeScript,
    addBug, updateBug, removeBug,
    setRankings, removeRanking, removeRankings, changeRanking, cleanRanking
 } = apiDataSlice.actions;

export const selectApiOffices = (root: RootState) => root.api.offices;
export const selectApiUsers = (root: RootState) => root.api.employeeUsers;
export const selectApiProjects = (root: RootState) => root.api.projects;
export const selectApiEnhancements = (root: RootState) => root.api.enhancements;
export const selectApiMilestones = (root: RootState) => root.api.milestones;
export const selectApiPoaUsers = (root: RootState) => root.api.poaUsers;
export const selectApiIdeas = (root: RootState) => root.api.ideas;
export const selectApiSystems = (root: RootState) => root.api.systems;
export const selectApiNpe = (root: RootState) => root.api.npe;
export const selectApiDocuments = (root: RootState) => root.api.documents;
export const selectApiTools = (root: RootState) => root.api.tools;
export const selectApiScripts = (root: RootState) => root.api.scripts;
export const selectApiBugs = (root: RootState) => root.api.bugs;
export const selectApiRankings = (root: RootState) => root.api.rankings;
export const selectApiLoaded = (root: RootState) => root.api.loaded;

export default apiDataSlice.reducer;