// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useMemo, useContext } from 'react';
import { Button, Table } from 'react-bootstrap';
import { ExecutiveDashboardContext } from '.';
import { openPreviewAsync } from '../../../../shared/ProjectPreviewModal';
import { toIsoDateStr } from '../../../../util/DataUtil';

type Props = {
    fiscalYearStr: string    
}

function EnhancementAutomationsDelivered({ fiscalYearStr }: Props) {
    const { deliveredEnh } = useContext(ExecutiveDashboardContext);

    const projects = useMemo(() => {
        const group = deliveredEnh.stats;
        return group.online.projects.concat(group.offline.projects);
    }, [deliveredEnh]);

    return (<>
    <Table bordered className='align-middle'>
        <thead className='exec-border'>
            <tr>
                <th colSpan={12} className='text-center exec-background exec-title'>
                    Enhancement Automations Delivered {fiscalYearStr && (' - ' + fiscalYearStr)}
                </th>
            </tr>
            <tr>
                <th className='exec-background-calm text-center'>Automation Name</th>
                <th className='exec-background-calm text-center'>Annual Hours Replaced</th>
                <th className='exec-background-calm text-center'>Annual Hours Added Capacity</th>
                <th className='exec-background-calm text-center'>Total Hours</th>
                <th className='exec-background-calm text-center'>Attended/Unattended</th>
                <th className='exec-background-calm text-center'>Additional Benefits</th>
                <th className='exec-background-calm text-center'>Online/Offline</th>
                <th className='exec-background-calm text-center'>Client</th>
                <th className='exec-background-calm text-center'>Process Owner(s)</th>
                <th className='exec-background-calm text-center'>Developer(s)</th>
                <th className='exec-background-calm text-center'>Delivered Month</th>
            </tr>
        </thead>
            <tbody className='exec-report-scroll'>
                {projects.map(project => {
                    return <tr key={project.ID}>
                        <td><Button variant="link" size='sm' onClick={() => openPreviewAsync(project as any)}>{project.name}</Button></td>
                        <td className='text-end'>{project.hours_saved}</td>
                        <td className='text-end'>{project.hours_added}</td>
                        <td className='text-end'>{project.hours_saved + project.hours_added}</td>
                        <td>{project.attended_unattended}</td>
                        <td>{project.additional_benefits}</td>
                        <td>{project.online_offline}</td>
                        <td>{project.office}</td>
                        <td>{project.process_owners}</td>
                        <td>{project.poa_users}</td>
                        <td className='text-center'>{toIsoDateStr(project.live_date)}</td>
                    </tr>
                })}
        </tbody>
    </Table></>);
}

export default EnhancementAutomationsDelivered;