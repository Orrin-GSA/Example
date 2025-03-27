// Home.jsx
import React, { useContext, useMemo, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { AppContext } from '../../../App';
import IntroSection from './components/IntroSection';
import ProjectSectionCard from './components/ProjectSectionCard';
import projectSections from './projectSections';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faTrophy, faBarsProgress} from '@fortawesome/free-solid-svg-icons'
import Form from 'react-bootstrap/Form';

const Home = () => {
  const { inputData, supportTickets, ideas, highlights, isLoaded, dbConfig } = useContext(AppContext);
  const [isChecked, setIsChecked] = useState(false);

  const handleSwitchChange = (event) => {
    setIsChecked(event.target.checked);
  };

  const dataObj = useMemo(() => {
    if (isChecked) {
      return {
        "inputData": inputData.filter(row => row.eoa_flag === "TRUE"),
        "supportTickets": supportTickets.filter(row => row.eoa_flag === "TRUE"),
        "ideas": ideas.filter(row => row.eoa_flag === "TRUE")
      }
    }
    return {
      "inputData": inputData,
      "supportTickets": supportTickets,
      "ideas": ideas
    }
  }, [isChecked, inputData, supportTickets, ideas]);

  const stats = useMemo(() => {
    if (!isLoaded || !inputData) return {};

    // Create a map of section IDs to count functions
    const sectionCounters = {
      'intake': () => dataObj.ideas?.length || 0,
      'optimization': () => dataObj.inputData.filter(item => item.status === "Optimization").length,
      'oAndM': () => dataObj.supportTickets?.length || 0,
      'cancelledOop': () => dataObj.inputData.filter(item => 
        ["Cancelled", "Denied", "On Hold"].includes(item.status)
      ).length
    };

    // Build stats object by processing each section
    return projectSections.reduce((statsObj, section) => {
      if (section.tabs && Array.isArray(section.tabs)) {
        statsObj[section.id] = section.tabs.reduce((acc, tab) => {
          acc[tab.key] = typeof tab.filter === 'function' 
            ? dataObj[section.data].filter(tab.filter).length 
            : 0;
          return acc;
        }, {});
      } else {
        statsObj[section.id] = sectionCounters[section.id] 
          ? sectionCounters[section.id]() 
          : 0;
      }
      return statsObj;
    }, {});
  }, [dataObj, projectSections, isLoaded]);

  return (
    <Container className="py-4">
      <IntroSection />

      <Row>
        <Col>
          <h3 className="text-center mb-3"><FontAwesomeIcon icon={faBarsProgress} />&ensp;Project Sections</h3>
        </Col>
      </Row>
      <Row className="mb-4"> 
        <Col xs={3} md={4} lg={5}></Col>
        <Col>
          <Form.Check type="switch" id="eoaSwitch" label="A-EOA" checked={isChecked} onChange={handleSwitchChange} />
        </Col>
        <Col xs={3} md={4} lg={5}></Col>
      </Row>
      <Row xs={1} md={2} lg={3} className="g-4 mb-4">
        {projectSections.map(section => (
          <Col key={section.id}>
            <ProjectSectionCard
              section={section}
              isLoaded={isLoaded}
              count={!section.tabs ? stats[section.id] : 0}
              subCounts={section.tabs ? stats[section.id] : null}
            />
          </Col>
        ))}
      </Row>
      <Row className="mb-4">
        <Col>
          <h3 className="text-center mb-3"><FontAwesomeIcon icon={faTrophy} />&ensp;Highlights</h3>
        </Col>
      </Row>
      <Row>
        {highlights?.map((row,idx) => <a><span class="buttonHighlights dimond">{row.Date}&emsp;{row.Highlights}</span></a>)}
      </Row>
    </Container>
  );
};

export default Home;