// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useContext, useMemo, useRef, useState } from "react";
import { Card, CardBody, Col, Form, Modal, Row } from "react-bootstrap";
import ToastUtils from "../util/ToastUtils";
import { getProjectType, toDateTime } from "../util/DataUtil";
import { DateTime } from "luxon";
import { useFieldMemo } from "../util/ReactUtils";
import { useSelector } from "react-redux";
import { selectApiPoaUsers, selectApiSystems, selectApiTools } from "../util/ApiDataSlice";
import { arrayUtils } from "../../../src_shared/TypeUtils";
import { AppContext } from "../../App";

// type ProjectPreviewDefaults = {
//     /** Text for confirm button. */
//     confirm: string;
//     /** Text for cancel button. */
//     cancel: string;
//     /** If true, will exapnd the size of the modal. */
//     useLarge: boolean;
//     /** If true, the promise will only ever resolve, returning true if confirmed or false if canceled in any way. If alwaysConfirm is false, it will reject the promise when canceled. Defaults to true. */
//     alwaysConfirm: boolean;
//     /** If true, the user can click outside of the modal to close it, triggering a "cancel". Defaults to true. */
//     outsideClicking: boolean;
// }

// const getDefaults = (): ProjectPreviewDefaults => ({
//     confirm: "Yes",
//     cancel: "No",
//     useLarge: false,
//     alwaysConfirm: true,
//     outsideClicking: true
// });
// const defaults = getDefaults();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let openInternal = (project: RpaProjectProcessed | EnhancementProjectProcessed | ScriptProjectProcessed | BugProjectProcessed): Promise<void> => {
    ToastUtils.showDevError('Input Modal not initialized.');
    return Promise.reject('Modal not initialized.');
}

// Sketchy, but there should only ever be one instance of this object in the tree and shouldn't have any conflicts.
/** Open modal with a simple confirm/cancel button. This will return a promise that will resolve or reject based on the modal. */
export const openPreviewAsync = (project: RpaProjectProcessed | EnhancementProjectProcessed | ScriptProjectProcessed | BugProjectProcessed) => openInternal(project);

// TODO: We could add a "RequireConfirm" which essentially makes them say "Yes this project looks OK.", and returns a error if they cancel.
function ProjectPreviewModal() {
    const [show, setShow] = useState(false);
    const [project, setProject] = useState<RpaProjectProcessed | EnhancementProjectProcessed | ScriptProjectProcessed | BugProjectProcessed>(null);
    const promiseRef = useRef<{ resolve: () => void, reject: (reason?: any) => void }>(null);
    const { toolsMapping, systemMapping, poaMapping, officeMapping } = useContext(AppContext);

    const projectType = useMemo(() => {
        return project?.ID && getProjectType(project.ID);
    }, [project?.ID]);

    const projectSystems = useMemo(() => {
        // system_ids is not present on all project types, so we return null to let the JSX below know to hide it rather than display nothing.
        if (!project || project.system_ids == null) {
            return null;
        }

        const systemIds = project.system_ids.split(',');

        return arrayUtils.mapFilter(systemIds, id => systemMapping.get(id.trim())?.name, (mapped) => !!mapped).join(', ');
    }, [project?.system_ids, systemMapping]);

    const projectTools = useMemo(() => {
        // system_ids is not present on all project types, so we return null to let the JSX below know to hide it rather than display nothing.
        if (!project) {
            return null;
        }

        if (!project.tools_ids) {
            return 'N/A';
        }

        const toolIds = project.tools_ids.split(',');

        return arrayUtils.mapFilter(toolIds, id => toolsMapping.get(id.trim())?.name, (mapped) => !!mapped).join(', ');
    }, [project?.tools_ids, toolsMapping]);

    const projectDevelopers = useMemo(() => {
        if (!project) {
            return null;
        }

        if(!project.dev_id) {
            return 'N/A';
        }

        const poaIds = project.dev_id.split(',');

        return arrayUtils.mapFilter(poaIds, id => poaMapping.get(id.trim())?.name, (mapped) => !!mapped).join(', ');
    }, [project?.dev_id, poaMapping]);

    const projectOffice = useMemo(() => {
        if (!project) {
            return null;
        }

        if(!project.office_id) {
            return 'N/A';
        }

        const office = officeMapping.get(project.office_id?.trim());
        if (office != null) {
            return office.sso + (office.dept_code ? " - " + office.dept_code : "");
        }
        
        return 'Not Found';
    },[project?.office_id, officeMapping])

    openInternal = (project: RpaProjectProcessed | EnhancementProjectProcessed | ScriptProjectProcessed | BugProjectProcessed) => {
        if (!project) {
            return Promise.reject('"project" argument is required.');
        }

        setProject(project);

        // Result to provide if onConfirm is not called before closing. 
        //  null makes the promise returned rejected, false makes it resolve with the value of false.
        const promise = new Promise<void>((resolve, reject) => {
            promiseRef.current = { resolve, reject };
        })

        setShow(true);
        return promise;
    }

    // Waits till after the animation finishes closing to resolve promise. Can be jarring if other modals start to popup before this closes or this modal needs to be reused back to back.
    const onExited = () => {
        promiseRef.current.resolve();
    }

    const onTryHide = () => {
        setShow(false);
    }

    return (
        <Modal show={show} onHide={onTryHide} onExited={onExited} size='xl'>
            {project && <>
                <Modal.Header closeButton>
                    {/* <Button onClick={() => onCancel(true)} aria-label="Close">&times;</Button> */}
                    <Modal.Title>{projectType}: {project.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {((labelSpan, valueSpan) => <>
                        <Row>
                            <Col lg={12}>
                                <Form.Group as={Row} controlId="viewProjectId">
                                    <Form.Label column lg={labelSpan} className='text-lg-end'>
                                        <b>Project ID:</b>
                                    </Form.Label>
                                    <Col lg={valueSpan}>
                                        <Form.Control plaintext readOnly defaultValue={project.ID} />
                                    </Col>
                                </Form.Group>
                                <Form.Group as={Row} controlId="viewProjectName">
                                    <Form.Label column lg={labelSpan} className='text-lg-end'>
                                        <b>Name:</b>
                                    </Form.Label>
                                    <Col lg={valueSpan}>
                                        <Form.Control plaintext readOnly as="textarea" rows={2} defaultValue={project.name} />
                                    </Col>
                                </Form.Group>
                            </Col>
                            <Col lg={12}>
                                <Form.Group as={Row} controlId="viewProjectDesc">
                                    <Form.Label column lg={labelSpan} className='text-lg-end'>
                                        <b>Description:</b>
                                    </Form.Label>
                                    <Col lg={valueSpan}>
                                        <Form.Control plaintext readOnly as="textarea" rows={3} defaultValue={project.description || 'N/A'} />
                                    </Col>
                                </Form.Group>
                            </Col>
                        </Row>
                        </>)(2, 10)}
                        <Card>
                            <CardBody>
                            {((labelSpan, valueSpan) => <>
                                <Row>
                                    <Col xl={6}>
                                        <Row>
                                            <Col className="text-center">
                                                <h5>Project Details</h5>
                                            </Col>
                                        </Row>
                                        <Form.Group as={Row} controlId="viewProjectOffice">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Client:</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={projectOffice} />
                                            </Col>
                                        </Form.Group>
                                        <Form.Group as={Row} controlId="viewProjectProcessOwners">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Process Owner(s):</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={project.process_owners} />
                                            </Col>
                                        </Form.Group>
                                        <Form.Group as={Row} controlId="viewProjectLeadAssessor">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Lead Assessor:</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={project ? "brian.mooers@gsa.gov" : ''} />
                                            </Col>
                                        </Form.Group>
                                        <Form.Group as={Row} controlId="viewcanvasProjectDeveloper">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Developer(s):</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={projectDevelopers ?? "N/A"} />
                                            </Col>
                                        </Form.Group>
                                        <Form.Group as={Row} controlId="viewStartDate">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Start Date:</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={toDateTime(project.start_date)?.toFormat('D')} />
                                            </Col>
                                        </Form.Group>
                                        <Form.Group as={Row} controlId="viewEstCompDate">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Est. Comp. Date:</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={toDateTime(project.est_delivery_date)?.toFormat('D')} />
                                            </Col>
                                        </Form.Group>
                                        {(projectSystems != null) && <Form.Group as={Row} controlId="viewSystems">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>System(s):</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={projectSystems} />
                                            </Col>
                                        </Form.Group>}
                                        {(projectTools != null) && <Form.Group as={Row} controlId="viewTools">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Tool(s):</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={projectTools} />
                                            </Col>
                                        </Form.Group>}
                                        <Form.Group as={Row} controlId="viewTools">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Project Folder:</b>
                                            </Form.Label>
                                            <Col lg={valueSpan} className="py-2">
                                                {project.project_folder_id ? <a target="_blank" rel="noreferrer" href={`https://drive.google.com/drive/folders/${project.project_folder_id}`}>Link</a> : <>Not Found</>}
                                            </Col>
                                        </Form.Group>
                                    </Col>
                                    <Col xl={6}>
                                        <Row>
                                            <Col className="text-center">
                                                <h5>Project Updates</h5>
                                            </Col>
                                        </Row>

                                        <Form.Group as={Row} controlId="viewCreatedDate">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Created Date:</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={toDateTime(project.created_date)?.toLocaleString(DateTime.DATETIME_FULL)} />
                                            </Col>
                                        </Form.Group>
                                        <Form.Group as={Row} controlId="viewCreatedBy">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Created By:</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={project.created_by} />
                                            </Col>
                                        </Form.Group>

                                        {/* Spacer Row */}
                                        <Form.Group as={Row}>
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                &nbsp;
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                &nbsp;
                                            </Col>
                                        </Form.Group>


                                        <Form.Group as={Row} controlId="viewStatusDate">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Last Status Date:</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={toDateTime(project.status_date)?.toLocaleString(DateTime.DATETIME_FULL)} />
                                            </Col>
                                        </Form.Group>

                                        <Form.Group as={Row} controlId="viewStatusReason">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Last Status Reason:</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={project.status_reason} />
                                            </Col>
                                        </Form.Group>

                                        {/* Spacer Row */}
                                        <Form.Group as={Row}>
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                &nbsp;
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                &nbsp;
                                            </Col>
                                        </Form.Group>

                                        <Form.Group as={Row} controlId="viewLastModDate">
                                            <Form.Label column lg={labelSpan} className='text-lg-end'>
                                                <b>Last Mod. Date:</b>
                                            </Form.Label>
                                            <Col lg={valueSpan}>
                                                <Form.Control plaintext readOnly defaultValue={toDateTime(project.last_modified_date)?.toLocaleString(DateTime.DATETIME_FULL)} />
                                            </Col>
                                        </Form.Group>
                                    </Col>
                                </Row>
                                </>)(4, 8)}

                            </CardBody>
                        </Card>
                </Modal.Body>
                {/* <Modal.Footer>
                <Button variant="warning" onClick={onCancel}>
                    {cancelText}
                </Button>
                <Button variant="success" onClick={onConfirm}>
                    {confirmText}
                </Button>
            </Modal.Footer> */}
            </>}
        </Modal>)
}

export default ProjectPreviewModal;