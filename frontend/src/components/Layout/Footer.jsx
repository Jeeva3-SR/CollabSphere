import React from 'react';
import Container from 'react-bootstrap/Container';

const Footer = () => {
  return (
    <footer className="border-top mt-auto bg-light"> {/* Bootstrap's bg-light for a subtle footer */}
      <Container className="py-4 text-center">
        <p className="text-muted small mb-0"> {/* text-muted for #6a7681 color, small for text-sm */}
          © {new Date().getFullYear()} CollabSphere. All rights reserved.
        </p>
        {/* You can add more links or info using Bootstrap's list-inline or similar */}
        {/* <ul className="list-inline mt-2">
          <li className="list-inline-item"><a href="#" className="text-muted small">Privacy</a></li>
          <li className="list-inline-item"><a href="#" className="text-muted small">Terms</a></li>
        </ul> */}
      </Container>
    </footer>
  );
};

export default Footer;