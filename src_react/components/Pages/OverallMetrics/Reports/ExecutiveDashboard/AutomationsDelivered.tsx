// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useMemo, useContext } from 'react';
import { Button, Table } from 'react-bootstrap';
import { CalcDeliveredObjType, ExecutiveDashboardContext } from '.';
import { openPreviewAsync } from '../../../../shared/ProjectPreviewModal';
import { toIsoDateStr } from '../../../../util/DataUtil';
import { AppContext } from '../../../../../App';
import { arrayUtils } from '../../../../../../src_shared/TypeUtils';

type Props = {
    delivered: CalcDeliveredObjType,
    title: string,
    fiscalYearStr: string
}

function AutomationsDelivered({ delivered, title, fiscalYearStr }: Props) {
    const { projectEnhCount } = useContext(ExecutiveDashboardContext);
    const { poaMapping, employeeMapping } = useContext(AppContext);

    const projects = useMemo(() => {
        const group = delivered.stats;
        return group.online.projects.concat(group.offline.projects);
    }, [delivered]);


    return (<>
    <Table bordered className='align-middle'>
        <thead className='exec-border'>
            <tr>
                <th colSpan={12} className='text-center exec-background exec-title'>
                   {title} {fiscalYearStr && (' - ' + fiscalYearStr)}
                </th>
            </tr>
            <tr>
                <th className='exec-background-calm text-center'>Automation Name</th>
                <th className='exec-background-calm text-center'>Annual Hours Replaced</th>
                <th className='exec-background-calm text-center'>Annual Hours Added Capacity</th>
                <th className='exec-background-calm text-center'>Total Hours</th>
                <th className='exec-background-calm text-center'>Attended/Unattended</th>
                <th className='exec-background-calm text-center'>Additional Benefits</th>
                <th className='exec-background-calm text-center'>Expansion/Enhancement Count</th>
                <th className='exec-background-calm text-center'>Online/Offline</th>
                <th className='exec-background-calm text-center'>Client</th>
                <th className='exec-background-calm text-center'>Process Owner(s)</th>
                <th className='exec-background-calm text-center'>Developer(s)</th>
                <th className='exec-background-calm text-center'>Delivered Month</th>
            </tr>
        </thead>
            <tbody className='exec-report-scroll'>
                {projects.map(project => {

                    const processOwners = arrayUtils.mapFilter(project.process_owner_ids?.split(',') ?? [], x => employeeMapping.get(x)?.email, x => !!x);
                    const developers = arrayUtils.mapFilter(project.dev_id?.split(',') ?? [], x => poaMapping.get(x)?.email, x => !!x);

                    return <tr key={project.ID}>
                        <td><Button variant="link" size='sm' onClick={() => openPreviewAsync(project as any)}>{project.name}</Button></td>
                        <td className='text-end'>{project.hours_saved}</td>
                        <td className='text-end'>{project.hours_added}</td>
                        <td className='text-end'>{project.total_hours}</td>
                        <td>{project.attended_unattended}</td>
                        <td>{project.additional_benefits}</td>
                        <td className='text-end'>{projectEnhCount.get(project.ID) ?? 0}</td>
                        <td>{project.online_offline}</td>
                        <td>{project.office}</td>
                        <td>{processOwners.join(', ')}</td>
                        <td>{developers.join(', ')}</td>
                        <td className='text-center'>{toIsoDateStr(project.live_date)}</td>
                    </tr>
                })}
        </tbody>
    </Table></>);
}

export default AutomationsDelivered;