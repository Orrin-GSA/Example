import { statusMapping } from '../../../src_shared/AppConstants';
import ApiDataService from './ApiDataService';
import { addBugWithBlocking, addEnhancementWithBlocking, addRpaWithBlocking, addScriptWithBlocking, cleanRanking, removeRanking, updateBugWithBlocking, updateEnhancementWithBlocking, updateRpaWithBlocking, updateScriptWithBlocking } from './ApiDataSlice';
import { UpdateHandler } from './DataUtil';
import store from './StoreLoad';
import ToastUtils from './ToastUtils';

/** A static object containing functions to handle updating any project type without needing to do a bunch of "if RPA do X, if Script do Y, etc." throughout the rest of the application. */
const ApiUpdater = {
    add(type: ProjectType, project: ProjectCommonProcessed) {
        switch(type) {
            case 'RPA':
                return store.dispatch(addRpaWithBlocking(project)).unwrap()
            case 'Script':
                return store.dispatch(addScriptWithBlocking(project)).unwrap()
            case 'Enhancement':
                return store.dispatch(addEnhancementWithBlocking(project)).unwrap()
            case 'Bug':
                return store.dispatch(addBugWithBlocking(project)).unwrap()
            default:
                throw new Error("Type not found.");
        }
    },
    /** Detects the type of project and correctly directs to the appropriate updateXXXWithBlocking method. */
    update(project: ProjectCommonProcessed, updater: UpdateHandler<AllProjectProccessed>) {
        const [updates, reverts] = updater.changes;
        const dispatchPayload = {
            ID: project.ID,
            updates: updates,
            revertedUpdates: reverts
        };

        let prom: Promise<any>;
        switch(project.type) {
            case 'RPA':
                prom = store.dispatch(updateRpaWithBlocking(dispatchPayload)).unwrap();
                break;
            case 'Script':
                prom = store.dispatch(updateScriptWithBlocking(dispatchPayload)).unwrap()
                break;
            case 'Enhancement':
                prom = store.dispatch(updateEnhancementWithBlocking(dispatchPayload)).unwrap()
                break;
            case 'Bug':
                prom = store.dispatch(updateBugWithBlocking(dispatchPayload)).unwrap()
                break;
            default:
                throw new Error("Type not found.");
        }
        
        return prom.then(() => {
            ToastUtils.show(`Successfully Updated ${project.ID}`);

            if(updater.logger.any()) {
                ApiUpdater.log(project, updater.logger.toArray());
                ApiDataService.logAuditActionBackground(`Updated project ${project.ID}`);
            }
            
            if(updater.includes('status') && (!project.status || project.status === statusMapping.UnderEvaluation.id)) {
                store.dispatch(removeRanking({ project_id: project.ID }));
                store.dispatch(cleanRanking());
            }
        },
        error => {
            console.error(error);
            ToastUtils.showError(`Failed to Update '${project.ID}'\n`);
        });
    },
    // Doesn't really need to be here as all projects act the same way currently, but adding in case there are project specific branches later in the future.
    log(project: ProjectCommonProcessed, actions: string | string[], addlContext?: string) {
        ApiDataService.logProjectAuditActionBackground(project, actions, addlContext);
    }
    // TODO: We don't yet have a need to be able to remove projects.
    // remove(project: ProjectCommonProcessed) {
    //     switch(project.type) {
    //         case 'RPA':
    //             return store.dispatch(addRpaWithBlocking(project)).unwrap()
    //         case 'Script':
    //             return store.dispatch(addScriptWithBlocking(project)).unwrap()
    //         case 'Enhancement':
    //             return store.dispatch(addEnhancementWithBlocking(project)).unwrap()
    //         case 'Bug':
    //             return store.dispatch(addBugWithBlocking(project)).unwrap()
    //         default:
    //             throw new Error("Type not found.");
    //     }
    // }
}

export default ApiUpdater;
