import React, { useState, useEffect, useContext } from 'react';
import { Button, Form, Modal, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';
import ApiDataService from '../../Utils/ApiDataService';
import { AppContext } from '../../../App'; 

function FeedbackComponent() {
  const { userEmail } = useContext(AppContext);
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Available feedback types
  const feedbackTypes = [
    { id: '', label: 'Select feedback type' },
    { id: 'bug', label: 'Bug Report' },
    { id: 'feature', label: 'Feature Request' },
    { id: 'improvement', label: 'Improvement Suggestion' },
    { id: 'other', label: 'Other' }
  ];

  const toggleFeedback = () => {
    setIsOpen(!isOpen);
    // Reset form when opening
    if (!isOpen) {
      setSubmitted(false);
      setFeedbackType('');
      setComment('');
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedbackType || !comment.trim()) {
      setError('Please select a feedback type and enter a comment.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Submit the feedback with user information
      await ApiDataService.submitFeedback({
        type: feedbackType,
        comment: comment.trim(),
        userEmail: userEmail,
        date: new Date().toISOString(),
        userAgent: navigator.userAgent,
        path: window.location.pathname
      });
      
      // Show the thank you message
      setSubmitted(true);
      
      // Close the feedback form after a delay
      setTimeout(() => {
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      setError('There was an error submitting your feedback. Please try again.');
      console.error('Feedback submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Feedback Button */}
      <Button 
        onClick={toggleFeedback}
        className="feedback-btn"
        variant="primary"
        aria-label="Provide feedback"
      >
        <FontAwesomeIcon icon={faCommentDots} size="lg" />
      </Button>

      {/* Feedback Modal */}
      <Modal show={isOpen} onHide={toggleFeedback} centered className="feedback-modal">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Share Your Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!submitted ? (
            <Form onSubmit={handleSubmit}>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form.Group className="mb-3">
                <Form.Label><strong>What type of feedback would you like to share?</strong></Form.Label>
                <Form.Select 
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  required
                >
                  {feedbackTypes.map((type) => (
                    <option
                      key={type.id}
                      value={type.id}
                      disabled={type.id === ''}
                    >
                      {type.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label><strong>Tell us more:</strong></Form.Label>
                <Form.Control
                  as="textarea"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Please share your thoughts..."
                  rows={5}
                  className="feedback-textarea"
                  required
                />
              </Form.Group>

              <div className="d-grid">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!feedbackType || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            </Form>
          ) : (
            <div className="text-center py-4 feedback-thank-you">
              <div className="display-3 mb-3"></div>
              <h3 className="fw-bold mb-3">Thank You!</h3>
              <p>
                We appreciate your feedback.
              </p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}

export default FeedbackComponent;