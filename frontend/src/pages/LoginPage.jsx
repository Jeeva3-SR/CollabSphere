import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Nav from 'react-bootstrap/Nav'; // For header nav links
import RBButton from 'react-bootstrap/Button';
import Input from '../components/common/Input';

const LoginPage = () => {
  const { login, loading, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if(error) setError(null);
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    const success = await login({ email, password });
    if (success) {
        toast.success("Login successful! Welcome back.");
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
    } else {
       if(error) toast.error(error);
    }
  };
  
  // Logo from template
  const Logo = () => (
    <Link to="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none text-template-dark">
        <h2 className="h5 fw-bold mb-0 text-template-dark" style={{letterSpacing: '-0.015em'}}>CollabSphere</h2>
    </Link>
  );

  return (
    <div className="d-flex flex-column min-vh-100 bg-white group-design-root">
      <header className="d-flex align-items-center justify-content-between border-bottom px-md-5 py-3">
            <Logo />
            <div className="d-flex align-items-center ms-auto">
                <nav className="d-none d-md-flex gap-4 me-4">
                    <Nav.Link as={Link} to="/" className="text-template-dark fw-medium">Home</Nav.Link>
                    
                </nav>
                <RBButton as={Link} to="/register" variant="light" className="bg-template-light-gray text-template-dark fw-bold btn-h10 border-0">Register</RBButton>
            </div>
        </header>
      <Container className="flex-grow-1 d-flex justify-content-center align-items-center py-5">
        <Row className="justify-content-center w-100">
          <Col md={8} lg={6} xl={5}>
            <h2 className="text-template-dark text-center fw-bold mb-4" style={{fontSize: '28px', letterSpacing: '-0.015em'}}>Welcome back</h2>
            <Form onSubmit={onSubmit}>
              <Input label="Email" name="email" type="email" value={email} onChange={onChange} placeholder="Enter your email" required />
              <Input label="Password" name="password" type="password" value={password} onChange={onChange} placeholder="Enter your password" required />
              
              {/* <p className="text-template-muted small mt-1 mb-3 text-start">
                <Link to="/forgot-password"className="text-decoration-underline text-primary">Forgot password?</Link>
              </p> */}
              {error && <p className="text-danger text-center small mt-2 mb-0">{error}</p>}

              <RBButton type="submit" variant="light" className="w-100 mt-3 bg-template-accent text-template-dark fw-bold btn-h10 border-0" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign in'}
              </RBButton>
            </Form>
            <p className="text-template-muted text-center small mt-3">
                Don't have an account? <Link to="/register" className="text-decoration-underline text-primary">Sign up</Link>
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;