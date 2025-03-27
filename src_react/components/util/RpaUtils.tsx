import { DateTime } from "luxon";
import { stageIdToTitle, StageType, statusIdToTitle, statusMapping, StatusType } from "../../../src_shared/AppConstants";
import { assert, is } from "../../../src_shared/TypeUtils";
import { getKeys, getProjectType, isBugProject, isEnhProject, parseSafe, toDateTime, toIsoDateStr, UpdateHandler } from "./DataUtil";
import React from "react";
import { MappingTrackingObjectLite } from "./ReactUtils";
import ToastUtils from "./ToastUtils";
import { Form } from "react-bootstrap";
import { FormOptions, openFormAsync } from "../shared/FormModal";
import { openInputAsync } from "../shared/InputModal";
import store from './StoreLoad';
import { useLocalData } from "../../../src_shared/AppConfig";
import ApiUpdater from "./ApiUpdater";

export const newMilestone = (ref_id): MilestoneProcessed => {
    return {
        ID: undefined,
        ref_id,
        kickoff_complete: null,
        dd_complete: null,
        test_plan_complete: null,
        dev_comp_complete: null,
        developer_testing_complete: null,
        uat_complete: null,
        pta_complete: null,
        security_assessment: null,
        npe_tickets_complete: null,
        custodian_tickets_complete: null,
        env_release_notes_complete: null,
        questionnaire_complete: null,
        sop_complete: null,
        archer: null,
        demo_video: null,
        system_access_signatures: null,
        attributes_questionnaire: null,
        prelim_security_override: null, 
        prelim_security_url: null,
        saving: false
    };
};


type MilestoneFieldMappings = {
    [Property in keyof (MilestoneProcessed)]?: string;
}

type MilestoneFieldValueMappings = {
    [Property in keyof (MilestoneProcessed)]?: (value: any) => any;
}

export const milestoneFieldMapping: MilestoneFieldMappings = {
    'kickoff_complete': 'Kickoff/Process Discovery Call Date',
    'test_plan_complete': 'Test Plan Completion Date',
    'developer_testing_complete': 'Developer Testing Completion Date',
    'uat_complete': 'UAT Signature Completion Date',
    'pta_complete': 'PTA Approval Date',
    'dev_comp_complete': 'Development Completion (%)',
    'security_assessment': 'Security Assessment Approval Date',
    'dd_complete': 'Definition Document URL',
    'attributes_questionnaire': 'Attributes Questionnaire',
    'demo_video': 'Demo Video',
    'archer': 'Added to Archer',
    'system_access_signatures': 'System Access Signature Forms',
    'npe_tickets_complete': 'Requests for NPE and Developers Tickets - IT Ticket Number',
    'custodian_tickets_complete': 'Custodian Tickets',
    'env_release_notes_complete': 'Environment Release Notes (Unattended)',
    'questionnaire_complete': 'Questionnaire',
    'sop_complete': 'SOP (If Warranted)'
}

const buildAction = (type: RpaActionType, user: string, description: string): RpaActionRecord => {
    return {
        date: new Date().toISOString().split('T')[0],
        type,
        user,
        description
    }
}

export const newAction = {
    stageChanged(user: string, fromStage: string, toStage: string) {
        return buildAction(RpaActionType.StageChanged, user, `Moved from Stage ${fromStage} to ${toStage}`)
    },
    statusChanged(user: string, fromStatus: string, toStatus: string) {
        return buildAction(RpaActionType.StatusChanged, user, `Moved from Status ${fromStatus} to ${toStatus}`)
    },
    statusWithStageChanged(user: string, fromStatus: string, toStatus: string, toStage: string) {
        return buildAction(RpaActionType.StatusChanged, user, `Moved from Status ${fromStatus} to ${toStatus} - ${toStage}`)
    }
}

export enum RpaActionType {
    StageChanged = "STAGE_CHANGED",
    StatusChanged = "STATUS_CHANGED"
}

export type MetricsProjectProcessed = AllProjectProccessed & {
    poa_users: string,
    process_owners: string,
    total_hours: number | undefined
};

type ProjectFieldMappings = {
    [Property in keyof (MetricsProjectProcessed)]?: string;
}

type ProjectFieldValueMappings = {
    [Property in keyof (MetricsProjectProcessed)]?: (value: any) => any;
}

export const projectFieldMapping: ProjectFieldMappings = {
    'name': 'Name',
    'actions_history': 'Actions History',
    'comments_history': 'Comments History',
    'status': 'Status',
    'dev_stage': 'Stage',
    'dept': 'Department',
    'office': 'Office',
    'poa_users': 'Developer(s)',
    'process_owners': 'Process Owners(s)',
    'priority': 'Priority',
    'hours_saved': 'Hours Saved',
    'attended_unattended': 'Attended/Unattended',
    'online_offline': 'Online/Offline',
    'deployed_version': 'Current Version',
    'start_date': 'Start Date',
    'est_delivery_date': 'Est. Comp. Date',
    'last_modified_date': 'Last Mod. Date',
    'project_folder_id': 'Project Folder'
}

/** 
 * Because Google Sheets saves values only as strings, we sometimes need to store values as strings that aren't user-friendly.
 * This object is for defining mappings from those values to a user-friendly representation.
 * */
export const projectFieldValueMapping: ProjectFieldValueMappings = {
    'status': (value) => statusIdToTitle.get(value),
    'dev_stage': (value) => stageIdToTitle.get(value),
    'start_date': (value) => toIsoDateStr(value),
    'est_delivery_date': (value) => toIsoDateStr(value),
    'last_modified_date': (value) => toDateTime(value)?.toLocaleString(DateTime.DATETIME_MED) ?? '',
    'project_folder_id': (value) => `https://drive.google.com/drive/folders/${value}`, // In theory we could wrap this in a url, if it is not already one.
}


export const projectReverseFieldMapping = (() => {
    const mapping = {};
    for (const prop in projectFieldMapping) {
        if (Object.prototype.hasOwnProperty.call(projectFieldMapping, prop)) {
            const value = projectFieldMapping[prop];
            mapping[value] = prop;
        }
    }
    return mapping;
})();

export const getProjectFieldMapping = (field: string) => {
    return projectFieldMapping[field] ?? field;
}

export const getProjectFieldValueMapping = (field: string, value: any) => {
    const mapping = projectFieldValueMapping[field];
    if (!mapping) {
        return value;
    }

    return mapping(value);
}

export const getProjectReverseFieldMapping = (field: string) => {
    return projectReverseFieldMapping[field] ?? field;
};

/*
const value = { 
    "kickoff_complete": "", 
    "dd_complete": "", 
    "all_system_access": { "npe_tickets_complete": "", "custodian_tickets_complete": "" }, 
    "test_plan_complete": "", 
    "developer_testing_complete": "", 
    "uat_complete": "", 
    "pta_complete": "", 
    "security_assessment": "", 
    "user_documents": { "env_release_notes_complete": "", "questionnaire_complete": "", "sop_complete": "" } 
}
*/

/** 
 * This array defines all of the fields on the milestone that count towards the "progress" of the milestone. We have some extra metadata fields (like saving) which we don't want to count hence manually defining the fields.
 * Fields that are objects are allowed, the component will loop over all fields in that object to determine how much of that field is 'complete'. 
 * */
export const milestoneRequirements = Object.freeze<(keyof Milestone)[]>(
    ['kickoff_complete', 'developer_testing_complete', 'uat_complete', 'pta_complete', 'security_assessment', 'dev_comp_complete', 'dd_complete', 'attributes_questionnaire', 'demo_video', 'archer', 'system_access_signatures']
);

export const milestoneScriptRequirements = Object.freeze<(keyof Milestone)[]>(
    ['kickoff_complete', 'developer_testing_complete', 'uat_complete', 'dd_complete', 'dev_comp_complete']
);

/**
 * Checks and verifies that the project can move from one status to another, and returns the Status object if it can.
 * @param statusFromId 
 * @param statusToId 
 * @returns null if the object cannot move.
 */
export const canMoveStatus = (statusFromId: string, statusToId: string, isAdmin?: boolean): StatusType | null => {
    assert.string(statusFromId);
    assert.string(statusToId);
    assert.check(() => statusMapping[statusFromId], 'No matching Status for the given statusFromId: ' + statusFromId);
    assert.check(() => statusMapping[statusToId], 'No matching Status for the given statusToId: ' + statusToId);

    const status = statusMapping[statusFromId];
    if (status.allowedMoves && status.allowedMoves.includes(statusToId) || (isAdmin && status.allowedAdminMoves.includes(statusToId))) {
        return statusMapping[statusToId];
    }

    return null;
}

/** The full check to see if a move is allowed between stages. Only happens on drop, so we can do costlier checks. */
export const validateMove = (record: ProjectCommonProcessed, fromStatusId: string, toStatusId: string, progress: number, isAdmin?: boolean) => {
    const errors = [];

    if (!(record?.ID)) {
        errors.push(`Record ID not found "${record.ID}". State of the data may be incorrect.`);
    }
    else if (record.saving) {
        errors.push('Record is saving, unable to move until saving is complete.');
    }
    else {
        if (!canMoveStatus(fromStatusId, toStatusId, isAdmin)) {
            errors.push(`Not allowed to move record from ${fromStatusId} to ${toStatusId}.`)
        }
        else if (record.type !== "Bug" && toStatusId === statusMapping.InProduction.id && progress < 100) {
            errors.push(`${record.ID} milestone progress is not 100% complete`);
        }
    }
    return errors.length > 0 ? errors.join('. ') : '';
}

/**
 * Status change checks and functionality specific to components that edit.
 * @param mapping 
 * @param record 
 * @param milestone 
 * @param output A object that can be have data passed in with existing values and updated as need.
 * @returns If the process should be canceled.
 */
export const moveProjectToStatus = async (isAdmin: boolean, record: ProjectCommonProcessed, mapping: MappingTrackingObjectLite<ProjectCommonProcessed>, milestone: MilestoneProcessed, updater: UpdateHandler<AllProjectProccessed>, output?: Record<string, any>): Promise<boolean> => {
    const progress = getMilestoneProgress(record, milestone);
    const moveErrors = validateMove(record, record.status, mapping.status, progress, isAdmin);
    if (moveErrors) {
        ToastUtils.showError(moveErrors);
        return true;
    }

    const moveToStatus = canMoveStatus(record.status, mapping.status);

    return MoveProjectToStatusInternal(record, mapping, moveToStatus, updater, output);
}

/** Status change checks and functionality specific to the drop boxes. */
export const moveDroppedProjectToStatus = async (isAdmin: boolean, record: ProjectCommonProcessed, toStatus: StatusType, toStage: StageType | undefined, progress: number, updater: UpdateHandler<AllProjectProccessed>, output?: Record<string, any>): Promise<boolean> => {
    const moveErrors = validateMove(record, record.status, toStatus.id, progress, isAdmin);
    if (moveErrors) {
        ToastUtils.showError(moveErrors);
        return true;
    }

    const moveToStatus = canMoveStatus(record.status, toStatus.id, isAdmin);
    const statusChanged = record.status !== toStatus.id;
    const stageChanged = !!toStage && record.dev_stage !== toStage?.id;

    const update: Partial<AllProjectProccessed> = Object.assign({}, record);
    if(statusChanged) {
        updater.add('status', toStatus.id);
        update.status = toStatus.id;
        
        if(stageChanged) {
            updater.add('dev_stage', toStage.id)
            update.status = toStage.id;
        }
        else {
            updater.add('dev_stage', '', true)
            update.dev_stage = '';
        }
    }
    else {
        updater.add('dev_stage', toStage.id);
        update.status = toStage.id;
    }

    return MoveProjectToStatusInternal(record, update, moveToStatus, updater, output);
}

/** Common functionality to any status change. */
const MoveProjectToStatusInternal = async (record: ProjectCommonProcessed, update: Partial<AllProjectProccessed>, moveToStatus: StatusType, updater: UpdateHandler<AllProjectProccessed>, output?: Record<string, any>) => {
    output ??= {};
    let status_reason: string | null = null;

    if ((isBugProject(record) || isEnhProject(record)) && moveToStatus?.id === statusMapping.InProduction.id) {
        const initialFormData = {
            bugResolved: '',
            timeTaken: 0,
            hasTicket: false,
            botPackageVersion: '',
            packageNumber: ''
        };

        const formConfig: FormOptions<typeof initialFormData> = {
            settings: {
                title: record.ID
            },
            rows: [
                { type: 'textarea', field: 'bugResolved', title: `How was this ${isBugProject(record) ? 'bug' : 'enhancement'} resolved?` },
                { type: 'number', field: 'timeTaken', title: 'How many hour did it take?' },
                { type: 'check', field: 'hasTicket', title: 'Does this have an IT Ticket number (RITM)?' },
                {
                    template: (formData, setFieldData) => {
                        if (!formData.hasTicket) {
                            return <></>;
                        }
                        return (
                            <Form.Control
                                placeholder="Please Enter RITM"
                                value={formData.packageNumber || ''}
                                onChange={(e) => setFieldData('packageNumber', e.target.value)} />
                        );
                    }
                },
                {
                    template: (formData, setFieldData) => {
                        if (!formData.hasTicket) {
                            return <></>;
                        }
                        return (
                            <Form.Control
                                placeholder="Please Enter Package Number"
                                value={formData.botPackageVersion || ''}
                                onChange={(e) => setFieldData('botPackageVersion', e.target.value)}
                            />
                        );
                    }
                }
            ]
        };
        const [canceled, formResult] = await openFormAsync(initialFormData, formConfig);
        if (canceled) {
            return true;
        }

        if (
            !formResult.bugResolved?.trim() || !formResult.timeTaken ||
            (formResult.hasTicket && !formResult.botPackageVersion?.trim())
        ) {
            ToastUtils.showError("Please complete all required fields.");
            return true;
        }

        status_reason = formResult.bugResolved;
        // TODO: What do we do with timeTaken?
        updater.add('RITM', formResult.packageNumber);
        updater.add('package_name', formResult.botPackageVersion);

    }

    if(moveToStatus?.id === statusMapping.InDevelopment.id) {
        if(!update.start_date || !update.dev_id) {
            const userOptions = store.getState().api.poaUsers
            .filter(x => x.status === "Active")
            .map(x => ({ label: x.name, value: x.ID }));

            const initialFormData = {
                start_date: update.start_date,
                dev_id: update.dev_id
            };
            const formConfig: FormOptions<typeof initialFormData> = {                
                rows: [
                    { type: 'date', field: 'start_date', title: 'Date Development Started', required: true },
                    { type: 'multi-select', field: 'dev_id', title: 'Assigned Developer(s)', options: userOptions, required: true }
                ],
                settings: {title: record.ID}
            };
            const [canceled, formResult] = await openFormAsync(initialFormData, formConfig);
            if (canceled) {
                return true;
            }
            
            if(formResult.start_date !== update.start_date) {
                updater.addOrChange('start_date', formResult.start_date);
            }
            if(formResult.dev_id !== update.dev_id) {
                updater.addOrChange('dev_id', formResult.dev_id);
            }
        }
    }

    // This is a little tricky, but it's working with onStatusChanged and onStatusUndo to ensure this is never improperly set, or is properly cleared.
    if (moveToStatus.stages.length === 0) {
        // addOrChange is not ideal, but it's a annoying edge case so it'll do.
        updater.addOrChange('dev_stage', '', true);
    }
    
    if (moveToStatus.requirements?.reason && !output.comments) {
        const commentRequired = moveToStatus.requirements.reason;
        const [canceled, comments] = await openInputAsync(is.string(commentRequired) ? commentRequired : 'Comment required to move to ' + moveToStatus.title);
        if (canceled) {
            return true;
        }

        output.comments = comments;
    }

    if (status_reason) {
        updater.add('status_reason', status_reason);
    }
    else if (updater.includes('status')) {
        updater.add('status_reason', '');
    }
    updater.add('status_date', new Date().toISOString());

    return false;
}

export const getMilestoneProgress = (record: ProjectCommonProcessed, milestone: MilestoneProcessed) => {
    if (record.type === 'Bug' || record.status !== statusMapping.InDevelopment.id) {
        return 100;
    }

    if (!milestone) {
        return 0;
    }

    let retVal = 0;
    let projectType = record.type as ProjectType;
    if(isEnhProject(record)) {
        // Get the project type of the parent project.
        projectType = getProjectType(record.project_id);
    }

    try {
        let requirements = null;
        if (projectType === 'Script') {
            requirements = milestoneScriptRequirements;
        } else {
            requirements = milestoneRequirements;
        };

        const percentage = 100 / requirements.length;
        requirements.forEach(requirement => {
            const value = milestone[requirement];

            if (is.object(value)) {
                const subRequirements = Object.keys(value);
                const subValues = Object.values(value);

                const arrSize = subRequirements.length;
                if (arrSize <= 0) {
                    return;
                }

                const completed = subValues.reduce<number>((prev, subValue: any) => prev + (subValue?.length > 0 ? 1 : 0), 0);

                const total = completed / arrSize;
                retVal += percentage * total;

            } else if (value?.length > 0) {
                retVal += percentage; // Simplified addition
            }
        });

    } catch (error) {
        console.error("Error while parsing milestones for project:", record?.ID, error);
    }

    return Math.floor(retVal);
}

/** Returns JS friendly stage name, lowercased and w/o whitespaces. */
export const getJsName = (title: string | null | undefined): string | null => {
    return title?.toLocaleLowerCase().replace(/[\s\W]/g, '') ?? null;
}

/** Returns Db friendly stage name, w/o whitespaces. */
export const getDbName = (title: string | null | undefined): string | null => {
    return title?.replace(/[\s\W]/g, '') ?? null;
}

export default { newMilestone, milestoneRequirements, newAction, getJsStageName: getJsName, projectFieldMapping, getProjectFieldMapping, projectReverseFieldMapping, getProjectReverseFieldMapping };