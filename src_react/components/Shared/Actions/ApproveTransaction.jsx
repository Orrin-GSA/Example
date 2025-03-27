import { Button, Form} from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';
import { React } from 'react';

const ApproveTransaction = (validated,submitUpdates,handleChange,todayDate,errors,formData,isSubmitting,tenantOverride) =>{
    return (
        <Form noValidate validated={validated} onSubmit={submitUpdates}>
            {
                tenantOverride &&
                <Form.Group controlId="formBasicCheckbox1">
                    <Form.Check 
                        onChange={handleChange}
                        type="checkbox" 
                        label={todayDate + ": I verify that there is no tenant information for this lease, and none is required to generate a new COR Letter."} 
                        isInvalid={errors.tenantOverride}
                        required
                        value={formData.tenantOverride}
                        disabled={isSubmitting}
                        name="tenantOverride"
                    />
                </Form.Group>   

            }
        <Form.Group controlId="formBasicCheckbox">
            <Form.Check 
                onChange={handleChange}
                type="checkbox" 
                label={todayDate + ": I verify that all information listed here is accurate to my knowledge, and that upon submission, this information will be used to generate a new COR Letter in LMT, and subsequently the Agency and Lessor Letters."} 
                isInvalid={errors.verification}
                required
                value={formData.verification}
                disabled={isSubmitting}
                name="verification"
            />
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
    )
}

export default ApproveTransaction;