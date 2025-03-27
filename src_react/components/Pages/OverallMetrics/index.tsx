import React, { useState, useMemo, useEffect, useContext, createContext } from 'react';
import { Toaster } from 'react-hot-toast';
import { Form, Button, Col, Row, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import MonthlySubmissionBreakdown from './Reports/MonthlySubmissionBreakdown';
import SubmissionBreakdownByOffice from './Reports/SubmissionBreakdownByOffice';
import ExecutiveDashboard from './Reports/ExecutiveDashboard';
import { MultiSelect } from 'react-multi-select-component';
import { to } from '../../../../src_shared/TypeUtils';
import MetricStorage, { useStorageState } from './storage';
import { statuses, statusMapping } from '../../../../src_shared/AppConstants';
import { selectApiBugs, selectApiEnhancements, selectApiOffices, selectApiProjects, selectApiScripts } from '../../util/ApiDataSlice';
import * as Icon from 'react-bootstrap-icons';
import InfoOverlay from '../../shared/InfoOverlay';
import ViewedProjects from './ViewedProjects';
import { AppContext } from '../../../App';
import { MetricsProjectProcessed } from '../../util/RpaUtils';

const reports = {
    0: <ExecutiveDashboard />,
    1: <MonthlySubmissionBreakdown />,
    2: <SubmissionBreakdownByOffice />,
};

export const MetricsContext = createContext({
    distinctSso: [] as string[],
    officeMapping: new Map<string, string>(),
    selectedOffices: [] as { label: string, value: string }[],
    filteredProjects: [] as MetricsProjectProcessed[],
    formattedProjects: [] as MetricsProjectProcessed[],
    filteredSso: [] as string[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    viewProjects(label: string, projects: MetricsProjectProcessed[]) { }
});

function OverallMetrics() {
    const { setDevTools } = useContext<any>(AppContext);

    const rpaProjects = useSelector(selectApiProjects);
    const enhancements = useSelector(selectApiEnhancements);
    const scripts = useSelector(selectApiScripts);
    const bugs = useSelector(selectApiBugs);
    const offices = useSelector(selectApiOffices);
    const { activeUser, poaMapping, employeeMapping } = useContext(AppContext);

    const [report, setReport] = useStorageState.asInt('report', 0);
    const [showFilters, setShowFilters] = useState(false);
    const [viewedProjectsLabel, setViewedProjectsLabel] = useState('');
    const [viewedProjects, setViewedProjects] = useState([]);
    const [showViewedProjects, setShowViewedProjects] = useState(false);

    const selectedReport = useMemo(() => {
        return reports[report];
    }, [report]);

    /** [FAS, OCFO, ...] */
    const distinctSso = useMemo(() => {
        return [...new Set(offices.map(x => x.sso))];
    }, [offices]);
    /**
     * { OFF-001 => FAS, OFF-002 => OCFO, OFF-003 => OCFO }
     *  @type {Map<string, string>} 
     * */
    const officeMapping = useMemo(() => {
        return offices.reduce((map, office) => map.set(office.ID, office.sso), new Map<string, string>());
    }, [offices]);
    const selectableOfficeSso = useMemo(() => {
        return distinctSso.map(x => ({ label: x, value: x }));
    }, [distinctSso]);
    const [selectedOffices, setSelectedOffices] = useStorageState.asArray('selectedOffices', selectableOfficeSso);

    const selectableStatuses = useMemo(() => {
        return statuses.map((x) => ({ label: x.title, value: x.id }));
    }, []);
    // TODO: If these data structures change, how do we ensure it resets the localStorage next time the page loads rather than load the storage and break the page?
    const [selectedStatuses, setSelectedStatuses] = useStorageState.asArray('selectedStatuses', selectableStatuses);

    const selectableStages = useMemo(() => {
        return selectedStatuses.map(x => statusMapping[x.value]).filter(x => x != null).flatMap(x => x.stages).map(x => ({ label: x.title, value: x.id }));
    }, [selectedStatuses]);
    const [selectedStages, setSelectedStages] = useStorageState.asArray('selectedStages', selectableStages);

    // If this is the first time and offices isn't loaded initially, this will ensure it defaults to "select all" once it does on the first try.
    useEffect(() => {
        if (selectedOffices.length <= 0) {
            setSelectedOffices(selectableOfficeSso);
        }
    }, [offices]);

    const formattedProjects = useMemo(() => {
        return [...rpaProjects, ...enhancements, ...scripts, ...bugs].map((item: AllProjectProccessed) => {
            let totalHours: number | undefined = undefined;
            if (item.hours_added) {
                totalHours ??= 0;
                totalHours += item.hours_added;
            }
            if (item.hours_saved) {
                totalHours ??= 0;
                totalHours += item.hours_saved;
            }

            return {
                ...item,
                poa_users: item?.dev_id.split(',').map(x => poaMapping.get(x)?.email).join(', '),
                process_owners: (item.process_owner_ids?.split(',').map(x => employeeMapping.get(x)?.email).join(', ') ?? []),
                total_hours: totalHours,
                attended_unattended: item.attended_unattended || 'Non RPA'
            } as MetricsProjectProcessed;
        }) as MetricsProjectProcessed[];
    }, [rpaProjects, enhancements, scripts, bugs, poaMapping]);

    const filteredProjects = useMemo(() => {
        const statuses = selectedStatuses.map(x => x.value) as string[];
        const stages = selectedStages.map(x => x.value);

        return formattedProjects.filter(x => {
            return (statuses.includes(x.status)); // && (!x.dev_stage || stages.includes(x.dev_stage)) // Stages aren't particularly used atm, so temporarily disabling the logic
        });
    }, [formattedProjects, selectedStatuses, selectedStages])

    const filteredSso = useMemo(() => {
        return selectedOffices.map(x => x.value);
    }, [selectedOffices]);

    // Setup dev tools
    useEffect(() => {
        const resetAndReload = () => {
            MetricStorage.clearAll();
            window.location.reload();
        }

        setDevTools(
            <>
                <Button size='sm' onClick={resetAndReload}>Reset Metrics Filters</Button>
            </>
        );
    }, []);

    const onSetReport = (e) => {
        const value = to.int(e.target.value, 0);
        setReport(value);
    }

    const viewProjects = (label: string, projects: MetricsProjectProcessed[]) => {
        setViewedProjectsLabel(label);
        setViewedProjects(projects);
        setShowViewedProjects(true);
    }

    /**
     * 
     * @param {any[]} selected 
     * @param {*} options 
     * @returns 
     */
    const customStageRenderer = (selected, options) => {
        if (selected.length === options.length) {
            return 'All Stages Included';
        }

        if (selected.length > 0) {
            return selected.map(({ label }) => label).join(', ');
        }

        return 'Select a Stage...';
    }

    /**
     * 
     * @param {any[]} selected 
     * @param {*} options 
     * @returns 
     */
    const customStatusRenderer = (selected, options) => {
        if (selected.length === options.length) {
            return 'All Statuses Included';
        }

        if (selected.length > 0) {
            return selected.map(({ label }) => label).join(', ');
        }

        return 'Select a Status...';
    }

    /**
     * 
     * @param {any[]} selected 
     * @param {*} options 
     * @returns 
     */
    const customOfficeRenderer = (selected, options) => {
        if (selected.length === options.length) {
            return 'All Offices Included';
        }

        if (selected.length > 0) {
            return selected.map(({ label }) => label).join(', ');
        }

        return 'Select an Office...';
    }

    const onViewFilteredToCsv = () => {
        viewProjects('Filtered RPA Projects', filteredProjects);
    }

    return (
        <MetricsContext.Provider value={{ distinctSso, officeMapping, selectedOffices, formattedProjects, filteredProjects, filteredSso, viewProjects }}>
            <div className='container-fluid'>
                <Toaster
                    position="top-left"
                    reverseOrder={false}
                />
                {/* report === 0 is the executive dashboard, which ignores filters */}
                <h1 className='text-center'>Overall Metrics {!!report && <Button variant='outline-primary' title='Filter Projects' onClick={() => setShowFilters(true)}><Icon.Filter></Icon.Filter></Button>}</h1>
                <Row>
                    <Col sm={{ offset: 3, span: 6 }} md={{ offset: 4, span: 4 }} lg={{ offset: 5, span: 2 }}>
                        <Form.Select onChange={onSetReport} defaultValue={report}>
                            <option value={0}>Executive Dashboard</option>
                            <option value={1}>Monthly Submission Breakdown</option>
                            <option value={2}>Submission Breakdown By Office</option>
                        </Form.Select>
                    </Col>
                </Row>
                <hr />
                {selectedReport}
            </div>
            <Modal show={showFilters} onHide={() => setShowFilters(false)} size='lg'>
                <Modal.Header closeButton>
                    <Modal.Title>Filters <InfoOverlay title='Apply filters to determine which projects are used by the selected report.' placement='right' /></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row>
                        <Col md='3'>
                            Include Statuses
                        </Col>
                        <Col>
                            <MultiSelect
                                options={selectableStatuses}
                                value={selectedStatuses}
                                onChange={setSelectedStatuses}
                                valueRenderer={customStatusRenderer}
                                labelledBy='Select Statuses'
                            />
                        </Col>
                    </Row>
                    {/* <hr/>
                    <Row>
                        <Col md='3' className='txt-md-end' style={{ verticalAlign: 'center' }}>
                        Include Stages
                        </Col>
                        <Col>
                            <MultiSelect
                                options={selectableStages}
                                value={selectedStages}
                                onChange={setSelectedStages}
                                valueRenderer={customStageRenderer}
                                labelledBy='Select Stages'
                            />
                        </Col>
                    </Row> */}
                    <hr />
                    <Row>
                        <Col md='3' className='txt-md-end' style={{ verticalAlign: 'center' }}>
                            Include Offices
                        </Col>
                        <Col>
                            <MultiSelect
                                options={selectableOfficeSso}
                                value={selectedOffices}
                                onChange={setSelectedOffices}
                                valueRenderer={customOfficeRenderer}
                                labelledBy='Select Offices'
                            />
                        </Col>
                    </Row>
                    <hr />

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={onViewFilteredToCsv}>
                        View Filtered Projects
                    </Button>
                    <Button variant="secondary" onClick={() => setShowFilters(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
            <ViewedProjects show={showViewedProjects} setShow={setShowViewedProjects} viewedProjects={viewedProjects} label={viewedProjectsLabel} />
        </ MetricsContext.Provider>
    );
}

export default OverallMetrics;