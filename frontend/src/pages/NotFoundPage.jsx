import React from 'react';
import { Link } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import RBButton from 'react-bootstrap/Button';

const NotFoundPage = () => {
  return (
    <Container fluid className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light text-center px-3">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <img 
            src="https://illustrations.popsy.co/gray/timed-out.svg" // Example 404 illustration
            alt="404 Not Found" 
            className="img-fluid mb-4" // Bootstrap class for responsive image
            style={{maxWidth: '250px'}}
          />
          <h1 className="display-1 fw-bold text-primary mb-3">404</h1> {/* Bootstrap's primary color */}
          <p className="h2 fw-semibold text-template-dark mb-2">Oops! Page Not Found.</p>
          <p className="text-template-muted mb-4">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <RBButton
            as={Link}
            to="/"
            variant="primary" // Bootstrap primary color
            size="lg"
            className="fw-semibold shadow-sm btn-h12" // btn-h12 for template height
          >
            Go to Homepage
          </RBButton>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFoundPage;