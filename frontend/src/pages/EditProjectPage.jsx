import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProjectForm from '../components/project/ProjectForm'; 
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
  const location = useLocation(); 
  const { user, loading: authLoading } = useContext(AuthContext);
  const [project, setProject] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!user && !authLoading) {
          toast.warn("Please log in to edit projects.");
          navigate("/login", { state: { from: location }, replace: true });
          setIsFetching(false);
          return;
      }
      if (!user) return;

      setIsFetching(true);
      try {
        const data = await getProjectById(projectId);
        if (data.owner._id !== user._id) {
          toast.error("You are not authorized to edit this project.");
          navigate(`/projects/${projectId}`, { replace: true });
          return;
        }
        setProject(data); 
      } catch (error) {
        toast.error("Failed to fetch project details for editing.");
        navigate("/dashboard", { replace: true });
      } finally {
        setIsFetching(false);
      }
    };

    if (!authLoading && projectId) { 
        fetchProject();
    } else if (!authLoading && !projectId) {
        toast.error("Project ID is missing.");
        navigate("/dashboard", { replace: true });
        setIsFetching(false);
    }
  }, [projectId, user, authLoading, navigate, location]);

  const handleSubmit = async (projectDataWithSkills) => {
    setIsSubmitting(true);
    try {
      const updated = await updateProject(projectId, projectDataWithSkills);
      toast.success("Project updated successfully!");
      navigate(`/projects/${updated._id}`);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Failed to update project.";
      toast.error(message);
      setIsSubmitting(false); 
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
                        isLoading={isSubmitting}
                        submitButtonText={isSubmitting ? "Saving..." : "Save Changes"}
                    />
                </Card.Body>
            </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EditProjectPage;