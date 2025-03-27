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

function UnderEvalCardBody({ project }: Props) {
    assert.object(project);

    const priorityType = useMemo(() => {
        const priorityId = project.priority;
        let priority: PriorityType;
        if(!priorityId) {
            priority = priorityMapping.Medium;
        }
        else {
            priority = priorityMapping[priorityId] ?? priorityMapping.Medium;
        }

        return priority;
    }, [project]);

    return (
        <div className='project-title'>
            <h6 className="card-title" id={`project_id_${project.ID}`}>ID: {project.ID}</h6>
            <h6 className="card-title">Priority: {priorityType.title}</h6>
        </div>
    );
}

UnderEvalCardBody.propTypes = {
    project: PropTypes.object.isRequired
}

export default UnderEvalCardBody;
