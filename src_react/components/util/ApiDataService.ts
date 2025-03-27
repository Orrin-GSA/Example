import { useLocalData, isDevelopment } from '../../../src_shared/AppConfig';
import { processServerFetch } from './DataUtil';
import GSA from './FetchUtils';
import '../../../src_shared/RpaTypeDefs.d.ts';
import { DateTime } from 'luxon';
import GitHubService from './GitHubService';

/* Format of gscript is a little different. The endpoint API in gscript will always return 200, gotta manually throw an error if it's returned. */
const handleGoogleUpdateResponse = (response) => {
    if(!response.code || !response.code.startsWith('2')) {
        console.error('Endpoint API Error: ' + response.errMessage);
        return Promise.reject(response.errMessage);
    }
    return response.msg;
}

declare const google;

const ApiDataService = {
    /**
     * @returns An array of JS arrays of objects parsed from JSON: [rpa_projects, employee_users, offices, milestones].
     */
    server_fetchRpaDataRaw(): Promise<PreProcessedServerFetch> {
        if (useLocalData) {
            return Promise.all([
                GSA.get("rpa_projects"),
                GSA.get("employee_user"),
                GSA.get("office"),
                GSA.get("milestones"),
                GSA.get("poa_user"),
                GSA.get("systems"),
                GSA.get("enhancements"),
                GSA.get("ideas"),
                GSA.get("npe"),
                GSA.get("documents"),
                GSA.get("it_tools"),
                GSA.get("bugs"),
                GSA.get("scripts"),
                GSA.get("rankings"),
            ]);
        }
        else {
            //@ts-expect-error Hack
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).server_fetchRpaDataRaw();
            })
            .then((result: any[]) => {
                return result.map(x => x.values);
            });
        }
    },
    /**
     * @returns {URLSearchParams}
     */
    getUrlParams() {
        if (useLocalData) {
            return new URLSearchParams(window.location.search);
        }
        else {
            //@ts-expect-error Hack
            return new URLSearchParams(window.googleParams);
        }
    },

    async server_fetchRpaDataProcessed(): Promise<PostProcessedServerFetch> {
        const result = await ApiDataService.server_fetchRpaDataRaw();

        // Does an in-place update on data.
        processServerFetch(result);

        return result as PostProcessedServerFetch;
    },
    /**
     * Log user action into storage.
     */
    logAuditAction(action): Promise<void> {
        if (useLocalData) {
            return GSA.post("audit/action", { action });
        }
        // We have copies of the spreadsheets for the published dev build, but we don't have copies of the project folders, so we can't audit log in development.
        else if(!isDevelopment) {
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).logAuditAction(action);
            });
        }
    },
    /**
     * Log user action into storage.
     */
    logProjectAuditAction(project: ProjectCommon, action, addlContext?: string): Promise<void> {
        if(!project.project_folder_id) {
            // No folder to log to.
            return;
        }

        if (useLocalData) {
            return GSA.post("audit/project", { action, addlContext });
        }
        // We have copies of the spreadsheets for the published dev build, but we don't have copies of the project folders, so we can't audit log in development.
        else if(!isDevelopment) {
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).logProjectAuditAction(project.project_folder_id, action, addlContext);
            });
        }
    },
    /** Log user action into storage in background; it does not return a awaitable promise. If an exception is thrown it will be logged to console but will not interrupt the flow. */
    logAuditActionBackground(action) {
        (async () => {
            await ApiDataService.logAuditAction(action);
        })().catch(console.error);
    },
    
    logProjectAuditActionBackground(project: ProjectCommon, action: string | string[], addlContext?: string) {
        (async () => {
            await ApiDataService.logProjectAuditAction(project, action, addlContext);
        })().catch(console.error);
    },

    getUserDetails(): Promise<{ name: string, email: string, isAdmin: boolean }> {
        if (useLocalData) {
            return Promise.resolve({ name: 'Local Dev', email: 'test@gsa.gov', isAdmin: true });
        }
        else {
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getUserDetails();
            });
        }
    },

    openProjectEmail(type : string, project: ProjectCommon, to: string, cc: string): Promise<void> {
        if (useLocalData) {
            // console.log('isDevelopment?', isDevelopment, '(LOCAL OPEN ' + type + ' EMAIL)', isDevelopment, "sending an email from the project", project, "Sending to", to, "cc", cc);
            console.warn("can't send emails locally");
        }
        // We have copies of the spreadsheets for the published dev build, but we don't have copies of the project folders, so we can't audit log in development.
        else {
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).sendSupportEmail(type, project, to, cc, isDevelopment);
            });
        }
    },

    /**
     * @returns {Promise<string>}
     */
    getUserName() {
        if (useLocalData) {
            return Promise.resolve('Local Dev');
        }
        else {
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getUserName();
            });
        }
    },
    getUserEmail(): Promise<string> {
        if (useLocalData) {
            return Promise.resolve('test@gsa.gov');
        }
        else {
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getUserEmail();
            });
        }
    },
    serverCheck() {
        return new Promise((resolve, reject) => {
            google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).serverCheck();
        });
    },
    getIsAdmin(): Promise<boolean> {
        if (useLocalData) {
            return Promise.resolve(true);
        }
        else {
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getIsAdmin();
            });
        }
    },
    addRpa(project) {
        if (useLocalData) {
            return GSA.post("rpa_projects", [project]);
        }
        else {
            const record_items = JSON.stringify([project]);
            
            const payload = {
                action: "add",
                table: "rpa_projects",
                records: record_items
            };

            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(payload);
            })
            .then(handleGoogleUpdateResponse);
        }
    },
    updateRpa(id: number|string, updates: { field: string, new_value: any }[]): Promise<any> {
        updates = updates.concat([{ field: 'last_modified_date', new_value: DateTime.now().toISO() }]);
        if (useLocalData) {
            return GSA.put("rpa_projects/" + id, updates);
        }
        else {
            const payload = {
                action: "update",
                table: "rpa_projects",
                id: id,
                updates: updates,
            };
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(payload);
            })
            .then(handleGoogleUpdateResponse);
        }
    },
    addScript(script) {
        if (useLocalData) {
            return GSA.post("script_projects", [script]);
        }
        else {
            const record_items = JSON.stringify([script]);
            
            const payload = {
                action: "add",
                table: "scripts",
                records: record_items
            };
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(payload);
            })
            .then(handleGoogleUpdateResponse);
        }
    },
    updateScript(id: number|string, updates: { field: string, new_value: any }[]): Promise<any> {
        updates = updates.concat([{ field: 'last_modified_date', new_value: DateTime.now().toISO() }]);
        if (useLocalData) {
            return GSA.put("scripts/" + id, updates);
        }
        else {
            const payload = {
                action: "update",
                table: "script_projects",
                id: id,
                updates: updates,
            };
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(payload);
            })
            .then(handleGoogleUpdateResponse);
        }
    },
    addEnhancement(enhancement) {
        if (useLocalData) {
            return GSA.post("enhancements", [enhancement]);
        }
        else {
            const record_items = JSON.stringify([enhancement]);
            
            const payload = {
                action: "add",
                table: "enhancements",
                records: record_items
            };
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(payload);
            })
            .then(handleGoogleUpdateResponse);
        }
    },
    /**
     * 
     * @param {number|string} id 
     * @param {{ field: string, new_value: any }[]} updates 
     */
    updateEnhancement(id: number|string, updates: { field: string, new_value: any }[]): Promise<any> {
        updates = updates.concat([{ field: 'last_modified_date', new_value: DateTime.now().toISO() }]);
        if (useLocalData) {
            return GSA.put("enhancements/" + id, updates);
        }
        else {
            const payload = {
                action: "update",
                table: "enhancements",
                id: id,
                updates: updates,
            };
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(payload);
            })
            .then(handleGoogleUpdateResponse);
        }
    },
    addBug(bug) {
        if (useLocalData) {
            return GSA.post("bugs", [bug]);
        }
        else {
            const record_items = JSON.stringify([bug]);
            
            const payload = {
                action: "add",
                table: "bugs",
                records: record_items
            };
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(payload);
            })
            .then(handleGoogleUpdateResponse);
        }
    },
    /**
     * 
     * @param {number|string} id 
     * @param {{ field: string, new_value: any }[]} updates 
     */
    updateBug(id: number|string, updates: { field: string, new_value: any }[]): Promise<any> {
        updates = updates.concat([{ field: 'last_modified_date', new_value: DateTime.now().toISO() }]);
        if (useLocalData) {
            return GSA.put("bugs/" + id, updates);
        }
        else {
            const payload = {
                action: "update",
                table: "bugs",
                id: id,
                updates: updates,
            };
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(payload);
            })
            .then(handleGoogleUpdateResponse);
        }
    },
    updateMilestone(id: number|string, updates: { field: string, new_value: any }[]): Promise<any> {
        if (useLocalData) {
            return GSA.put("milestones/" + id, updates);
        }
        else {
            const payload = {
                action: 'update',
                table: "project_milestones",
                id: id,
                updates: updates
            };
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(payload);
            })
            .then(handleGoogleUpdateResponse);
        }
    },
    addMilestone(record): Promise<any> {
        if (useLocalData) {
            return GSA.post("milestones", [record]);
        }
        else {
            const payload = {
                action: 'add',
                table: 'project_milestones',
                records: JSON.stringify([record])
            };

            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(payload);
            })
            .then(handleGoogleUpdateResponse);
        }
    },
    updateRankings(updates: Ranking[]): Promise<any> {
        if (useLocalData) {
            return GSA.put("rankings", updates);
        }
        else {
            const payload = {
                action: 'update',
                // 'rankings' table has special logic to update. 
                table: "rankings",
                updates: updates.map(x => [x.project_id, x.rank])
            };
            return new Promise((resolve, reject) => {
                google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(payload);
            })
            .then(handleGoogleUpdateResponse);
        }
    },
    saveFeedback(feedbackText: string, feedbackType = 'suggestion'): Promise<void> {
        if (useLocalData) {
          return GSA.post("feedback", { feedbackType, feedbackText });
        } else {
          return new Promise(async (resolve, reject) => {
            try {
              // Get user information
              const userDetails = await this.getUserDetails();
              
              // Try to submit to GitHub
              const success = await GitHubService.submitFeedback(
                feedbackType, 
                feedbackText,
                { 
                  name: userDetails.name, 
                  email: userDetails.email 
                }
              );
      
              if (success) {
                resolve();
              } else {
                // If GitHub submission fails, fall back to Google Script (if not in local/dev mode)
                if (!isDevelopment) {
                  google.script.run
                    .withSuccessHandler(resolve)
                    .withFailureHandler(reject)
                    .saveFeedback(feedbackType, feedbackText);
                } else {
                  // In development, just log feedback locally
                  GitHubService.logFeedbackLocally(
                    feedbackType,
                    feedbackText,
                    { 
                      name: userDetails.name || 'Local Dev', 
                      email: userDetails.email || 'test@gsa.gov' 
                    }
                  );
                  resolve();
                }
              }
            } catch (error) {
              console.error('Error saving feedback:', error);
              reject(error);
            }
          });
        }
      },
    /** Sends a error message to the script in the background to log for WALDO devs to pontentially look into. */
    logError(message: string) {
        if (!useLocalData) {
            (async () => {
                if (isDevelopment) {
                    message = 'DEV - ' + message;
                }
                await new Promise((resolve, reject) => {
                    google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).postUpdate(message);
                });
            })().catch(console.error);
        }
    }
}

export default ApiDataService;