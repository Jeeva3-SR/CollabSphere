import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProjectForm from '../components/project/ProjectForm'; // Bootstrap-ified form
import { createProject } from '../services/projectService';
import { toast } from 'react-toastify';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import RBButton from 'react-bootstrap/Button'; // Aliased
import { ArrowLeft } from 'react-bootstrap-icons';


const CreateProjectPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (projectData) => {
    if (!user) {
      toast.error("You must be logged in to create a project.");
      navigate("/login");
      return;
    }
    setIsLoading(true);
    try {
      const newProject = await createProject(projectData);
      toast.success("Project created successfully!");
      navigate(`/projects/${newProject._id}`);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Failed to create project.";
      toast.error(message);
      setIsLoading(false);
    }
  };

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-md-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8} xl={7}> {/* Max width for form, e.g., max-w-2xl */}
            <RBButton variant="link" onClick={() => navigate(-1)} className="d-flex align-items-center text-template-muted text-decoration-none mb-3 p-0 hover-underline">
                <ArrowLeft size={20} className="me-2" /> Back
            </RBButton>
            <h1 className="h2 text-template-dark fw-bolder mb-4 text-center">Create a New Project</h1>
            <Card className="shadow-lg border-light"> {/* border-gray-200 approx. border-light */}
                <Card.Body className="p-4 p-sm-5">
                    <ProjectForm 
                        onSubmit={handleSubmit} 
                        isLoading={isLoading} 
                        submitButtonText="Create Project" 
                    />
                </Card.Body>
            </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateProjectPage;