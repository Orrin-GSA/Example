import React, { useContext, useMemo } from 'react';
import { Spinner, Row, Col, Button } from 'react-bootstrap';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import * as Icon from 'react-bootstrap-icons';
import { AutomationsContext } from '../Automations';
import { getMilestoneProgress, newMilestone } from '../../../util/RpaUtils';
import { assert, is } from '../../../../../src_shared/TypeUtils';
import { statusMapping } from '../../../../../src_shared/AppConstants';
import { convertStrToDate } from '../../../util/DataUtil';

/**
 * @param {Object} props
 * @param {RpaProjectProcessed} props.project
 * @param {import('../../../../../src_shared/AppConstants').StatusType} props.status Status the project is currently a part of.
 * @param {import('../../../../../src_shared/AppConstants').StageType?} props.stage Stage the project is currently a part of, if any.
*/
function ScriptMilestonePreview({ project, status, stage }) {
    const { setMilestoneModalShow, setCurrentProjectId, mappedMilestones } = useContext(AutomationsContext);

    /** @type {import('../../../../../src_shared/AppConstants').MilestoneProcessed} */
    const selectedMilestone = useMemo(() => {
        return mappedMilestones[project.ID] ?? newMilestone(project.ID);
    }, [project, mappedMilestones]);

    const isDevelopmentStatus = useMemo(() => {
        return status.id === statusMapping.InDevelopment.id;
    }, [status]);

    const badgeSddClass = (selectedMilestone?.dd_complete) ? 'milestone-done mx-2 px-2' : 'milestone mx-2 px-2';
    const badgeUatClass = (selectedMilestone?.uat_complete) ? 'milestone-done mx-2 px-2' : 'milestone mx-2 px-2';

    const trackerClass = isDevelopmentStatus ? 'dev-container-tracker-on' : 'dev-container-tracker-off';

    // Use to change the color of the progress bar to red if the ticket hasn't been modified in 14 days
    const progressBarClass = useMemo(() => {
        const lastModDate = project.last_modified_date != null ? convertStrToDate(project.last_modified_date) : new Date();
        const todayDate = new Date();
        const oneDay = 1000 * 60 * 60 * 24;

        const diffInDays = Math.round((todayDate.getTime() - lastModDate.getTime()) / oneDay);
        const barClass = (diffInDays > 14) ? "progress-bar-inactive " : "progress-bar-active ";

        return barClass + "progress-bar-striped progress-bar-animated";
    }, [project]);

    // TODO: I would love this to be cached (useMemo), but I'm not certain how dependencies on fields of objects works, and the dependency is going to vary because of different requirements...
    const progress = getMilestoneProgress(project, selectedMilestone);

    function handleClickEditMStones(event) {
        try {
            // Quick and dirty copy so we aren't editing redux slice data.
            setCurrentProjectId(project.ID);
            setMilestoneModalShow(true);
        } catch (error) {
            console.error("Error while parsing milestones:", error);
        }
        event.stopPropagation();
    };

    return <div className={trackerClass}>
        <div className='d-flex float-right my-1 milestones'>
            <div className={badgeSddClass} title='Script Design Document'>SDD</div>
            <div className={badgeUatClass} title='User Acceptance Test'>UAT</div>
        </div>
        <div className="progress-container">
            <div className="progress text-center">
                <div className={progressBarClass} role="progressbar" title="Milestone Progress Bar" aria-valuenow={progress}
                    aria-valuemin="0" aria-valuemax="100" style={{ width: `${progress}%` }}>
                    {!!progress &&
                        <b className='mx-2'>{progress}%</b>
                    }
                </div>
                {/* The width is 0% when progress is 0 and causes each character to be a newline, so we just put the number outside if that's the case. */}
                {!progress &&
                    <b className='mx-2'>0%</b>
                }
            </div>
            <button title='Click to Edit Milestones' aria-label={`Click to Edit Milestones for ${project.name}`} className='milestone-edit' onClick={handleClickEditMStones} >
                <i className="bi bi-pencil-square" style={{ width: "16", height: "16" }}></i>
            </button>
        </div>
    </div>
}

ScriptMilestonePreview.propTypes = {
    project: PropTypes.object.isRequired,
    status: PropTypes.object.isRequired,
    stage: PropTypes.object
}

export default ScriptMilestonePreview;