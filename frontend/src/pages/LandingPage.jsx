import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button'; 
import Card from 'react-bootstrap/Card'; 
import NavbarComponent from '../components/Layout/NavbarComponent'; 
import Logo from '../components/Layout/logo';

const LandingPage = () => {
  const { user } = useAuth();
  const heroStyle = {
  backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url('/Landingpage.webp')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  minHeight: '480px',
  };

  
  return (
    <div className="d-flex flex-column min-vh-100 bg-white group-design-root">
 
     {user ? <NavbarComponent /> : (
  <header className="d-flex align-items-center justify-content-between border-bottom px-md-5 py-3">
   
     <Logo/>
    <div className="d-flex ms-auto gap-2">
      <Button as={Link} to="/login" variant="light" className="bg-template-accent text-template-dark fw-bold btn-h10 border-0">
        Login
      </Button>
      <Button as={Link} to="/register" variant="light" className="bg-template-light-gray text-template-dark fw-bold btn-h10 border-0">
        Register
      </Button>
    </div>
  </header>
)}


      <Container fluid className="flex-grow-1 d-flex justify-content-center align-items-center py-5 px-sm-3 px-md-5">
        <Container style={{maxWidth: '960px'}}>
          <Row className="justify-content-center">
            <Col xs={12}> 
              <div className="rounded-xl p-sm-4"> 
                <div 
                    style={heroStyle} 
                    className="d-flex flex-column gap-3 align-items-center justify-content-center p-4 rounded-xl text-center">
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
          
        
          <Row className="justify-content-center mt-5 pt-3">
            <Col xs={12}>
              <h2 className="h4 fw-bold text-template-dark mb-4 px-sm-2 text-center text-sm-start">How CollabSphere Works</h2>
              <Row className="g-3 g-sm-4"> 
                {[
                  { title: 'Post Your Project', desc: 'Share your project idea with the community and attract potential collaborators.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNaCy8VeuA8ht7tJvazgHROoK5pNoDsRnV60O9gH3gIWZPVBR2Y8yoDdfEb3kSvFVmaGhlCa7IYl7XW7eYzQwgN9QSD4kB0pI-wTZsy1PP63NnI_0WEV71O3lO74cyhUkiUJFbMLVqEIvihJ3CD2UHnYMjom-2RJbR90Wwd2lZP3v-4-PhavJTa9Ih9mLIqBOFc4Jw_LHU2UwcenmOZQAKjKmbHYB63UryS9Xe6eMBg_CSgy2nVH1e2MRYyitUjrx_a-H6elN4G5qK' },
                  { title: 'Find Projects', desc: 'Browse through a variety of projects and find one that matches your skills and interests.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvRY_LKKpgzGEoAjOe4s4D8bYPnFZMFIQSk_9GsMPqTQRqB_MJeIUcJKRuKweJvGWsuwsEW1ZBpyPwMHrwmkdaMmLCR9EU1vuubciIvg1_aLbp-DI7Zm-vu2ZMVjZZNA2eYEFdTjUry1aqsptNeAXQbBVOskftRK6aiLqJ0YsFvIaHMTTu4Ay-JUhpgY666KB7s8w92kWNewerINAQb0r2UAJlgLUEfCm4MidTUYrRES9aJPMQDYGybGhSExTj33rxH5UI88JVUYuU' },
                  { title: 'Collaborate', desc: 'Work together with other users to achieve your project goals and create something great.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMc2wphoZ0bXvraO3YaJGQZiOoXDjUJmFwi6ame7xt_IQugpZAzq8G8bcLRb-Ro1EbJ8TK17CwHD0EFZ5l4Bq0-Ie4PReu4eZNZenhcMMtByW68xj-2Rq8LoahE-w236KuhF2mHQfJq8s0CyupR9lwrSYzLjVH1oN2PgnhSQRIDYthwv-mHhnQxyvHfiolkySIyys7Wq1SJPGqoThBwDZHNJRLqxug5KyZWGSUzUazKVPmP1kfJTDCOp0ydZWToTiJQ2q2iKgIvTVo' }
                ].map((item, index) => (
                  <Col key={index} md={4} className="d-flex">
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