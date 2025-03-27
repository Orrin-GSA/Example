/**
 * Mock Server for the dev
 */

import AppConstants, { statuses, statusMapping } from '../src_shared/AppConstants';
import fs from 'fs';
import * as data from './mockdata.json';
import '../src_shared/RpaTypeDefs.d.ts';
import { DateTime, Settings } from 'luxon';
import { arrayUtils } from '../src_shared/TypeUtils';

/* Setting Up Luxon Default TZ */
Settings.defaultZone = 'America/New_York';

type Override<T, TOverride> = Omit<T, keyof TOverride> & TOverride;
type MockDataTypeOverride = { rpa_projects: RpaProject[], milestones: Milestone[], enhancements: EnhancementProject[], scripts: ScriptProject[], bugs: BugProject[], rankings: Ranking[] };
type MockDataType = Override<typeof data, MockDataTypeOverride>;
export const mock_data = structuredClone(data) as MockDataType;

const dataDateFormat = new Intl.DateTimeFormat('en-US', {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: 'America/New_York'
});

function getRandomInt(min: number, max: number) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}


/**
 * A function to ensure all items of an array are used for a more even balance, excluding the last item of the previous iteration.
 * @returns A function that can be repeatedly called to get a random element of an array without repeats until all items have been seen.
 */
const randomFromArray = <T>(array: T[] | Readonly<T[]>): () => T => {
    var copy = array.slice(0);
    let lastItem = null;
    return function () {
        if (copy.length <= 0) {
            copy = array.slice(0);
            const lastItemIndex = copy.indexOf(lastItem);
            // Remove the last item on reset, to ensure you can't have "Moved Development to Development".
            if (lastItemIndex > -1) {
                copy.splice(lastItemIndex, 1);
            }
        }

        var index = Math.floor(Math.random() * copy.length);
        lastItem = copy[index];
        copy.splice(index, 1);
        return lastItem;
    };
};

const randomArrayFromArray = <T>(array: T[] | Readonly<T[]>): [() => T, (upTo: number, min?: number) => T[]] => {
    const randomArray = randomFromArray(array);
    return [randomArray,
        function (upTo: number, min: number = 1) {
            const result = [];
            const count = getRandomInt(min, upTo);
            for (let i = 0; i < count; i++) {
                result.push(randomArray());
            }
            return result;
        }
    ];
}

/**
 * A function to prevent an item from being seen twice until resetAfter # of items have been seen. Intended for largers arrays where it might take awhile to get through a whole list.
 * @returns A function that can be repeatedly called to get a random element of an array without repeats until up to resetAfter # of items have been seen.
 */
const randomFromArrayEarly = <T>(array: T[] | Readonly<T[]>, resetAfter: number): () => T => {
    var copy = array.slice(0);
    let lastItem = null;

    // -1 to account for removing lastItem from the next reset.
    if (resetAfter >= array.length - 1) {
        console.warn('resetAfter is not shorter than the array length, defaulting to array length - 2.');
        resetAfter = array.length - 2;
    }

    const resetLength = array.length - resetAfter;

    return function () {
        if (copy.length <= resetLength) {
            copy = array.slice(0);
            const lastItemIndex = copy.indexOf(lastItem);
            // Remove the last item on reset, to ensure you can't have "Moved Development to Development".
            if (lastItemIndex > -1) {
                copy.splice(lastItemIndex, 1);
            }
        }

        var index = Math.floor(Math.random() * copy.length);
        lastItem = copy[index];
        copy.splice(index, 1);
        return lastItem;
    };
};

const randomArrayFromArrayEarly = <T>(array: T[] | Readonly<T[]>, resetAfter: number): [() => T, (upTo: number, min?: number) => T[]] => {
    const randomArray = randomFromArrayEarly(array, resetAfter);
    return [randomArray,
        function (upTo: number, min: number = 1) {
            const result = [];
            const count = getRandomInt(min, upTo);
            for (let i = 0; i < count; i++) {
                result.push(randomArray());
            }
            return result;
        }
    ];
}

/**
 * Returns a random item of an array.
 * @returns A function that can be repeatedly called to get a random element of an array without repeats until all items have been seen.
 */
const getRandomArrayElement = <T>(array: T[]): T | undefined => {
    var index = Math.floor(Math.random() * array.length);
    return array[index];
}

const getRandomRange = (intMax: number) => {
    return Math.ceil(Math.random() * intMax);
}

const getRandomPercentage = () => {
    return Math.ceil(Math.random() * 100);
}

const getIfPercentage = <T>(threshold: number, fcnResult: () => T): T | null => {
    return (getRandomPercentage() < threshold) ? fcnResult() : null;
}

const getIfFieldAndPercentage = <T>(field, threshold: number, fcnResult: () => T): T | null => {
    return !!field ? getIfPercentage(threshold, fcnResult) : null;
}

const rndFiscalDate = (dateOfFiscal: DateTime): DateTime => {
    const endFiscalYear = dateOfFiscal.set({ month: 9, day: 30 }).endOf('day');
    const startFiscalYear = endFiscalYear.minus({ years: 1 }).plus({ day: 1 }).startOf('day');

    return DateTime.fromMillis(startFiscalYear.toMillis() + Math.random() * (endFiscalYear.toMillis() - startFiscalYear.toMillis()));
}

const rndFiscalDateAfter = (afterDate: DateTime, dateOfFiscal: DateTime): DateTime => {
    const endFiscalYear = dateOfFiscal.set({ month: 9, day: 30 }).endOf('day');

    return DateTime.fromMillis(afterDate.toMillis() + Math.random() * (endFiscalYear.toMillis() - afterDate.toMillis()));
}

export const newMilestone = (id, ref_id): Milestone => {
    return {
        ID: id,
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
        prelim_security_url: null
    };
}

export const newRanking = (project_id: string, rank: number): Ranking => {
    return {
        project_id,
        rank
    };
}

export const milestoneFields = Object.keys(newMilestone('', ''));

const getRandomPriority = randomFromArray(['Low', 'Low', 'Medium', 'Medium', 'Medium', 'High']);
const getRandomOnline = randomFromArray<any>(['ONLINE', 'ONLINE', 'ONLINE', 'OFFLINE']);
const getRandomOffice = randomFromArray(mock_data.office.map(x => x.ID));
const getRandomStatus = randomFromArray(AppConstants.statuses);
const getRandomPoaUser = randomFromArray(mock_data.poa_user);
const getRandomUser = randomFromArray(mock_data.employee_user);
const [getRandomSystem, getRandomSystems] = randomArrayFromArrayEarly(mock_data.systems, 6);
const [getRandomTool, getRandomTools] = randomArrayFromArrayEarly(mock_data.it_tools, 6);

// This happens after loading the static mockdata.json, so mock_data is accessible here (does not include rpa_projects or milestones).
export function CreateMockRpas(): RpaProject[] {
    // Duplicating just for the sake of "weighing" towards medium.
    const getRandomAttended = randomFromArray<any>(['Attended', 'Attended', 'Attended', 'Unattended', 'Unattended']);

    let id = 22028;
    let rpaProjects = [];
    let fiscalStartDate = DateTime.now();

    for (let i = 0; i < 200; i++) {

        var currId = "RPA-" + id.toString().padStart(5, '0');
        var currName = "Project Name " + currId;
        var currComment = "This is a comment for " + currId;
        var currStatus = getRandomStatus();

        const statusTo = currStatus.id;
        const poaUser = getRandomPoaUser();
        const poaUserFriendlyName = poaUser.email ?? poaUser.name;

        const startDate = rndFiscalDate(fiscalStartDate);
        const estDeliveryDate = rndFiscalDateAfter(startDate, fiscalStartDate);
        const actionDate = rndFiscalDate(fiscalStartDate);

        let rpaProject: RpaProject = {
            ID: currId,
            subidea_id: "",
            name: currName,
            priority: getRandomPriority(),
            status: statusTo,
            dev_stage: getRandomArrayElement(currStatus.stages)?.id ?? "",
            dev_id: poaUser.ID,
            start_date: startDate.toISO(),
            created_date: startDate.toISO(),
            est_delivery_date: estDeliveryDate.toISO(),
            attended_unattended: getRandomAttended(),
            deployed_version: "ICATSAuditRecordBot.1.1.55-alpha",
            online_offline: getRandomOnline(),
            process_owner_ids: getRandomUser().ID,
            custodian_ids: getRandomUser().ID,
            npe_ids: "NPE-0001",
            system_ids: getRandomSystems(3).map(x => x.ID).join(','),
            tools_ids: getRandomTools(3, 0).map(x => x.ID).join(','),
            document_ids: "DOC-00001,DOC-00002,DOC-00003",
            office_id: getRandomOffice(),
            project_support_ids: getRandomPoaUser().ID,
            project_folder_id: "",
            comments_history: JSON.stringify([{ date: rndFiscalDate(fiscalStartDate).toISO(), user: poaUserFriendlyName, comment: currComment }]),
            //actions_history: JSON.stringify([{ date: actionDate.toISO(), user: poaUserFriendlyName, type: 'STATUS_CHANGE', description: `Moved from ${statusFrom} to ${statusTo}` }]),
            last_modified_date: estDeliveryDate.toISO(),
            hours_added: getRandomPercentage() > 5 ? Math.floor(Math.random() * 1000).toString() : undefined,
            hours_saved: getRandomPercentage() > 5 ? Math.floor(Math.random() * 1000).toString() : undefined,
        };

        if (rpaProject.status === statusMapping.InProduction.id) {
            rpaProject.live_date = actionDate.toISO();
        }

        if (rpaProject.status === statusMapping.OnHold.id) {
            rpaProject.status_date = actionDate.toISO();
            rpaProject.status_reason = Math.random() > .75 ? 'Some Reason' : 'Issues Appeared';
        }

        if (rpaProject.status === statusMapping.Cancelled.id) {
            rpaProject.status_date = actionDate.toISO();
            rpaProject.status_reason = Math.random() > .75 ? 'Stack Overflow' : 'Unnecessary';
        }

        rpaProjects.push(rpaProject);
        id += 1;
        if (i > 0 && i % 50 === 0) {
            fiscalStartDate = fiscalStartDate.minus({ years: 1 });
        }
    }

    return rpaProjects;
}

export function CreateMockEnhancements(projects: (RpaProject | ScriptProject)[]): EnhancementProject[] {
    // Duplicating just for the sake of "weighing" towards medium.
    const getRandomPriority = randomFromArray(['Low', 'Low', 'Medium', 'Medium', 'Medium', 'High']);
    const getRandomOnline = randomFromArray<any>(['ONLINE', 'ONLINE', 'ONLINE', 'OFFLINE']);
    const getRandomAttended = randomFromArray<any>(['Attended', 'Attended', 'Attended', 'Unattended', 'Unattended']);

    let id = 22028;
    let enhancements = [];
    let fiscalStartDate = DateTime.now();

    for (let i = 0; i < projects.length; i++) {
        var refProject = projects[getRandomRange(projects.length) - 1];
        var currId = "ENH-" + id.toString().padStart(5, '0');
        var currName = "Enhancement for " + refProject.ID;
        var currComment = "This is a comment for " + currId;
        var currStatus = getRandomStatus();

        const statusTo = currStatus.id;
        const poaUser = getRandomPoaUser();

        const startDate = rndFiscalDate(fiscalStartDate);
        const estDeliveryDate = rndFiscalDateAfter(startDate, fiscalStartDate);
        const actionDate = rndFiscalDate(fiscalStartDate);

        let rpaEnhancement: EnhancementProject = {
            ID: currId,
            subidea_id: "",
            name: currName,
            priority: getRandomPriority(),
            status: statusTo,
            dev_stage: getRandomArrayElement(currStatus.stages)?.id ?? "",
            dev_id: poaUser.ID,
            start_date: startDate.toISO(),
            created_date: startDate.toISO(),
            est_delivery_date: estDeliveryDate.toISO(),
            attended_unattended: getRandomAttended(),
            deployed_version: "ICATSAuditRecordBot.1.1.55-alpha",
            online_offline: getRandomOnline(),
            system_ids: getRandomSystems(3).map(x => x.ID).join(','),
            tools_ids: getRandomTools(3, 0).map(x => x.ID).join(','),
            document_ids: "DOC-00001,DOC-00002,DOC-00003",
            project_folder_id: "",
            project_support_ids: getRandomPoaUser().ID,
            comments_history: JSON.stringify([{ date: rndFiscalDate(fiscalStartDate).toISO(), comment: currComment }]),
            //actions_history: JSON.stringify([{ date: actionDate.toISO(), user: poaUser.ID, type: 'STATUS_CHANGE', description: `Moved from ${statusFrom} to ${statusTo}` }]),
            last_modified_date: estDeliveryDate.toISO(),
            hours_added: getRandomPercentage() > 5 ? Math.floor(Math.random() * 1000).toString() : undefined,
            hours_saved: getRandomPercentage() > 5 ? Math.floor(Math.random() * 1000).toString() : undefined,
            project_id: refProject.ID
        };

        if (rpaEnhancement.status === statusMapping.InProduction.id) {
            rpaEnhancement.live_date = actionDate.toISO();
        }

        if (rpaEnhancement.status === statusMapping.OnHold.id) {
            rpaEnhancement.status_date = actionDate.toFormat('DATE_SHORT');
            rpaEnhancement.status_reason = Math.random() > .75 ? 'Some Reason' : 'Issues Appeared';
        }

        if (rpaEnhancement.status === statusMapping.Cancelled.id) {
            rpaEnhancement.status_date = actionDate.toFormat('DATE_SHORT');
            rpaEnhancement.status_reason = Math.random() > .75 ? 'Stack Overflow' : 'Unnecessary';
        }

        enhancements.push(rpaEnhancement);
        id += 1;
        if (i > 0 && i % 50 === 0) {
            fiscalStartDate = fiscalStartDate.minus({ years: 1 });
        }
    }
    return enhancements;

}

export function CreateMockBugs(projects: (RpaProject | ScriptProject)[]): BugProject[] {
    // Duplicating just for the sake of "weighing" towards medium.
    const getRandomPriority = randomFromArray(['Low', 'Low', 'Medium', 'Medium', 'Medium', 'High']);

    let id = 22028;
    let enhancements = [];
    let fiscalStartDate = DateTime.now();

    for (let i = 0; i < projects.length; i++) {
        var refProject = projects[getRandomRange(projects.length) - 1];
        var currId = "BUG-" + id.toString().padStart(5, '0');
        var currName = "Bug for " + refProject.ID;
        var currComment = "This is a comment for " + currId;
        var currStatus = getRandomStatus();

        const statusTo = currStatus.id;
        //const statusFrom = getRandomStatus().id;
        const poaUser = getRandomPoaUser();

        const startDate = rndFiscalDate(fiscalStartDate);
        const estDeliveryDate = rndFiscalDateAfter(startDate, fiscalStartDate);
        const actionDate = rndFiscalDate(fiscalStartDate);

        let rpaBug: BugProject = {
            ID: currId,
            subidea_id: "",
            name: currName,
            priority: getRandomPriority(),
            status: statusTo,
            dev_stage: getRandomArrayElement(currStatus.stages)?.id ?? "",
            dev_id: poaUser.ID,
            start_date: startDate.toISO(),
            created_date: startDate.toISO(),
            est_delivery_date: estDeliveryDate.toISO(),
            //system_ids: "SYS-001",
            //document_ids: "DOC-00001,DOC-00002,DOC-00003",
            //project_folder_id: "",
            //project_support_ids: getRandomPoaUser(),
            comments_history: JSON.stringify([{ date: rndFiscalDate(fiscalStartDate).toISO(), comment: currComment }]),
            //actions_history: JSON.stringify([{ date: actionDate.toISO(), user: poaUser.ID, type: 'STATUS_CHANGE', description: `Moved from ${statusFrom} to ${statusTo}` }]),
            last_modified_date: estDeliveryDate.toISO(),
            //hours_added: getRandomPercentage() > 5 ? Math.floor(Math.random() * 1000).toString() : undefined,
            //hours_saved: getRandomPercentage() > 5 ? Math.floor(Math.random() * 1000).toString() : undefined,
            project_id: refProject.ID,
            ticket_id: undefined
        };

        if (rpaBug.status === statusMapping.InProduction.id) {
            rpaBug.live_date = actionDate.toISO();
        }

        if (rpaBug.status === statusMapping.OnHold.id) {
            rpaBug.status_date = actionDate.toFormat('DATE_SHORT');
            rpaBug.status_reason = Math.random() > .75 ? 'Some Reason' : 'Issues Appeared';
        }

        if (rpaBug.status === statusMapping.Cancelled.id) {
            rpaBug.status_date = actionDate.toFormat('DATE_SHORT');
            rpaBug.status_reason = Math.random() > .75 ? 'Stack Overflow' : 'Unnecessary';
        }

        enhancements.push(rpaBug);
        id += 1;
        if (i > 0 && i % 50 === 0) {
            fiscalStartDate = fiscalStartDate.minus({ years: 1 });
        }
    }
    return enhancements;

}

export function CreateMockScripts(): ScriptProject[] {
    // Duplicating just for the sake of "weighing" towards medium.
    //const getRandomAttended = randomFromArray<any>(['Attended', 'Attended', 'Attended', 'Unattended', 'Unattended']);

    let id = 22028;
    let rpaScripts = [];
    let fiscalStartDate = DateTime.now();

    for (let i = 0; i < 50; i++) {
        var currId = "SCR-" + id.toString().padStart(5, '0');
        var currName = "Script Name " + currId;
        var currComment = "This is a comment for " + currId;
        var currStatus = getRandomStatus();

        const statusTo = currStatus.id;
        //const statusFrom = getRandomStatus().id;
        const poaUser = getRandomPoaUser();
        const poaUserFriendlyName = poaUser.email ?? poaUser.name;

        const startDate = rndFiscalDate(fiscalStartDate);
        const estDeliveryDate = rndFiscalDateAfter(startDate, fiscalStartDate);
        const actionDate = rndFiscalDate(fiscalStartDate);

        let rpaScript: ScriptProject = {
            ID: currId,
            subidea_id: "",
            name: currName,
            priority: getRandomPriority(),
            status: statusTo,
            dev_stage: getRandomArrayElement(currStatus.stages)?.id ?? "",
            dev_id: poaUser.ID,
            start_date: startDate.toISO(),
            created_date: startDate.toISO(),
            est_delivery_date: estDeliveryDate.toISO(),
            //attended_unattended: getRandomAttended(),
            deployed_version: "ICATSAuditRecordBot.1.1.55-alpha",
            online_offline: getRandomOnline(),
            process_owner_ids: getRandomUser().ID,
            custodian_ids: getRandomUser().ID,
            //npe_ids: "NPE-0001",
            system_ids: getRandomSystems(3).map(x => x.ID).join(','),
            tools_ids: getRandomTools(3, 0).map(x => x.ID).join(','),
            document_ids: "DOC-00001,DOC-00002,DOC-00003",
            office_id: getRandomOffice(),
            project_support_ids: getRandomPoaUser().ID,
            project_folder_id: "",
            comments_history: JSON.stringify([{ date: rndFiscalDate(fiscalStartDate).toISO(), user: poaUserFriendlyName, comment: currComment }]),
            //actions_history: JSON.stringify([{ date: actionDate.toISO(), user: poaUserFriendlyName, type: 'STATUS_CHANGE', description: `Moved from ${statusFrom} to ${statusTo}` }]),
            last_modified_date: estDeliveryDate.toISO(),
            hours_added: getRandomPercentage() > 5 ? Math.floor(Math.random() * 1000).toString() : undefined,
            hours_saved: getRandomPercentage() > 5 ? Math.floor(Math.random() * 1000).toString() : undefined,
        };

        if (rpaScript.status === statusMapping.InProduction.id) {
            rpaScript.live_date = actionDate.toISO();
        }

        if (rpaScript.status === statusMapping.OnHold.id) {
            rpaScript.status_date = actionDate.toISO();
            rpaScript.status_reason = Math.random() > .75 ? 'Some Reason' : 'Issues Appeared';
        }

        if (rpaScript.status === statusMapping.Cancelled.id) {
            rpaScript.status_date = actionDate.toISO();
            rpaScript.status_reason = Math.random() > .75 ? 'Stack Overflow' : 'Unnecessary';
        }

        rpaScripts.push(rpaScript);
        id += 1;
        if (i > 0 && i % 50 === 0) {
            fiscalStartDate = fiscalStartDate.minus({ years: 1 });
        }
    }

    return rpaScripts;
}

export function CreateMockMilestones(projects: RpaProject[], enhancements: EnhancementProject[], scripts: ScriptProject[]): Milestone[] {

    let id = 14062;
    let milestones = [];

    // GOAL: simulate making progress step by step, to give the semblance of real data.
    for (let i = 0; i < projects.length; i++) {
        let refProject = projects[i];
        let currId = "MS-" + id.toString().padStart(6, '0');

        let rpaMilestone = newMilestone(currId, refProject.ID);
        let fiscalStartDate = DateTime.fromISO(refProject.start_date);

        if(refProject.status === statusMapping.InDevelopment.id) {
            //@ts-expect-error
            rpaMilestone.kickoff_complete = getIfPercentage(99, () => rndFiscalDate(fiscalStartDate));
            //@ts-expect-error
            rpaMilestone.test_plan_complete = getIfFieldAndPercentage(rpaMilestone.kickoff_complete, 90, () => rndFiscalDateAfter(rpaMilestone.kickoff_complete, fiscalStartDate));
            //@ts-expect-error
            rpaMilestone.developer_testing_complete = getIfFieldAndPercentage(rpaMilestone.test_plan_complete, 90, () => rndFiscalDateAfter(rpaMilestone.test_plan_complete, fiscalStartDate));
            //@ts-expect-error
            rpaMilestone.uat_complete = getIfFieldAndPercentage(rpaMilestone.developer_testing_complete, 90, () => rndFiscalDateAfter(rpaMilestone.developer_testing_complete, fiscalStartDate));
            //@ts-expect-error
            rpaMilestone.pta_complete = getIfFieldAndPercentage(rpaMilestone.uat_complete, 90, () => rndFiscalDateAfter(rpaMilestone.uat_complete, fiscalStartDate));
            //@ts-expect-error
            rpaMilestone.security_assessment = getIfFieldAndPercentage(rpaMilestone.pta_complete, 90, () => rndFiscalDateAfter(rpaMilestone.pta_complete, fiscalStartDate));
            rpaMilestone.dd_complete = getIfFieldAndPercentage(rpaMilestone.security_assessment, 90, () => 'www.google.com');
            //@ts-expect-error
            rpaMilestone.attributes_questionnaire = getIfFieldAndPercentage(rpaMilestone.dd_complete, 90, () => rndFiscalDateAfter(rpaMilestone.security_assessment, fiscalStartDate));
            //@ts-expect-error
            rpaMilestone.demo_video = getIfFieldAndPercentage(rpaMilestone.attributes_questionnaire, 90, () => rndFiscalDateAfter(rpaMilestone.attributes_questionnaire, fiscalStartDate));
            //@ts-expect-error
            rpaMilestone.archer = getIfFieldAndPercentage(rpaMilestone.demo_video, 90, () => rndFiscalDateAfter(rpaMilestone.demo_video, fiscalStartDate));
            //@ts-expect-error
            rpaMilestone.system_access_signatures = getIfFieldAndPercentage(rpaMilestone.archer, 90, () => rndFiscalDateAfter(rpaMilestone.archer, fiscalStartDate));

        }
        else {
            //@ts-expect-error
            rpaMilestone.kickoff_complete = rndFiscalDate(fiscalStartDate);
            //@ts-expect-error
            rpaMilestone.test_plan_complete = rndFiscalDateAfter(rpaMilestone.kickoff_complete, fiscalStartDate);
            //@ts-expect-error
            rpaMilestone.developer_testing_complete = rndFiscalDateAfter(rpaMilestone.test_plan_complete, fiscalStartDate);
            //@ts-expect-error
            rpaMilestone.uat_complete = rndFiscalDateAfter(rpaMilestone.developer_testing_complete, fiscalStartDate);
            //@ts-expect-error
            rpaMilestone.pta_complete = rndFiscalDateAfter(rpaMilestone.uat_complete, fiscalStartDate);
            //@ts-expect-error
            rpaMilestone.security_assessment = rndFiscalDateAfter(rpaMilestone.pta_complete, fiscalStartDate);
            rpaMilestone.dd_complete = 'www.google.com';
            //@ts-expect-error
            rpaMilestone.attributes_questionnaire = rndFiscalDateAfter(rpaMilestone.security_assessment, fiscalStartDate);
            //@ts-expect-error
            rpaMilestone.demo_video = rndFiscalDateAfter(rpaMilestone.attributes_questionnaire, fiscalStartDate);
            //@ts-expect-error
            rpaMilestone.archer = rndFiscalDateAfter(rpaMilestone.demo_video, fiscalStartDate);
            //@ts-expect-error
            rpaMilestone.system_access_signatures = rndFiscalDateAfter(rpaMilestone.archer, fiscalStartDate);
        }

        milestones.push(rpaMilestone);
        id += 1;
    }

    for (let i = 0; i < enhancements.length; i++) {
        let refProject = enhancements[i];
        let currId = "MS-" + id.toString().padStart(6, '0');

        let enhMilestone = newMilestone(currId, refProject.ID);
        let fiscalStartDate = DateTime.fromISO(refProject.start_date);

        if(refProject.status === statusMapping.InDevelopment.id) {
            //@ts-expect-error
            enhMilestone.kickoff_complete = getIfPercentage(99, () => rndFiscalDate(fiscalStartDate));
            //@ts-expect-error
            enhMilestone.test_plan_complete = getIfFieldAndPercentage(enhMilestone.kickoff_complete, 90, () => rndFiscalDateAfter(enhMilestone.kickoff_complete, fiscalStartDate));
            //@ts-expect-error
            enhMilestone.developer_testing_complete = getIfFieldAndPercentage(enhMilestone.test_plan_complete, 80, () => rndFiscalDateAfter(enhMilestone.test_plan_complete, fiscalStartDate));
            //@ts-expect-error
            enhMilestone.uat_complete = getIfFieldAndPercentage(enhMilestone.developer_testing_complete, 70, () => rndFiscalDateAfter(enhMilestone.developer_testing_complete, fiscalStartDate));
            //@ts-expect-error
            enhMilestone.pta_complete = getIfFieldAndPercentage(enhMilestone.uat_complete, 60, () => rndFiscalDateAfter(enhMilestone.uat_complete, fiscalStartDate));
            //@ts-expect-error
            enhMilestone.security_assessment = getIfFieldAndPercentage(enhMilestone.pta_complete, 50, () => rndFiscalDateAfter(enhMilestone.pta_complete, fiscalStartDate));
            enhMilestone.dd_complete = getIfFieldAndPercentage(enhMilestone.security_assessment, 40, () => 'www.google.com');
            //@ts-expect-error
            enhMilestone.attributes_questionnaire = getIfFieldAndPercentage(enhMilestone.dd_complete, 90, () => rndFiscalDateAfter(enhMilestone.security_assessment, fiscalStartDate));
            //@ts-expect-error
            enhMilestone.demo_video = getIfFieldAndPercentage(enhMilestone.attributes_questionnaire, 90, () => rndFiscalDateAfter(enhMilestone.attributes_questionnaire, fiscalStartDate));
            //@ts-expect-error
            enhMilestone.archer = getIfFieldAndPercentage(enhMilestone.demo_video, 90, () => rndFiscalDateAfter(enhMilestone.demo_video, fiscalStartDate));
            //@ts-expect-error
            enhMilestone.system_access_signatures = getIfFieldAndPercentage(enhMilestone.archer, 90, () => rndFiscalDateAfter(enhMilestone.archer, fiscalStartDate));
        }
        else {
            //@ts-expect-error
            enhMilestone.kickoff_complete = rndFiscalDate(fiscalStartDate);
            //@ts-expect-error
            enhMilestone.test_plan_complete = rndFiscalDateAfter(enhMilestone.kickoff_complete, fiscalStartDate);
            //@ts-expect-error
            enhMilestone.developer_testing_complete = rndFiscalDateAfter(enhMilestone.test_plan_complete, fiscalStartDate);
            //@ts-expect-error
            enhMilestone.uat_complete = rndFiscalDateAfter(enhMilestone.developer_testing_complete, fiscalStartDate);
            //@ts-expect-error
            enhMilestone.pta_complete = rndFiscalDateAfter(enhMilestone.uat_complete, fiscalStartDate);
            //@ts-expect-error
            enhMilestone.security_assessment = rndFiscalDateAfter(enhMilestone.pta_complete, fiscalStartDate);
            enhMilestone.dd_complete = 'www.google.com';
            //@ts-expect-error
            enhMilestone.attributes_questionnaire = rndFiscalDateAfter(enhMilestone.security_assessment, fiscalStartDate);
            //@ts-expect-error
            enhMilestone.demo_video = rndFiscalDateAfter(enhMilestone.attributes_questionnaire, fiscalStartDate);
            //@ts-expect-error
            enhMilestone.archer = rndFiscalDateAfter(enhMilestone.demo_video, fiscalStartDate);
            //@ts-expect-error
            enhMilestone.system_access_signatures = rndFiscalDateAfter(enhMilestone.archer, fiscalStartDate);
        }

        milestones.push(enhMilestone);
        id += 1;
    }

    // TODO: Scripts have a smaller set of milestones.

    for (let i = 0; i < scripts.length; i++) {
        let refProject = scripts[i];
        let currId = "MS-" + id.toString().padStart(6, '0');

        let scriptMilestone = newMilestone(currId, refProject.ID);
        let fiscalStartDate = DateTime.fromISO(refProject.start_date);

        // Scripts need SDD, UAT, and "Google Team" Approval. Can we piggy back on the existing approvals instead of creating whole new columns?

        if(refProject.status === statusMapping.InDevelopment.id) {
            //@ts-expect-error
            scriptMilestone.kickoff_complete = getIfPercentage(99, () => rndFiscalDate(fiscalStartDate));
            scriptMilestone.dd_complete = getIfFieldAndPercentage(scriptMilestone.kickoff_complete, 80, () => 'www.google.com');
            //@ts-expect-error
            scriptMilestone.developer_testing_complete = getIfFieldAndPercentage(scriptMilestone.dd_complete, 60, () => rndFiscalDateAfter(scriptMilestone.kickoff_complete, fiscalStartDate));
            //@ts-expect-error
            scriptMilestone.uat_complete = getIfFieldAndPercentage(scriptMilestone.developer_testing_complete, 60, () => rndFiscalDateAfter(scriptMilestone.developer_testing_complete, fiscalStartDate));
            //@ts-expect-error
            scriptMilestone.security_assessment = getIfFieldAndPercentage(scriptMilestone.uat_complete, 40, () => rndFiscalDateAfter(scriptMilestone.uat_complete, fiscalStartDate));
        }
        else {
            //@ts-expect-error
            scriptMilestone.kickoff_complete = rndFiscalDate(fiscalStartDate);
            scriptMilestone.dd_complete = 'www.google.com';
            //@ts-expect-error
            scriptMilestone.developer_testing_complete = rndFiscalDateAfter(scriptMilestone.kickoff_complete, fiscalStartDate);
            //@ts-expect-error
            scriptMilestone.uat_complete = rndFiscalDateAfter(scriptMilestone.developer_testing_complete, fiscalStartDate);
            //@ts-expect-error
            scriptMilestone.security_assessment = rndFiscalDateAfter(scriptMilestone.uat_complete, fiscalStartDate);
        }

        milestones.push(scriptMilestone);
        id += 1;
    }


    return milestones;
}

// TODO: Intentionally leave holes in the ranking (Under Eval projects w/o a associated ranking object) to test the front-end's ability to plug those holes.
export function CreateMockRankings(projects: ProjectCommon[]): Ranking[] {
    let rankings = [];
    projects = projects.filter(x => x.status === statusMapping.UnderEvaluation.id);
    
    const rankingRange = arrayUtils.shuffle(arrayUtils.range(projects.length));

    for (let i = 0; i < projects.length; i++) {
        let refProject = projects[i];

        let ranking = newRanking(refProject.ID, rankingRange.pop());

        rankings.push(ranking);
    }


    return rankings;
}

export function getRpas(): RpaProject[] {
    let data;

    if (!fs.existsSync('data/projects.json')) {
        let projects = CreateMockRpas();
        data = JSON.stringify(projects);
        fs.mkdirSync('data/', { recursive: true });
        fs.writeFileSync('data/projects.json', data, { encoding: 'utf8', flag: 'w' });
    }
    else {
        data = fs.readFileSync('data/projects.json', 'utf8');
    }

    return JSON.parse(data);
}

export function getScripts(): ScriptProject[] {
    let data;

    if (!fs.existsSync('data/scripts.json')) {
        const scripts = CreateMockScripts();
        data = JSON.stringify(scripts);
        fs.mkdirSync('data/', { recursive: true });
        fs.writeFileSync('data/scripts.json', data, { encoding: 'utf8', flag: 'w' });
    }
    else {
        data = fs.readFileSync('data/scripts.json', 'utf8');
    }

    return JSON.parse(data);
}

export function getEnhancements(projects: RpaProject[], scripts: ScriptProject[]): EnhancementProject[] {
    let data;

    if (!fs.existsSync('data/enhancements.json')) {
        // Only generate for every tenth RPA project.
        let enhancements = CreateMockEnhancements(getChangeProjects(projects, scripts, 2));
        data = JSON.stringify(enhancements);
        fs.mkdirSync('data/', { recursive: true });
        fs.writeFileSync('data/enhancements.json', data, { encoding: 'utf8', flag: 'w' });
    }
    else {
        data = fs.readFileSync('data/enhancements.json', 'utf8');
    }

    return JSON.parse(data);
}

export function getBugs(projects: RpaProject[], scripts: ScriptProject[]): BugProject[] {
    let data;

    if (!fs.existsSync('data/bugs.json')) {
        // Only generate for every tenth RPA project.
        let bugs = CreateMockBugs(getChangeProjects(projects, scripts, 1));
        data = JSON.stringify(bugs);
        fs.mkdirSync('data/', { recursive: true });
        fs.writeFileSync('data/bugs.json', data, { encoding: 'utf8', flag: 'w' });
    }
    else {
        data = fs.readFileSync('data/bugs.json', 'utf8');
    }

    return JSON.parse(data);
}

export function updateRpasAsync(projects: RpaProject[]) {
    return new Promise<void>((resolve, reject) => {
        // Place updated data into the file (database)
        fs.writeFile('data/projects.json', JSON.stringify(projects), (err) => {
            if (err) {
                console.error('Error saving file:', err);
                reject(err);
            } else {
                console.log('File saved successfully');
                resolve();
            }
        });
    });
}

export function updateScriptsAsync(scripts: ScriptProject[]) {
    return new Promise<void>((resolve, reject) => {
        // Place updated data into the file (database)
        fs.writeFile('data/scripts.json', JSON.stringify(scripts), (err) => {
            if (err) {
                console.error('Error saving file:', err);
                reject(err);
            } else {
                console.log('File saved successfully');
                resolve();
            }
        });
    });
}

export function updateEnhancementsAsync(enhancements: EnhancementProject[]) {
    return new Promise<void>((resolve, reject) => {
        // Place updated data into the file (database)
        fs.writeFile('data/enhancements.json', JSON.stringify(enhancements), (err) => {
            if (err) {
                console.error('Error saving file:', err);
                reject(err);
            } else {
                console.log('File saved successfully');
                resolve();
            }
        });
    });
}

export function updateBugsAsync(bugs: BugProject[]) {
    return new Promise<void>((resolve, reject) => {
        // Place updated data into the file (database)
        fs.writeFile('data/bugs.json', JSON.stringify(bugs), (err) => {
            if (err) {
                console.error('Error saving file:', err);
                reject(err);
            } else {
                console.log('File saved successfully');
                resolve();
            }
        });
    });
}

// TODO: This doesn't create data for Scripts yet.
export function getMilestones(projects: RpaProject[], enhancements: EnhancementProject[], scripts: ScriptProject[]): Milestone[] {
    let data;
    try {
        const statusCheck = (project: ProjectCommon) => project.status === statusMapping.InDevelopment.id || project.status === statusMapping.InProduction.id || project.status === statusMapping.Completed.id;
        if (!fs.existsSync('data/milestones.json')) {
            let milestones = CreateMockMilestones(projects.filter(statusCheck), enhancements.filter(statusCheck), scripts.filter(statusCheck));
            data = JSON.stringify(milestones);
            fs.mkdirSync('data/', { recursive: true });
            fs.writeFileSync('data/milestones.json', data, { encoding: 'utf8', flag: 'w' });
        }
        else {
            data = fs.readFileSync('data/milestones.json', 'utf8');
        }
    }
    catch (error) {
        console.error(error);
        throw error;
    }

    return JSON.parse(data);
}

export function updateMilestonesAsync(milestones) {
    return new Promise<void>((resolve, reject) => {
        // Place updated data into the file (database)
        fs.writeFile('data/milestones.json', JSON.stringify(milestones), (err) => {
            if (err) {
                console.error('Error saving file:', err);
                reject(err);
            } else {
                console.log('File saved successfully');
                resolve();
            }
        });
    });
}

export function getChangeProjects(rpas: RpaProject[], scripts: ScriptProject[], ratio: number = 2): ProjectCommon[] {    
    let completedScripts = (scripts).filter(x => x.status === statusMapping.Completed.id || x.status === statusMapping.InProduction.id);
    let completedRpas = (rpas).filter(x => x.status === statusMapping.Completed.id || x.status === statusMapping.InProduction.id);

    if(ratio >= 2) {
        const ratioToTake = ratio - 1;
        completedScripts = completedScripts.filter((proj, idx) => idx % ratio === ratioToTake);
        completedRpas = completedRpas.filter((proj, idx) => idx % ratio === ratioToTake);
    }

    return completedRpas.concat(completedScripts);
}

// TODO: This doesn't create data for Scripts yet.
export function getRankings(projects: RpaProject[], enhancements: EnhancementProject[], scripts: ScriptProject[], bugs: BugProject[]): Ranking[] {
    let data;
    try {

        if (!fs.existsSync('data/rankings.json')) {
            let rankings = CreateMockRankings(projects.concat(enhancements).concat(scripts).concat(bugs));
            data = JSON.stringify(rankings);
            fs.mkdirSync('data/', { recursive: true });
            fs.writeFileSync('data/rankings.json', data, { encoding: 'utf8', flag: 'w' });
        }
        else {
            data = fs.readFileSync('data/rankings.json', 'utf8');
        }
    }
    catch (error) {
        console.error(error);
        throw error;
    }

    return JSON.parse(data);
}

export function updateRankingsAsync(rankings: Ranking[]) {
    return new Promise<void>((resolve, reject) => {
        // Place updated data into the file (database)
        fs.writeFile('data/rankings.json', JSON.stringify(rankings), (err) => {
            if (err) {
                console.error('Error saving file:', err);
                reject(err);
            } else {
                console.log('File saved successfully');
                resolve();
            }
        });
    });
}

// function createGetterSetter() {
//     const getter = ;
//     const setter = ;

//     return [getter, setter];
// }

mock_data.rpa_projects = getRpas();
mock_data.scripts = getScripts();
mock_data.enhancements = getEnhancements(mock_data.rpa_projects, mock_data.scripts);
mock_data.bugs = getBugs(mock_data.rpa_projects, mock_data.scripts);
mock_data.milestones = getMilestones(mock_data.rpa_projects, mock_data.enhancements, mock_data.scripts);
mock_data.rankings = getRankings(mock_data.rpa_projects, mock_data.enhancements, mock_data.scripts, mock_data.bugs);

fs.mkdirSync('logs/', { recursive: true });