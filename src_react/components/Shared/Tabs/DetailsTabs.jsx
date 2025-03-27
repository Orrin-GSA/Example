
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container, Tabs, Tab, Table } from 'react-bootstrap';
import DetailsTab from '../DetailsTab';
import { is } from '../../../../src_shared/TypeUtils';

const getJsonObject = (row, field) => {
    const value = row[field];

    if(is.object(value)) {
        return value;
    }
    else {
        return JSON.parse(value || "{}")
    }
}

const getDetailsTab = (tab, row, section) => {
    const cache = {};
    let rows = [];

    if (section.fields) {
        // for each row to display in table
        const fieldRows = section.fields.map((field) => {
            let value = '';
            let title = '';
            // DO WE NEED THIS??
            if (is.object(field)) {
                title = field.title || field.name;
                if (field.subField) {
                    const jsonObj = cache[field.name] ??= getJsonObject(row, field.name);
                    value = jsonObj[field.subField];
                }
                else {
                    value = row[field.name];
                }

                // Do all validation checks below here.
                if (field.hideIfEmpty && !value) {
                    return null;
                }
                return <tr key={title}>
                    <td>{title}</td>
                    <td>{value}</td>
                </tr>
            }
            // JSON within a JSON
            else if (field.includes('|')) {
                let [name, subField] = field.split('|');
                const jsonObj = cache[name] ??= getJsonObject(row, name);
                if (Object.keys(jsonObj).length>0){
                    // check if field exists
                    if(jsonObj[subField]){
                        // JSON
                        if (is.object(jsonObj[subField])){
                            return Object.keys(jsonObj[subField]).map(key =>{
                                return <tr key={key}>
                                    <td>{key}</td>
                                    <td>{jsonObj[subField][key]}</td>
                                </tr>
                            })
                        }
                        // ARRAY
                        else {
                            return jsonObj[subField].map(row =>{
                                return Object.keys(row).map(key =>{
                                    return <tr key={key}>
                                        <td>{key}</td>
                                        <td>{row[key]}</td>
                                    </tr>
                                })
                            })
                        }
                    }
                }
                

            }
            // display specific key-value pairs in json object field
            else if (field.includes(':')) {
                let [name, subField] = field.split(':');
                const jsonObj = cache[name] ??= getJsonObject(row, name);
                title = subField.charAt(0).toUpperCase() + subField.slice(1);
                value = jsonObj[subField];
                return <tr key={title}>
                    <td>{title}</td>
                    <td>{value}</td>
                </tr>
            }
            // field is a string
            else {
                title = field.charAt(0).toUpperCase() + field.slice(1);
                value = row[field];
                // if value is stringified array
                if(value?.includes("[")){
                    let arr = JSON.parse(value)
                    return arr.map((id,idx) => {
                    return <tr key={title}>
                            <td>{title}</td>
                            <td>{id}</td>
                            </tr>   
                    })
                    
                }
                return <tr key={title}>
                        <td>{title}</td>
                        <td>{value}</td>
                        </tr>                
            }

            // return <tr key={title}>
            //     <td>{title}</td>
            //     <td>{value}</td>
            // </tr>
        }).filter(x => !!x);

        rows = rows.concat(fieldRows);
    }

    if (section.json) {
        const jsonRows = section.json.flatMap((jsonField) => {
            // if jsonField was not cached, we get the object
            const jsonObj = cache[jsonField] ??= getJsonObject(row, jsonField);
            // for each key in the json object
            return Object.keys(jsonObj).map(key => {
                let title = key
                // let title = jsonField.charAt(0).toUpperCase() + jsonField.slice(1);
                let value = jsonObj[key];
                if(is.object(value)) {
                    title = key
                    value = JSON.stringify(value);
                    value = value?.replaceAll(/({|}|"|')+/gm,"")
                }

                return <tr key={jsonField + key}>
                    <td>{title}</td>
                    <td>{value}</td>
                </tr>
            });
        });

        rows = rows.concat(jsonRows);
    }

    return <div key={section.title} id={section.title?.replaceAll(" ","").toLowerCase()+"Div"}>
        {section.title ?? <span className="sectionTitle">{section.title}</span>}
        <hr className="underline" aria-hidden="true" />
        <Table striped bordered hover>
            {/* <thead>
                <tr>
                    <th></th>
                    <th>Existing Value</th>
                    <th>New Value</th>
                </tr>
            </thead> */}
            <tbody>
                {rows}
            </tbody>
        </Table>
    </div>
}

function DetailsTabs({ metadata, row ,defaultActiveKey}) {
    const tab = useMemo(() => {
        var tabs = metadata.tabs

        tabs = tabs.flatMap((tab, idx) => <Tab title={tab.title} id={tab.title?.replaceAll(" ", "").toLowerCase()} eventKey={tab.title?.replaceAll(" ", "").toLowerCase()}>{tab.sections.map(section => getDetailsTab(tab, row, section))}</Tab>);

        return tabs;
    }, [metadata, row]);

    return (<Tabs
        defaultActiveKey={defaultActiveKey}
        id="uncontrolled-tab-example"
        className="mb-3"
    >
        {tab}
    </Tabs>);
}

export default DetailsTabs;