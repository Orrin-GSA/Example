// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useContext } from 'react';
import { Col, Row, Table } from 'react-bootstrap';
import { ExecutiveDashboardContext } from '.';
import { statusMapping } from '../../../../../../src_shared/AppConstants';

function TotalHoursByOffice() {
    const { clientsTotals } = useContext(ExecutiveDashboardContext);
    
    return (<>
        <Row>
            <Col></Col>
            <Col>
                <Table bordered className='align-middle'>
                    <thead className='exec-border'>
                        <tr>
                            <th colSpan={6} className='text-center exec-background exec-title'>
                                Total Hours Replaced By Office
                            </th>
                        </tr>
                        <tr>
                            <th className='exec-background-calm text-center'>Client</th>
                            <th className='exec-background-calm text-center'>In Production</th>
                            <th className='exec-background-calm text-center'>Under Evaluation</th>
                            <th className='exec-background-calm text-center'>In Development</th>
                            <th className='exec-background-calm text-center'>On Hold</th>
                            <th className='exec-background-calm text-center'>Grand Total</th>
                        </tr>
                    </thead>
                    <tbody className='exec-report-scroll'>
                        {clientsTotals.clients.map(office => {
                            return <tr key={office.id}>
                                <th className='text-center exec-border exec-background-calm'>{office.name}</th>
                                <td className='text-end'>{office[statusMapping.InProduction.id].totalHours.toLocaleString()}</td>
                                <td className='text-end'>{office[statusMapping.UnderEvaluation.id].totalHours.toLocaleString()}</td>
                                <td className='text-end'>{office[statusMapping.InDevelopment.id].totalHours.toLocaleString()}</td>
                                <td className='text-end'>{office[statusMapping.OnHold.id].totalHours.toLocaleString()}</td>
                                <th className='text-end exec-background-bleak'>{office.totalHours.toLocaleString()}</th>
                            </tr>
                        })}
                        <tr>
                            <th className='text-center exec-border exec-background-calm'>Grand Total</th>
                            <th className='text-end exec-background-bleak'>{clientsTotals[statusMapping.InProduction.id].totalHours.toLocaleString()}</th>
                            <th className='text-end exec-background-bleak'>{clientsTotals[statusMapping.UnderEvaluation.id].totalHours.toLocaleString()}</th>
                            <th className='text-end exec-background-bleak'>{clientsTotals[statusMapping.InDevelopment.id].totalHours.toLocaleString()}</th>
                            <th className='text-end exec-background-bleak'>{clientsTotals[statusMapping.OnHold.id].totalHours.toLocaleString()}</th>
                            <th className='text-end exec-background-bleak'>{clientsTotals.totalHours.toLocaleString()}</th>
                        </tr>
                    </tbody>
                </Table>
            </Col>
            <Col></Col>
        </Row>
    </>);
}

export default TotalHoursByOffice;