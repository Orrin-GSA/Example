import React, { useContext, useMemo } from 'react';
import { Spinner, Row, Col, Button } from 'react-bootstrap';
import { useDrag } from 'react-dnd';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import * as Icon from 'react-bootstrap-icons';
import { AutomationsContext } from './Automations';
import { getMilestoneProgress, newMilestone } from '../../util/RpaUtils';
import { assert, is } from '../../../../src_shared/TypeUtils';
import { statusMapping } from '../../../../src_shared/AppConstants';
import { openPreviewAsync } from '../../shared/ProjectPreviewModal';
import { getProjectType, isEnhProject } from '../../util/DataUtil';
import RpaMilestonePreview from './Cards/RpaMilestonePreview';
import ScriptMilestonePreview from './Cards/ScriptMilestonePreview';
import DefaultCardBody from './Cards/DefaultCardBody';
import UnderEvalCardBody from './Cards/UnderEvalCardBody';
import InProductionCardBody from './Cards/InProductionCardBody';

/**
 * 
 * @param {Object} props
 * @param {string} props.clsName 
 * @param {AllProjectProccessed} props.project
 * @param {import('../../../../src_shared/AppConstants').StatusType} props.status Status the project is currently a part of.
 * @param {import('../../../../src_shared/AppConstants').StageType?} props.stage Stage the project is currently a part of, if any.
 * @param {number} props.idx Stage the project is currently a part of, if any.
 */
function ProjectCard({ clsName, project, status, stage, idx }) {
    const { setShowOffcanvas, setCurrentProjectId, mappedMilestones } = useContext(AutomationsContext);

    assert.object(project);

    const projectName = useMemo(() => {
        return project.name ?? "Failed to load project name...";
    }, [project?.name]);

    /** @type {RpaMilestone} */
    const selectedMilestone = useMemo(() => {
        return mappedMilestones[project.ID] ?? newMilestone(project.ID);
    }, [project?.ID, mappedMilestones]);

    const isDevelopmentStatus = useMemo(() => {
        return status.id === statusMapping.InDevelopment.id;
    }, [status?.id]);

    const isUnderEvalStatus = useMemo(() => {
        return status.id === statusMapping.UnderEvaluation.id;
    }, [status?.id]);

    const showMilestones = useMemo(() => {
        return isDevelopmentStatus && project.type !== 'Bug';
    }, [isDevelopmentStatus, project?.type]);

    const milestonePreview = useMemo(() => {
        if(!showMilestones) {
            return <></>;
        }

        const typeId = isEnhProject(project) ? project.project_id : project.ID;

        switch(getProjectType(typeId))  {
            case 'RPA':
                return <RpaMilestonePreview project={project} status={status} stage={stage}></RpaMilestonePreview>;
            case 'Script':
                return <ScriptMilestonePreview project={project} status={status} stage={stage}></ScriptMilestonePreview>;
            case 'Bug':
                // Bugs do not have milestones, just require a comment about how it was resolved (Do we want this in Action History or Status Reason?)
                return <></>;
        }
    }, [showMilestones, project?.ID, project?.project_id]);

    const cardBody = useMemo(() => {
        if(!status || !project) {
            return <></>;
        }
        
        if(status.id === statusMapping.UnderEvaluation.id) {
            return <UnderEvalCardBody project={project} />;
        }
        else if (status.id === statusMapping.InProduction.id) {
            return <InProductionCardBody project={project} />;
        }

        return <DefaultCardBody project={project}/>;
    }, [status?.id, project]);

    const itemClass = 'border mt-3 mx-1 drag-item d-block ' + clsName;

    // TODO: I would love this to be cached (useMemo), but I'm not certain how dependencies on fields of objects works, and the dependency is going to vary because of different requirements...
    const progress = getMilestoneProgress(project, selectedMilestone);

    const [collected, drag, dragPreview] = useDrag(() => ({
        type: 'RpaProjects',
        // Items to include when this object is "dropped" into a dropzone. The lighter the better, this is collected every pixel the mouse is moved.
        item: { ID: project.ID, statusId: status.id, stageId: stage?.id, progress, record: project, idx: isUnderEvalStatus ? idx : null },
        // Items to include in the returned collected object for use in the JSX. The lighter the better, this is collected every pixel the mouse is moved.
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
        })
    }), [project, selectedMilestone, isUnderEvalStatus]);

    function handleClickOffCanvas() {
        // Quick and dirty copy so we aren't editing redux slice data.
        // console.log("Card Progress", progress);
        localStorage.setItem("currentProgress", progress.toString());
        setCurrentProjectId(project.ID);
        setShowOffcanvas(true);
        localStorage.setItem("currentProject", JSON.stringify(project));
    };

    /**
     * 
     * @param {React.KeyboardEvent<HTMLDivElement>} e 
     */
    function handleKeyOffCanvas(e) {
        if (e.key !== 'Enter') {
            return;
        }
        // Quick and dirty copy so we aren't editing redux slice data.
        // console.log("Card Progress", progress);
        localStorage.setItem("currentProgress", progress.toString());
        setCurrentProjectId(project.ID);
        setShowOffcanvas(true);
        localStorage.setItem("currentProject", JSON.stringify(project));
    }

    return (
        <>
            {
                collected.isDragging ? (
                    <div ref={dragPreview} />
                ) : (
                    <div ref={drag} className={itemClass} title={project.name} aria-label={`Project ID: ${project.ID} in ${project.status} status`}>
                        <div className={"border border-secondary"}>
                            <div aria-label={`Project ID: ${project.ID} in ${project.status} status`} data-id={project.ID}>
                                <div className='text-truncate border-bottom border-secondary mb-1'>
                                    <Row className='mx-1'>
                                        <Col xs='1'></Col>
                                        <Col xs='10' id={`project_name_${projectName}`} className='text-truncate text-center'>                                            
                                            <h6 className='my-1'><b>
                                                    {projectName}
                                                    {
                                                        project.saving &&
                                                        (<>&nbsp;<Spinner animation="border" role="status" size='sm'>
                                                            <span className="visually-hidden">Loading...</span>
                                                        </Spinner></>)
                                                    }
                                                </b></h6>
                                        </Col>
                                        <Col xs='1'><Button variant='link' title='View Project Details' onClick={() => openPreviewAsync(project)} className='py-0'><Icon.ListColumns /></Button></Col>
                                    </Row>
                                </div>

                                <div className='project-content mx-2' role="button" onClick={handleClickOffCanvas} onKeyDown={handleKeyOffCanvas} tabIndex={0}>
                                    {cardBody}

                                    {showMilestones && milestonePreview}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}

ProjectCard.propTypes = {
    clsName: PropTypes.string.isRequired,
    project: PropTypes.object.isRequired,
    status: PropTypes.object.isRequired,
    stage: PropTypes.object
}

export default ProjectCard;
