import React, { useState, useContext } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import RBButton from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import { XCircleFill, PlusCircleFill, TagFill } from 'react-bootstrap-icons';
import Input from '../components/common/Input'; 
import TextArea from '../components/common/TextArea'; 
import SkillSelectionModal from '../components/common/SkillSelectionModal'; 
import { skillOptions } from '../utils/constants';
import AnimatedLogo from '../components/Layout/AnimatedLogo';
const RegisterPage = () => {
  const { register, loading, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    bio: '', githubLink: '', linkedinLink: '',
  });
  
  const [confirmedSkills, setConfirmedSkills] = useState([]);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const { name, email, password, confirmPassword, bio, githubLink, linkedinLink } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if(error) setError(null); 
  }

  const handleSkillsUpdateFromModal = (skillsFromModal) => {
    setConfirmedSkills(skillsFromModal);
  };

  const removeSkillFromDisplay = (skillValueToRemove) => {
    setConfirmedSkills(prevSkills => prevSkills.filter(skill => skill.value !== skillValueToRemove));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match"); setError("Passwords do not match"); return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters"); setError("Password must be at least 6 characters"); return;
    }
    
    const skillsValueArray = confirmedSkills.map(skill => skill.value);
    
    const result = await register({ 
      name, email, password, bio, 
      skills: skillsValueArray, 
      githubLink, linkedinLink 
    });
    
    if (result.success) {
        toast.success("Registration successful! Welcome.");
        navigate('/dashboard');
    } else {
        if(result.error) toast.error(result.error);
        else if (error) toast.error(error); 
    }
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
    <div className="d-flex flex-column min-vh-100 bg-white group-design-root">
        <header className="d-flex align-items-center justify-content-between border-bottom px-md-5 py-3">
            <Logo />
            <div className="d-flex align-items-center ms-auto">
                <Nav className="d-none d-md-flex gap-4 me-4">
                    <Nav.Link as={Link} to="/" className="text-template-dark fw-medium">Home</Nav.Link>
                  
                </Nav>
                <RBButton as={Link} to="/login" variant="light" className="bg-template-light-gray text-template-dark fw-bold btn-h10 border-0">Log In</RBButton>
            </div>
        </header>

      <Container className="flex-grow-1 d-flex justify-content-center align-items-center py-5">
        <Row className="justify-content-center w-100">
          <Col md={8} lg={6} xl={5}> 
            <h2 className="text-template-dark text-center fw-bold mb-4" style={{fontSize: '28px', letterSpacing: '-0.015em'}}>Create your account</h2>
            <Form onSubmit={onSubmit} noValidate>
              <Input label="Name" name="name" value={name} onChange={onChange} placeholder="Enter your full name" required />
              <Input label="Email" name="email" type="email" value={email} onChange={onChange} placeholder="Enter your email" required />
              <Input label="Password" name="password" type="password" value={password} onChange={onChange} placeholder="Create a password (min 6 characters)" required />
              <Input label="Confirm Password" name="confirmPassword" type="password" value={confirmPassword} onChange={onChange} placeholder="Confirm your password" required />
              <TextArea label="Short bio" name="bio" value={bio} onChange={onChange} placeholder="Tell us about yourself (optional)" rows={3} />
              
              <Row>
                <Col md={6}>
                  <Input label="GitHub link" name="githubLink" value={githubLink} onChange={onChange} placeholder="https://github.com/... (optional)" />
                </Col>
                <Col md={6}>
                  <Input label="LinkedIn link" name="linkedinLink" value={linkedinLink} onChange={onChange} placeholder="https://linkedin.com/in/... (optional)" />
                </Col>
              </Row>
             
              <Form.Group className="mb-3">
                <Form.Label className="text-template-dark fw-medium d-block mb-1">Skills (optional)</Form.Label>
                <div className="p-2 border rounded-xl form-control-h14 d-flex align-content-start flex-wrap gap-1 mb-2" style={{ minHeight: '56px', overflowY: 'auto' }}>
                  {confirmedSkills.length > 0 ? confirmedSkills.map(skill => (
                    <Badge 
                      key={skill.value} 
                      pill 
                      bg="primary-subtle" 
                      text="primary-emphasis" 
                      className="d-flex align-items-center p-2 border border-primary-subtle"
                    >
                      <TagFill size={12} className="me-1"/> {skill.label}
                      <XCircleFill 
                        size={16} // Slightly larger for easier click
                        className="ms-1 cursor-pointer opacity-75 hover-opacity-100" 
                        onClick={(e) => { e.stopPropagation(); removeSkillFromDisplay(skill.value);}}
                        style={{cursor: 'pointer'}}
                        title={`Remove ${skill.label}`}
                      />
                    </Badge>
                  )) : (
                    <span className="text-template-muted small align-self-center">No skills selected. Click below to add.</span>
                  )}
                </div>
                <RBButton 
                  variant="outline-secondary" 
                  onClick={() => setShowSkillModal(true)} 
                  className="w-100 btn-h10 d-flex align-items-center justify-content-center"
                >
                   <PlusCircleFill size={16} className="me-2"/> Add/Edit Skills
                </RBButton>
              </Form.Group>

              {error && <p className="text-danger text-center small mt-2 mb-0">{error}</p>}

              <RBButton type="submit" variant="light" className="w-100 mt-3 bg-template-accent text-template-dark fw-bold btn-h10 border-0" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create account'}
              </RBButton>
            </Form>
            <p className="text-template-muted text-center small mt-3">
                Already have an account? <Link to="/login" className="text-decoration-underline text-primary">Log In</Link>
            </p>
          </Col>
        </Row>
      </Container>

      <SkillSelectionModal
        show={showSkillModal}
        handleClose={() => setShowSkillModal(false)}
        onSkillsConfirm={handleSkillsUpdateFromModal} 
        initialSelectedSkills={confirmedSkills}        
        allSkillOptions={skillOptions}                  
      />
    </div>
  );
};

export default RegisterPage;