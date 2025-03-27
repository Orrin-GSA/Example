import { React} from 'react';
import { Modal, Form, Table } from 'react-bootstrap';

const DetailsPageModal = (handleClose,setModalAction,onActionChange,actionOptions,actionPanel,logTableHeaders,memberLogs,show,modalType) =>{
    return (
    <Modal
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        show={show}
        onHide={() => { handleClose(); }}
        onExited={() => { setModalAction(""); }}
        backdrop="static"
    >
        <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
                {modalType == "Action" ? "Action Menu" : "History Log"}
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {modalType == "Action" &&
                <>
                <div className="flex actionGap">
                    <Form.Select aria-label="Select an action" onChange={onActionChange} defaultValue="selectaction">
                    <option disabled value="selectaction">Select An Action</option>
                    {actionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}

                    </Form.Select>
                </div>
                <hr />
                {actionPanel}
                </>
                
            }
            {
                modalType=="History" &&
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            {logTableHeaders.map((header, idx) => (
                                <th key={header}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {memberLogs.map((val, rowidx) => (
                            <tr>
                                <td >{val["Date"]}</td>
                                <td >{val["User"]}</td>
                                <td >{val["Action"]}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            }
        </Modal.Body>
        {/* <Modal.Footer>
            {modalType == "Action" &&
                <>
                    <Button variant="secondary" onClick={() => { handleClose(); }}>
                        Close
                    </Button>
                    <Button  type="submit" style={{"background-color":"#003c71"}} disabled={modalAction == "resolve" ? true : false}>
                        Submit Action
                    </Button>
                </>
            }
        </Modal.Footer> */}
    </Modal>
    )
}

export default DetailsPageModal