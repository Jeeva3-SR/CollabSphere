import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProjectForm from '../components/project/ProjectForm'; // Bootstrap-ified form
import { getProjectById, updateProject } from '../services/projectService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import RBButton from 'react-bootstrap/Button';
import { ArrowLeft } from 'react-bootstrap-icons';

const EditProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // For form submission
  const [isFetching, setIsFetching] = useState(true); // For initial data fetch

  useEffect(() => {
    const fetchProject = async () => {
      if (!user) return; // Wait for user context
      setIsFetching(true);
      try {
        const data = await getProjectById(projectId);
        if (data.owner._id !== user._id) {
          toast.error("You are not authorized to edit this project.");
          navigate(`/projects/${projectId}`);
          return;
        }
        setProject(data);
      } catch (error) {
        toast.error("Failed to fetch project details for editing.");
        navigate("/dashboard");
      } finally {
        setIsFetching(false);
      }
    };

    if (!authLoading) { // Only fetch if auth context is resolved
        fetchProject();
    }
  }, [projectId, user, authLoading, navigate]);

  const handleSubmit = async (projectData) => {
    setIsLoading(true);
    try {
      const updated = await updateProject(projectId, projectData);
      toast.success("Project updated successfully!");
      navigate(`/projects/${updated._id}`);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Failed to update project.";
      toast.error(message);
      setIsLoading(false);
    }
  };

  if (isFetching || authLoading) {
    return <div className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 200px)'}}><LoadingSpinner size="lg" /></div>;
  }

  if (!project) {
    return <div className="alert alert-warning text-center container mt-5">Project data not available or you are not authorized.</div>;
  }

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-md-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8} xl={7}>
            <RBButton variant="link" onClick={() => navigate(`/projects/${projectId}`)} className="d-flex align-items-center text-template-muted text-decoration-none mb-3 p-0 hover-underline">
                <ArrowLeft size={20} className="me-2" /> Back to Project
            </RBButton>
            <h1 className="h2 text-template-dark fw-bolder mb-4 text-center">Edit Project</h1>
            <Card className="shadow-lg border-light">
                <Card.Body className="p-4 p-sm-5">
                    <ProjectForm
                        onSubmit={handleSubmit}
                        initialData={project}
                        isLoading={isLoading}
                        submitButtonText="Save Changes"
                    />
                </Card.Body>
            </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EditProjectPage;