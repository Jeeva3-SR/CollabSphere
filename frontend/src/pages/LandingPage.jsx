import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button'; // React-Bootstrap Button
import Card from 'react-bootstrap/Card'; // For "How it works"

// Assuming NavbarComponent is the Bootstrap Navbar
import NavbarComponent from '../components/Layout/NavbarComponent'; 

const LandingPage = () => {
  const { user } = useAuth();

  // Inline styles for background image, as it's complex
  const heroStyle = {
  backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url('/Landingpage.webp')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  minHeight: '480px',
};

  
  // Styles for the buttons to match template
  // bg-[#dce8f3] text-[#121416] -> approx btn-light with custom text color
  // bg-[#f1f2f4] text-[#121416] -> approx btn-light with custom text color

  return (
    <div className="d-flex flex-column min-vh-100 bg-white group-design-root">
      {/* Show generic Navbar if user is logged in, otherwise custom header for landing */}
      {user ? <NavbarComponent /> : (
         <header className="d-flex align-items-center justify-content-between border-bottom px-md-5 py-3"> {/* px-10 in template */}
            <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none text-template-dark">
                 <div style={{width: '1rem', height: '1rem'}}>
                    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '100%', height: '100%'}}>
                        <path d="M39.5563 34.1455V13.8546C39.5563 15.708 36.8773 17.3437 32.7927 18.3189C30.2914 18.916 27.263 19.2655 24 19.2655C20.737 19.2655 17.7086 18.916 15.2073 18.3189C11.1227 17.3437 8.44365 15.708 8.44365 13.8546V34.1455C8.44365 35.9988 11.1227 37.6346 15.2073 38.6098C17.7086 39.2069 20.737 39.5564 24 39.5564C27.263 39.5564 30.2914 39.2069 32.7927 38.6098C36.8773 37.6346 39.5563 35.9988 39.5563 34.1455Z" fill="currentColor"></path>
                        <path fillRule="evenodd" clipRule="evenodd" d="M10.4485 13.8519C10.4749 13.9271 10.6203 14.246 11.379 14.7361C12.298 15.3298 13.7492 15.9145 15.6717 16.3735C18.0007 16.9296 20.8712 17.2655 24 17.2655C27.1288 17.2655 29.9993 16.9296 32.3283 16.3735C34.2508 15.9145 35.702 15.3298 36.621 14.7361C37.3796 14.246 37.5251 13.9271 37.5515 13.8519C37.5287 13.7876 37.4333 13.5973 37.0635 13.2931C36.5266 12.8516 35.6288 12.3647 34.343 11.9175C31.79 11.0295 28.1333 10.4437 24 10.4437C19.8667 10.4437 16.2099 11.0295 13.657 11.9175C12.3712 12.3647 11.4734 12.8516 10.9365 13.2931C10.5667 13.5973 10.4713 13.7876 10.4485 13.8519ZM37.5563 18.7877C36.3176 19.3925 34.8502 19.8839 33.2571 20.2642C30.5836 20.9025 27.3973 21.2655 24 21.2655C20.6027 21.2655 17.4164 20.9025 14.7429 20.2642C13.1498 19.8839 11.6824 19.3925 10.4436 18.7877V34.1275C10.4515 34.1545 10.5427 34.4867 11.379 35.027C12.298 35.6207 13.7492 36.2054 15.6717 36.6644C18.0007 37.2205 20.8712 37.5564 24 37.5564C27.1288 37.5564 29.9993 37.2205 32.3283 36.6644C34.2508 36.2054 35.702 35.6207 36.621 35.027C37.4573 34.4867 37.5485 34.1546 37.5563 34.1275V18.7877ZM41.5563 13.8546V34.1455C41.5563 36.1078 40.158 37.5042 38.7915 38.3869C37.3498 39.3182 35.4192 40.0389 33.2571 40.5551C30.5836 41.1934 27.3973 41.5564 24 41.5564C20.6027 41.5564 17.4164 41.1934 14.7429 40.5551C12.5808 40.0389 10.6502 39.3182 9.20848 38.3869C7.84205 37.5042 6.44365 36.1078 6.44365 34.1455L6.44365 13.8546C6.44365 12.2684 7.37223 11.0454 8.39581 10.2036C9.43325 9.3505 10.8137 8.67141 12.343 8.13948C15.4203 7.06909 19.5418 6.44366 24 6.44366C28.4582 6.44366 32.5797 7.06909 35.657 8.13948C37.1863 8.67141 38.5667 9.3505 39.6042 10.2036C40.6278 11.0454 41.5563 12.2684 41.5563 13.8546Z" fill="currentColor"></path>
                    </svg>
                </div>
                <h2 className="h5 fw-bold mb-0 text-template-dark" style={{letterSpacing: '-0.015em'}}>CollabSphere</h2>
            </Link>
            <div className="d-flex ms-auto gap-2">
                <Button as={Link} to="/login" variant="light" className="bg-template-accent text-template-dark fw-bold btn-h10 border-0">Login</Button>
                <Button as={Link} to="/register" variant="light" className="bg-template-light-gray text-template-dark fw-bold btn-h10 border-0">Register</Button>
            </div>
        </header>
      )}

      <Container fluid className="flex-grow-1 d-flex justify-content-center align-items-center py-5 px-sm-3 px-md-5">
        <Container style={{maxWidth: '960px'}}>
          <Row className="justify-content-center">
            <Col xs={12}> {/* Full width on small screens */}
              {/* Hero Section */}
              {/* Applying padding for @[480px]:p-4 directly to child div or using media queries in CSS */}
              <div className="rounded-xl p-sm-4"> {/* rounded-xl and p-4 for sm and up */}
                <div 
                    style={heroStyle} 
                    className="d-flex flex-column gap-3 align-items-center justify-content-center p-4 rounded-xl text-center"
                    // For @[480px]:gap-8, use Bootstrap's responsive gap or custom CSS
                >
                  <div className="d-flex flex-column gap-2 text-center">
                    <h1 className="text-white display-5 display-sm-4 fw-bolder" style={{letterSpacing: '-0.033em'}}>
                      Welcome to CollabSphere
                    </h1>
                    <h2 className="text-white fs-6 fs-sm-5 fw-normal mx-auto" style={{maxWidth: '600px'}}>
                      Connect with talented individuals and bring your project ideas to life. Find collaborators, share your expertise, and build amazing things together.
                    </h2>
                  </div>
                  {!user && (
                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                      <Button as={Link} to="/login" variant="light" size="lg" className="bg-template-accent text-template-dark fw-bold btn-h10 btn-h-sm-12">Login</Button>
                      <Button as={Link} to="/register" variant="light" size="lg" className="bg-template-light-gray text-template-dark fw-bold btn-h10 btn-h-sm-12">Register</Button>
                    </div>
                  )}
                   {user && (
                     <div className="d-flex flex-wrap gap-3 justify-content-center">
                        <Button as={Link} to="/dashboard" variant="primary" size="lg" className="fw-bold btn-h10 btn-h-sm-12">Go to Dashboard</Button>
                     </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
          
          {/* How it Works Section */}
          <Row className="justify-content-center mt-5 pt-3">
            <Col xs={12}>
              <h2 className="h4 fw-bold text-template-dark mb-4 px-sm-2 text-center text-sm-start">How CollabSphere Works</h2>
              <Row className="g-3 g-sm-4"> {/* gap-10 in template, Bootstrap's g-4 or g-5 is max */}
                {[
                  { title: 'Post Your Project', desc: 'Share your project idea with the community and attract potential collaborators.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNaCy8VeuA8ht7tJvazgHROoK5pNoDsRnV60O9gH3gIWZPVBR2Y8yoDdfEb3kSvFVmaGhlCa7IYl7XW7eYzQwgN9QSD4kB0pI-wTZsy1PP63NnI_0WEV71O3lO74cyhUkiUJFbMLVqEIvihJ3CD2UHnYMjom-2RJbR90Wwd2lZP3v-4-PhavJTa9Ih9mLIqBOFc4Jw_LHU2UwcenmOZQAKjKmbHYB63UryS9Xe6eMBg_CSgy2nVH1e2MRYyitUjrx_a-H6elN4G5qK' },
                  { title: 'Find Projects', desc: 'Browse through a variety of projects and find one that matches your skills and interests.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvRY_LKKpgzGEoAjOe4s4D8bYPnFZMFIQSk_9GsMPqTQRqB_MJeIUcJKRuKweJvGWsuwsEW1ZBpyPwMHrwmkdaMmLCR9EU1vuubciIvg1_aLbp-DI7Zm-vu2ZMVjZZNA2eYEFdTjUry1aqsptNeAXQbBVOskftRK6aiLqJ0YsFvIaHMTTu4Ay-JUhpgY666KB7s8w92kWNewerINAQb0r2UAJlgLUEfCm4MidTUYrRES9aJPMQDYGybGhSExTj33rxH5UI88JVUYuU' },
                  { title: 'Collaborate', desc: 'Work together with other users to achieve your project goals and create something great.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMc2wphoZ0bXvraO3YaJGQZiOoXDjUJmFwi6ame7xt_IQugpZAzq8G8bcLRb-Ro1EbJ8TK17CwHD0EFZ5l4Bq0-Ie4PReu4eZNZenhcMMtByW68xj-2Rq8LoahE-w236KuhF2mHQfJq8s0CyupR9lwrSYzLjVH1oN2PgnhSQRIDYthwv-mHhnQxyvHfiolkySIyys7Wq1SJPGqoThBwDZHNJRLqxug5KyZWGSUzUazKVPmP1kfJTDCOp0ydZWToTiJQ2q2iKgIvTVo' }
                ].map((item, index) => (
                  <Col key={index} md={4} className="d-flex"> {/* grid-cols-[repeat(auto-fit,minmax(158px,1fr))] is tricky, using Bootstrap cols */}
                    <Card className="h-100 shadow-sm">
                      <Card.Img variant="top" src={item.img} style={{ aspectRatio: '16/9', objectFit: 'cover' }} className="rounded-top-xl" />
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="h6 fw-medium text-template-dark">{item.title}</Card.Title>
                        <Card.Text className="text-template-muted small">
                          {item.desc}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Container>
      </Container>
    </div>
  );
};

export default LandingPage;