import { useEffect, useMemo, useContext, useRef } from 'react';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import { useSelector } from 'react-redux';
import { selectUseGreyScale } from '../../../util/UserSettingsSlice';
import { Form, Col, Row, Container  } from 'react-bootstrap';
import { MultiSelect } from 'react-multi-select-component';
import { getMonth, backgroundColors, getFiscalMonthRange } from '../ChartUtil';
import { makeChildStorage } from '../storage';
import { MetricsContext } from '..';
import { DateTime } from 'luxon';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';

const today = DateTime.now();
const dateFiscalRange = getFiscalMonthRange();

const dateFiscalRangeStrs = dateFiscalRange.map(x =>  x.toLocaleString({
    year: '2-digit',
    month: 'short',
    timeZone: 'America/New_York'
}));

const { useStorageState } = makeChildStorage('report1');
const OtherDisplayName = 'Other';

/** @type {import('chart.js').ChartOptions} */
const options = {
    plugins: {
        title: {
            display: true,
            text: `FY${today.toLocaleString({ year: '2-digit' })} - Monthly Submission Breakdown`,
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

// TODO: Add a legend somewhere to inform the user that they can Control-Click on a dataset in a bar to see only that dataset.
function MonthlySubmissionBreakdown() {
    const useGreyScale = useSelector(selectUseGreyScale);
    const { distinctSso, officeMapping, filteredProjects, filteredSso, viewProjects } = useContext(MetricsContext);

    /** @type {any[]} */
    const selectableSso = useMemo(() => {
        return filteredSso.map(x => ({ label: x, value: x }));
    }, [filteredSso]);

    const [selectedSso, setSelectedSso] = useStorageState.asArray('selectedSso', selectableSso);
    //const [selectedOther, setSelectedOther] = useStorageState.asArray('selectedOther', selectableSso);
    const [includeOther, setIncludeOther] = useStorageState.asBool('includeOther', true);

    useEffect(() => {
        if(selectedSso.length <= 0) {
            setSelectedSso(selectableSso);
        }
        else {
            setSelectedSso(selectedSso.filter(x => filteredSso.includes(x.value)));
        }
    }, [filteredSso]);

    const reportData = useMemo(() => {
        let backgroundColor;
        if (useGreyScale) {
            backgroundColor = backgroundColors.greyScale(distinctSso.length);
        }
        else {
            backgroundColor = backgroundColors.main();
        }

        /** @type {string[]} */
        const currentOffices = selectedSso.map(x => x.value);

        let dataSets = currentOffices.map((officeSso, idx) => {
            return {
                label: officeSso,
                // Return an array of numbers, where each element matches up to the root labels, dateFiscalRange.
                data: dateFiscalRange.map(date => filteredProjects.filter(project =>
                    officeMapping.get(project.office_id) === officeSso
                    && getMonth(project.start_date) === date.month).length
                ),
                backgroundColor: backgroundColor(idx),
            }
        });

        if(includeOther && dataSets.length !== selectableSso.length) {
            dataSets = dataSets.concat([{
                label: OtherDisplayName,
                // Return an array of numbers, where each element matches up to root labels, dateFiscalRange.
                data: dateFiscalRange.map(date => filteredProjects.filter(project =>
                    !currentOffices.includes(officeMapping.get(project.office_id))
                    && getMonth(project.start_date) === date.month).length
                ),
                backgroundColor: backgroundColors.greyScale(1)(0),
            }]);
        }

        return {
            // "labels" defines the bar graph X axis. Y is a simple number count by default.
            labels: dateFiscalRangeStrs,
            // "datasets" defines the collections of data types, and how each one maps to the labels.
            datasets: dataSets,
        };
    }, [useGreyScale, includeOther, filteredProjects, selectableSso, selectedSso, officeMapping, filteredSso]);

    const onChangeCheckbox = (event) => {
        setIncludeOther(event.target.checked)
    }
    
    const chartRef = useRef();
    // TODO: Send projects to root, have it popup a modal with a dynamically shaped table, and then have a button to "Save to CSV".
    const onClick = (event) => {
        const info = getElementAtEvent(chartRef.current, event)[0];
        if(!info) {
            return;
        }

        const isControlClick = event.ctrlKey;

        /** @type {{ labels: string[], datasets: [] }} */
        // @ts-expect-error Hack
        const chartData = chartRef.current.data;
        let label = chartData.labels[info.index];

        const idx = dateFiscalRangeStrs.findIndex(x => x === label);
        const fiscalMonth = dateFiscalRange[idx];

        let projects;
        const currentOffices = selectedSso.map(x => x.value);

        // If Control is held, select only the subset of data clicked on (the specific office within a month)
        if(isControlClick) {
            const dataset = chartData.datasets[info.datasetIndex];
            label += ' - ' + dataset.label;
            const isOther = dataset.label === OtherDisplayName;

            projects = filteredProjects.filter(project => getMonth(project.start_date) === fiscalMonth.month
                && (
                    (isOther && !currentOffices.includes(officeMapping.get(project.office_id))) || 
                    (!isOther && officeMapping.get(project.office_id) === dataset.label)
                )
            );
        }
        else {
            // If include other is checked we just include all, we don't differentiate "other" in the viewed results as all offices are included.
            projects = filteredProjects.filter(project => getMonth(project.start_date) === fiscalMonth.month && (includeOther || currentOffices.includes(officeMapping.get(project.office_id))));
        }

        viewProjects('Monthly Submission Breakdown - ' + label, projects);
    }

    return (<>
        <Container className='mb-4'>
            <Row>
                <Col>
                    <MultiSelect
                        options={selectableSso}
                        value={selectedSso}
                        onChange={setSelectedSso}
                        labelledBy='Select Offices'
                    />
                </Col>
                <Col></Col>
                <Col>
                    <Form.Check
                        type='checkbox'
                        id='include-unchecked'
                        label='Include Unchecked as Other'
                        defaultChecked={includeOther}
                        onChange={onChangeCheckbox}
                    />
                </Col>
            </Row>

            <Bar ref={chartRef} options={options} data={reportData} className='metrics-chart' onClick={onClick} />
        </Container>
    </>);
}

export default MonthlySubmissionBreakdown;