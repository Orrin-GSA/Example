import React, { useContext, useMemo } from 'react';
import { Spinner, Row, Col, Button } from 'react-bootstrap';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import * as Icon from 'react-bootstrap-icons';
import { assert, is } from '../../../../../src_shared/TypeUtils';
import { priorityMapping, PriorityType } from '../../../../../src_shared/AppConstants';

type Props = {
    project: ProjectCommonProcessed
}

/**
 * 
 * @param {string?} inputDate 
 * @returns 
 */
function usDateFormat(inputDate) {
    if (!inputDate) {
        return "";
    }
    const date = inputDate.includes('/') ? DateTime.fromFormat(inputDate, 'D') : DateTime.fromISO(inputDate);
    if (!date.isValid) {
        return "invalid date";
    }
    return date.toLocaleString(DateTime.DATE_SHORT);
}

function InProductionCardBody({ project }: Props) {
    assert.object(project);

    return (
        <div className='project-title'>
            <h6 className="card-title" id={`project_id_${project.ID}`}>ID: {project.ID}</h6>
            <h6 className="card-title">{project.live_date ? 'Live Date: ' + usDateFormat(project.live_date) : ''}</h6>
        </div>
    );
}

InProductionCardBody.propTypes = {
    project: PropTypes.object.isRequired
}

export default InProductionCardBody;
