// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useContext } from 'react';
import { Button, Table } from 'react-bootstrap';
import { ExecutiveDashboardContext } from '.';
import { openPreviewAsync } from '../../../../shared/ProjectPreviewModal';

function AutomationsUnderEval() {
    const { evalProjects } = useContext(ExecutiveDashboardContext);

    return (<>
        <Table bordered className='align-middle'>
            <thead className='exec-border'>
                <tr>
                    <th colSpan={12} className='text-center exec-background exec-title'>
                        Automations Under Evaluation
                    </th>
                </tr>
                <tr>
                    <th className='exec-background-calm text-center'>Automation Name</th>
                    <th className='exec-background-calm text-center'>Annual Hours Replaced</th>
                    <th className='exec-background-calm text-center'>Annual Hours Added Capacity</th>
                    <th className='exec-background-calm text-center'>Total Hours</th>
                    <th className='exec-background-calm text-center'>Attended/Unattended</th>
                    <th className='exec-background-calm text-center'>Additional Benefits</th>
                    <th className='exec-background-calm text-center'>New/Update</th>
                    {/* <th className='exec-background-calm text-center'>Target Assessment Approval Date</th> */}
                    <th className='exec-background-calm text-center'>Client</th>
                    <th className='exec-background-calm text-center'>Process Owner(s)</th>
                    {/* <th className='exec-background-calm text-center'>Lead Assessment POC</th>
                    <th className='exec-background-calm text-center'>Assessment Approval Date</th> */}
                </tr>
            </thead>
            <tbody className='exec-report-scroll'>
                {evalProjects.projects.map(project => {
                    return <tr key={project.ID}>
                        <td><Button variant="link" size='sm' onClick={() => openPreviewAsync(project as any)}>{project.name}</Button></td>
                        <td className='text-end'>{project.hours_saved}</td>
                        <td className='text-end'>{project.hours_added}</td>
                        <td className='text-end'>{project.total_hours}</td>
                        <td>{project.attended_unattended}</td>
                        <td>{project.additional_benefits}</td>                        
                        <td className='text-center'>{(project.ID.startsWith('RPA') || project.ID.startsWith('SCR')) ? 'New' : 'Update'}</td>
                        {/* <td>This is pulled from the Assessments table/sheet </td> */}
                        <td>{project.office}</td>
                        <td>{project.process_owners}</td>
                        {/* <td>This is pulled from the Assessments table/sheet</td> */}
                        {/* <td>This is pulled from the Assessments table/sheet</td> */}
                    </tr>
                })}
            </tbody>
        </Table>
    </>);
}

export default AutomationsUnderEval;