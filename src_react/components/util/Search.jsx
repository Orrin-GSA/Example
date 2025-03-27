import React, { useState, useContext, useEffect, useMemo, useRef } from 'react'
import { AutomationsContext } from './../pages/Automations/Automations';
import Form from 'react-bootstrap/Form';
import { ReactSearchAutocomplete } from 'react-search-autocomplete';
import { makeStorage } from '../util/StorageUtils';
import { AppContext } from '../../App';
import { Button, Col, Dropdown, DropdownButton, InputGroup, Row, ToggleButtonGroup, ToggleButton } from 'react-bootstrap';

export const result_max_num = 1000000;
export const searchOptions = [
    {
        name: 'Project Name',
        attribute: 'name',
        id: 1,
        result_max: result_max_num,
        threshold: 0.2
    },
    {
        name: 'ID',
        attribute: 'ID',
        id: 2,
        result_max: result_max_num,
        threshold: 0.1
    },
    {
        name: 'Office',
        attribute: 'office',
        id: 3,
        result_max: result_max_num,
        threshold: 0.1
    },
    {
        name: 'Developer',
        attribute: 'poa_users',
        placeholder: 'Search by Developer Email',
        id: 4,
        result_max: result_max_num,
        threshold: 0.1
    },
    {
        name: 'Est Comp. Date',
        attribute: 'format_est_delivery_date',
        placeholder: 'MM/DD/YYYY',
        id: 5,
        result_max: result_max_num,
        threshold: 0.0
    }
]

export const filterTypeOptions = ['All', 'RPA', 'Script', 'Enhancement', 'Bug'];

const automationStorage = makeStorage('automations');

function Search({ filter, setFilter }) {
    const {
        setCurrentProjectId,
        setShowOffcanvas,
        filteredBucketedProjects
    } = useContext(AutomationsContext);
    const [rpaCheck, setRpaCheck] = useState(true);
    const { activeUser, poaMapping } = useContext(AppContext);
    const meChecked = filter?.meChecked || false;
    
    // const test = automationStorage.get('search_term');

    useEffect(() => {
        // When the components unmounts remove the results from localStorage
        return () => {
            handleOnClear();
        };
    }, []);

    function formatResult(item) {
        return (
            <div key={item?.ID}>
                <span className={'search_card ' + (filter.filterField.toLowerCase() == 'id' ? "bold_search" : "")}>{item?.ID}</span> | <span className={'search_card ' + (filter.filterField.toLowerCase() == 'office' ? "bold_search" : "")}>{item?.office}</span> | <span className='search_card'>{item?.status}</span><br />
                <span className={'search_card ' + (filter.filterField.toLowerCase() == 'name' ? "bold_search" : "")}>{item?.name}</span><br />
                <span className={'search_card ' + (filter.filterField.toLowerCase() == 'poa_users' ? "bold_search" : "")}>Developer(s): {(item && item.poa_users.length > 0) ? item?.poa_users.join(', ') : "N/A"}</span><br />
                <span className={'search_card ' + (filter.filterField.toLowerCase() == 'format_est_delivery_date' ? "bold_search" : "")}>Est Delivery Date: {(item?.format_est_delivery_date && item?.format_est_delivery_date.length > 0 ? item?.format_est_delivery_date : "N/A")}</span>
            </div>
        )
    }

    const selectedOptionIdx = useMemo(() => {
        return searchOptions.findIndex(x => x.attribute === filter.filterField) ?? 0;
    }, [filter]);

    const selectedOption = useMemo(() => {
        return searchOptions[selectedOptionIdx] ?? searchOptions[0];
    }, [selectedOptionIdx]);

    const handleOnSearch = (searchValue, results) => {
        automationStorage.set('search_term', searchValue);
        if (results.length > 0) {
            let filteredIDs = results.map((project) => {
                return project.ID
            });

            setFilter(prevFilter => ({ ...prevFilter, filterField: prevFilter.filterField, filterValue: filteredIDs }));
        } else {
            handleOnClear();
        }
    }

    const handleOnSelect = (item) => {
        // After selecting an option in the drop down add it to the search
        setCurrentProjectId(item?.ID);
        setShowOffcanvas(true);
    }

    const handleOnClear = () => {
        //place everything back into the buckets
        // debugger;
        setFilter(prevFilter => ({ ...prevFilter, filterField: prevFilter.filterField || '', filterValue: '' }));
        automationStorage.clear('search_term');
    };

    function searchFilterSelect(select) {
        try {
            switch (select) {
                case "name":
                    setFilter((prevFilter) => ({ ...prevFilter, filterField: 'name', filterValue: '' }));
                    break
                case "office":
                    setFilter((prevFilter) => ({ ...prevFilter, filterField: 'office', filterValue: '' }));
                    break;
                case "ID":
                    setFilter((prevFilter) => ({ ...prevFilter, filterField: 'ID', filterValue: '' }));
                    break;
                case "poa_users":
                    setFilter((prevFilter) => ({ ...prevFilter, filterField: 'poa_users', filterValue: '' }));
                    break;
                case "status":
                    setFilter((prevFilter) => ({ ...prevFilter, filterField: 'status', filterValue: '' }));
                    break;
                case "format_est_delivery_date":
                    setFilter((prevFilter) => ({ ...prevFilter, filterField: 'format_est_delivery_date', filterValue: '' }));
                    break;
                default:
                    setFilter((prevFilter) => ({ ...prevFilter, filterField: 'name', filterValue: '' }));
                    break;
            }

        } catch (err) {
            console.warn("Failed to get option target. Reverting to 'name'.", err);
        }
    }

    const formattedProjects = useMemo(() => {
        const allFiltered = Object.keys(filteredBucketedProjects).map((attribute) => filteredBucketedProjects[attribute]).flat();
        return allFiltered.map(item => ({
            ...item,
            poa_users: item.dev_id?.split(',').map(x => poaMapping.get(x)?.email) ?? [],
            format_est_delivery_date: new Date(item.est_delivery_date).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
              }),
          }))
    }, [filteredBucketedProjects, poaMapping]);

    const SearchBar = useMemo(() => {
        return searchOptions.map((option, idx) => 
            <div key={option.attribute} className={`form-control p-0 remove-border filter_option ` + (selectedOptionIdx === idx ? '' : 'd-none')}>
                <ReactSearchAutocomplete
                    className={`search sharpen-autocomplete`}
                    items={formattedProjects}
                    onSearch={handleOnSearch}
                    onSelect={handleOnSelect}
                    styling={{
                        zIndex: 2,
                        height: '36px',
                        resultsContainer: {
                            overflowY: 'auto',
                        }
                    }}
                    inputDebounce={700}
                    onClear={handleOnClear}
                    formatResult={formatResult}
                    maxResults={option.result_max}
                    showNoResultsText={"No project(s) found"}
                    placeholder={(option.placeholder ? option.placeholder : "Search by " + option.name)}
                    showIcon={true}
                    fuseOptions={{
                        threshold: option.threshold,
                        ignoreLocation: true,
                        location: 0,
                        distance: 100,
                        maxPatternLength: 50,
                        minMatchCharLength: 2,
                        includeScore: true,
                        keys: [option.attribute]
                    }}
                />
            </div>
        );
    }, [formattedProjects, selectedOptionIdx]);

    return (
        <Row>
            <Col lg={4}>
                <InputGroup className='search-input-group mt-1'>
                    {SearchBar}
                    <DropdownButton
                        variant="secondary"
                        title={selectedOption.name}
                        align="end"
                    >
                        {searchOptions.map((option) => {
                            return <Dropdown.Item key={option.name} onClick={() => searchFilterSelect(option.attribute)}>{option.name}</Dropdown.Item>
                        })}
                    </DropdownButton>
                </InputGroup>
            </Col>
            {/* Section for toggles */}
            <Col lg={8}>
                <DropdownButton
                    variant="secondary"
                    title={'Type: ' + filter.filterType}
                    style={{ display: 'inline-block' }}
                >
                    {filterTypeOptions.map((option) => {
                        return <Dropdown.Item key={option} onClick={() => setFilter(prevFilter => ({ ...prevFilter, filterType: option }))}>{option}</Dropdown.Item>
                    })}
                </DropdownButton>
                <Form.Check
                    className='pt-2 mx-2'
                    style={{ display: 'inline-block' }}
                    title={"projects associated with " + activeUser.email}
                    type="switch"
                    id="me-switch"
                    label="Me"
                    checked={meChecked}
                    onChange={() => setFilter(prevFilter => ({ ...prevFilter, filterValue: '', meChecked: !meChecked }))}
                />
            </Col>
        </Row>
    )
}

export default Search