// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useContext } from 'react';
import { Col, Row, Table } from 'react-bootstrap';
import { ExecutiveDashboardContext } from '.';
import { statusMapping } from '../../../../../../src_shared/AppConstants';

function NewAutomationsByOffice() {
    const { clientsTotals } = useContext(ExecutiveDashboardContext);

    return (<>
        <Row>
            <Col xs='12' lg='4'></Col>
            <Col xs='12' lg='4'>
                <Table bordered className='align-middle'>
                    <thead className='exec-border'>
                        <tr>
                            <th colSpan={6} className='text-center exec-background exec-title'>
                                New Automations Counts By Office
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
                                <td className='text-end'>{office[statusMapping.InProduction.id].count}</td>
                                <td className='text-end'>{office[statusMapping.UnderEvaluation.id].count}</td>
                                <td className='text-end'>{office[statusMapping.InDevelopment.id].count}</td>
                                <td className='text-end'>{office[statusMapping.OnHold.id].count}</td>
                                <th className='text-end exec-background-bleak'>{office.count}</th>
                            </tr>
                        })}
                        <tr>
                            <th className='text-center exec-border exec-background-calm'>Grand Total</th>
                            <th className='text-end exec-background-bleak'>{clientsTotals[statusMapping.InProduction.id].count.toLocaleString()}</th>
                            <th className='text-end exec-background-bleak'>{clientsTotals[statusMapping.UnderEvaluation.id].count.toLocaleString()}</th>
                            <th className='text-end exec-background-bleak'>{clientsTotals[statusMapping.InDevelopment.id].count.toLocaleString()}</th>
                            <th className='text-end exec-background-bleak'>{clientsTotals[statusMapping.OnHold.id].count.toLocaleString()}</th>
                            <th className='text-end exec-background-bleak'>{clientsTotals.count.toLocaleString()}</th>
                        </tr>
                    </tbody>
                </Table>
            </Col>
            <Col xs='12' lg='4'></Col>
        </Row>
    </>);
}

export default NewAutomationsByOffice;