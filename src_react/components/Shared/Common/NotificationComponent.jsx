import React, { useState, useEffect, useContext } from 'react';
import { Button, Badge, Modal, ListGroup, Card, OverlayTrigger, Popover } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faExternalLinkAlt, 
  faUser, 
  faCalendarAlt, 
  faIdCard, 
  faExclamationTriangle, 
  faBusinessTime,
  faInfoCircle,
  faRobot,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import { AppContext } from '../../../App';
import { Link } from 'react-router-dom';

// Standard descriptions for each survey type
const SURVEY_DESCRIPTIONS = {
  'Automation Impact Survey': 'Impact assessment required by governance policy',
  'Project Completion Survey': 'Annual compliance survey required for continued project support',
  'Annual Recertification Survey': 'Annual recertification required for all automation projects'
};

const NotificationComponent = () => {
  // Get all needed data from context, including alerts
  const { inputData, supportTickets, ideas, userEmail, alerts } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pastDueNotifications, setPastDueNotifications] = useState([]);
  const [immediateNotifications, setImmediateNotifications] = useState([]);
  const [upcomingNotifications, setUpcomingNotifications] = useState([]);
  const [today] = useState(new Date());
  const isDarkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  
  // Calculate notifications based on data from context and alerts
  useEffect(() => {
    const pendingNotifications = [];
    const pastDueItems = [];
    const immediateItems = [];
    const upcomingItems = [];
    
    // Process alerts data from the context
    if (alerts && alerts.length > 0) {
      alerts.forEach(alert => {
        const dueDate = new Date(alert.due_date);
        const processOwner = Array.isArray(alert.process_owner_ids) ? 
          alert.process_owner_ids[0] : alert.process_owner_ids;
        
        // Create notification object from alert data
        const notification = {
          id: alert.id,
          type: 'Survey',
          title: alert.type,
          description: SURVEY_DESCRIPTIONS[alert.type] || 'Survey requires your attention',
          link: alert.form_link,
          dateCreated: new Date(),
          priority: alert.priority || 'Medium',
          dueDate: dueDate,
          processOwner: processOwner,
          projectId: alert.project_id,
          anniversaryDate: alert.anniversary_date ? new Date(alert.anniversary_date) : null
        };
        
        pendingNotifications.push(notification);
        
        // Automation Impact Assessment and Project Completion Survey are always due immediately
        if (alert.type === 'Automation Impact Survey' || alert.type === 'Project Completion Survey') {
          immediateItems.push(notification);
        } else {
          // For Annual Recertification and other types, use the due date
          const daysUntilDue = getDaysUntilDue(dueDate);
          
          if (daysUntilDue < 0) {
            // Past due
            pastDueItems.push(notification);
          } else if (daysUntilDue < 1) {
            // Less than one day should be in upcoming
            upcomingItems.push(notification);
          } else if (daysUntilDue <= 2) {
            // 1-2 days goes to immediate
            immediateItems.push(notification);
          } else {
            // More than 2 days goes to upcoming
            upcomingItems.push(notification);
          }
        }
      });
    }
    
    // Add pending support tickets (keeping original logic)
    if (supportTickets && supportTickets.length > 0) {
      const pendingTickets = supportTickets.filter(ticket => 
        ticket.status !== 'Closed' && 
        ticket.assignee === userEmail
      );
      
      pendingTickets.forEach(ticket => {
        const notification = {
          id: `ticket-${ticket.ID}`,
          type: 'Support Ticket',
          title: `Ticket #${ticket.ID}`,
          description: ticket.description?.substring(0, 100) + '...',
          link: `/o-and-m?ticket=${ticket.ID}`,
          dateCreated: new Date(ticket.open_date),
          priority: ticket.priority || 'Medium',
          progress: 30,
          processOwner: ticket.process_owner_ids ? ticket.process_owner_ids.replace(/[\[\]"]/g, '') : 'Not Assigned',
          projectId: ticket.project_id || 'N/A',
          anniversaryDate: ticket.anniversary_date ? new Date(ticket.anniversary_date) : null
        };
        
        pendingNotifications.push(notification);
      });
    }
    
    // Add tasks from projects in development
    if (inputData && inputData.length > 0) {
      const devProjects = inputData.filter(project => 
        project.status === 'In Development' && 
        project.dev_id && 
        (project.dev_id.includes(userEmail) || project.process_owner_ids?.includes(userEmail))
      );
      
      devProjects.forEach(project => {
        const notification = {
          id: `project-${project.ID}`,
          type: 'Development Task',
          title: project.name,
          description: `Project #${project.ID} requires your attention`,
          link: `/automations?project=${project.ID}`,
          dateCreated: new Date(project.created_date || new Date()),
          priority: project.priority || 'Medium',
          progress: project.milestones || 45,
          processOwner: project.process_owner_ids ? project.process_owner_ids.replace(/[\[\]"]/g, '') : 'Not Assigned',
          projectId: project.ID || 'N/A',
          anniversaryDate: project.live_date ? new Date(project.live_date) : null
        };
        
        pendingNotifications.push(notification);
      });
    }
    
    // Sort notifications by date (newest first)
    pendingNotifications.sort((a, b) => b.dateCreated - a.dateCreated);
    
    // Sort immediate and upcoming items by due date (soonest first)
    immediateItems.sort((a, b) => a.dueDate - b.dueDate);
    upcomingItems.sort((a, b) => a.dueDate - b.dueDate);
    
    // Sort past due items by how overdue they are (most overdue first)
    pastDueItems.sort((a, b) => a.dueDate - b.dueDate);
    
    setNotifications(pendingNotifications);
    setPastDueNotifications(pastDueItems);
    setImmediateNotifications(immediateItems);
    setUpcomingNotifications(upcomingItems);
  }, [inputData, supportTickets, ideas, userEmail, today, alerts]);
  
  // Toggle notification modal
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };
  
  // Format due date with relative time - only show for Annual Recertification
  const formatDueDate = (survey) => {
    if (survey.title === 'Automation Impact Survey' || survey.title === 'Project Completion Survey') {
      return '';
    }
    
    const diffDays = getDaysUntilDue(survey.dueDate);
    
    if (diffDays <= 2) {
      return ''; 
    } else {
      return `Due in ${diffDays} days`;
    }
  };
  
  // Format anniversary date
  const formatAnniversaryDate = (date) => {
    if (!date) return 'Not available';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get days until due
  const getDaysUntilDue = (dueDate) => {
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
// Determine card style based on survey type and due date
const getCardStyle = (survey) => {

  // Always use red style for Automation Impact and Project Completion surveys
  if (survey.title === 'Automation Impact Survey' || survey.title === 'Project Completion Survey') {
    return {
      backgroundColor: isDarkMode ? '#3a2a2a' : '#fff5f5',
      borderColor: isDarkMode ? '#dc3545' : '#ffcccc',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '0.375rem'
    };
  }
  
  // For other types, base on due date
  const daysUntilDue = getDaysUntilDue(survey.dueDate);
  
  if (daysUntilDue < 0) {
    // Deep red for overdue
    return {
      backgroundColor: isDarkMode ? '#3a2a2a' : '#fff0f0',
      borderColor: isDarkMode ? '#dc3545' : '#dc3545',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderRadius: '0.375rem'
    };
  } else if (daysUntilDue <= 0) {
    // Deep red for overdue
    return {
      backgroundColor: isDarkMode ? '#3a2a2a' : '#fff0f0',
      borderColor: isDarkMode ? '#dc3545' : '#ffcccc',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderRadius: '0.375rem'
    };
  } else if (daysUntilDue <= 2) {
    // Red for due immediately or within 2 days
    return {
      backgroundColor: isDarkMode ? '#3a2a2a' : '#fff5f5',
      borderColor: isDarkMode ? '#dc3545' : '#ffcccc',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '0.375rem'
    };
  } else {
    // Yellow for due beyond 2 days
    return {
      backgroundColor: isDarkMode ? '#3a3022' : '#fffaf0',
      borderColor: isDarkMode ? '#ffc107' : '#ffebcc',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderRadius: '0.375rem'
    };
  }
};
  
  // Determine text color class based on due date
  const getTextColorClass = (survey) => {
    if (survey.title === 'Automation Impact Survey' || survey.title === 'Project Completion Survey') {
      return 'text-danger';
    }
    
    const daysUntilDue = getDaysUntilDue(survey.dueDate);
    if (daysUntilDue < 0) {
      return 'text-danger fw-bold';
    }
    return daysUntilDue <= 2 ? 'text-danger' : 'text-warning';
  };
  
  // Determine button variant based on survey type and due date
  const getButtonVariant = (survey) => {
    if (survey.title === 'Automation Impact Survey' || survey.title === 'Project Completion Survey') {
      return 'danger';
    }
    
    // For other types, base on due date
    const daysUntilDue = getDaysUntilDue(survey.dueDate);
    if (daysUntilDue < 0) {
      return 'danger';
    }
    return daysUntilDue <= 2 ? 'danger' : 'warning';
  };
  
// Render a survey notification card
const renderSurveyCard = (survey, isPastDue = false) => {
  // Check for dark mode
  const isDarkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  
  // Create a popover for the survey description
  const descriptionPopover = (
    <Popover id={`popover-${survey.id}`}>
      <Popover.Header as="h6">Survey Details</Popover.Header>
      <Popover.Body>
        {survey.description}
      </Popover.Body>
    </Popover>
  );

  // Get formatted due date
  const dueDateText = formatDueDate(survey);

  return (
    <div key={survey.id} className="mb-4">
      <div 
        className="p-3" 
        style={getCardStyle(survey)}
      >
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="w-100">
            {/* Title section with info icon */}
            <div className="d-flex align-items-center mb-1">
              <h6 className={`fw-bold mb-0 me-2 ${isPastDue ? 'text-danger' : ''}`} 
                  style={{ color: isDarkMode ? '#ff6b6b' : '' }}>
                {survey.title}
              </h6>
              <OverlayTrigger
                placement="right"
                overlay={descriptionPopover}
              >
                <FontAwesomeIcon 
                  icon={faInfoCircle} 
                  className="text-primary notification-info-icon"
                />
              </OverlayTrigger>
            </div>
            
            {/* Project information and process owner */}
            <div className={`border-start border-4 ${isPastDue ? 'border-danger' : 'border-primary'} ps-2 my-2`}>
              <div className="d-flex justify-content-between">
                <div>
                  <strong className={`d-block ${getTextColorClass(survey)}`}
                         style={{ color: isDarkMode ? '#ff6b6b' : '' }}>
                    <FontAwesomeIcon icon={faRobot} className="me-1" />
                    Project name: {survey.projectId}
                  </strong>
                  <span className="fw-normal d-block" style={{ color: isDarkMode ? '#f8f9fa' : '' }}>
                    Process Owner: <span className="fw-bold">{survey.processOwner}</span>
                  </span>
                  
                  {/* Anniversary Date moved under Process Owner */}
                  {survey.anniversaryDate && (
                    <small className={isDarkMode ? "text-light opacity-75 d-block" : "text-muted d-block"}>
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                      <strong>
                        {survey.title === 'Project Completion Survey' || survey.title === 'Automation Impact Survey' 
                          ? 'Live Date:' 
                          : 'Anniversary Date:'}
                      </strong> {formatAnniversaryDate(survey.anniversaryDate)}
                    </small>
                  )}
                </div>
      
                {/* Due date and button aligned with project info */}
                <div className="d-flex flex-column align-items-end">
                  {dueDateText && (
                    <div className="text-warning mb-2">
                      <span className="fw-bold">{dueDateText}</span>
                    </div>
                  )}
                  
                  <Button 
                    as={Link}
                    to={survey.link || "/surveys"}
                    variant={getButtonVariant(survey)} 
                    size="sm"
                    className="d-flex align-items-center"
                    onClick={toggleNotifications}
                  >
                    <small>{isPastDue ? 'Complete Now' : 'Complete Form'}</small>
                    <FontAwesomeIcon icon={faExternalLinkAlt} className="ms-1" />
                  </Button>
                </div>
              </div>
            </div>
            {/* Past Due Warning Message */}
            {isPastDue}
            
            {/* Remove duplicate button by checking if we already rendered a button AND don't have an anniversary date */}
            {!survey.anniversaryDate && (
              <div className="d-none">
                {/* Hidden to prevent duplicate buttons */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
  
  return (
    <>
      {/* Notification Button */}
      <div className="notification-bell position-relative" onClick={toggleNotifications}>
        <FontAwesomeIcon 
          icon={faBell} 
          className="notification-icon"
        />
        {notifications.length > 0 && (
          <Badge 
            bg="danger" 
            pill
            className="position-absolute top-100 start-100 translate-middle notification-badge"
          >
            {notifications.length}
          </Badge>
        )}
      </div>

      {/* Action Required Modal with height adjustments */}
      <Modal 
        show={isOpen} 
        onHide={toggleNotifications} 
        centered 
        size="lg"
        dialogClassName="modal-90h"
      >
        <Modal.Header closeButton className="d-flex justify-content-between align-items-center">
          <Modal.Title className="h5 mb-0">
            Action Required ({notifications.length})
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="p-3 notification-modal-body">
          {(pastDueNotifications.length > 0 || immediateNotifications.length > 0 || upcomingNotifications.length > 0) ? (
            <>
              {/* Past Due Notifications Section */}
              {pastDueNotifications.length > 0 && (
                <>
                  <h6 className="fw-bold mb-3 text-danger d-flex align-items-center">
                    <FontAwesomeIcon icon={faClock} className="me-2" /> 
                    <span>Past Due</span>
                  </h6>
                  {pastDueNotifications.map(survey => renderSurveyCard(survey, true))}
                </>
              )}
              
              {/* Immediate Notifications Section */}
              {immediateNotifications.length > 0 && (
                <>
                  <h6 className="fw-bold mb-3 text-danger">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" /> 
                    Due Immediately
                  </h6>
                  {immediateNotifications.map(survey => renderSurveyCard(survey))}
                </>
              )}
              
              {/* Upcoming Notifications Section */}
              {upcomingNotifications.length > 0 && (
                <>
                  <h6 className="fw-bold mb-3 text-warning">Upcoming</h6>
                  {upcomingNotifications.map(survey => renderSurveyCard(survey))}
                </>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mb-3">✓</div>
              <h4>All caught up!</h4>
              <p className="text-muted">All process owners have completed their required surveys.</p>
            </div>
          )}
        </Modal.Body>
        
        <Modal.Footer className={isDarkMode ? "bg-dark" : "bg-light"}>
        <Button variant="primary" onClick={toggleNotifications}>
          Close
        </Button>
      </Modal.Footer>
      </Modal>
    </>
  );
};

export default NotificationComponent;