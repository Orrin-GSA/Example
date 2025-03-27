/**
 * Fetches and exports data from API requests and mounts the different stages of Automations in development (respective dev_stage)
 */
import { getProjectFieldValueMapping } from './RpaUtils';
import ToastUtils from './ToastUtils';
import { arrayUtils, is, objectUtils, to } from '../../../src_shared/TypeUtils';
import { statuses, statusMapping } from '../../../src_shared/AppConstants';
import { MappingTrackingObjectLite } from './ReactUtils';
import XLSX from 'xlsx';
import { DateTime } from "luxon";
import { createCustomEqual } from 'fast-equals';
import type { TypeEqualityComparator } from 'fast-equals';
import AppConfig from '../../../src_shared/AppConfig';
import ApiDataService from './ApiDataService';

/* Disabled and removed from src_react to unused folder. Should exclude unless we are specifically asked to print pdfs; increases the size of the published app dramatically, but did in fact print out a PDF.
import PDFDocument from '../../plugins/pdfkit.standalone';
import PDFDocumentTable from '../../plugins/pdfkit-table';
import blobStream from 'blob-stream';
*/

const areProjectsEqual: TypeEqualityComparator<ProjectCommon, undefined> = (a, b) => a.ID === b.ID;

export const isProjectEqual = createCustomEqual({
  createCustomConfig: () => ({ areObjectsEqual: areProjectsEqual }),
});

/** Tries to safely convert to a DateTime object. */
export function toDateTime(date: string | number | null): DateTime | null {
    if(!date) {
        return null;
    }

    if(is.number(date)) {
        return DateTime.fromMillis(date);
    }
    
    return date.includes('/') ? DateTime.fromFormat(date, 'D') : DateTime.fromISO(date);
}

/** Tries to safely convert date to a DateTime object and then return a ISO Date string (yyyy-MM-dd). */
export function toIsoDateStr(date: string | number | null): string {
    if(!date) {
        return '';
    }

    const dateTime: DateTime = toDateTime(date)!;
    
    return dateTime.toISODate();
}

/** Tries to safely convert date to a DateTime object and then return a ISO Date string (yyyy-MM-dd). */
export function toUserFriendlyDateStr(date: string | number | null): string {
    if (!date) {
        return '';
    }

    const dateTime: DateTime = toDateTime(date)!;

    return dateTime.toLocaleString();
}

type BucketedRpaProjects = {
    [titleName: string]: RpaProjectProcessed[];
}

// type ServerFetchCache = {
//     fetch: PreProcessedServerFetch;
//     poa_users: Record<string, PoaUser | undefined>;
//     employee_users: Record<string, EmployeeUser | undefined>;
//     offices: Record<string, Office | undefined>;
// }

/**
* "Buckets" the RPA data into the respective categories
*/
export function bucketAutomationsData(projects: RpaProject[] | null, enhancements: EnhancementProject[] | null, scripts: ScriptProject[] | null, bugs: BugProject[] | null): BucketedRpaProjects {
    const result = {};

    for(const statusType of Object.values(statuses)) {
        result[statusType.id] = [];
    }

    function processAutomations(automations: ProjectCommon[]) {
        if (Array.isArray(automations) && automations.length > 0) {        
            for(const item of automations) {
                // Ensure the 'status' property exists in the object
                if (!Object.prototype.hasOwnProperty.call(item, 'status')) {
                    console.error(`Missing "status" property for ${item.ID}`);
                    continue;
                }
    
                let status = item.status?.trim();

                if(!status) {
                    console.warn(`No status providing on ${item.ID}, assigning to Under Evaluation by default`);
                    status = statusMapping.UnderEvaluation.id;
                }
    
                // Ensure the status is properly mapped to the statuses.
                if(!result[status]) {
                    console.error(`Status id "${status}" was not found on ${item.ID}, is the DB value correct?`);
                    continue;                
                }
    
                // Push the object with the 'status' key into the corresponding array
                result[status].push(item);
            }
        }
    }

    processAutomations(projects);
    processAutomations(enhancements);
    processAutomations(scripts);
    processAutomations(bugs);

    return result;
}

export function processServerFetch(serverFetch: PreProcessedServerFetch) {
    // Cache often reused data (employee_users, offices, poa_users) NVM, the process functions are used for the one-off additions as well, so we'd need to account for that, or make a custom function for bulk processing.
    // const cache: ServerFetchCache = {
    //     fetch: serverFetch,
    //     poa_users: {},
    //     employee_users: {},
    //     offices: {}
    // };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [rpa_projects, employee_users, offices, milestones, poa_users, systems, enhancements, ideas, npe, documents, tools, bugs, scripts, rankings] = serverFetch;

    // cache.employee_users = to.object(employee_users, employee => employee.ID);
    // cache.poa_users = to.object(poa_users, user => user.ID);
    // cache.offices = to.object(offices, office => office.ID);

    milestones.forEach(milestone => {
        processMilestone(milestone);
    });

    rpa_projects.forEach(project => {
        processRpaProject(project as RpaProjectProcessed, employee_users, offices, poa_users);
    });

    enhancements.forEach((enh) => {
        processEnhancementProject(enh as EnhancementProjectProcessed, rpa_projects as RpaProjectProcessed[], scripts as ScriptProjectProcessed[], employee_users, offices);
    });

    bugs.forEach((bug) => {
        processBugProject(bug as BugProjectProcessed, employee_users, offices);
    });

    scripts.forEach((script) => {
        processScriptProject(script as ScriptProjectProcessed, employee_users, offices, poa_users);
    });

    fillRankings(rankings, rpa_projects.concat(enhancements).concat(bugs).concat(scripts));

    return serverFetch as PostProcessedServerFetch;
}

export function getProjectType(projectId: string): ProjectType {
    if (projectId.startsWith('RPA')) {
        return 'RPA';
    }
    else if (projectId.startsWith('ENH')) {
        return 'Enhancement';
    }
    else if (projectId.startsWith('BUG')) {
        return 'Bug';
    }
    else if (projectId.startsWith('SCR')) {
        return 'Script';
    }
    else {
        console.error('Unexpected ID Type: ' + projectId);
    }

    return undefined;
}

export function isBugProject(project: ProjectCommonProcessed): project is BugProjectProcessed {
    return project.type === 'Bug';
}

export function isRpaProject(project: ProjectCommonProcessed): project is RpaProjectProcessed {
    return project.type === 'RPA';
}

export function isEnhProject(project: ProjectCommonProcessed): project is EnhancementProjectProcessed {
    return project.type === 'Enhancement';
}

export function isScriptProject(project: ProjectCommonProcessed): project is ScriptProjectProcessed {
    return project.type === 'Script';
}

function processProjectCommon(project: ProjectCommonProcessed) {
    // Add field to mark project as locked.
    project.saving ??= false;
    project.status = project.status?.trim();
    project.dev_stage = project.dev_stage?.trim();
    project.type = getProjectType(project.ID);

    if (project.status) {
        const itemStatus = statusMapping[project.status];
        if (itemStatus && itemStatus.stages.length > 0 && !project.dev_stage) {
            project.dev_stage = itemStatus.stages[0].id;
            // NOTE: This might just need to be the default behaviour anyway. We could theoretically remove this on the assumption blank dev_stage is always stage[0] for the given status.
            console.warn(`Project ${project.ID} has no dev_stage, but assigned status ${project.status} has stages. Using default stage ${project.dev_stage}.`);
        }
    }
}

/** 
 * The goal of this is to cache any static values, things that will not change during it's lifetime in WALDO, 
 * and to coerce the object into an easier state to manage. For example, ensuring hours_added and hours_saved are always a number, rather than a string | number | undefined.
 * */
export function processRpaProject(project: RpaProjectProcessed, employee_users: EmployeeUser[], offices: Office[], poa_users: PoaUser[]): project is RpaProjectProcessed {
    if (project == null) {
        return false;
    }

    processProjectCommon(project);

    if(is.string(project.hours_added)) {
        project.hours_added = to.int(project.hours_added);
    }
    else if(!project.hours_added) {
        project.hours_added = 0;
    }

    if(is.string(project.hours_saved)) {
        project.hours_saved = to.int(project.hours_saved);
    }
    else if(!project.hours_saved) {
        project.hours_saved = 0;
    }

    // if(is.string(project.rank)) {
    //     project.rank = to.int(project.rank, -1);
    // }
    // else if(!project.rank) {
    //     // Ordered by asc, so default this to a really high number
    //     project.rank = 100000;
    // }

    // NOTE: It seems like these will be able to change soon. How do we want to handle that? Probably remove these and have them as lookups in the places that actually need them.
    //project.poa_users = arrayUtils.mapFilter(project.dev_id?.split(',') ?? [], id => poa_users.find(x => x.ID === id)?.email);
    project.process_owners = arrayUtils.mapFilter(project.process_owner_ids?.split(',') ?? [], id => employee_users.find(x => x.ID === id)?.email);

    // Office is likely fixed on creation, so this is safe.
    const office = offices.find(x => x.ID === project.office_id);
    if (office != null) {
        project.office = office.sso;
        project.dept = office.dept_code;
    }

    return true;
}

export function processScriptProject(script: ScriptProjectProcessed, employee_users: EmployeeUser[], offices: Office[], poa_users: PoaUser[]) {
    if (script == null) {
        return false;
    }

    processProjectCommon(script);

    // Field is currently not used, but for the sake of consistency with other types were gonna add an empty string.
    if(!script.npe_ids) {
        script.npe_ids = '';
    }

    if(!script.process_owner_ids) {
        script.process_owner_ids = '';
    }

    if(is.string(script.hours_added)) {
        script.hours_added = to.int(script.hours_added);
    }
    else if(!script.hours_added) {
        script.hours_added = 0;
    }

    if(is.string(script.hours_saved)) {
        script.hours_saved = to.int(script.hours_saved);
    }
    else if(!script.hours_saved) {
        script.hours_saved = 0;
    }

    //script.poa_users = arrayUtils.mapFilter(script.dev_id?.split(',') ?? [], id => poa_users.find(x => x.ID === id)?.email);
    script.process_owners = arrayUtils.mapFilter(script.process_owner_ids?.split(',') ?? [], id => employee_users.find(x => x.ID === id)?.email);

    const office = offices.find(x => x.ID === script.office_id);
    if (office != null) {
        script.office = office.sso;
        script.dept = office.dept_code;
    }
}

/** 
 * The goal of this is to cache any static values, things that will not change during it's lifetime in WALDO, 
 * and to coerce the object into an easier state to manage. For example, ensuring hours_added and hours_saved are always a number, rather than a string | number | undefined.
 * */
export function processEnhancementProject(enh: EnhancementProjectProcessed, rpa_projects: RpaProjectProcessed[], scripts: ScriptProjectProcessed[], employee_users: EmployeeUser[], offices: Office[]): enh is EnhancementProjectProcessed {
    if (enh == null) {
        return false;
    }

    let project: RpaProjectProcessed | ScriptProjectProcessed = null;
    if(enh.project_id) {
        const projectType = getProjectType(enh.project_id);
        switch(projectType) {
            case 'RPA':
                project = rpa_projects.find(x => x.ID === enh.project_id);
                break;
            case 'Script':
                project = scripts.find(x => x.ID === enh.project_id);
                break;
        }
    }
    if(project) {
        // Adding fields as references.

        // ISSUE: I was told most of these fields were not being added to Enhancements, but that assumption seems to be incorrect currently. TODO: Verify if these fields are being used in the sheet, or if not get them removed from the sheet. 
        //enh.process_owner_ids = project.process_owner_ids;
        //enh.custodian_ids = project.custodian_ids;
        enh.npe_ids = project.npe_ids;
        //enh.office_id = project.office_id;
        enh.functional_category_id = project.functional_category_id;
    }
    else {
        console.error("Parent project not found for " + enh.ID + ", Parent Project ID: " + enh.project_id);
    }

    processProjectCommon(enh);

    if(is.string(enh.hours_added)) {
        enh.hours_added = to.int(enh.hours_added);
    }
    else if(!enh.hours_added) {
        enh.hours_added = 0;
    }

    if(is.string(enh.hours_saved)) {
        enh.hours_saved = to.int(enh.hours_saved);
    }
    else if(!enh.hours_saved) {
        enh.hours_saved = 0;
    }

    //enh.poa_users = arrayUtils.mapFilter(enh.dev_id?.split(',') ?? [], id => poa_users.find(x => x.ID === id)?.email);
    enh.process_owners = arrayUtils.mapFilter(enh.process_owner_ids?.split(',') ?? [], id => employee_users.find(x => x.ID === id)?.email);

    const office = offices.find(x => x.ID === enh.office_id);
    if (office != null) {
        enh.office = office.sso;
        enh.dept = office.dept_code;
    }
    
    return true;
}

export function processBugProject(bug: BugProjectProcessed,  employee_users: EmployeeUser[], offices: Office[]) {
    if (bug == null) {
        return false;
    }

    // let project: (RpaProjectProcessed | ScriptProjectProcessed) = null;
    // if(bug.project_id) {
    //     const projectType = getProjectType(bug.project_id);
    //     switch(projectType) {
    //         case 'RPA':
    //             project = rpa_projects.find(x => x.ID === bug.project_id);
    //             break;
    //         case 'Script':
    //             project = scripts.find(x => x.ID === bug.project_id);
    //             break;
    //     }
    // }

    // if(project) {
    //     // Adding fields as references.
    //     //bug.process_owner_ids = project.process_owner_ids;
    //     //bug.custodian_ids = project.custodian_ids;
    //     //bug.npe_ids = project.npe_ids;
    //     bug.office_id = project.office_id;
    //     //bug.functional_category_id = project.functional_category_id;
    // }
    // else {
    //     console.error("Project not found for " + bug.ID + ", Project ID: " + bug.project_id);
    // }
    
    processProjectCommon(bug);

    //bug.poa_users = arrayUtils.mapFilter(bug.dev_id?.split(',') ?? [], id => poa_users.find(x => x.ID === id)?.email);
    bug.process_owners = arrayUtils.mapFilter(bug.process_owner_ids?.split(',') ?? [], id => employee_users.find(x => x.ID === id)?.email);

    const office = offices.find(x => x.ID === bug.office_id);
    if (office != null) {
        bug.office = office.sso;
        bug.dept = office.dept_code;
    }
}

// We can't trust that rankings exist for all projects that come in, we have external ways to add new projects. This method fixes any holes, aligns the ranking #s, and adds any missing projects.
export function fillRankings(rankings: Ranking[], projects: ProjectCommon[]) {
    // Sort existing rankings by rank, then smooth out any gaps in the ranking by applying the index to the ranking.
    // POTENTIAL ISSUE: Is the rank here a string? It might be but I think subtraction tries to force it to a number.
    rankings.sort((a, b) => a.rank - b.rank);
    let nextRanking = 1;
    const rankingMapping = {};
    

    for (let i = 0; i < rankings.length; i++) {
        const ranking = rankings[i];
        ranking.rank = nextRanking;
        nextRanking += 1;
        if(!ranking.project_id) {
            console.error('Project ID missing from ranking.');
        }
        rankingMapping[ranking.project_id] = ranking;
    }

    for(let i = 0; i < projects.length; i++) {
        const project = projects[i];
        // No or non UnderEval status can be skipped, or if it already has a mapping.
        if(!project.status || project.status !== statusMapping.UnderEvaluation.id) {
            // If doesn't need a ranking but has an existing ranking, we need to remove it.
            if(rankingMapping[project.ID]) {
                const removeRanking = rankingMapping[project.ID];
                const idx = removeRanking ? rankings.indexOf(removeRanking) : -1;
                if(idx > -1) {
                    rankings.splice(idx, 1);
                }
            }

            continue;
        }
        else if (rankingMapping[project.ID]) {
            continue;
        }

        rankings.push({ project_id: project.ID, rank: nextRanking });
        nextRanking += 1;
    }

    for (let i = 0; i < rankings.length; i++) {
        const ranking = rankings[i];
        ranking.rank = i + 1;
    }
}

// We can't trust that rankings exist for all projects that come in, we have external ways to add new projects. This method fixes any holes, aligns the ranking #s, and adds any missing projects.
export function fillRankingsApi(rankings: Ranking[], projects: any[], scripts: any[], enhancements: any[], bugs: any[]) {
    fillRankings(rankings, projects.concat(scripts).concat(enhancements).concat(bugs));
}

export function processMilestone(milestone) {
    milestone.saving ??= false;
}

export function convertStrToDate(str) {
    const spDate = str.split();
    const formattedDate = `${spDate[2]}/${spDate[1]}/${spDate[0]}`;

    return new Date(formattedDate);
}

/** Returns date (string or Date object) in the format yyyy-MM-dd to comply with date picker format. */
export function dateToDatePickerFormat(strOrDate: string | Date | null) {
    if(!strOrDate) {
        return '';
    }

    if(is.stringDate(strOrDate)) {
        strOrDate = new Date(strOrDate);
    }
    
    return strOrDate.toISOString().split('T')[0];
}

/**
 * A safety wrapper around JSON.parse. If the string is empty or otherwise throws an error, it will return the defaultVal instead.
 * @param jsonStr Json string to parse.
 * @param defaultVal Default value to fallback to.
 * @returns The parsed value or defaultVal if the string is invalid.
 */
export function parseSafe<T=any>(jsonStr: string | null | undefined, defaultVal: T = undefined): T {
    if(jsonStr == null || jsonStr === '') {
        return defaultVal;
    }

    try {
        return JSON.parse(jsonStr) as T;
    }
    catch(error) {
        ToastUtils.showDevError(error);
    }

    return defaultVal;
}

type SheetExportOptions<T> = {
    /** Columns to include in the sheet based on object fields. If not provided, will default to all fields on the first object in the data. */
    include?: (keyof T)[],
    /** Exclude keys from the object. Ignored if include field is provided. */
    exclude?: (keyof T)[],
    /** 
     * If useHeader is true, will use the fields defined in include as the headers to the columns. 
     * 
     * If useHeader is an object, will treat the object as a mapping and use the field names provided by include as the key. If no mapping is found for a field name, it will fallback to the field name.
     * */
    useHeader?: true | { [Property in keyof(T)]?: string; }
}

export function exportDataToXlsx<T>(filename: string, data: T | T[], options?: SheetExportOptions<T>) {
    if(is.array(data)) { 
        if(data.length <= 0) {
            console.error('Tried to download empty data set.')
            return;
        }

        if(!is.object(data[0])) {
            ToastUtils.showDevError('Type must be an object or an array of objects to export to CSV.');
            return;
        }        
    }
    else if(is.object(data)) {
        data = [data];
    }
    else {
        ToastUtils.showDevError('Type must be an object or an array of objects to export to CSV.');
        return;
    }

    let include = options?.include;
    if(!include) {
        include = Object.keys(data[0]) as (keyof T)[];
        if(options?.exclude) {
            include = include.filter(x => !options.exclude.includes(x));
        }
    }

    /* generate worksheet and workbook */
    const workbook = XLSX.utils.book_new();

    const rows = data.map(item => include.map(field => convertValueToSheet(field as string, item[field])));
    if(options?.useHeader) {
        const headers = include.concat();

        // If object, is assumed to be a mapping from the field name to a user friendly name.
        if(is.object(options.useHeader)) {            
            for(let i = 0; i < include.length; i++) {
                const mapping = options.useHeader[include[i] as string];
                if(mapping) {
                    headers[i] = mapping;
                }
            }
        }

        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");

        /* fix headers */
        XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });
        /* calculate column width */
        const max_width = rows.reduce((curr, nextItem) => Math.max(curr, nextItem.reduce((colCurr, nextCol) => Math.max(colCurr, nextCol?.toString().length ?? 1), 1)), 10);
        worksheet["!cols"] = [ { wch: max_width } ];
    }
    else {
        const worksheet = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");
    }
    
    /* create an XLSX file and try to save to the xlsx */
    XLSX.writeFile(workbook, filename + ".xlsx", { compression: true });
}

export function exportDataToCsv<T>(filename: string, data: T | T[], options?: SheetExportOptions<T>) {
    if(is.array(data)) { 
        if(data.length <= 0) {
            console.error('Tried to download empty data set.')
            return;
        }

        if(!is.object(data[0])) {
            ToastUtils.showDevError('Type must be an object or an array of objects to export to CSV.');
            return;
        }        
    }
    else if(is.object(data)) {
        data = [data];
    }
    else {
        ToastUtils.showDevError('Type must be an object or an array of objects to export to CSV.');
        return;
    }

    let include = options?.include;
    if(!include) {
        include = Object.keys(data[0]) as (keyof T)[];
        if(options?.exclude) {
            include = include.filter(x => !options.exclude.includes(x));
        }
    }

    let rows = data.map(item => include.map(field => convertValueToSheet(field as string, item[field])));
    if(options?.useHeader) {
        const headers = include.concat();

        // If object, is assumed to be a mapping from the field name to a user friendly name.
        if(is.object(options.useHeader)) {            
            for(let i = 0; i < include.length; i++) {
                const mapping = options.useHeader[include[i] as string];
                if(mapping) {
                    headers[i] = mapping;
                }
            }
        }

        rows = [headers].concat(rows);
    }
    exportToCsv(filename, rows);
}

function convertValueToSheet(field: string, value: any) {
    if(value == null) {
        return '';
    }

    if(is.array(value)) {
        return value.join(', ');
    }

    if(is.object(value) || is.array(value)) {
        return JSON.stringify(value);
    }

    return getProjectFieldValueMapping(field, value);
}

export function exportToCsv(filename: string, rows: any[][]) {
    const processRow = function (row) {
        let finalVal = '';
        for (let j = 0; j < row.length; j++) {
            let innerValue = row[j] == null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            let result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0) {
                result = '"' + result + '"';
            }
            if (j > 0) {
                finalVal += ',';
            }
            finalVal += result;
        }
        return finalVal + '\n';
    };

    let csvFile = '';
    for (let i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename + ".csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    else {
        ToastUtils.showError('CSV download not supported.');
    }
}

export function getDateForFilename() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Combine date and time parts into a filename-friendly string
    const filename = `${year}${month}${day}_${hours}${minutes}${seconds}`;
    return filename;
}

export function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

export function dragulaCssName(inputString, isDropzone) {
    // Use a regular expression to replace spaces and special characters
    // \s matches any whitespace character, and \W matches any non-word character
    let cleanedString = inputString?.toLowerCase().replace(/[\s\W]/g, '');
    cleanedString = (isDropzone) ? cleanedString + "-dropzone" : cleanedString + "-item";
  
    return cleanedString;
}

export type UpdateRecord<TProp = string> = { field: TProp, new_value: any };
export type ChangeRecord = { new_value: any, old_value: any };

export class UpdateHandler<T, TProp extends Extract<keyof T, string> = Extract<keyof T, string>> {
    public readonly logger: ActionLoggerBase<T, TProp>;
    private _hasEdit: boolean;
    private _current: T;
    private _changes: Record<TProp, ChangeRecord>;

    get updates(): UpdateRecord[] { return objectUtils.map(this._changes, (prop, change) => ({ field: prop, new_value: change.new_value })) }
    get reverts(): UpdateRecord[] { return objectUtils.map(this._changes, (prop, change) => ({ field: prop, new_value: change.old_value })) }

    /** returns an array of two arrays, the updates and reverts. */
    get changes(): [updates: UpdateRecord[], reverts: UpdateRecord[]] { 
        const updates: UpdateRecord[] = [];
        const reverts: UpdateRecord[] = [];

        objectUtils.forEach(this._changes, (prop, change) => {
            updates.push({ field: prop, new_value: change.new_value });
            reverts.push({ field: prop, new_value: change.old_value });
        })

        return [updates, reverts];
    }

    constructor(current: T, edit?: MappingTrackingObjectLite<T, TProp>, fieldMapping?: Record<string, string>, exclusions?: TProp[]) {
        this._current = current;
        this._hasEdit = !!edit;
        this.logger = this._hasEdit ? new ActionLogger(current, edit, fieldMapping) : new SimpleActionLogger(current, fieldMapping);
        if(this._hasEdit) {
            this._changes = edit.changes.toObject(state => ({ new_value: state.value, old_value: this._current[state.name] }), exclusions) as Record<TProp, ChangeRecord>;
        }
        else {
            this._changes = {} as Record<TProp, ChangeRecord>;
        }
    }

    /**
     * Attempts to add the field as updated but throws an error if it already exists.
     * @param field Name of the field that is updating.
     * @param updateValue Value the field is being updated to.
     * @param customLogging If true, will skip doing any logging internally, this would be flagged if you have done the logging externally. If a string is passed, it will log the exact string instead of the using the default log.
     */
    add(field: TProp, updateValue: any, customLogging?: true | string) {
        if(!this.addIfNot(field, updateValue, customLogging)) {
            throw new Error('Update already exists, please use change, or addOrChange if necessary.');
        }
    }

    /**
     * Attempts to add the field as updated but returns false if it already has an update.
     * @param field Name of the field that is updating.
     * @param updateValue Value the field is being updated to.
     * @param customLogging If true, will skip doing any logging internally, this would be flagged if you have done the logging externally. If a string is passed, it will log the exact string instead of the using the default log.
     */
    addIfNot(field: TProp, updateValue: any, customLogging?: true | string) {
        if(this.logger.hasAction(field)) {
            return false;
        }

        this._changes[field] = { new_value: updateValue, old_value: this._current[field] };

        if(!customLogging) {
            this.logger.setAction(field, updateValue);
        }
        else if(is.string(customLogging)) {
            this.logger.addManualAction(customLogging);
        }

        return true;
    }

    /** Modifies an existing record. This currently does not update the existing action log for the initial add() call, so be aware. */
    change(field: TProp, updateValue: any, customLogging?: true | string) {
        if(!this.logger.hasAction(field)) {
            return false;
        }

        const existingUpdate = this._changes[field];
        // Must be undefined specifically, null would still be a valid value.
        if(existingUpdate === undefined) {
            return false;
        }

        existingUpdate.new_value = updateValue;
        if(!customLogging) {
            this.logger.setAction(field, updateValue);
        }
        else if(is.string(customLogging)) {
            this.logger.addManualAction(customLogging);
        }

        return true;
    }

    /** Ideally you should know if you are adding or changing, using this could make issues harder to find. */
    addOrChange(field: TProp, updateValue: any, customLogging?: true | string) {
        if(!this.change(field, updateValue, customLogging)) {
            this.add(field, updateValue, customLogging);
        }
    }

    /** Returns true if there are any recorded updates */
    any() {
        return !is.emptyObject(this._changes);
    }

    includes(field: TProp) {
        // Must be undefined specifically, null would still be a valid value.
        return this._changes[field] !== undefined;
    }

    get(field: TProp) {
        return this._changes[field];
    }
}

abstract class ActionLoggerBase<T, TProp extends Extract<keyof T, string> = Extract<keyof T, string>> {
    // TODO: Replace with some way to update actions added via addAction. Manual actions will have to be permanent.
    private _current: T;
    private _mapping: Record<TProp, string>;
    private _actions: Map<string, string>;
    private _counter = 0;

    constructor(current: T, fieldMapping?: Record<string, string>) {
        //this._actions = [];
        this._current = current;
        this._mapping = fieldMapping ?? {};
        this._actions = new Map<string, string>();
    }

    /** Used in special contexts, such as the Box Container, where there isn't a edit object and instead where making targeted changes. */
    addManualAction(action: string) {
        this._actions.set('__manual' + this._counter, action);
        this._counter += 1;
    }

    setAction(field: TProp, toValue: any, friendlyName?: string) {
        const fromValue = this._current[field];

        const name = friendlyName ?? this._mapping[field] ?? field;
        let action = `Changed ${name}`;
        if(fromValue) {
            action += ` from "${fromValue}"`;
        }
        else {
            action += ` from N/A`;
        }
        action += ` to "${toValue}"`;
        this._actions.set(field, action);
    }

    hasAction(field: TProp) {
        return this._actions.has(field);
    }

    /** Adds any changed fields to the action logger. Will skip a field if an action is already recorded. Only usable if the derived class is ActionLogger  */
    abstract addAllChanges(filterFcn?: (changedField: { name: TProp, value: any }) => boolean);

    toArray() {
        return Array.from(this._actions.values());
    }

    any() {
        return this._actions.size > 0;
    }

}

function getAllKeys<T>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
}

export function getKeys<T, const TK extends keyof T>(obj: T, excludes: TK[] = undefined): Exclude<keyof T, typeof excludes[number]>[] {
    let keys = getAllKeys(obj);

    if(excludes) {
        keys = keys.filter((key: any) => !excludes.includes(key));
    }

    return keys as Exclude<keyof T, typeof excludes[number]>[];
}

export class ActionLogger<T, TProp extends Extract<keyof T, string> = Extract<keyof T, string>> extends ActionLoggerBase<T, TProp> {
    // TODO: Replace with some way to update actions added via addAction. Manual actions will have to be permanent.
    private _edit: MappingTrackingObjectLite<T, TProp> | undefined;

    constructor(current: T, edit?: MappingTrackingObjectLite<T, TProp>, fieldMapping?: Record<string, string>) {
        super(current, fieldMapping);
        this._edit = edit;
    }

    addAllChanges(filterFcn?: (changedField: { name: TProp, value: any }) => boolean) {
        if(!this._edit) {
            throw new Error('No edit object provided in the constructor, use addManualAction instead.')
        }

        this._edit.changes.forEach(field => {
            // If the a action has been registered for a field already, do not reset it.
            if(this.hasAction(field.name)) {
                return;
            }

            if(filterFcn && !filterFcn(field)) {
                return;
            }

            this.setAction(field.name, field.value);
        })
    }
}

/** 
 * Will log the error, if this is development mode it will popup a Toast with the error message, if it is not it will simply popup a generic error message. 
 * Regardless of that, it will pass the error message onto the apps scripts (if in google) to we can see errors happening on other peoples' machines.
 * */
export function logError(error: string) {
    console.error(error);
    let toastMessage = '';
    if (AppConfig.isDevelopment) {
        if(is.error(error)) {
            toastMessage = error.message;
        }
        else {
            toastMessage = error;
        }
        ToastUtils.showError('DEV: ' + toastMessage);
    }
    else {
        ToastUtils.showError('An issue occurred, please try again or contact support.');
    }
    ApiDataService.logError(error);
}

class SimpleActionLogger<T, TProp extends Extract<keyof T, string>> extends ActionLoggerBase<T, TProp> {
    addAllChanges(filterFcn?: (changedField: { name: TProp; value: any; }) => boolean) {
        throw new Error('Class does not support function.');
    }
}
