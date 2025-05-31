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

import Input from '../components/common/Input'; // Your Bootstrap-styled Input wrapper
import TextArea from '../components/common/TextArea'; // Your Bootstrap-styled TextArea wrapper
import SkillSelectionModal from '../components/common/SkillSelectionModal'; // The modal component

// Comprehensive skill options - consider moving to a shared constants file
const skillOptions = [
  // Programming Languages
  { value: 'javascript', label: 'JavaScript' }, { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' }, { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' }, { value: 'cplusplus', label: 'C++' },
  { value: 'typescript', label: 'TypeScript' }, { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' }, { value: 'go', label: 'Go (Golang)' },
  { value: 'ruby', label: 'Ruby' }, { value: 'scala', label: 'Scala' },
  { value: 'rust', label: 'Rust' }, { value: 'dart', label: 'Dart' },
  // Frontend
  { value: 'html5', label: 'HTML5' }, { value: 'css3', label: 'CSS3' },
  { value: 'reactjs', label: 'React.js' }, { value: 'angular', label: 'Angular' },
  { value: 'vuejs', label: 'Vue.js' }, { value: 'svelte', label: 'Svelte' },
  { value: 'jquery', label: 'jQuery' }, { value: 'bootstrap', label: 'Bootstrap' },
  { value: 'tailwindcss', label: 'Tailwind CSS' }, { value: 'sass', label: 'Sass/SCSS' },
  // Backend
  { value: 'nodejs', label: 'Node.js' }, { value: 'expressjs', label: 'Express.js' },
  { value: 'django', label: 'Django' }, { value: 'flask', label: 'Flask' },
  { value: 'rubyonrails', label: 'Ruby on Rails' }, { value: 'springboot', label: 'Spring Boot' },
  { value: 'laravel', label: 'Laravel' }, { value: 'aspnet', label: 'ASP.NET' },
  // Databases
  { value: 'sql', label: 'SQL' }, { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' }, { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' }, { value: 'firebase', label: 'Firebase Realtime/Firestore' },
  // Mobile Development
  { value: 'reactnative', label: 'React Native' }, { value: 'flutter', label: 'Flutter' },
  { value: 'android', label: 'Android (Java/Kotlin)' }, { value: 'ios', label: 'iOS (Swift/Objective-C)' },
  // DevOps & Cloud
  { value: 'aws', label: 'AWS' }, { value: 'azure', label: 'Microsoft Azure' },
  { value: 'gcp', label: 'Google Cloud Platform (GCP)' }, { value: 'docker', label: 'Docker' },
  { value: 'kubernetes', label: 'Kubernetes' }, { value: 'jenkins', label: 'Jenkins' },
  { value: 'git', label: 'Git & GitHub/GitLab' }, { value: 'terraform', label: 'Terraform' },
  // Data Science & ML
  { value: 'machinelearning', label: 'Machine Learning' }, { value: 'deeplearning', label: 'Deep Learning' },
  { value: 'datascience', label: 'Data Science' }, { value: 'nlp', label: 'Natural Language Processing (NLP)' },
  { value: 'computervision', label: 'Computer Vision' }, { value: 'pandas', label: 'Pandas' },
  { value: 'numpy', label: 'NumPy' }, { value: 'scikitlearn', label: 'Scikit-learn' },
  { value: 'tensorflow', label: 'TensorFlow' }, { value: 'pytorch', label: 'PyTorch' },
  // Design & UX
  { value: 'uidesign', label: 'UI Design' }, { value: 'uxdesign', label: 'UX Design' },
  { value: 'uxresearch', label: 'UX Research' }, { value: 'figma', label: 'Figma' },
  { value: 'adobexd', label: 'Adobe XD' }, { value: 'sketch', label: 'Sketch' },
  { value: 'prototyping', label: 'Prototyping' }, { value: 'graphicdesign', label: 'Graphic Design' },
  // Others
  { value: 'projectmanagement', label: 'Project Management' }, { value: 'agile', label: 'Agile Methodologies' },
  { value: 'technicalwriting', label: 'Technical Writing' }, { value: 'blockchain', label: 'Blockchain' },
  { value: 'cybersecurity', label: 'Cybersecurity' }, { value: 'testingqa', label: 'Software Testing/QA' },
];


const RegisterPage = () => {
  const { register, loading, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    bio: '', githubLink: '', linkedinLink: '',
  });
  
  // This state will hold the array of {value, label} skill objects confirmed from the modal
  const [confirmedSkills, setConfirmedSkills] = useState([]);
  const [showSkillModal, setShowSkillModal] = useState(false);

  const { name, email, password, confirmPassword, bio, githubLink, linkedinLink } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if(error) setError(null); // Clear previous errors on new input
  }

  // This function is called by the modal when skills are confirmed
  const handleSkillsUpdateFromModal = (skillsFromModal) => {
    setConfirmedSkills(skillsFromModal); // skillsFromModal is an array of {value, label}
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
    // Extract just the 'value' (string) from each confirmed skill object for the backend
    const skillsValueArray = confirmedSkills.map(skill => skill.value);
    
    const result = await register({ 
      name, email, password, bio, 
      skills: skillsValueArray, // Send array of skill values
      githubLink, linkedinLink 
    });
    
    if (result.success) {
        toast.success("Registration successful! Welcome.");
        navigate('/dashboard');
    } else {
        if(result.error) toast.error(result.error);
        else if (error) toast.error(error); // Fallback to context error
    }
  };
  
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
                <Nav className="d-none d-md-flex gap-4 me-4"> {/* react-bootstrap Nav */}
                    <Nav.Link as={Link} to="/" className="text-template-dark fw-medium">Home</Nav.Link>
                  
                </Nav>
                <RBButton as={Link} to="/login" variant="light" className="bg-template-light-gray text-template-dark fw-bold btn-h10 border-0">Log In</RBButton>
            </div>
        </header>

      <Container className="flex-grow-1 d-flex justify-content-center align-items-center py-5">
        <Row className="justify-content-center w-100">
          <Col md={8} lg={6} xl={5}> {/* Max width 512px approx */}
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
              
              {/* Skills Section with Modal Button */}
              <Form.Group className="mb-3">
                <Form.Label className="text-template-dark fw-medium d-block mb-1">Skills (optional)</Form.Label>
                <div className="p-2 border rounded-xl form-control-h14 d-flex align-content-start flex-wrap gap-1 mb-2" style={{ minHeight: '56px', overflowY: 'auto' }}>
                  {confirmedSkills.length > 0 ? confirmedSkills.map(skill => (
                    <Badge 
                      key={skill.value} 
                      pill 
                      bg="primary-subtle" 
                      text="primary-emphasis" 
                      className="d-flex align-items-center p-2 border border-primary-subtle" // p-2 for slightly larger badge
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
        onSkillsConfirm={handleSkillsUpdateFromModal} // This updates confirmedSkills
        initialSelectedSkills={confirmedSkills}        // Pass current confirmed skills to modal
        allSkillOptions={skillOptions}                  // Pass all available skills
      />
    </div>
  );
};

export default RegisterPage;