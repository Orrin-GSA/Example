// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useContext } from 'react';
import { Button, Table } from 'react-bootstrap';
import { ExecutiveDashboardContext } from '.';
import { openPreviewAsync } from '../../../../shared/ProjectPreviewModal';
import { toIsoDateStr } from '../../../../util/DataUtil';


function AutomationsOnHold() {
    const { onHoldProjects } = useContext(ExecutiveDashboardContext);

    return (<>
    <Table bordered className='align-middle'>
        <thead className='exec-border'>
            <tr>
                <th colSpan={12} className='text-center exec-background-angry exec-title'>
                   Automations ON HOLD
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
                <th className='exec-background-calm text-center'>Reason for Hold/Denial</th>
                <th className='exec-background-calm text-center'>Client</th>
                <th className='exec-background-calm text-center'>Process Owner(s)</th>
                <th className='exec-background-calm text-center'>Developer(s)</th>
                <th className='exec-background-calm text-center'>On Hold Date</th>
            </tr>
        </thead>
            <tbody className='exec-report-scroll'>
                {onHoldProjects.projects.map(project => {
                    return <tr key={project.ID}>
                        <td><Button variant="link" size='sm' onClick={() => openPreviewAsync(project as any)}>{project.name}</Button></td>
                        <td className='text-end'>{project.hours_saved}</td>
                        <td className='text-end'>{project.hours_added}</td>
                        <td className='text-end'>{project.total_hours}</td>
                        <td>{project.attended_unattended}</td>
                        <td>{project.additional_benefits}</td>
                        <td className='text-center'>{(project.ID.startsWith('RPA') || project.ID.startsWith('SCR')) ? 'New' : 'Update'}</td>
                        <td>{project.status_reason}</td>
                        <td>{project.office}</td>
                        <td>{project.process_owners}</td>
                        <td>{project.poa_users}</td>
                        <td className='text-center'>{toIsoDateStr(project.status_date)}</td>
                    </tr>
                })}
        </tbody>
    </Table></>);
}

export default AutomationsOnHold;