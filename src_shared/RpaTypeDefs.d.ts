/* 
    A folder to define types using typescript syntax for RPA objects, roughly matching the columns in the associated spreadsheet for the data objects.
    Intended for VS Code, though other editors may also work. 
    Types definitions here can be used in jsdoc comments inside of js files, see ApiDataService for examples. 

    Last Updated: 10/30/2024
*/

// This is necessary for VS Code. I cannot tell you why, just that it is. 
//  Additionally, this file has to be imported somewhere in the components folder for reasons unknown, but an import in any file works across them all. Currently placed in ApiDataService.js.
export { }

declare global {

    // Any attributes shared by all project types (RPA/Script/Enhancement/Bug) go into here.
    type ProjectCommon = {
        ID: string;

        subidea_id?: string;
        dev_id?: string;
        lead_assessor_ids?: string;

        name: string;
        description?: string;

        priority: string;
        status?: string;
        /** This now functions as a sub-status, it is no longer dev specific, and is not required. */
        dev_stage?: string;
        project_folder_id?: string;
        process_owner_ids?: string;

        /** a JSON stringified array of RpaCommentRecord objects. */
        comments_history?: string;
        /** a JSON stringified array of RpaActionRecord objects. */
        actions_history?: string;
        
        start_date?: string;
        live_date?: string;
        est_delivery_date?: string;

        created_by?;
        created_date?;

        status_date?;
        status_reason?;

        last_modified_date?: string;
        /** @deprecated Unused and replaced by rankings table, to be removed */
        rank?: string | number;
    }

    // Any attributes shared by addition project types (RPA/Script) go into here.
    type ProjectAdditionCommon = ProjectCommon & {
        dd_link?: string;
        milestone_id?: string;
        deployed_version?: string;
        custodian_ids?: string;
        system_ids?: string;
        document_ids?: string;
        office_id?: string;
        functional_category_id?: string;
        hours_saved?: string | number;
        hours_added?: string | number;
        tools_ids?: string;
        controller_id?: string;
        project_support_ids?: string;
        additional_benefits?: string;
        online_offline?: "ONLINE" | "OFFLINE";
    }

    // Any attributes shared by change project types (Enhancement/Bug) go into here.
    type ProjectChangeCommon = ProjectCommon & {
        ticket_id?: string;
        project_id?: string;
    }    

    /** RpaProject as received from google. Uncertain what fields come as, so we're just putting everything on optional, and maybe assigned a type. */
    type RpaProject = ProjectAdditionCommon & {
        npe_ids?: string;
        // NOTE: I am unsure of "Non RPA". It's used for the Executive Dashboard, I don't know if that goes in this field or that's some data minipulation they are doing.
        attended_unattended?: "Unattended" | "Attended" | "Non RPA";
    }

    type ScriptProject = ProjectAdditionCommon & {
        //npe_ids?: string;

        // ID of developer who deployed application
        deployed_id?: string;
        project_support_ids?: string;

        language_framework?: string;
        location?: string;
    }

    /** A Enhancement is *very* similar to a project, but it's missing a number of fields that are instead copied from the referenced RPA project. */
    type EnhancementProject = ProjectChangeCommon & {
        milestone_id?;
        deployed_version?;
        system_ids?: string;
        document_ids?: string;
        project_folder_id?: string;
        hours_saved?: string | number;
        hours_added?: string | number;
        // NOTE: I am unsure of "Non RPA". It's used for the Executive Dashboard, I don't know if that goes in this field or that's some data minipulation they are doing.
        attended_unattended?: "Unattended" | "Attended" | "Non RPA";
        online_offline?: "ONLINE" | "OFFLINE";
        tools_ids?: string;
        controller_id?: string;
        project_support_ids?: string;
        additional_benefits?: string;
    }

    type BugProject = ProjectChangeCommon & {
        npe_id?: string;
        project_support?: string;
        office_id?: string;
        RITM?: string;
        package_name?: string;
        
        // Do we need these fields in the Bug sheet? This seems like it would be on the Ticket sheet instead?
        open_date?: string;
        closed_date?: string;

        // fields added as never explicitly. This is added so that if we do something like (project: BugProject | EnhancementProject),
        //      `if (!project.tool_ids)` will be able to infer if it is or isn't a bug project. w/o the field defined as never that check would throw an error because the field is in one type but not the other.
        system_ids?: never;
        tools_ids?: never;
    }

    type ProjectType = "RPA" | "Script" | "Enhancement" | "Bug";
    /** Simple indicatation it's a string that represents a date. TS will treat it as a string in all cases. */
    type StringDate = string;

    /*                          Processed Types                         */
    
    type ProjectCommonProcessed = ProjectCommon & {
        type: ProjectType;
        /** Internal lock flag. Intended to be used while a project is being saved. */
        saving: boolean;
        rank: number;
    }

    // Any attributes shared by addition project types (RPA/Script) go into here.
    type ProjectAdditionCommonProcessed = ProjectCommonProcessed & {

    }

    // Any attributes shared by change project types (Enhancement/Bug) go into here.
    type ProjectChangeCommonProcessed = ProjectCommonProcessed & {

    }

    /** Post-processed RpaProject. Caches ID references, keeps special fields for internal use, and coerces some of the original values so they are more safely usable. */
    type RpaProjectProcessed = RpaProject & ProjectAdditionCommonProcessed & {
        office?: string;
        dept?: string;
        process_owners: string[];
        // DataUtils.ts -> processRpaProject() ensure that these are always numbers, so we override the type in the base RpaProject.
        hours_saved: number;
        hours_added: number;
    }

    type ScriptProjectProcessed = ScriptProject & ProjectAdditionCommonProcessed & {
        office?: string;
        dept?: string;
        process_owners: string[];

        // NOTE: Added so it's compatible with other "project" types, but should generally be empty.
        npe_ids: string
    }

    /** Includes all of the columns that are copied from RpaProject and used dynamically, plus copies of the fields that are static. and are fixed for this project (assuming the referenced project is completed and locked) */
    type EnhancementProjectProcessed = EnhancementProject & ProjectChangeCommonProcessed & {
        /* static copied fields from the referenced RpaProject. */
        process_owner_ids?;
        custodian_ids?;
        npe_ids?;
        office_id?;
        functional_category_id?;

        // TODO: I'd like to move away from attaching the fields we are looking up, and instead do map lookups as needed. Trying to move the maps to the AppProviderContext in App.js.
        /* Fields pulled from other references or fields coerced into better data. */
        office?: string;
        dept?: string;
        process_owners: string[];
        // DataUtils.ts -> processRpaProject() ensure that these are always numbers, so we override the type in the base RpaProject.
        hours_saved: number;
        hours_added: number;
    }

    type BugProjectProcessed = BugProject & ProjectChangeCommonProcessed & {
        office?: string;
        dept?: string;
        process_owners: string[];
    }

    type AnyProjectProccessed = RpaProjectProcessed | ScriptProjectProcessed | EnhancementProject | BugProjectProcessed;
    type AllProjectProccessed = Partial<RpaProjectProcessed> & Partial<ScriptProjectProcessed> & Partial<EnhancementProject> & Partial<BugProjectProcessed>;
    type AllProject = Partial<RpaProject> & Partial<ScriptProject> & Partial<EnhancementProject> & Partial<BugProject>;

    type RpaCommentRecord = {
        date;
        user: string;
        comment: string;
    }

    type RpaActionRecord = {
        date: string;
        /** User name pulled from google. */
        user: string;
        /** Psuedo-enum, describing the general category of the action. Must be a string without spaces. */
        type: string;
        /** A specific description based of what happened. */
        description: string;
    }

    type Milestone = {
        ID: string;
        ref_id: string;
        kickoff_complete?: StringDate;
        dd_complete?: string;
        test_plan_complete?: StringDate;
        developer_testing_complete?: StringDate;
        uat_complete?: StringDate;
        pta_complete?: StringDate;
        security_assessment?: StringDate;
        dev_comp_complete?: number;
        npe_tickets_complete?: StringDate;
        custodian_tickets_complete?: StringDate;
        env_release_notes_complete?: StringDate;
        questionnaire_complete?: StringDate;
        sop_complete?: StringDate;
        archer?: StringDate;
        demo_video?: StringDate;
        system_access_signatures?: StringDate;
        attributes_questionnaire?: StringDate;
        // Google *might* be able to return this a boolean directly. Google Sheets can treat TRUE or FALSE as a special type of value in cell, but I've not done any testing directly to confirm if that is then returned as a boolean.
        prelim_security_override?: string;
        prelim_security_url?: string;
    }

    type MilestoneProcessed = Milestone & {
        saving?: boolean;
    }

    type Office = {
        ID: string;
        sso: string;
        dept_code: string;
        // Not sure if spreadsheet returns null or empty string for empty cells.
        name: string | null;
    }

    type System = {
        ID: string;
        name: string;
        system_owner?: string;
        isso?: string;
        issm?: string;
        is_gsa_app?: string;
    }

    type Idea = {
        ID: string;
        folder_id: string;
        submitter_email: string;
        submission_date: string;
        office: string;
        category: string;
        benefits: string;
        description: string;
        additional_info: string;
        kickoff_date: string;
        assessor: string;
        outcome: string;
        assessment_ids: string;
    }

    type Npe = {
        ID: string;
        ent: string;
        email: string;
        type: string;
        schedule: string;
        status: string;
        ticket_created: string;
        ticket_deleted: string;
        ad_group: string;
        old_id: string;
    }

    type Ranking = {
        project_id: string;
        rank: number;
    }

    type Tools = {
        ID: string;
        name: string;
    }

    type Documents = {
        ID: string;
        name: string;
        "type/category": string;
        link: string;
        create_date: string;
        dss_sign_date: string;
    }

    type EmployeeUser = {
        ID: string;
        name: string;
        email: string | null;
        status: 'Active' | 'Inactive';
    }

    type PoaUser = {
        ID: string;
        name: string;
        email: string | null;
        status: 'Active' | 'Inactive';
        roles: string;
    }

    type RpaUpdateObject = {
        field: string;
        new_value: any;
    }

    type RpaUpdateResponseObject = RpaUpdateObject & {
        old_value: any;
    }

    type PreProcessedServerFetch = [
        rpa_projects: RpaProject[],
        employee_users: EmployeeUser[],
        offices: Office[],
        milestones: Milestone[],
        poa_users: PoaUser[],
        systems: System[],
        enhancements: EnhancementProject[],
        ideas: Idea[],
        npe: Npe[],
        documents: Documents[],
        tools: Tools[],
        bugs: BugProject[],
        scripts: ScriptProject[],
        rankings: Ranking[]
    ];

    type PostProcessedServerFetch = [
        rpa_projects: RpaProjectProcessed[],
        employee_users: EmployeeUser[],
        offices: Office[],
        milestones: Milestone[],
        poa_users: PoaUser[],
        systems: System[],
        enhancements: EnhancementProjectProcessed[],
        ideas: Idea[],
        npe: Npe[],
        documents: Documents[],
        tools: Tools[],
        bugs: BugProjectProcessed[],
        scripts: ScriptProjectProcessed[],
        rankings: Ranking[]
    ];
}