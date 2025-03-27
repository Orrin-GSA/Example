import React, { useState, useContext, useEffect, useMemo, createContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, Button, Form, Accordion, Row, Col, InputGroup } from 'react-bootstrap';
import SyncLoader from "react-spinners/SyncLoader";
import PropTypes from 'prop-types';
import { addMilestoneWithBlocking, selectApiMilestones, updateMilestoneWithBlocking, selectApiProjects, selectApiEnhancements, selectApiScripts, selectApiBugs } from '../../../util/ApiDataSlice';
import { AutomationsContext } from '../Automations';
import { newMilestone, milestoneFieldMapping } from '../../../util/RpaUtils';
import { selectIsAdmin, selectEmail } from '../../../util/UserSettingsSlice';
import ToastUtils from '../../../util/ToastUtils';
import { getProjectType, toIsoDateStr, getKeys, UpdateHandler } from '../../../util/DataUtil';
import { is, assertAlways } from '../../../../../src_shared/TypeUtils';
import MilestoneField from './MilestoneField';
import { AppContext } from '../../../../App';
import { useStateMapperTrackingLite } from '../../../util/ReactUtils';
import ApiUpdater from '../../../util/ApiUpdater';
import ApiDataService from '../../../util/ApiDataService';

export const MilestonesContext = createContext({ editMilestone: {}, milestone: {}, isDisabled: false, isEnh: false });

// Update the returned object in newMilestone if you want to add new keys.
const editMilestoneKeys = getKeys(newMilestone(''), ['ID', 'saving', 'ref_id']);

function AutoMilestones({ show, handleClose }) {
    const dispatch = useDispatch();
    const isAdmin = useSelector(selectIsAdmin);

    const { currentProjectId, setCurrentProjectId } = useContext(AutomationsContext);
    const { activeUser } = useContext(AppContext);
    const allRpas = useSelector(selectApiProjects);
    const allScripts = useSelector(selectApiScripts);
    const allEnhancements = useSelector(selectApiEnhancements);
    const allBugs = useSelector(selectApiBugs);

    const currentProjectType = useMemo(() => {
        if (!currentProjectId) {
            return '';
        }

        return getProjectType(currentProjectId) ?? '';
    }, [currentProjectId])

    const isEnh = useMemo(() => {
        if (!currentProjectType) {
            return false;
        }

        return currentProjectType === 'Enhancement';
    }, [currentProjectType]);

    const currentProject = useMemo(() => {
        if (!currentProjectId || !currentProjectType) {
            return null;
        }

        switch (currentProjectType) {
            case 'RPA':
                return allRpas.find(x => x.ID === currentProjectId)
            case 'Script':
                return allScripts.find(x => x.ID === currentProjectId)
            case 'Enhancement':
                return allEnhancements.find(x => x.ID === currentProjectId)
            case 'Bug':
                return allBugs.find(x => x.ID === currentProjectId)
        }
    }, [currentProjectId, currentProjectType, allRpas, allScripts, allEnhancements, allBugs]);

    const parentProject = useMemo(() => {
        if(!isEnh || !currentProject || !currentProject.project_id) {
            return null;
        }

        const parentProjectType = getProjectType(currentProject.project_id);

        switch (parentProjectType) {
            case 'RPA':
                return allRpas.find(x => x.ID === currentProject.project_id)
            case 'Script':
                return allScripts.find(x => x.ID === currentProject.project_id);
        }

        // Parent should only ever be RPA or Script.
        return null;
    }, [currentProject, isEnh, allRpas, allScripts]);

    const parentProjectType = useMemo(() => {
        if (!parentProject) {
            return '';
        }

        return getProjectType(parentProject.ID) ?? '';
    }, [parentProject]);

    const isRpa = useMemo(() => {
        if (!currentProjectType) {
            return false;
        }

        return currentProjectType === 'RPA' || parentProjectType === 'RPA';
    }, [currentProjectType, parentProjectType]);

    const isScript = useMemo(() => {
        if (!currentProjectType) {
            return false;
        }

        return currentProjectType === 'Script' || parentProjectType === 'Script';
    }, [currentProjectType, parentProjectType]);

    const milestones = useSelector(selectApiMilestones);
    const selectedMilestone = useMemo(() => {
        if (!currentProjectId) {
            return null;
        }

        return milestones.find(x => x.ref_id === currentProjectId) ?? newMilestone(currentProjectId);
    }, [currentProjectId, milestones]);

    // TODO: Figure out why this lookup isn't working.
    const parentMilestone = useMemo(() => {
        if (!parentProject) {
            return null;
        }

        return milestones.find(x => x.ref_id === parentProject.ID);
    }, [parentProject, milestones]);

    const isSaving = useMemo(() => selectedMilestone?.saving === true, [selectedMilestone]);
    const isLocked = useMemo(() => !isAdmin && !!currentProject?.process_owner_ids && currentProject.process_owner_ids.includes(activeUser.ID), [isAdmin, activeUser, currentProject]);
    const isDisabled = useMemo(() => isSaving || isLocked, [isSaving, isLocked]);

    const editMilestone = useStateMapperTrackingLite(selectedMilestone, editMilestoneKeys, true);

    useEffect(() => {
        if (!selectedMilestone?.ID) {
            return;
        }

        editMilestone.updateFrom(selectedMilestone);
    }, [selectedMilestone]);

    async function handleSubmit(e) {
        e.preventDefault();
        assertAlways.check(currentProjectId?.trim(), "Could not get the current project ID. Unable to submit.");

        const updater = new UpdateHandler(selectedMilestone, editMilestone, milestoneFieldMapping);
        
        if (!updater.any()) {
            onClose();
            return;
        }

        updater.logger.addAllChanges();

        try {
            if (!selectedMilestone.ID) {
                //Add the RPA id to the rpa_id column if it is inserting a new row
                console.log("Milestone does not exist. Attempting to create it.", currentProjectId);
                const newMilestone = editMilestone.toObject();
                newMilestone.ref_id = currentProjectId;
                newMilestone.saving = true;

                dispatch(addMilestoneWithBlocking(newMilestone)).unwrap()
                    .then(() => {
                        ToastUtils.show(`Successfully Added ${currentProjectId} Milestone`);
                        if (updater.logger.any()) {
                            ApiUpdater.log(currentProject, updater.logger.toArray(), 'to the Milestones');
                            ApiDataService.logAuditActionBackground(`Added project milestones ${currentProjectId}`);
                        }
                    }, error => {
                        console.error("Failed to add milestone", error);
                        ToastUtils.showError(`Failed to Add ${currentProjectId} Milestone.`);
                    });
            }
            else {
                dispatch(updateMilestoneWithBlocking({ ID: selectedMilestone.ID, updates: updater.updates, revertedUpdates: updater.reverts })).unwrap()
                    .then(() => {
                        ToastUtils.show(`Successfully Updated ${currentProjectId} Milestone`);
                        if (updater.logger.any()) {
                            ApiUpdater.log(currentProject, updater.logger.toArray(), 'to the Milestones');
                            ApiDataService.logAuditActionBackground(`Updated project milestones ${currentProjectId}`);
                        }
                    }, error => {
                        console.error(error);
                        ToastUtils.showError(`Failed to Update ${currentProjectId} Milestone.`);
                    });
            }
        }
        catch (error) {
            console.error(error);
            ToastUtils.showError(`Failed to Update ${currentProjectId} Milestone.`);
        }
        finally {
            onClose();
        }

    };

    function onClose() {
        setCurrentProjectId(null);
        handleClose();
    }

    function copyFromParent(fieldName) {
        editMilestone[fieldName] = parentMilestone[fieldName];
    }

    if (!currentProjectId) {
        return <></>;
    }

    return (
        <MilestonesContext.Provider value={{ editMilestone, milestone: selectedMilestone, isDisabled, isEnh, parentMilestone, copyFromParent }}>
            <Modal show={show} onHide={onClose} className='milestone-modal' size='lg'>
                <Modal.Header closeButton>
                    <Modal.Title>Milestones - {currentProject?.name} {isLocked ? "(Read Only)" : ""}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <MilestoneField title='Kickoff/Process Discovery Call Date' type='date' fieldName='kickoff_complete' required={true} />
                            {isRpa && <MilestoneField title='Added to Archer' type='date' fieldName='archer' required={true} size={6} />}
                            <MilestoneField title={isScript ? 'Scripting Definition Document (SDD)' : 'Process Definition Document (PDD)'} type='url' fieldName='dd_complete' required={true} size={isScript? 6 : 12} />
                            {isRpa && <MilestoneField title='PTA Approval Date' type='date' fieldName='pta_complete' required={true} />}
                            {isRpa && <MilestoneField title='System Access Signature Forms' type='date' fieldName='system_access_signatures' required={true} size={6} />}
                            {isRpa && <MilestoneField title='Attibutes Questionnarie / Excel Export' type='date' fieldName='attributes_questionnaire' required={true} size={6} />}
                            <MilestoneField title='Development Completion (%)' type='number' fieldName='dev_comp_complete' required={true} />
                            <MilestoneField title='Developer Testing Completion Date' type='date' fieldName='developer_testing_complete' required={true} />
                            {isRpa && <MilestoneField title='Demo Video' type='date' fieldName='demo_video' required={true} size={6} />}
                            {isRpa && <MilestoneField title='Security Assessment Approval Date' type='date' fieldName='security_assessment' required={true} />}
                            <MilestoneField title='UAT Signature Completion Date' type='date' fieldName='uat_complete' required={true} />
                        </Row>

                        {isRpa && <><Accordion>
                            <Accordion.Item eventKey="0">
                                <Accordion.Header>All System Access Requests</Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        <MilestoneField title='Requests for NPE and Developers Tickets - IT Ticket Number' type='text' fieldName='npe_tickets_complete' placeholder='NPE Ticket #' size={12} />
                                        <MilestoneField title='Custodian Tickets' type='text' fieldName='custodian_tickets_complete' placeholder='Custodian Ticket #' size={12} />
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                        <Accordion>
                            <Accordion.Item eventKey="1">
                                <Accordion.Header>User (Custodian/NPE) Documentation</Accordion.Header>
                                <Accordion.Body>
                                    <Row>
                                        <MilestoneField title='Environment Release Notes (Unattended)' type='url' placeholder='URL' fieldName='env_release_notes_complete' size={12} />
                                        <MilestoneField title='Questionnaire' type='url' placeholder='URL' fieldName='questionnaire_complete' size={12} />
                                        <MilestoneField title='SOP (If Warranted)' type='text' placeholder='SOP' fieldName='sop_complete' size={12} />
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion></>}
                        <div className='milestone-actions'>
                            <Button variant="secondary" onClick={handleClose}>Close</Button>
                            <Button variant="primary" type="submit" disabled={isSaving}>
                                {!isSaving
                                    ? <>Save <i className="bi bi-floppy2" style={{ width: "16", height: "16", fill: "currentColor", marginLeft: "4px" }}></i></>
                                    : <>
                                        <div className="sweet-loading">
                                            Saving &nbsp;
                                            <SyncLoader
                                                color={"#ffffff"}
                                                loading={isSaving}
                                                size={5}
                                                aria-label="Loading Spinner"
                                                data-testid="loader"
                                                cssOverride={{ display: 'inline' }}
                                            />
                                        </div>
                                    </>}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </MilestonesContext.Provider>
    );
}

AutoMilestones.propTypes = {
    show: PropTypes.bool.isRequired,
    handleClose: PropTypes.func.isRequired
}

export default AutoMilestones;