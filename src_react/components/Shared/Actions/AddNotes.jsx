import { Button, Col, Form, InputGroup} from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';
import { React } from 'react';

const AddNotes = (validated,submitUpdates,todayDate,userEmail,handleChange,errors,formData,isSubmitting) =>{
    return (
        <Form noValidate validated={validated} onSubmit={submitUpdates}>
            <Col size='12' className="text-center">
                <InputGroup className="mb-3">
                    <InputGroup.Text id="basic-addon1">Date</InputGroup.Text>
                    <Form.Control
                        id="todayDate"
                        defaultValue={todayDate}
                        aria-label="todayDate"
                        aria-describedby="todayDate"
                        disabled
                    />
                </InputGroup>
                <InputGroup className="mb-3">
                    <InputGroup.Text id="basic-addon1">User</InputGroup.Text>
                    <Form.Control
                        id="userEmail"
                        defaultValue={userEmail}
                        aria-label="userEmail"
                        aria-describedby="userEmail"
                        disabled
                    />
                </InputGroup>
                <Form.Group controlId="notesTextArea">
                    <Form.Control 
                    as="textarea" 
                    name="notes"
                    aria-label="With textarea" 
                    placeholder='Enter notes here. Notes will be saved in the History Log. (Required)' 
                    onChange={handleChange}
                    isInvalid={errors.notes}
                    required
                    value={formData.notes}
                    disabled={isSubmitting}
                    />
                </Form.Group>
            </Col>
            {
                (isSubmitting) ?
                <Button style={{"float":"right"}} type="submit" disabled={true}>
                    Submitting &nbsp;<Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                </Button>
                :
                <Button style={{"float":"right"}} type="submit">Submit Action</Button>
            }
            </Form>
    )
}

export default AddNotes;