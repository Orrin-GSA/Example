// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Offcanvas, Form, Button, Modal, Table, Row, Col, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {FormSelect} from 'react-bootstrap';
import { DateTime } from 'luxon';
import * as Icon from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import SyncLoader from "react-spinners/SyncLoader";
import { AutomationsContext } from './Automations';
import { AppContext } from '../../../App';
import { useDeepMemo, useStateMapperTrackingLite } from '../../util/ReactUtils';
import { selectApiBugs, selectApiEnhancements, selectApiProjects, selectApiScripts, selectApiMilestones, selectApiOffices, selectApiPoaUsers, selectApiUsers, selectApiTools, selectApiSystems, selectApiRankings, cleanRanking, removeRanking } from '../../util/ApiDataSlice';
import { selectUsername, selectEmail, selectIsAdmin } from '../../util/UserSettingsSlice';
import { arrayUtils, assertAlways, is, to } from '../../../../src_shared/TypeUtils';
import ToastUtils from '../../util/ToastUtils';
import { newAction, canMoveStatus, validateMove, getMilestoneProgress, projectFieldMapping, moveProjectToStatus } from '../../util/RpaUtils';
import { parseSafe, dateToDatePickerFormat, toDateTime, toIsoDateStr, getProjectType, convertStrToDate, ActionLogger, UpdateHandler } from '../../util/DataUtil';
import { statuses, statusMapping, priorities, priorityMapping, rpaModes } from '../../../../src_shared/AppConstants';
import { openInputAsync } from '../../shared/InputModal';
import ApiUpdater from '../../util/ApiUpdater';
import ApiDataService from '../../util/ApiDataService';
import { openFormAsync } from '../../shared/FormModal';
import MultiSelectString from "../../shared/MultiSelectString";
import { ApiProviderContext } from '../../util/ApiDataProvider';
import InfoOverlay from '../../shared/InfoOverlay';

function AutomationOffcanvasDisplay({ show, onHide, placement }) {
    const employees = useSelector(selectApiUsers);
    const poas = useSelector(selectApiPoaUsers);
    const tools = useSelector(selectApiTools);
    const offices = useSelector(selectApiOffices);
    const systems = useSelector(selectApiSystems);
    const isAdmin = useSelector(selectIsAdmin);
    const rankings = useSelector(selectApiRankings);
    const { employeeMapping, poaMapping, toolsMapping, systemMapping, activeUser, officeMapping } = useContext(AppContext);
    const { updateRanking, rankingIsSaving } = useContext(ApiProviderContext);
    const dispatch = useDispatch();

    /** @type {{ currentProject: ProjectCommon }} */
    const { currentProjectId, setCurrentProjectId } = useContext(AutomationsContext);
    const allProjects = useSelector(selectApiProjects);
    const allScripts = useSelector(selectApiScripts);
    const allEnhancements = useSelector(selectApiEnhancements);
    const allBugs = useSelector(selectApiBugs);
    const allMilestones = useSelector(selectApiMilestones);

    const [commentArea, setCommentArea] = useState("");
    const [showLogs, setShowLogs] = useState(false);

    const currentProject = useMemo(() => {
        if (!currentProjectId) {
            return null;
        }

        const type = getProjectType(currentProjectId);
        let project = null;
        switch (type) {
            case "RPA":
                project = allProjects.find(x => x.ID === currentProjectId);
                break;
            case "Script":
                project = allScripts.find(x => x.ID === currentProjectId);
                break;
            case 'Enhancement':
                project = allEnhancements.find(x => x.ID === currentProjectId);
                break;
            case 'Bug':
                project = allBugs.find(x => x.ID === currentProjectId);
                break;
        }

        if (!project) {
            console.error('Project not found for ' + currentProjectId);
            return null;
        }

        return project;
    }, [currentProjectId, allProjects, allScripts, allEnhancements, allBugs]);

    // Will be used to determine if the Attended/Unattended field appears or not 
    const isRpa = useMemo(() => {
        if (!currentProject) {
            return false;
        }
        return getProjectType(currentProject.ID) === 'RPA' || (getProjectType(currentProject.ID) === 'Enhancement' && getProjectType(currentProject.project_id) === 'RPA');
    }, [currentProject?.ID, currentProject?.status]);

    //will be used in a different PR - attended/unattended field
    // const [rpaMode, setRpaMode] = useState(rpaModes);

    const isUnderEval = useMemo(() => {
        if (!currentProject) {
            return false;
        }

        return currentProject.status === statusMapping.UnderEvaluation.id;
    }, [currentProject?.ID, currentProject?.status]);

    const [currRanking, minRank, maxRank] = useMemo(() => {
        if (!isUnderEval || !currentProject) {
            return [null, 0, 0];
        }

        let [min, max] = arrayUtils.minMax(rankings, ranking => ranking.rank);
        let curr = rankings.find(x => x.project_id === currentProject.ID);

        if (!curr) {
            max += 1;
            curr = { project_id: currentProject.ID, rank: max }
        }

        return [curr, min, max];
    }, [isUnderEval, rankings, currentProject?.ID]);

    const selectedMilestone = useMemo(() => {
        if (!currentProjectId) {
            return null;
        }

        return allMilestones.find(x => x.ref_id === currentProjectId);
    }, [currentProjectId, allMilestones]);

    const employeeOptions = useMemo(() => {
        return employees.filter(user => user.status === "Active")
        .map(user => ({ value: user.ID, label: user.name }));
    }, [employees]);

    const poaOptions = useMemo(() => {
        return poas.filter(user => user.status === "Active")
        .map(user => ({ value: user.ID, label: user.name }));
    }, [poas]);

    const toolsOptions = useMemo(() => {
        return tools.map(tool => ({ value: tool.ID, label: tool.name }));
    }, [tools]);

    const systemOptions = useMemo(() => {
        return systems.map(system => ({ value: system.ID, label: system.name }));
    }, [systems]);

    //Only View (Read mode) if the user isn't assigned to the project
    const isLocked = (!isAdmin) && !!currentProject?.dev_id && !(currentProject.dev_id.includes(activeUser?.ID))
    const saving = currentProject?.saving === true;
    const hasProjectFolder = !!currentProject?.project_folder_id;

    // This returns a copied object with the listed fields mapped, plus some additional generated fields. Assigning to the fields on mapping will call setState under the hood.
    //    For example: 'mapping.start_date = new Date()' in essence calls 'setState(prevMapping => ({ ...prevMapping, start_date = new Date() }))'.
    const editProject = useStateMapperTrackingLite(currentProject, ['start_date', 'est_delivery_date', 'priority', 'dev_stage', 'status', 'deployed_version', 'live_date', 'dev_id', 'lead_assessor_ids', 'tools_ids', 'system_ids', 'process_owner_ids', 'rank', 'attended_unattended'], true);

    // Disabled auto updating in useStateMapperTrackingLite, we only want to update the whole model if the referencing ID changes.
    useEffect(() => {
        if (!currentProjectId) {
            return;
        }

        editProject.updateFrom(currentProject);
        if (currRanking) {
            editProject.rank = currRanking.rank;
            editProject.accept();
        }
    }, [currentProjectId, currRanking]);

    /** @type {RpaCommentRecord[]} */
    const prevComments = useMemo(() => {
        return parseSafe(currentProject?.comments_history, []);
    }, [currentProject?.comments_history]);

    // Will include any admin moves if user isAdmin.
    const allowedMovesById = useMemo(() => {
        if (!currentProject) {
            return [];
        }

        const status = statusMapping[currentProject.status];
        if (!status) {
            return [];
        }

        let allowedMoves = status.allowedMoves;
        if (isAdmin) {
            allowedMoves = allowedMoves.concat(status.allowedAdminMoves);
        }

        return allowedMoves;
    }, [isAdmin, currentProject?.status]);

    const availableStatuses = useMemo(() => {
        return statuses.filter(x => !x.hidden || allowedMovesById.includes(x.id))
    }, [allowedMovesById]);

    const availablePriorities = useMemo(() => {
        if (!currentProjectId) {
            return [];
        }

        const filteredPriorities = priorities.filter(x => isAdmin || !x.adminOnly);

        const currPriority = currentProject.priority && priorityMapping[currentProject.priority];

        if (!isAdmin && currPriority && currPriority.adminOnly) {
            filteredPriorities.push(currPriority);
        }

        return filteredPriorities;
    }, [currentProjectId, isAdmin]);

    const selectedStatus = useMemo(() => {
        const id = editProject.status;
        /** @type {import('../../../../src_shared/AppConstants').StatusType | null} */
        const status = statusMapping[id];
        return status;
    }, [editProject.status]);

    const availableStages = useMemo(() => {
        return selectedStatus?.stages.filter(x => !x.hidden) ?? [];
    }, [selectedStatus?.id]);

    const projectOffice = useMemo(() => {
        if (!currentProject) {
            return null;
        }

        if (!currentProject.office_id) {
            return 'N/A';
        }

        const office = officeMapping.get(currentProject.office_id?.trim());
        if (office != null) {
            return office.sso + (office.dept_code ? " - " + office.dept_code : "");
        }

        return 'Not Found';
    }, [currentProject?.office_id, officeMapping]);

    const selectedProcessOwners = useMemo(() => {
        const ids = editProject.process_owner_ids ? editProject.process_owner_ids.split(',').map(id => id.trim()) : [];
        return arrayUtils.mapFilter(ids, id => {
            const user = employeeMapping.get(id);
            if (!user) {
                return null;
            }
            return { value: user.ID, label: user.name, email: user.email };
        });
    }, [editProject.process_owner_ids, employeeMapping]);

    const selectedTools = useMemo(() => {
        const ids = editProject.tools_ids ? editProject.tools_ids.split(',').map(id => id.trim()) : [];
        return arrayUtils.mapFilter(ids, id => {
            const tool = toolsMapping.get(id);
            if (!tool) {
                return null;
            }
            return { value: tool.ID, label: tool.name };
        });
    }, [editProject.tools_ids, toolsMapping]);

    const selectedLeadAssessors = useMemo(() => {
        const ids = editProject.lead_assessor_ids ? editProject.lead_assessor_ids.split(',').map(id => id.trim()) : [];
        return arrayUtils.mapFilter(ids, id => {
            const user = poaMapping.get(id);
            if (!user) {
                return null;
            }
            return { value: user.ID, label: user.name, email: user.email };
        });
    }, [editProject.lead_assessor_ids, poaMapping]);

    const selectedDevelopers = useMemo(() => {
        const ids = editProject.dev_id ? editProject.dev_id.split(',').map(id => id.trim()) : [];
        return arrayUtils.mapFilter(ids, id => {
            const user = poaMapping.get(id);
            if (!user) {
                return null;
            }
            return { value: user.ID, label: user.name, email: user.email };
        });
    }, [editProject.dev_id, poaMapping]);

    const selectedSystems = useMemo(() => {
        const ids = editProject.system_ids ? editProject.system_ids.split(',').map(id => id.trim()) : [];
        return arrayUtils.mapFilter(ids, id => {
            const system = systemMapping.get(id);
            if (!system) {
                return null;
            }
            return { value: system.ID, label: system.name };
        });
    }, [editProject.system_ids, systemMapping]);

    // REMINDER: Changes to this may also need to be made in BoxContainer.jsx, if it involves validation or business rule changes related to statuses or stages.
    async function handleClickSaveOffCanvas(e) {
        try {
            e.preventDefault();
            assertAlways.check(currentProject, 'No RPA project selected');

            const updater = new UpdateHandler(currentProject, editProject, projectFieldMapping, ['rank']);

            const output = { comments: commentArea };

            if (editProject.status_changed) {
                const canceled = await moveProjectToStatus(isAdmin, currentProject, editProject, selectedMilestone, updater, output)
                if (canceled) {
                    return;
                }
            }

            if (editProject.rank_changed) {
                if (!isAdmin) {
                    ToastUtils.showError('Only Admins can change the Rank.');
                    return;
                }

                currRanking.rank = editProject.rank;
            }

            if (output.comments) {
                const prevComments = parseSafe(currentProject.comments_history, []);
                const newComments = [{ date: new Date(), comment: output.comments, user: !activeUser?.email ? "invalid_user" : activeUser.email }, ...prevComments];
                updater.add('comments_history', JSON.stringify(newComments));
            }

            // No updates, don't waste time on the API call.
            if (!updater.any()) {
                if (editProject.rank_changed) {
                    updateRanking({ ...currRanking, rank: editProject.rank });
                }
                close();
                return;
            }

            updater.logger.addAllChanges(changedField => {
                if (changedField.name === 'dev_stage' && editProject.status_changed) {
                    // We don't need to log the dev_stage if the status is changed (We might if it's not changed to the default dev_stage, but this is simpler for now).
                    return false;
                }

                return true;
            });

            const updateProm = ApiUpdater.update(currentProject, updater);
            updateProm.then(() => {
                //send a assignment email only when the developer field is updated
                if (updater.includes('dev_id')) {
                    let developers = selectedDevelopers.map((item) => item.email);
                    let process_owners = selectedProcessOwners.map((item) => item.email);
                    let lead_assessor = selectedLeadAssessors.map((item) => item.email);
                    let projectType = currentProject.type.toLowerCase();
                    let type = (projectType === 'bug' ? "bug_assignment" : "project_assignment")
                    ApiDataService.openProjectEmail(type, currentProject, developers, process_owners.concat(lead_assessor));
                }
                
                if (editProject.status === statusMapping.UnderEvaluation.id && editProject.rank_changed) {
                    updateRanking(currRanking);
                }
            });

            updateProm.catch(error => {
                console.error(error);
                ToastUtils.showError(`Failed to Update '${currentProjectId}'\n${error}`);
            });

            close();
        }
        catch (err) {
            console.error("error while saving:", err);
            ToastUtils.showError(`Failed to Update '${currentProject.ID}'\n${err.message}`);
        }
    }

    function close() {
        setCommentArea('');
        setCurrentProjectId(null);
        //hide offcanvas after saving
        document.querySelector('.btn-close').click();
    }

    function formatDateTime(dateStr) {
        if (!dateStr) {
            return "invalid date";
        }

        const date = toDateTime(dateStr);

        if (!date.isValid) {
            return "invalid date";
        }

        return date.toLocaleString(DateTime.DATETIME_FULL);
    }

    function onStatusChanged(statusId) {
        editProject.status = statusId;
        /** @type {import('../../../../src_shared/AppConstants').StatusType} */
        const status = statusMapping[statusId];
        if (status.stages.length === 0) {
            editProject.dev_stage = '';
        }
        else {
            // Theoretically the first should always be a good value, but take care to ensure the first stage isn't flagged as hidden.
            editProject.dev_stage = status.stages[0].id;
        }
    }

    function onStatusUndo() {
        editProject.dev_stage = currentProject?.dev_stage;
    }

    function onRankingUndo(setMappingState) {
        setMappingState(prevState => ({ ...prevState, rank: currRanking.rank }));
    }

    return (
        <>
            <Offcanvas show={show} onHide={onHide} placement={placement}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title title={isLocked ? "You do not have edit rights to this Project" : currentProject?.name}>Project Details{isLocked ? " (Read Only)" : ""}</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body tabIndex={-1}>
                    <Form onSubmit={handleClickSaveOffCanvas} className='automation-canvas-form'>
                        <Form.Group className="row mb-3 ">
                            <Col xs={8}>
                                <p>
                                    <u>Current Status:</u><br />
                                    <i>{currentProject?.status}</i>
                                </p>
                            </Col>
                            <Col className='text-end'>
                                <OverlayTrigger
                                    placement="left"
                                    overlay={
                                        <Tooltip id="project-folder-tooltip">
                                            {hasProjectFolder ? 'Open Drive Folder' : 'No Drive Folder ID'}
                                        </Tooltip>}>
                                    <span>
                                        <Button href={`https://drive.google.com/drive/folders/${currentProject?.project_folder_id}`} target="_blank" disabled={!hasProjectFolder} title={hasProjectFolder ? 'Open Drive Folder' : 'No Drive Folder ID'}>
                                            <Icon.FolderSymlink />
                                        </Button>
                                    </span>
                                </OverlayTrigger>
                                {/* <Button></Button>
                                <Button className='mx-1' title='Action History' aria-label='Action History' onClick={() => { setShowActions(true) }}>
                                    <Icon.FolderSymlink />
                                </Button> */}
                            </Col>
                        </Form.Group>
                        {((labelSpan, valueSpan) => <>
                            <Form.Group as={Row} controlId="offcanvasProjectName">
                                <Form.Label column lg={labelSpan} className='text-lg-end'>
                                    <b>Project Name:</b>
                                </Form.Label>
                                <Col lg={valueSpan}>
                                    <Form.Control plaintext readOnly as="textarea" rows={2} defaultValue={currentProject?.name} />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} controlId="offcanvasProjectId">
                                <Form.Label column lg={labelSpan} className='text-lg-end'>
                                    <b>Project ID:</b>
                                </Form.Label>
                                <Col lg={valueSpan}>
                                    <Form.Control plaintext readOnly defaultValue={currentProject?.ID} />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} controlId="offcanvasProjectOffice">
                                <Form.Label column lg={labelSpan} className='text-lg-end'>
                                    <b>Client:</b>
                                </Form.Label>
                                <Col lg={valueSpan}>
                                    <Form.Control plaintext readOnly defaultValue={projectOffice} />
                                </Col>
                            </Form.Group>
                        </>)(4, 8)}
                        <br />
                        {/* {(isRpa ? <Form.Group className="mb-3" controlId="offcanvasAttendedUnattended">
                            <OverlayTrigger
                                placement="left"
                                overlay={
                                    <Tooltip id="selected-owners-tooltip">
                                        {rpaMode.length ? (
                                            <ul style={{ listStyleType: 'disc', paddingLeft: '0rem', margin: 0 }}>
                                                {rpaMode.map(mode => (<li key={mode.value}>{mode.label}</li>))}</ul>) :
                                            ('No automation mode selected')}
                                    </Tooltip>}>
                                <Form.Label style={{ cursor: 'pointer' }}>Attended/Unattended:</Form.Label>
                            </OverlayTrigger>
                            <InputGroup>
                                    <FormSelect
                                    disabled={saving || isLocked}
                                    onChange={value => editProject.attended_unattended = value}
                                    value={editProject.attended_unattended}>
                                        {rpaMode.map((option) => {
                                        return <option key={option.value}>{option.label}</option>})}
                                    </FormSelect>
                                <editProject.changes.Undo propName="attended_unattended" variant="outline-secondary" />
                            </InputGroup>
                        </Form.Group> : <></>)} */}
                        <Form.Group className="mb-3" controlId="offcanvasProjectProcessOwners">
                            <OverlayTrigger
                                placement="left"
                                overlay={
                                    <Tooltip id="selected-owners-tooltip">
                                        {selectedProcessOwners.length ? (
                                            <ul style={{ listStyleType: 'disc', paddingLeft: '0rem', margin: 0 }}>
                                                {selectedProcessOwners.map(poa => (<li key={poa.value}>{poa.label}</li>))}</ul>) :
                                            ('No process owners selected')}
                                    </Tooltip>}>
                                <Form.Label style={{ cursor: 'pointer' }}>Process Owner(s):</Form.Label>
                            </OverlayTrigger>
                            <InputGroup>
                                <MultiSelectString
                                    value={editProject.process_owner_ids}
                                    onChange={value => editProject.process_owner_ids = value}
                                    disabled={saving || isLocked}
                                    options={employeeOptions} />
                                <editProject.changes.Undo propName="process_owner_ids" variant="outline-secondary" />
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="offcanvas_EstCompDateId">
                            <OverlayTrigger
                                placement="left"
                                overlay={
                                    <Tooltip id="selected-owners-tooltip">
                                        {selectedSystems.length ? (
                                            <ul style={{ listStyleType: 'disc', paddingLeft: '0rem', margin: 0 }}>
                                                {selectedSystems.map(system => (<li key={system.value}>{system.label}</li>))}</ul>) :
                                            ('No systems selected')}
                                    </Tooltip>}>
                                <Form.Label style={{ cursor: 'pointer' }}>System(s):</Form.Label>
                            </OverlayTrigger>
                            <InputGroup>
                                <MultiSelectString
                                    value={editProject.system_ids}
                                    onChange={value => editProject.system_ids = value}
                                    disabled={saving || isLocked}
                                    options={systemOptions} />
                                <editProject.changes.Undo propName='system_ids' variant="outline-secondary"></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="offcanvasProjectProcessOwners">
                            <OverlayTrigger
                                placement="left"
                                overlay={
                                    <Tooltip id="selected-owners-tooltip">
                                        {selectedTools.length ? (
                                            <ul style={{ listStyleType: 'disc', paddingLeft: '0rem', margin: 0 }}>
                                                {selectedTools.map(tool => (<li key={tool.value}>{tool.label}</li>))}</ul>) :
                                            ('No tools selected')}
                                    </Tooltip>}>
                                <Form.Label style={{ cursor: 'pointer' }}>Tool(s):</Form.Label>
                            </OverlayTrigger>
                            <InputGroup>
                                <MultiSelectString
                                    value={editProject.tools_ids}
                                    onChange={value => editProject.tools_ids = value}
                                    disabled={saving || isLocked}
                                    options={toolsOptions} />
                                <editProject.changes.Undo propName='tools_ids' variant="outline-secondary"></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="offcanvasProjectLeadAssessor">
                            <OverlayTrigger
                                placement="left"
                                overlay={
                                    <Tooltip id="selected-owners-tooltip">
                                        {selectedLeadAssessors.length ? (
                                            <ul style={{ listStyleType: 'disc', paddingLeft: '0rem', margin: 0 }}>
                                                {selectedLeadAssessors.map(lead => (<li key={lead.value}>{lead.label}</li>))}</ul>) :
                                            ('No lead assessor selected')}
                                    </Tooltip>}>
                                <Form.Label style={{ cursor: 'pointer' }}>Lead Assessor:</Form.Label>
                            </OverlayTrigger>
                            <InputGroup>
                                <MultiSelectString
                                    value={editProject.lead_assessor_ids}
                                    onChange={value => editProject.lead_assessor_ids = value}
                                    disabled={saving || isLocked}
                                    options={poaOptions} />
                                <editProject.changes.Undo propName='lead_assessor_ids' variant="outline-secondary"></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="offcanvasProjectDeveloper">
                            <OverlayTrigger
                                placement="left"
                                overlay={
                                    <Tooltip id="selected-owners-tooltip">
                                        {selectedDevelopers.length ? (
                                            <ul style={{ listStyleType: 'disc', paddingLeft: '0rem', margin: 0 }}>
                                                {selectedDevelopers.map(dev => (<li key={dev.value}>{dev.label}</li>))}</ul>) :
                                            ('No developers selected')}
                                    </Tooltip>}>
                                <Form.Label style={{ cursor: 'pointer' }}>Developer(s):</Form.Label>
                            </OverlayTrigger>
                            <InputGroup>
                                <MultiSelectString
                                    value={editProject.dev_id}
                                    onChange={value => editProject.dev_id = value}
                                    disabled={saving || isLocked}
                                    options={poaOptions} />
                                <editProject.changes.Undo propName='dev_id' variant="outline-secondary"></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group>
                        {/* <Form.Group className="mb-3" controlId="offcanvasProjectDeveloper2">
                            <OverlayTrigger
                                placement="left"
                                overlay={
                                    <Tooltip id="selected-owners-tooltip">
                                        {selectedDevelopers.length ? (
                                            <ul style={{ listStyleType: 'disc', paddingLeft: '0rem', margin: 0 }}>
                                                {selectedDevelopers.map(dev => (<li key={dev.value}>{dev.label}</li>))}</ul>) :
                                            ('No developers selected')}
                                    </Tooltip>}>
                                <Form.Label style={{ cursor: 'pointer' }}>Developer(s):</Form.Label>
                            </OverlayTrigger>
                            <InputGroup>
                                    <Select
                                        className='form-control'
                                        value={editProject.dev_id}
                                        onChange={value => editProject.dev_id = value}
                                        disabled={saving || isLocked}
                                        options={poaOptions} />
                                <editProject.changes.Undo propName='dev_id' variant="outline-secondary"></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group> */}
                        <Form.Group className="mb-3" controlId="offcanvas_PriorityId">
                            <Form.Label>Priority</Form.Label>
                            <InputGroup>
                                <Form.Select
                                    name="rpa_priority"
                                    value={editProject.priority}
                                    onChange={(e) => editProject.priority = e.target.value}
                                    disabled={saving || isLocked}>
                                    {availablePriorities.map(priority => <option key={priority.value} value={priority.id} disabled={!isAdmin && priority.adminOnly}>{priority.title}</option>)}
                                </Form.Select>
                                <editProject.changes.Undo propName='priority' variant="outline-secondary"></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group>
                        {isUnderEval && <Form.Group className="mb-3" controlId="offcanvas_Ranking">
                            <Form.Label>Ranking<InfoOverlay title={`Determines the order of this project in the ${statusMapping.UnderEvaluation.title} lane, with 1 being the highest rank.`} placement='right' /></Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type="number"
                                    min={minRank}
                                    max={maxRank}
                                    value={editProject.rank}
                                    disabled={saving || isLocked || (isUnderEval && rankingIsSaving) || !isAdmin}
                                    onChange={(e) => editProject.rank = to.int(e.target.value, maxRank)} />
                                <editProject.changes.Undo propName='rank' variant="outline-secondary" onUndo={onRankingUndo}></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group>}
                        <Form.Group className="mb-3" controlId="offcanvas_StartDate">
                            <Form.Label>Start Date</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type="date"
                                    value={dateToDatePickerFormat(editProject.start_date)}
                                    disabled={saving || isLocked}
                                    onChange={(e) => editProject.start_date = toIsoDateStr(e.target.value)} />
                                <editProject.changes.Undo propName='start_date' variant="outline-secondary"></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="offcanvas_EstCompDateId">
                            <Form.Label>Est. Comp. Date</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type="date"
                                    value={dateToDatePickerFormat(editProject.est_delivery_date)}
                                    disabled={saving || isLocked}
                                    onChange={(e) => editProject.est_delivery_date = toIsoDateStr(e.target.value)} />
                                <editProject.changes.Undo propName='est_delivery_date' variant="outline-secondary"></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="offcanvasProjectLiveDate">
                            <Form.Label>Live Date</Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type="date"
                                    value={dateToDatePickerFormat(editProject.live_date)}
                                    disabled={saving || isLocked}
                                    onChange={(e) => editProject.live_date = toIsoDateStr(e.target.value)} />
                                <editProject.changes.Undo propName='live_date' variant="outline-secondary"></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="offcanvas_StatusId">
                            <Form.Label>Status</Form.Label>
                            <InputGroup>
                                <Form.Select
                                    value={editProject.status}
                                    disabled={saving || isLocked}
                                    onChange={(e) => onStatusChanged(e.target.value)}>
                                    {availableStatuses.map(status => {
                                        return <option key={status.id} value={status.id} disabled={(!allowedMovesById.includes(status.id))
                                            ||
                                            //disable path to production if the current progress is not 100%
                                            ((parseInt(localStorage.getItem("currentProgress")) < 100)
                                                &&
                                                status.id === statusMapping.InProduction.id
                                            )
                                        }>{status.title}</option>
                                    })};
                                </Form.Select>
                                <editProject.changes.Undo propName='status' onUndo={onStatusUndo} variant="outline-secondary"></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className={"mb-1 " + (availableStages.length > 1 ? "" : "invisible")} controlId="offcanvas_Stage">
                            <Form.Label>Stage</Form.Label>
                            <InputGroup>
                                <Form.Select
                                    name="stage_change"
                                    value={editProject.dev_stage}
                                    disabled={saving || isLocked}
                                    onChange={(e) => editProject.dev_stage = (e.target.value)}>
                                    {availableStages.map(stage => {
                                        return !stage.hidden && <option key={stage.id} value={stage.id}>{stage.title}</option>
                                    })}
                                </Form.Select>
                                <editProject.changes.Undo propName='dev_stage' variant="outline-secondary"></editProject.changes.Undo>
                            </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="offcanvas_Comment">
                            <Form.Label>Comments
                                {/* Disabled for now. Jonathan wants the comments to be displayed at the bottom of the offcanvas. I have a feeling it may be used again */}
                                {/* <Button size='sm' className='mx-1' title='Comment History' aria-label='Comment History' onClick={() => { setShowLogs(true) }}>
                                    <Icon.ClockHistory></Icon.ClockHistory>
                                </Button> */}
                            </Form.Label>

                            <Form.Control
                                as="textarea"
                                name="comment"
                                form="usrform"
                                placeholder="Insert Comments"
                                value={commentArea}
                                disabled={saving || isLocked}
                                onChange={(e) => { setCommentArea(e.target.value) }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="offcanvas_CommentList" style={{ overflowY: "scroll", maxHeight:"200px" }}>
                            {
                                prevComments?.map((comment, index) => {
                                    return (
                                        <button key={"comment_" + index} className={"text-dark w-100 px-2 pb-2 text-left bg-light"}
                                            aria-label={`Date: ${comment.date} comment: ${comment?.comment}`}>
                                            <div className='d-flex px-2'>
                                            <b>{!comment?.user ? "Invalid Username" : comment.user}</b><span>&nbsp;</span>{'-'}<span>&nbsp;</span><p className="text-secondary">{formatDateTime(comment?.date)}</p>
                                            </div>
                                            <div className='text-break'>
                                            <span>&nbsp;&nbsp;</span>{comment?.comment}
                                            </div>
                                        </button>
                                    )
                                })
                            }
                            <br />
                        </Form.Group>

                        <Button id="canvas_save" variant="primary" type="submit" className='btn btn-primary' aria-label='Save Changes to Project' disabled={saving || isLocked}>
                            {!saving
                                ? <>Save <i className="bi bi-floppy2" style={{ width: "16", height: "16", fill: "currentColor", marginLeft: "10px" }}></i></>
                                : <>
                                    <div className="sweet-loading">
                                        Saving &nbsp;
                                        <SyncLoader
                                            color={"#ffffff"}
                                            loading={saving}
                                            size={5}
                                            aria-label="Loading Spinner"
                                            data-testid="loader"
                                            cssOverride={{ display: 'inline' }}
                                        />
                                    </div>
                                </>}
                        </Button>
                    </Form>
                </Offcanvas.Body>
            </Offcanvas>
            <Modal show={showLogs} onHide={() => setShowLogs(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Comment History</Modal.Title>
                </Modal.Header>
                <Modal.Body className='force_scroll'>
                    {
                        prevComments?.map((comment, index) => {
                            return (
                                <button key={"comment_" + index} className={"w-100 px-2 pb-1 text-left " + (index % 2 == 0 ? 'bg-secondary text-light' : 'bg-light')}
                                    style={{ color: "black" }}
                                    aria-label={`Date: ${comment.date} comment: ${comment?.comment}`}><div><h5>{formatDateTime(comment?.date)}</h5> {!comment?.user ? "Invalid Username" : comment.user}</div>
                                    <div style={{ wordWrap: "break-word", maxHeight: "200px", overflow: "auto" }}>
                                        <b>
                                            {comment?.comment}
                                        </b>
                                    </div>
                                </button>
                            )
                        })
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowLogs(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* <Modal show={showActions} onHide={() => setShowActions(false)} size='lg'>
                <Modal.Header closeButton>
                    <Modal.Title>Action History</Modal.Title>
                </Modal.Header>
                <Modal.Body className='action-history-body'>
                    <Table striped borderless hover>
                        <thead className='text-center'>
                            <tr>
                                <th>Date</th>
                                <th>User</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                prevActions.map((action, index) => {
                                    return (
                                        <tr key={"actions_history_" + index}>
                                            <td className='text-center'>{action.date}</td>
                                            <td className='text-center'>{action.user}</td>
                                            <td className='text-center'>{action.description}</td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </Table>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowActions(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal> */}
        </>
    );
}

AutomationOffcanvasDisplay.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func,
    placement: PropTypes.string
}

export default AutomationOffcanvasDisplay;
