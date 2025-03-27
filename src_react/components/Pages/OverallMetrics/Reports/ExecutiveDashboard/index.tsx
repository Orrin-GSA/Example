// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useMemo, useContext, createContext } from 'react';
import { useSelector } from 'react-redux';
import { Form, Col, Row, Table, Container, Card } from 'react-bootstrap';
import { isInFiscalYear } from '../../ChartUtil';
import { MetricsContext } from '../..';
import { statusMapping } from '../../../../../../src_shared/AppConstants';
import { selectApiEnhancements, selectApiProjects } from '../../../../util/ApiDataSlice';
import { to } from '../../../../../../src_shared/TypeUtils';
import AutomationsDelivered from './AutomationsDelivered';
import AutomationsUnderDiscoveryAndDevelopment from './AutomationsDiscoveryAndDev';
import AutomationsUnderEval from './AuotmationsUnderEval';
import AutomationsOnHold from './AutomationsOnHold';
import NewAutomationsByOffice from './NewAutomationsByOffice';
import TotalHoursByOffice from './TotalHoursByOffice';
import EnhancementAutomationsDelivered from './EnhancementAutomationsDelivered';
import { getProjectType, toDateTime } from '../../../../util/DataUtil';
import { MetricsProjectProcessed } from '../../../../util/RpaUtils';

// The naming on these could be better.
type CalcTotalsType = { projects: MetricsProjectProcessed[]; hoursReplaced: number; hoursAdded: number; }
type CalcStatsType = { total: number, online: CalcTotalsType; offline: CalcTotalsType; }
export type CalcDeliveredObjType = { stats: CalcStatsType };

type OfficeTotalsType = { id: string, name: string, count: number, totalHours: number } & Record<string, { count: number, totalHours: number }>;
type OfficesTotalsType = Record<string, OfficeTotalsType>
type ClientsTotalsType = { clients: OfficeTotalsType[], count: number, totalHours: number } & Record<string, { count: number, totalHours: number }>;

const fiscalYears = [];
(() => {
    const today = new Date();
    let year = today.getFullYear();
    const month = today.getMonth();

    if (month > 8) {
        year += 1;
    }

    for (let i = 0; i < 5; i++) {
        fiscalYears.push(year - i);
    }
})();

// const subReports = [
//     ({ title: 'New Automation Projects Delivered' + (fyStr && (' - ' + fyStr)), html: <AutomationsDelivered useRpa={true}  /> }),
//     ({ title: 'Automations Delivered (Non RPA)' + (fyStr && (' - ' + fyStr)), html: <AutomationsDelivered useRpa={false} /> }),
//     ({ title: 'Enhancement Automations Delivered', html: <EnhancementAutomationsDelivered /> }),
//     ({ title: 'Automations Under Evaluation', html: <AutomationsUnderEval /> }),
//     ({ title: 'Automations Under Discovery and Development', html: <AutomationsUnderDiscoveryAndDevelopment /> }),
//     ({ title: 'Automations ON HOLD', html: <AutomationsOnHold /> }),
//     ({ title: 'New Automations Counts By Office', html: <NewAutomationsByOffice /> }),
//     ({ title: 'Total Hours By Office', html: <TotalHoursByOffice /> })
// ];

const newStats = () => ({
    total: 0,
    online: newTotals(),
    offline: newTotals()
});

const newTotals = (): CalcTotalsType => ({
    projects: [],
    hoursReplaced: 0,
    hoursAdded: 0
});

const newDelivered = (): CalcDeliveredObjType => ({
    stats: newStats()
})

const updateTotals = (stats: CalcTotalsType, project: MetricsProjectProcessed) => {
    stats.projects.push(project);
    if(project.hours_added) {
        stats.hoursAdded += project.hours_added;
    }
    if(project.hours_saved) {
        stats.hoursReplaced += project.hours_saved;
    }
}

const updateOfficeTotals = (clientsTotals, officeTotals: OfficeTotalsType, statusId: string, project: AllProjectProccessed) => {
    let totalHours = 0;
    
    if(project.hours_added) {
        totalHours += project.hours_added;
    }
    if(project.hours_saved) {
        totalHours += project.hours_saved
    }

    // Update total of specific status
    officeTotals[statusId].totalHours += totalHours;
    officeTotals[statusId].count += 1;

    clientsTotals[statusId].totalHours += totalHours;
    clientsTotals[statusId].count += 1;

    // Update total of sum of (listed) statuses
    officeTotals.totalHours += totalHours;
    officeTotals.count += 1;

    // calculate grand total.
    clientsTotals.totalHours += totalHours;
    clientsTotals.count += 1;
}

const updateDelivered = (delivered: CalcDeliveredObjType, project: MetricsProjectProcessed) => {
    const group = delivered.stats;

    let stats: CalcTotalsType;
    if (project.online_offline === 'ONLINE') {
        stats = group.online;
    }
    else {
        stats = group.offline;
    }
    group.total += 1;

    updateTotals(stats, project);
}

export const ExecutiveDashboardContext = createContext({
    evalProjects: null as CalcTotalsType,
    devProjects: null as CalcTotalsType,
    onHoldProjects: null as CalcTotalsType,
    deliveredGroups: null as CalcDeliveredObjType,
    clientsTotals: null as ClientsTotalsType,
    projectEnhCount: null as Map<string, number>,
    deliveredEnh: null as CalcDeliveredObjType,
    deliveredScr: null as CalcDeliveredObjType,
    deliveredBug: null as CalcDeliveredObjType,
});

// NOTES: Are there any cutoffs for these metrics? Are the different groups simply by status, or do some factor in dev_stage?
function ExecutiveDashboard() {
    const { officeMapping, formattedProjects } = useContext(MetricsContext);
    const [reportIdx, setReport] = useState(-1);
    // Unused for now
    const [fiscalYear, setFiscalYear] = useState(-1);//useStorageState.asInt('fiscalYear', fiscalYears[0]);
    const showAllYears = useMemo(() => {
        return fiscalYear === -1;
    }, [fiscalYear]);

    const fiscalYearStr = useMemo(() => {
        return fiscalYear >= 0 ? "FY" + fiscalYear.toString().substring(2) : '';
    }, [fiscalYear]);

    // Since this is pure stats, this page should only use the raw rpaProjects (perhaps filtered by fiscal year?)
    const [evalProjects, devProjects, onHoldProjects, clientsTotals, projectEnhCount, deliveredGroups, deliveredEnh, deliveredScr, deliveredBug] = useMemo(() => {
        const clientsTotals = {
            count: 0,
            totalHours: 0,
            clients: [],
            [statusMapping.InProduction.id]: {
                count: 0,
                totalHours: 0
            },
            [statusMapping.UnderEvaluation.id]: {
                count: 0,
                totalHours: 0
            },
            [statusMapping.InDevelopment.id]: {
                count: 0,
                totalHours: 0
            },
            [statusMapping.OnHold.id]: {
                count: 0,
                totalHours: 0
            },
        } as ClientsTotalsType;

        const clientsMapping = {

        } as OfficesTotalsType;

        const projectEnhCount = new Map<string, number>();

        for (const officeMap of officeMapping) {
            // officeMap[0] = office_id (OFF_001)
            // officeMap[1] = office name (FAS)

            //@ts-expect-error Hack 
            clientsMapping[officeMap[1]] = {
                id: officeMap[0],
                name: officeMap[1],
                [statusMapping.InProduction.id]: {
                    count: 0,
                    totalHours: 0
                },
                [statusMapping.UnderEvaluation.id]: {
                    count: 0,
                    totalHours: 0
                },
                [statusMapping.InDevelopment.id]: {
                    count: 0,
                    totalHours: 0
                },
                [statusMapping.OnHold.id]: {
                    count: 0,
                    totalHours: 0
                },
                count: 0,
                totalHours: 0
            }
        }

        const evalTotals = newTotals();
        const devsTotal = newTotals();
        const holdTotals = newTotals();

        const delivered = newDelivered();
        const deliveredEnh = newDelivered();
        const deliveredScr = newDelivered();
        const deliveredBug = newDelivered();

        for(const project of formattedProjects) {
            const type = getProjectType(project.ID);
            // NOTE: Bugs is a standout in that it isn't a "new" automation, nor does have any improvements to hours saved. Not sure if Overall Metrics should include bugs at all.
            if(!type || type === 'Bug') {
                continue;
            }

            if(type === 'Enhancement') {                
                if(!projectEnhCount.has(project.project_id)) {
                    projectEnhCount.set(project.project_id, 1);
                }
                else {
                    const enhCount = projectEnhCount.get(project.project_id);
                    projectEnhCount.set(project.project_id, enhCount + 1);
                }
            }

            const officeName = officeMapping.get(project.office_id);
            const officeTotals = officeName && clientsMapping[officeName];
            if (!officeTotals) {
                // Not required, but we still wanna note it.
                console.warn('No matching Office ID found for: ' + project.ID + ", " + project.office_id);
            }
            
            if (project.status === statusMapping.InProduction.id) {
                const liveDate = toDateTime(project.live_date);
                if((showAllYears || isInFiscalYear(fiscalYear, liveDate))) {
                    const deliveredType = type === 'RPA' ? delivered : type === 'Enhancement' ? deliveredEnh : type === 'Script' ? deliveredScr : type === 'Bug' ? deliveredBug : null;
                    updateDelivered(deliveredType, project);
                }
                if(officeTotals) {
                    updateOfficeTotals(clientsTotals, officeTotals, statusMapping.InProduction.id, project);
                }
            }
            else if (project.status === statusMapping.UnderEvaluation.id) {
                updateTotals(evalTotals, project);
                if(officeTotals) {
                    updateOfficeTotals(clientsTotals, officeTotals, statusMapping.UnderEvaluation.id, project);
                }
            }
            else if (project.status === statusMapping.OnHold.id) {
                updateTotals(holdTotals, project);
                if(officeTotals) {
                    updateOfficeTotals(clientsTotals, officeTotals, statusMapping.OnHold.id, project);
                }
            }
            else if (project.status === statusMapping.InDevelopment.id) {
                updateTotals(devsTotal, project);
                if(officeTotals) {
                    updateOfficeTotals(clientsTotals, officeTotals, statusMapping.InDevelopment.id, project);
                }
            }
        }

        clientsTotals.clients = Object.values(clientsMapping);

        return [evalTotals, devsTotal, holdTotals, clientsTotals, projectEnhCount, delivered, deliveredEnh, deliveredScr, deliveredBug];
    }, [formattedProjects, officeMapping, showAllYears, fiscalYear]);

    const subReports = useMemo(() => {
        return [
            ({ title: 'New Automation Projects Delivered' + (fiscalYearStr && (' - ' + fiscalYearStr)), html: <AutomationsDelivered title='New Automation Projects Delivered' delivered={deliveredGroups} fiscalYearStr={fiscalYearStr}  /> }),
            ({ title: 'Automations Delivered (Non RPA)' + (fiscalYearStr && (' - ' + fiscalYearStr)), html: <AutomationsDelivered title='Automations Delivered (Non RPA)' delivered={deliveredScr} fiscalYearStr={fiscalYearStr} /> }),
            ({ title: 'Enhancement Automations Delivered' + (fiscalYearStr && (' - ' + fiscalYearStr)), html: <EnhancementAutomationsDelivered fiscalYearStr={fiscalYearStr} /> }),
            ({ title: 'Automations Under Evaluation', html: <AutomationsUnderEval /> }),
            ({ title: 'Automations Under Discovery and Development', html: <AutomationsUnderDiscoveryAndDevelopment /> }),
            ({ title: 'Automations ON HOLD', html: <AutomationsOnHold /> }),
            ({ title: 'New Automations Counts By Office', html: <NewAutomationsByOffice /> }),
            ({ title: 'Total Hours By Office', html: <TotalHoursByOffice /> })
        ];
    }, [fiscalYearStr, deliveredGroups, deliveredScr]);

    return (<ExecutiveDashboardContext.Provider value={{ evalProjects, devProjects, onHoldProjects, clientsTotals, projectEnhCount, deliveredGroups, deliveredEnh, deliveredScr, deliveredBug }}>
        <Row className='mb-3'>
            <Col></Col>
            <Col lg={4}>
                <Form.Select aria-label="Show Report" title='Show Report' value={reportIdx} onChange={(e) => setReport(to.int(e.target.value))}>
                    <option value={-1}>Show All Reports</option>
                    {subReports.map((x, idx) => <option key={idx} value={idx}>{x.title}</option>)}
                </Form.Select>

                {/* <Form.Check // prettier-ignore
                    defaultChecked={showAllYears}
                    onChange={(e) => {
                        setShowAllYears(e.target.checked);
                    }}
                    id='exec-fiscal-year-only'
                    label="Show All Years"
                /> */}
            </Col>
            <Col lg={2}>
                <Form.Select
                    //className={ showAllYears ? 'invisible' : 'visible' }
                    defaultValue={fiscalYear}
                    aria-label="Fiscal Year to view."
                    onChange={(e) => {
                        setFiscalYear(to.int(e.target.value));
                    }} 
                    >
                    <option value={-1}>Show All Years</option>
                    {fiscalYears.map(x => <option key={x} value={x}>{x}</option>)}
                </Form.Select>
            </Col>
            <Col></Col>
        </Row>

        <Row>
            <Col lg={8}>
                <Table borderless className='text-center align-middle'>
                    <thead>
                        <tr>
                            <th colSpan={1} style={{ width: '20%' }}></th>
                            <th colSpan={3} style={{ width: '40%' }} className='exec-background exec-border'>New RPA Delivered {showAllYears ? '' : ' - ' + fiscalYearStr}</th>
                            <th colSpan={3} style={{ width: '40%' }} className='exec-background exec-border'>Automations Delivered (Non RPA) {showAllYears ? '' : ' - ' + fiscalYearStr}</th>
                        </tr>
                        <tr>
                            <th colSpan={1}></th>
                            <th colSpan={1} className='exec-background exec-border-left'>Total</th>
                            <th colSpan={1} className='exec-background'>Online</th>
                            <th colSpan={1} className='exec-background exec-border-right'>Offline</th>
                            <th colSpan={1} className='exec-background'>Total</th>
                            <th colSpan={1} className='exec-background'>Online</th>
                            <th colSpan={1} className='exec-background exec-border-right'>Offline</th>
                        </tr>
                    </thead>
                    <tbody className='exec-border'>
                        <tr>
                            {/* RPA */}
                            <th className='text-end exec-background exec-border-right'>Total Delivered</th>
                            <td className='exec-border'>{deliveredGroups.stats.total.toLocaleString()}</td>
                            <td className='exec-border'>{deliveredGroups.stats.online.projects.length.toLocaleString()}</td>
                            <td className='exec-border'>{deliveredGroups.stats.offline.projects.length.toLocaleString()}</td>

                            {/* Non RPA */}
                            <td className='exec-border'>{deliveredScr.stats.total.toLocaleString()}</td>
                            <td className='exec-border'>{deliveredScr.stats.online.projects.length.toLocaleString()}</td>
                            <td className='exec-border'>{deliveredScr.stats.offline.projects.length.toLocaleString()}</td>
                        </tr>
                        <tr>
                            {/* RPA */}
                            <th className='text-end exec-background exec-border-right'>Total Hours Replaced</th>
                            <td className='exec-border'>{(deliveredGroups.stats.online.hoursReplaced + deliveredGroups.stats.offline.hoursReplaced).toLocaleString()}</td>
                            <td className='exec-border'>{deliveredGroups.stats.online.hoursReplaced.toLocaleString()}</td>
                            <td className='exec-border'>{deliveredGroups.stats.offline.hoursReplaced.toLocaleString()}</td>

                            {/* Non RPA */}
                            <td className='exec-border'>{(deliveredScr.stats.online.hoursReplaced + deliveredScr.stats.offline.hoursReplaced).toLocaleString()}</td>
                            <td className='exec-border'>{deliveredScr.stats.online.hoursReplaced.toLocaleString()}</td>
                            <td className='exec-border'>{deliveredScr.stats.offline.hoursReplaced.toLocaleString()}</td>
                        </tr>
                        <tr>
                            {/* RPA */}
                            <th className='text-end exec-background exec-border-right'>Total Hours Added</th>
                            <td className='exec-border'>{(deliveredGroups.stats.online.hoursAdded + deliveredGroups.stats.offline.hoursAdded).toLocaleString()}</td>
                            <td className='exec-border'>{deliveredGroups.stats.online.hoursAdded.toLocaleString()}</td>
                            <td className='exec-border'>{deliveredGroups.stats.offline.hoursAdded.toLocaleString()}</td>

                            {/* Non RPA */}
                            <td className='exec-border'>{(deliveredScr.stats.online.hoursAdded + deliveredScr.stats.offline.hoursAdded).toLocaleString()}</td>
                            <td className='exec-border'>{deliveredScr.stats.online.hoursAdded.toLocaleString()}</td>
                            <td className='exec-border'>{deliveredScr.stats.offline.hoursAdded.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </Table>
            </Col>
            <Col lg={4}>
                <Table borderless className='text-center align-middle'>
                    <thead>
                        <tr>
                            <th colSpan={1}></th>
                            <th colSpan={3} className='exec-background exec-border'>Automations Projects in Pipeline Currently</th>
                        </tr>
                        <tr>
                            <th colSpan={1}></th>
                            <th colSpan={1} className='exec-background exec-border-left'>Total Count</th>
                            <th colSpan={1} className='exec-background'>Hours Replaced</th>
                            <th colSpan={1} className='exec-background exec-border-right'>Added Capacity</th>
                        </tr>
                    </thead>
                    <tbody className='exec-border'>
                        <tr>
                            <th className='text-end exec-background exec-border-right'>Automations Under Evaluation</th>
                            <td className='exec-border'>{evalProjects.projects.length.toLocaleString()}</td>
                            <td className='exec-border'>{evalProjects.hoursReplaced.toLocaleString()}</td>
                            <td className='exec-border'>{evalProjects.hoursAdded.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <th className='text-end exec-background exec-border-right'>Automations In Development</th>
                            <td className='exec-border'>{devProjects.projects.length.toLocaleString()}</td>
                            <td className='exec-border'>{devProjects.hoursReplaced.toLocaleString()}</td>
                            <td className='exec-border'>{devProjects.hoursAdded.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <th className='text-end exec-background exec-border-right'>Automations On Hold</th>
                            <td className='exec-border'>{onHoldProjects.projects.length.toLocaleString()}</td>
                            <td className='exec-border'>{onHoldProjects.hoursReplaced.toLocaleString()}</td>
                            <td className='exec-border'>{onHoldProjects.hoursAdded.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </Table>
            </Col>
        </Row>
        <Container fluid>            
            <Card style={{ padding: '16px' }}>
                {reportIdx === -1 &&
                    subReports.map((x, idx) => <div key={idx}>{x.html}<hr /></div>)
                }
                {reportIdx > -1 && subReports[reportIdx].html}
            </Card>
        </Container>
    </ExecutiveDashboardContext.Provider>);
}

export default ExecutiveDashboard;