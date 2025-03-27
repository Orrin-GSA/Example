// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { Button, Col, Row, Modal, Table, Card } from 'react-bootstrap';
import { makeChildStorage } from './storage';
import { MultiSelect, Option as MultiSelectOption } from 'react-multi-select-component';
import { exportDataToCsv, exportDataToXlsx, getDateForFilename } from '../../util/DataUtil';
import { getProjectFieldMapping, getProjectFieldValueMapping, MetricsProjectProcessed, projectFieldMapping } from '../../util/RpaUtils';
const { useStorageState } = makeChildStorage('viewed');

interface ViewedProjectsProps {
    show: boolean;
    setShow: (arg) => void;
    viewedProjects: MetricsProjectProcessed[];
    label: string;
    onClose?: () => void;
}

// Ordered List of fields to display.
const orderedFields: (keyof MetricsProjectProcessed | keyof AllProjectProccessed)[] = [
    'ID', 'name', 'status', 'dev_stage', 'office', 'dept', 'poa_users', 'process_owners', 'priority', 'start_date', 'est_delivery_date', 'deployed_version', 'comments_history', 'actions_history', 'hours_saved', 
    'attended_unattended', 'online_offline', 'last_modified_date', 'project_folder_id', 
    // Additional fields disabled. Enable as needed.
    // 'process_owner_ids', 'custodian_ids', 'npe_ids', 'system_ids', 'document_ids','office_id', 'project_folder_id', 'functional_category_id', 'subidea_id', 'milestone_id', 'tools_ids'
];
const selectableFields: MultiSelectOption[] = orderedFields.map(x => ({ label: getProjectFieldMapping(x), value: x }));

function ViewedProjects({ show, setShow, viewedProjects, label, onClose }: ViewedProjectsProps) {
    const [selectedFields, setSelectedFields] = useStorageState.asArray('selectedFields', selectableFields);

    function handleClose() {
        setShow(false);
        onClose?.();
    }

    function onSaveToCsv() {
        exportDataToCsv(label.replaceAll(' ', '') + '_' + getDateForFilename(), viewedProjects, { useHeader: projectFieldMapping, include: selectedFields.map(x => x.value) });
    }

    function onSaveToXlsx() {
        exportDataToXlsx(label.replaceAll(' ', '') + '_' + getDateForFilename(), viewedProjects, { useHeader: projectFieldMapping, include: selectedFields.map(x => x.value) });
    }

    return (
        <Modal show={show} onHide={handleClose} className='milestone-modal' size='xl'>
            <Modal.Header closeButton>
                <Modal.Title>{label}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col lg='6'>
                    <Row>
                        <Col lg='3' className='d-flex align-items-center'><div>Included Fields:</div></Col>
                        <Col lg='9'>
                        <MultiSelect
                            options={selectableFields}
                            value={selectedFields}
                            onChange={setSelectedFields}
                            labelledBy='Select Fields'
                        />
                        </Col>
                    </Row>
                    </Col>
                    <Col lg='6'>
                        <div className='d-none d-lg-inline'>
                            {/* visible if >= lg */}
                            <Button onClick={onSaveToCsv}>Save to CSV</Button>
                            <Button onClick={onSaveToXlsx} className='mx-3'>Save to XLSX</Button>
                            {/* <Button onClick={async () => await onSaveToPdf()} className='mx-3'>Save to PDF</Button> */}
                        </div>
                        <div className='d-inline d-lg-none'>
                            {/* visible if < lg, make button take up entire space */}
                            <Button onClick={onSaveToCsv} className='col-12 mt-3'>Save to CSV</Button>
                            <Button onClick={onSaveToCsv} className='col-12 mt-3'>Save to XSLX</Button>
                            {/* <Button onClick={async () => await onSaveToPdf()} className='col-12 mt-3'>Save to PDF</Button> */}
                        </div>
                    </Col>
                </Row>
                <Row className='mt-3'>
                    <Col>
                        <Card style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
                            <div>
                                <Table style={{ tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr>
                                            {selectedFields.map(field =>
                                                <th key={field.value} style={{ width: '250px', position: 'sticky', top: '0' }}>{getProjectFieldMapping(field.value)}</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewedProjects.map(project =>
                                            <tr key={project.ID}>
                                                {selectedFields.map(field =>
                                                    <td key={field.value}>{getProjectFieldValueMapping(field.value, project[field.value])}</td>
                                                )}
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                        </Card>
                    </Col>
                </Row>
            </Modal.Body>
        </Modal>
    );
}

export default ViewedProjects;