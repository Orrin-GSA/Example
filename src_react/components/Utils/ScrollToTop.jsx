import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { Button } from 'react-bootstrap';

function ScrollToTop() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Button onClick={scrollToTop}
        className="scrollToTop-btn iconBtns"
        variant="primary"
        aria-label="Scroll To Top Of Page">
      <FontAwesomeIcon icon={faArrowUp} size="lg" />
    </Button>
  );
}

export default ScrollToTop;