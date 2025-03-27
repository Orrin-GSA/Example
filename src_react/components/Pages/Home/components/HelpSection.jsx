import React from 'react';
import { Row, Col, Card, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment } from '@fortawesome/free-solid-svg-icons';

const HelpSection = () => (
  <Row className="mb-4 d-flex align-items-start">
    <Col md={6} className="d-flex align-items-start">
      <Card className="w-100 shadow-sm">
        <Card.Header as="h5">Quick Tips</Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            <ListGroup.Item>
              Use the dark/light mode toggle in the navbar for your preferred viewing experience.
            </ListGroup.Item>
            <ListGroup.Item>
              Click the column headers to sort the data in ascending or descending order.
            </ListGroup.Item>
            <ListGroup.Item>
              Use the "Columns" button to customize which columns are displayed.
            </ListGroup.Item>
            <ListGroup.Item>
              Click the project folder icon to access related project files directly.
            </ListGroup.Item>
          </ListGroup>
        </Card.Body>
      </Card>
    </Col>
    
    <Col md={6} className="d-flex align-items-start">
      <Card className="w-100 shadow-sm">
        <Card.Header as="h5">Need Help?</Card.Header>
        <Card.Body>
          <Card.Text>
            If you have questions or need assistance using the Project Monitor Tracker, please contact:
          </Card.Text>
          <ListGroup variant="flush">
            <ListGroup.Item>Email: project-tracker-support@gsa.gov</ListGroup.Item>
            <ListGroup.Item>Internal Helpdesk: x1234</ListGroup.Item>
            <ListGroup.Item>
              <Link to="/surveys">
                <FontAwesomeIcon icon={faComment} className="me-2" />
                Submit feedback
              </Link>
            </ListGroup.Item>
          </ListGroup>
        </Card.Body>
      </Card>
    </Col>
  </Row>
);

export default HelpSection;
