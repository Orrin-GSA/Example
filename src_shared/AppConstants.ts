import metadata from '../src_react/metadata.json';
import { assert, is } from './TypeUtils';

export type StatusRequirements = {
    /** Reason must be given to move to this status, typically On Hold or Cancellation. A string can be provided and will be used as a custom prompt for the popup. */
    reason?: true | string;
    /** Milestones must be completed to move to this status. */
    milestones?: true;
}

export type StatusType = {
    /** User-friendly title. Defaults to id if undefined. Can be used to rename the status w/o changing the values. */
    title?: string;
    /** id used when saving to database.*/
    id: string;
    /** Required, even if it's an empty array. Will include a dropzone automatically if no stage is provided. */
    stages: StageType[];
    allowedMoves: string[];
    allowedAdminMoves: string[];
    /** Additional requirements for moving beyond allowedMoves. */
    requirements: StatusRequirements;
    /** If true, will not show up as a lane or in the Status dropdown in Offcanvas by default. If a status can move to a hidden status, it will include in the dropdown in Offcanvas only. */
    hidden?: true;
    //canMoveTo(statusId: string): boolean;
}

// make all fields optional initially, do not allow allowedMoves to be defined, and make id required.
type StatusTypeConstructor = Partial<Omit<StatusType, 'allowedMoves'>> & Pick<StatusType, 'id'>;

export type StageType = {
    /** User-friendly title. Defaults to id if undefined. Use empty string if you want the header to be hidden in Automations but for the stage to still be present. */
    title?: string;
    /** id used when saving to database. */
    id: string;
    /** Hidden from general display. */
    hidden?: true;
    allowedMoves: string[];
}

// make all fields optional initially, do not allow allowedMoves to be defined, and make id required.
type StageTypeConstructor = Partial<Omit<StageType, 'allowedMoves'>> & Pick<StageType, 'id'>;

export type PriorityType = {
    id: string,
    title?: string,
    /** Value of priority, higher value means higher priority. */
    value: number,
    adminOnly?: true
}

type PriorityTypeConstructor = Partial<PriorityType> & Pick<PriorityType, 'id' | 'value'>

export type ConstantConstructor = {
    /** User-friendly title. Defaults to id if undefined. */
    title?: string;
    /** id used when saving to database. */
    id: string;
    /** Hidden from general display. */
    hidden?: true;
}

/*
BIG TODO:
    * We want to have a structure for managing statuses and stages. This should include the user-friendly titles, internal names, any rules for the statuses and stages.
    * How do we lookup the models when they are pulled from the DB? More specifically, how do we track these on projects? We can attach them but we then also need to ensure they are updated on change.
        * If we do this, it has to be aggressively enforced, we can't allow projects to be added or updated that do not have a status object referenced, _even if they have a status string_.
        * We could, in theory, include the lookup when we do the reducers, that way people don't need to care.
    * Separate rules from definitions. That way we can directly include references when comparing (canMove) rather than simply relying on strings.
*/

function makePriority(data: PriorityTypeConstructor) {
    const priority: PriorityType = {
        id: '',
        value: 0
    };

    Object.assign(priority, data);
    const id = priority.id?.trim();
    assert.check(id, 'id must be a non-empty string.');
    priority.id = id;

    priority.title ??= priority.id;
    return priority;
}

function makeStatus(dataOrId: StatusTypeConstructor | string) {
    const status: StatusType = {
        id: '',
        stages: [],
        allowedMoves: [],
        allowedAdminMoves: [],
        requirements: {}
    };

    if (is.string(dataOrId)) {
        const id = dataOrId?.trim();
        assert.check(id, 'id must be a non-empty string.');
        status.id = id;
    }
    else {
        Object.assign(status, dataOrId);
        const id = status.id?.trim();
        assert.check(id, 'id must be a non-empty string.');
        status.id = id;

        if (!is.array(status.stages)) {
            status.stages = [];
        }
        if (!is.array(status.allowedMoves)) {
            status.allowedMoves = [];
        }
        if (!is.object(status.requirements)) {
            status.requirements = {};
        }
    }

    status.title ??= status.id;

    return status;
}

function makeStage(dataOrId: StageTypeConstructor | string) {
    const stage: StageType = {
        id: '',
        allowedMoves: []
    }

    if (is.string(dataOrId)) {
        const id = dataOrId.trim();
        assert.check(id, 'id must be a non-empty');
        stage.id = id;
    }
    else {
        Object.assign(stage, dataOrId);
        const id = stage.id?.trim();
        assert.check(id, 'id must be a non-empty');
        stage.id = id;

        if (!is.array(stage.allowedMoves)) {
            stage.allowedMoves = [];
        }
    }

    stage.title ??= stage.id;

    return stage;
}

/*
    NOTE: Per discussions with Chantelle, the database id for any status or stage will be Pascal Case w/ spaces.
*/
export const [statuses, statusMapping] = (() => {
    // REMINDER: Take care to never change the "id" once this is published to Prod. If the user-displayed name needs to be changed, add or update the title field.
    const arr: StatusType[] = [
        // Avoid adding stages to Under Eval, the lane for this status ignores any stages.
        makeStatus('Under Evaluation'),
        makeStatus('In Development'),
        makeStatus({
            id: 'In Production',
            title: 'In Hypercare',
            requirements: {
                milestones: true,
            },

            stages: [
                // NOTE: If we were to disable Hypercare, any Released would also be shown in automations, which we don't want. So instead we add a "empty" stage as a default.
                makeStage({ id: 'Hypercare', title: '' }),
                makeStage({
                    id: 'Released',
                    hidden: true
                }),
            ]
        }),
        makeStatus({
            title: 'On Hold',
            id: 'On Hold',
            requirements: {
                reason: 'Reason for moving to On Hold?'
            },
            stages: [
                //makeStage({ id: 'On Hold', title: '' }),
                //makeStage('Blocked')
            ]
        }),
        makeStatus({
            id: 'Denied',
            requirements: {
                reason: true
            },
            hidden: true
        }),
        makeStatus({
            id: 'Cancelled',
            requirements: {
                reason: true
            },
            hidden: true
        }),
        makeStatus({
            id: 'Completed',
            hidden: true
        })
    ];

    // NOTE: The typings here are manually maintained. If the id above changes, these need to be changed as well.
    const mapping = {} as {
        UnderEvaluation: StatusType, InDevelopment: StatusType, InProduction: StatusType, OnHold: StatusType, Denied: StatusType, Cancelled: StatusType, Completed: StatusType
        [x: string]: StatusType | undefined
    };

    for (const item of arr) {
        // We want both the trimmed and untrimmed id mappings. It's ok if the untrimmed isn't different than the trimmed. The untrimmed is for dynamic usages, the trimmed is for hard-coding.
        mapping[item.id.replace(/[\s\W]/g, '')] = item;
        mapping[item.id] = item;
    }

    // Define the allowed moves for statuses here, now that the ids and mappings are defined.
    mapping[mapping.UnderEvaluation.id].allowedMoves = [mapping.UnderEvaluation.id, mapping.InDevelopment.id, mapping.OnHold.id, mapping.Denied.id];
    mapping[mapping.InDevelopment.id].allowedMoves = [mapping.InDevelopment.id, mapping.InProduction.id, mapping.OnHold.id, mapping.Cancelled.id];
    mapping[mapping.InDevelopment.id].allowedAdminMoves = [mapping.UnderEvaluation.id];
    mapping[mapping.InProduction.id].allowedMoves = [mapping.InProduction.id, mapping.Completed.id];
    mapping[mapping.OnHold.id].allowedMoves = [mapping.OnHold.id, mapping.UnderEvaluation.id, mapping.InDevelopment.id];
    mapping[mapping.OnHold.id].allowedAdminMoves = [mapping.Cancelled.id];

    // Ensure that the object cannot be modified after this.
    for (const item of arr) {
        Object.freeze(item);
    }

    return [Object.freeze(arr), Object.freeze(mapping)];
})();

export type StatusTypes = typeof statusMapping;

const flatStages = statuses.flatMap(x => x.stages);
export const stages = Object.freeze(flatStages.map(x => x.title));
export const stageIds = Object.freeze(flatStages.map(x => x.id));

export const stageIdToTitle = stageIds.reduce((map, stage, index) => {
    map.set(stage, stages[index]);
    return map;
}, new Map<string, string>());

export const statusTitles = Object.freeze(statuses.map(x => x.title));
export const statusIds = Object.freeze(statuses.map(x => x.id));

export const statusIdToTitle = statusIds.reduce((map, status, index) => {
    map.set(status, statusTitles[index]);
    return map;
}, new Map<string, string>());

export const [priorities, priorityMapping] = (() => {
    const arr: PriorityType[] = [
        makePriority({ id: 'Low', value: 1 }), makePriority({ id: 'Medium', value: 2 }), makePriority({ id: 'High', value: 3 }),
        // Admin Priorities are always higher than default priorities.
        makePriority({ id: 'Admin_Low', title: 'Important', value: 4, adminOnly: true }), makePriority({ id: 'Admin_Medium', title: 'Urgent', value: 5, adminOnly: true }), makePriority({ id: 'Admin_High', title: 'Critical', value: 6, adminOnly: true })
    ];

    // NOTE: The typings here are manually maintained. If the id above changes, these need to be changed as well.
    const mapping = {} as {
        Low: PriorityType, Medium: PriorityType, High: PriorityType, Admin_Low: PriorityType, Admin_Medium: PriorityType, Admin_High: PriorityType
        [x: string]: PriorityType | undefined
    };

    for (const item of arr) {
        // We want both the trimmed and untrimmed id mappings. It's ok if the untrimmed isn't different than the trimmed. The untrimmed is for dynamic usages, the trimmed is for hard-coding.
        mapping[item.id.replace(/[\s\W]/g, '')] = item;
        mapping[item.id] = item;
    }

    // Ensure that the object cannot be modified after this.
    for (const item of arr) {
        Object.freeze(item);
    }

    return [Object.freeze(arr), Object.freeze(mapping)];
})();

// likely will delete this with a later PR
export const rpaModes = [{label: "Attended", value: "Attended"}, {label: "Unattended", value: "Unattended"}];

// Experimental, not updating at the moment.
export const versionNumber = `${metadata.buildMajor}.${metadata.buildMinor}.${metadata.buildRevision}${metadata.buildTag ? " " + metadata.buildTag : ''}`;

const AppConstants = {
    versionNumber,

    stages: stages,
    stageIds: stageIds,
    stageIdToTitle: stageIdToTitle,

    statusTitles: statusTitles,
    statusIds: statusIds,
    statusIdToTitle: statusIdToTitle,

    statuses: statuses,
    rpaModes: rpaModes
}

export default AppConstants;