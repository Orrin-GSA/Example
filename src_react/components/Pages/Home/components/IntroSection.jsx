import React from 'react';
import { Row, Col, Card, ListGroup, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../Utils/icons';

const IntroSection = () => (
  <>
    {/* Welcome Section */}
    <Row className="mb-4">
      <Col>
        <h1 className="text-center">Project Monitor Tracker Dashboard</h1>
        <p className="text-center lead">
        Stay up to date with the latest progress on your projects! This dashboard provides real-time visibility into the status of submitted ideas, ongoing optimizations, automation development, completed projects, and more! Below, you'll find a breakdown of the different categories to help you navigate the status of your projects effectively
        </p>
      </Col>
    </Row>

    {/* Tabbed Section */}
    <Row className="mb-4">
      <Col>
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <Tabs defaultActiveKey="getting-started" id="dashboard-tabs" className="mb-0">
              <Tab eventKey="getting-started" title="Getting Started">
                <div className="p-3">
                  <Card.Text>
                  This dashboard allows you to track and monitor various projects throughout their lifecycle, from intake to completion.
                  Navigate through different sections using the navigation bar at the top.
                </Card.Text>
                <ListGroup variant="flush" className="mb-2">
                  <ListGroup.Item className="d-flex align-items-center">
                    <FontAwesomeIcon icon={ICONS.faMagnifyingGlass} className="me-2" />
                    <div>
                      <strong>Search:</strong> Use the search box in each section to filter projects by any keyword.
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center">
                    <FontAwesomeIcon icon={ICONS.faFilterCircleXmark} className="me-2" />
                    <div>
                      <strong>Filters:</strong> Apply column-specific filters to narrow down your view.
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center">
                    <FontAwesomeIcon icon={ICONS.faChartLine} className="me-2" />
                    <div>
                      <strong>Metrics:</strong> Expand the metrics accordion to view charts and analytics for each section.
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center">
                    <FontAwesomeIcon icon={ICONS.faFileExcel} className="me-2" />
                    <div>
                      <strong>Export:</strong> Export data to Excel or CSV for further analysis.
                    </div>
                  </ListGroup.Item>
                </ListGroup>
                </div>
              </Tab>
              <Tab eventKey="quick-tips" title="Quick Tips">
                <div className="p-3">
                  <Card.Text>
                  Use these handy pointers to streamline your workflow and make the most of the dashboard's features.
                </Card.Text>
                <ListGroup variant="flush" className="mb-2">
                  <ListGroup.Item className="d-flex align-items-center">
                    <FontAwesomeIcon icon={ICONS.faArrowsUpDown} className="me-2" />
                    <div>
                      Click the column headers to sort the data in ascending or descending order.
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center">
                    <FontAwesomeIcon icon={ICONS.faEye} className="me-2" />
                    <div>
                    Use the "Columns" button to customize which columns are displayed.
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center">
                    <FontAwesomeIcon icon={ICONS.faFolderOpen} className="me-2" />
                    <div>
                    Click the project folder icon to access related project files directly.
                    </div>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex align-items-center">
                    <FontAwesomeIcon icon={ICONS.faMoon} className="me-2" />
                    <div>
                    Use the dark/light mode toggle in the navbar for your preferred viewing experience.                   
                    </div>
                  </ListGroup.Item>
                </ListGroup>
                </div>
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </>
);

export default IntroSection;