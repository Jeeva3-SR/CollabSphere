import React, {useState,useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import AnimatedLogo from './AnimatedLogo';
import {
  BellIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

const NavbarComponent = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');


  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
  };

const Logo = ({ user }) => (
  <Link
    to={user ? "/dashboard" : "/"}
    className="navbar-brand d-flex align-items-center gap-2 text-decoration-none"
  >
    <AnimatedLogo />
    <h2
      className="h5 fw-bold mb-0"
      style={{
        letterSpacing: "-0.015em",
        background:
          "linear-gradient(90deg, #2563EB 0%, #3B82F6 50%, #60A5FA 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      CollabSphere
    </h2>
  </Link>
);

  return (
    <Navbar bg="white" expand="lg" className="border-bottom py-3 sticky-top shadow-sm">
      <Container fluid className="px-md-5">
        <Logo />
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          {user && (
            <Nav className="me-auto my-2 my-lg-0 gap-lg-3">
              <Nav.Link as={Link} to="/dashboard" className="text-template-dark fw-medium">
                Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/projects" className="text-template-dark fw-medium">
                Explore
              </Nav.Link>
              <Nav.Link as={Link} to="/my-projects" className="text-template-dark fw-medium">
                My Projects
              </Nav.Link>
            </Nav>
          )}
          <div className="d-flex align-items-center ms-auto mt-2 mt-lg-0 gap-2 gap-md-3">
            {user && (
              <Form onSubmit={handleSearch} className="d-none d-sm-flex">
                <div className="input-group" style={{ maxWidth: '250px' }}>
                  <span className="input-group-text bg-template-light-gray border-0 rounded-start-3">
                    <MagnifyingGlassIcon style={{ width: '20px', height: '20px', color: '#6a7681' }} />
                  </span>
                  <Form.Control
                    type="search"
                    placeholder="Search projects..."
                    className="bg-template-light-gray border-0 rounded-end-3 shadow-none form-control-sm"
                    aria-label="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </Form>
            )}

            {user ? (
              <>
                <Button
                  variant="light"
                  as={Link}
                  to="/create-project"
                  className="d-none d-sm-flex align-items-center bg-template-accent text-template-dark fw-bold btn-h10 border-0"
                  style={{ letterSpacing: '0.015em' }}
                >
                  <PlusCircleIcon style={{ width: '20px', height: '20px' }} className="me-1 me-sm-2" />
                  New Project
                </Button>
                <Button
                  variant="light"
                  as={Link}
                  to="/notifications"
                  className="position-relative bg-template-light-gray text-template-dark p-2 rounded-3 border-0 btn-h10"
                >
                  <BellIcon style={{ width: '20px', height: '20px' }} />
                  
                </Button>

                <NavDropdown
                  title={
                    <div
                      className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-semibold"
                      style={{ width: '40px', height: '40px', fontSize: '18px', cursor: 'pointer' }}
                    >
                      {user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  }
                  id="user-nav-dropdown"
                  align="end"
                  className="avatar-dropdown"
                >
                  <NavDropdown.Item as={Link} to={`/profile/${user._id}`}>
                    My Profile
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <ArrowLeftOnRectangleIcon style={{ width: '20px', height: '20px' }} className="me-2" />
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <div className="d-flex gap-2">
                <Button
                  as={Link}
                  to="/login"
                  variant="light"
                  className="bg-template-accent text-template-dark fw-bold btn-h10 border-0"
                  style={{ letterSpacing: '0.015em' }}
                >
                  Log In
                </Button>
                <Button
                  as={Link}
                  to="/register"
                  variant="light"
                  className="bg-template-light-gray text-template-dark fw-bold btn-h10 border-0"
                  style={{ letterSpacing: '0.015em' }}
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;