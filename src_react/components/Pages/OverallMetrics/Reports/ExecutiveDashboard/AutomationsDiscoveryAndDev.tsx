// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useMemo, useContext } from 'react';
import { Button, Table } from 'react-bootstrap';
import { ExecutiveDashboardContext } from '.';
import { is, to } from '../../../../../../src_shared/TypeUtils';
import { openPreviewAsync } from '../../../../shared/ProjectPreviewModal';
import { toIsoDateStr } from '../../../../util/DataUtil';

function AutomationsUnderDiscoveryAndDevelopment() {
    const { devProjects } = useContext(ExecutiveDashboardContext);

    const processDevProjects = useMemo(() => {
        const today = new Date();
        return devProjects.projects.map(project => {            
            let days: number | '' = '';
            if(!project.est_delivery_date || !is.stringDate(project.est_delivery_date)) {
                days = '';
            }
            else {
                const estDeliveryDate = to.date(project.est_delivery_date);
                const diff = estDeliveryDate.getTime() - today.getTime();
                days = Math.round(diff / (1000 * 3600 * 24))
            }

            return { project: project, daysToDelivery: days };
        });
    }, [devProjects]);

    return (<>
        <Table bordered className='align-middle'>
            <thead className='exec-border'>
                <tr>
                    <th colSpan={16} className='text-center exec-background exec-title'>
                        Automations Under Discovery and Development
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
                    <th className='exec-background-calm text-center'>Expected Delivery</th>
                    <th className='exec-background-calm text-center'>Client</th>
                    <th className='exec-background-calm text-center'>Process Owner(s)</th>
                    <th className='exec-background-calm text-center'>Project Coordinator</th>
                    <th className='exec-background-calm text-center'>Developer(s)</th>
                    <th className='exec-background-calm text-center'>Development Start Date</th>
                    <th className='exec-background-calm text-center'>Days to Expected Delivery Date</th>
                </tr>
            </thead>
            <tbody className='exec-report-scroll'>
                {processDevProjects.map(processed => {
                    return <tr key={processed.project.ID}>
                        <td><Button variant="link" size='sm' onClick={() => openPreviewAsync(processed.project as any)}>{processed.project.name}</Button></td>
                        <td className='text-end'>{processed.project.hours_saved}</td>
                        <td className='text-end'>{processed.project.hours_added}</td>
                        <td className='text-end'>{processed.project.total_hours}</td>
                        <td>{processed.project.attended_unattended}</td>
                        <td>{processed.project.additional_benefits}</td>
                        <td className='text-center'>{(processed.project.ID.startsWith('RPA') || processed.project.ID.startsWith('SCR')) ? 'New' : 'Update'}</td>
                        <td className='text-center'>{toIsoDateStr(processed.project.est_delivery_date)}</td>
                        <td>{processed.project.office}</td>
                        <td>{processed.project.process_owners}</td>
                        <td>{processed.project.project_support_ids}</td>
                        <td>{processed.project.poa_users}</td>
                        <td className='text-center'>{toIsoDateStr(processed.project.start_date)}</td>
                        <td className='text-end'>{processed.daysToDelivery}</td>
                    </tr>
                })}
            </tbody>
        </Table>
    </>);
}

export default AutomationsUnderDiscoveryAndDevelopment;