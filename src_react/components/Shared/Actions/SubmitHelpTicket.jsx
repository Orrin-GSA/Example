import { Button, Col, Form, InputGroup} from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';
import { React } from 'react';

const SubmitHelpTicket = (validated,submitUpdates,userEmail,handleChange,errors,formData,isSubmitting,currentMember)  =>{
    return (
        <div style={{"width":"60%"}}>
            <p>Please describe your issue below. The admin will be notified via email. </p>
            <Form noValidate validated={validated} onSubmit={submitUpdates}>
            <Col size='12' className="text-center">
                <InputGroup className="mb-3">
                    <InputGroup.Text id="basic-addon1">To</InputGroup.Text>
                    <Form.Control
                        id="toEmail"
                        placeholder="mary.senn@gsa.gov"
                        aria-label="toEmail"
                        aria-describedby="toEmail"
                        disabled
                    />
                </InputGroup>
                <InputGroup className="mb-3">
                    <InputGroup.Text id="basic-addon1">From</InputGroup.Text>
                    <Form.Control
                        id="fromEmail"
                        placeholder={userEmail}
                        aria-label="userEmail"
                        aria-describedby="userEmail"
                        disabled
                    />
                </InputGroup>
                <InputGroup className="mb-3">
                    <InputGroup.Text id="basic-addon1">Subject</InputGroup.Text>
                    <Form.Control
                        id="emailSubject"
                        placeholder={"COR Change Dashboard Help Ticket: " + currentMember.leaseNumber + " | " + currentMember.transactionID}
                        aria-label="emailSubject"
                        aria-describedby="emailSubject"
                        disabled
                    />
                </InputGroup>
                <Form.Group controlId="notesTextArea">
                <Form.Control 
                as="textarea" 
                name="getHelp"
                aria-label="With textarea" 
                placeholder='Describe your issue. (Required)' 
                onChange={handleChange}
                isInvalid={errors.getHelp}
                required
                value={formData.getHelp}
                disabled={isSubmitting}
                />
            </Form.Group>
            </Col>
            <Form.Group controlId="formBasicCheckbox">
                <Form.Check onChange={handleChange} name="checkbox" type="checkbox" disabled={isSubmitting} value={formData.checkbox} label="Yes, I would like to receive a copy of this email." />
            </Form.Group>   
            {
                (isSubmitting) ?
                <Button style={{"float":"right"}} type="submit" disabled={true}>
                    Submitting &nbsp;<Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                </Button>
                :
                <Button style={{"float":"right"}} type="submit">Submit Action</Button>
            }
            </Form>
        </div>
    )
}

export default SubmitHelpTicket