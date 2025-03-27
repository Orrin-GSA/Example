import React, { useMemo, useContext, useRef } from 'react';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { selectApiOffices } from '../../../util/ApiDataSlice';
import { selectUseGreyScale } from '../../../util/UserSettingsSlice';
import { Form, Col, Row, Container  } from 'react-bootstrap';
import { backgroundColors } from '../ChartUtil';
import { makeChildStorage } from '../storage';
import { MetricsContext } from '..';
import ToastUtils from '../../../util/ToastUtils';

const { useStorageState } = makeChildStorage('report2');

function SubmissionBreakdownByOffice() {
    const useGreyScale = useSelector(selectUseGreyScale);
    const offices = useSelector(selectApiOffices);
    const { filteredSso, officeMapping, filteredProjects, viewProjects } = useContext(MetricsContext);

    const [selectedSso, setSelectedSso] = useStorageState('selectedSso', filteredSso[0]);

    const officesBySso = useMemo(() => {
        return [...new Set(offices.filter(x => x.sso === selectedSso))];
    }, [offices, selectedSso]);

    const options = useMemo(() => {
        /** @type {import('chart.js').ChartOptions} */
        return {
            plugins: {
                legend: {
                  display: false
                },
                title: {
                    display: true,
                    text: `${selectedSso} Submission Breakdown By Office`,
                },
            },
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                },
            }
        };
    }, [selectedSso]);

    const reportData = useMemo(() => {
        let backgroundColor;
        if (useGreyScale) {
            backgroundColor = backgroundColors.greyScale(filteredSso.length);
        }
        else {
            backgroundColor = backgroundColors.main();
        }

        const labels = officesBySso.map(x => x.dept_code || x.sso);

        // Ensures a minimum size of the chart so we don't have huge bars if there are only 2 labels.
        while(labels.length < 10) {
            labels.push('');
        }

        return {
            labels: labels,
            datasets: [{
                label: selectedSso,
                data: officesBySso.map(office => filteredProjects.filter(project => project.office_id == office.ID).length),
                backgroundColor: backgroundColor(2),
            }],
            events: ['click']
        };
    }, [useGreyScale, filteredProjects, selectedSso, officeMapping, officesBySso, filteredSso]);
    
    const chartRef = useRef();
    // TODO: Send projects to root, have it popup a modal with a dynamically shaped table, and then have a button to "Save to CSV".
    const onClick = (event) => {
        const info = getElementAtEvent(chartRef.current, event)[0];
        if(!info) {
            return;
        }
        /** @type {{ labels: string[], datasets: [] }} */
        const chartData = chartRef.current.data;
        const label = chartData.labels[info.index];

        let office = officesBySso.find(x => x.dept_code === label);
        if(!office) {
            office = officesBySso.find(x => x.sso === label);
        }

        if(!office) {
            ToastUtils.showDevError('DEV: Office not found.')
            return;
        }

        const projects = filteredProjects.filter(project => project.office_id === office.ID);
        viewProjects('Submission Breakdown By ' + label, projects);
    }

    return (<>
        <Container>
            <Row>
                <Col>
                    <Form.Select onChange={(e) => setSelectedSso(e.target.value)} defaultValue={selectedSso}>
                        {filteredSso.map(sso => {
                            return <option key={sso} value={sso}>{sso}</option>
                        })}
                    </Form.Select>
                </Col>
                <Col></Col>
                <Col>

                </Col>
            </Row>

            <Bar ref={chartRef} options={options} data={reportData} className='metrics-chart' onClick={onClick} />
        </Container>
    </>);
}

export default SubmissionBreakdownByOffice;