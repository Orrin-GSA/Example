
import { Button, Form,Card } from "react-bootstrap";
import Spinner from 'react-bootstrap/Spinner';

const helpTicketDisplayCard = (ticket,access,submitUpdates,validated,isSubmitting,errors,formData,handleChange) => {
    const id = parseInt(ticket.ticketID?.split("-")[1])
    return (
        <Form noValidate validated={validated} onSubmit={e => {submitUpdates(e,id)}}>
        <Card style={{"marginBottom":"10px"}} border={ticket.status=="Open" ? "danger":"success"}>
          <Card.Header>{ticket.date + " - " + ticket.status}</Card.Header>
          <Card.Body style={{"padding":"5px 5px 0px 10px"}}>
            <div class="flex">
            <div>
                <Card.Text>{ticket.submitter + ": " + ticket.description}</Card.Text>
                {(ticket.status=="Closed") &&
                <Card.Text>{"Admin: " + ticket.comments}</Card.Text>
                }
            </div>
            {
                (access =="admin" && ticket.status!="Closed") &&
                
                    ((isSubmitting) ?
                    <Button type="submit" disabled={true}>
                        Submitting &nbsp;<Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                    </Button>
                    :
                    <Button type="submit">Submit Action</Button>)
                
            }
            </div>
            {
                (access =="admin" && ticket.status!="Closed") &&
                <Form.Group controlId="notesTextArea" style={{"width":"90%"}}>
                    <Form.Control 
                    as="textarea" 
                    name={"resolve"+id}
                    aria-label="With textarea" 
                    placeholder='Enter resolution comments here. (Required)' 
                    onChange={handleChange}
                    isInvalid={errors["resolve"+id]}
                    required
                    value={formData["resolve"+id]}
                    disabled={isSubmitting}
                    />
                </Form.Group>
            }
          </Card.Body>
        </Card>
        </Form>
    );
}

export default helpTicketDisplayCard;