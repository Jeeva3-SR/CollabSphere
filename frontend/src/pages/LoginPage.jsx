import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Nav from 'react-bootstrap/Nav'; 
import RBButton from 'react-bootstrap/Button';
import Input from '../components/common/Input'; 
import LoadingSpinner from '../components/common/LoadingSpinner'; 
import Logo from '../components/Layout/logo';
const LoginPage = () => {
  const { login, error: authContextError, setError: setAuthContextError } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [formError, setFormError] = useState(''); 

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formError) setFormError(''); 
    if (authContextError) setAuthContextError(null); 
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setAuthContextError(null);
    setIsSubmitting(true);

    const result = await login({ email, password }); 

    setIsSubmitting(false);

    if (result.success) {
        toast.success("Login successful! Welcome back."); 
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
    } else {
       const errorMessage = result.error || "An unknown error occurred during login.";
       setFormError(errorMessage);
       toast.error(errorMessage); 
    }
  };
  

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
            <Form onSubmit={onSubmit} noValidate> 
              <Input 
                label="Email" name="email" type="email" 
                value={email} onChange={onChange} 
                placeholder="Enter your email" required 
                error={formError && (formError.toLowerCase().includes('email') || formError.toLowerCase().includes('credential')) ? formError : null}
              />
              <Input 
                label="Password" name="password" type="password" 
                value={password} onChange={onChange} 
                placeholder="Enter your password" required 
                error={formError && (formError.toLowerCase().includes('password') || formError.toLowerCase().includes('credential')) ? formError : null}
              />
          
              {formError && !formError.toLowerCase().includes('email') && !formError.toLowerCase().includes('password') && !formError.toLowerCase().includes('credential') && (
                <div className="alert alert-danger py-2 small mt-2 text-center">{formError}</div>
              )}

              <RBButton 
                type="submit" 
                variant="light" 
                className="w-100 mt-3 bg-template-accent text-template-dark fw-bold btn-h10 border-0" 
                disabled={isSubmitting}
              >
                {isSubmitting ? <LoadingSpinner size="sm" as="span" animation="border" className="me-2"/> : null}
                {isSubmitting ? 'Signing In...' : 'Sign in'}
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