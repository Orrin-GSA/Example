import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../Utils/icons';

// Default item labels if not specified in config
const DEFAULT_LABELS = {
  singular: 'project',
  plural: 'projects'
};

const ProjectSectionCard = ({ section, isLoaded, count, subCounts }) => {
  const getItemLabel = (count) => {
    const labels = section.itemLabel || DEFAULT_LABELS;
    return count === 1 ? labels.singular : labels.plural;
  };

  return (
    <Card className="h-100 shadow-sm project-card">
      <Card.Body>
        <Card.Title>
          <FontAwesomeIcon
            icon={ICONS[section.icon]}
            className={`me-2 text-${section.color}`}/>
          {section.title}
        </Card.Title>
        <Card.Text>{section.description}</Card.Text>
        {isLoaded && (
          <Card.Text className="d-flex align-items-center">
            {subCounts && section.tabs ? (
              <>
                {section.tabs.map(tab => (
                  <React.Fragment key={tab.key}>
                    <Badge bg={section.color} className="me-2">
                      {subCounts[tab.key] || 0}
                    </Badge>
                    <span className="text-muted me-3">{tab.name}</span>
                  </React.Fragment>))}</>) : (<>
                <Badge bg={section.color} className="me-2">
                  {count}
                </Badge>
                <span className="text-muted">
                  {getItemLabel(count)}
                </span></>)}
          </Card.Text>
        )}
      </Card.Body>
      <Card.Footer>
      <Link to={section.path}>
          <Button variant={`outline-${section.color}`}>
            View {section.title}
          </Button>
        </Link>
      </Card.Footer>
    </Card>
  );
};

export default ProjectSectionCard;