import { Button, Col, Form, InputGroup} from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';
import { React } from 'react';

const CancelTransaction = (validated,submitUpdates,todayDate,userEmail,handleChange,errors,formData,isSubmitting) => {
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
                        name="cancel"
                        aria-label="With textarea" 
                        placeholder='Enter cancellation reason. (Required)' 
                        onChange={handleChange}
                        isInvalid={errors.cancel}
                        value={formData.cancel}
                        required
                        disabled={isSubmitting}
                        />
                    </Form.Group>                     
            </Col>
            <Form.Group controlId="formBasicCheckbox">
                <Form.Check onChange={handleChange} type="checkbox" label="Yes, I would like to receive an email confirmation" disabled={isSubmitting} value={formData.checkbox}/>
            </Form.Group>   
            <div class="flex">
                <div><b>**THIS ACTION CANNNOT BE UNDONE**</b></div>
                <div>
                {
                    (isSubmitting) ?
                    <Button style={{"float":"right"}} type="submit" disabled={true}>
                        Submitting &nbsp;<Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                    </Button>
                    :
                    <Button style={{"float":"right"}} type="submit">Submit Action</Button>
                }
                </div>
            </div>
            </Form>
    )
}

export default CancelTransaction;