import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container, Tabs, Tab, Table } from 'react-bootstrap';
import { is } from '../../../src_shared/TypeUtils';

function DetailsTab({ tab, row }) {

    const sections = useMemo(() => {
        return tab.sections.map(section => {
            const cache = {};

            
            let rows = [];

            if(section.fields) {
                const fieldRows = section.fields.map((field: string | Record<string, any>) => {
                    let value: string = '';
                    let title: string = '';
    
                    if (is.object(field)) {
                        title = field.title || field.name;
                        if(field.subField) {
                            const jsonObj = cache[field.name] ??= JSON.parse(row[field.name] || "{}");
                            value = jsonObj[field.subField];
                        }
                        else {
                            value = row[field.name];
                        }      
                        
                        // Do all validation checks below here.
                        if(field.hideIfEmpty && !value) {
                            return null;
                        }
                    }
                    else if(field.includes(':')) {
                        let [name, subField] = field.split(':');
                        const jsonObj = cache[name] ??= JSON.parse(row[name] || "{}");
    
                        title = subField.charAt(0).toUpperCase() + subField.slice(1);
                        value = jsonObj[subField];
                        
                    }
                    else {
                        title = field.charAt(0).toUpperCase() + field.slice(1);
                        value = row[field];
                    }
    
                    return <tr key={title}>
                        <td>{title}</td>
                        <td>{value}</td>
                    </tr>
                }).filter(x => !!x);

                rows = rows.concat(fieldRows);
            }

            if(section.json) {
                const jsonRows = section.json.flatMap((jsonField: string) => {
                    const jsonObj = cache[jsonField] ??= JSON.parse(row[jsonField] || "{}");
                    return Object.keys(jsonObj).map(key => {
                        const title = jsonField.charAt(0).toUpperCase() + jsonField.slice(1);
                        
                        return <tr key={jsonField + key}>
                            <td>{title}</td>
                            <td>{jsonObj[key]}</td>
                        </tr>
                    });
                });

                rows = rows.concat(jsonRows);
            }

            return <div key={section.title}>
                {section.title ?? <span className="sectionTitle">{section.title}</span>}
                <hr className="underline" aria-hidden="true" />
                <Table striped bordered hover>
                    <tbody>
                        {rows}
                    </tbody>
                </Table>
            </div>
        });

    }, [tab, row])

    return (
        <Tab title={tab.title} eventKey={tab.title?.replaceAll(" ", "").toLowerCase()}>
            {sections}
        </Tab>
    )
}

export default DetailsTab;