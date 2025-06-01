
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getProjectById, removeTeamMember, deleteProject } from '../services/projectService'; 
import { sendCollaborationRequest, getSentCollaborationRequests } from '../services/collaborationService';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import UserAvatar from '../components/user/UserAvatar';
import SkillTag from '../components/project/SkillTag';
import { toast } from 'react-toastify';
import { skillOptions as allSkillOptions } from '../utils/constants';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Image from 'react-bootstrap/Image';
import RBButton from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card';
import Modal from 'react-bootstrap/Modal'; 
import { 
    ArrowLeft, 
    PencilSquare, 
    PeopleFill, 
    ChatDotsFill, 
    BoxArrowInRight,
    BoxArrowLeft,
    ClockHistory,
    Trash3Fill 
} from 'react-bootstrap-icons';

const ProjectDetailsPage = () => {
  const { id: projectIdFromParams } = useParams();
  const { user: currentUser, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [project, setProject] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRequestingJoin, setIsRequestingJoin] = useState(false);
  const [isLeavingProject, setIsLeavingProject] = useState(false);
 
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [hasPendingJoinRequest, setHasPendingJoinRequest] = useState(false);
  const [checkingRequestStatus, setCheckingRequestStatus] = useState(false);

  const fetchProjectDataAndStatus = useCallback(async () => {
    if (!projectIdFromParams) {
        toast.error("Project ID is missing.");
        navigate("/projects", {replace: true});
        return;
    }
    setPageLoading(true); 
    setCheckingRequestStatus(true); 
    setError(null); 
    setHasPendingJoinRequest(false); 

    try {
      const projectData = await getProjectById(projectIdFromParams);
      setProject(projectData);

      if (currentUser?._id && projectData) {
        try {
            const sentRequests = await getSentCollaborationRequests(); 
            const pendingRequestForThisProject = sentRequests.find(
                req => 
                    (req.project?._id === projectData._id || req.project === projectData._id) && 
                    req.status === 'Pending' &&
                    req.requester === currentUser._id
            );
            setHasPendingJoinRequest(!!pendingRequestForThisProject);
        } catch (reqError) {
            console.error("Failed to fetch sent requests status:", reqError);
            setHasPendingJoinRequest(false); 
        }
      } else {
        setHasPendingJoinRequest(false);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Could not load project details.";
      setError(message); toast.error(message);
      if (err.response?.status === 404 || err.response?.status === 403) {
        navigate("/projects", {replace: true});
      }
    } finally {
      setPageLoading(false);
      setCheckingRequestStatus(false);
    }
  }, [projectIdFromParams, navigate, currentUser?._id]);

  useEffect(() => {
    if (!authLoading) {
         fetchProjectDataAndStatus();
    }
  }, [authLoading, fetchProjectDataAndStatus]);

  const handleRequestToJoin = async () => {
    if (!currentUser) {
      toast.info("Please log in to request to join projects.");
      navigate('/login', { state: { from: location }, replace: true });
      return;
    }
    if (!project?._id || hasPendingJoinRequest || isRequestingJoin) return;

    setIsRequestingJoin(true);
    try {
      await sendCollaborationRequest(project._id, { message: "I'd like to collaborate on this project!" });
      toast.success("Your request to join has been sent!");
      setHasPendingJoinRequest(true); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send join request. You may have already requested or are a member.");
    } finally {
      setIsRequestingJoin(false);
    }
  };

  const handleLeaveProject = async () => {
    if (!project?._id || !currentUser?._id) return;
    if (window.confirm(`Are you sure you want to leave the project "${project.title}"?`)) {
      setIsLeavingProject(true);
      try {
        await removeTeamMember(project._id, currentUser._id); 
        toast.success("You have successfully left the project.");
        fetchProjectDataAndStatus(); 
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to leave project.");
      } finally {
        setIsLeavingProject(false);
      }
    }
  };


  const handleDeleteProject = async () => {
    if (!project?._id || !isOwner) return; 
    
    setIsDeletingProject(true);
    try {
        await deleteProject(project._id);
        toast.success(`Project "${project.title}" has been deleted.`);
        setShowDeleteConfirmModal(false);
        navigate('/dashboard');
    } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete project.");
        setIsDeletingProject(false); 
    }
  };
  
  const isOwner = currentUser && project && project.owner?._id === currentUser._id;
  const isMember = currentUser && project && project.teamMembers?.some(member => member._id === currentUser._id);
  const canAccessChat = currentUser && project && (isOwner || isMember);
  const canRequest = currentUser && project && !isOwner && !isMember && !hasPendingJoinRequest && !checkingRequestStatus;
  const canLeave = currentUser && project && isMember && !isOwner;

  const canDeleteProject = isOwner && project && project.teamMembers?.length === 1 && project.teamMembers[0]?._id === currentUser._id;
  


  if (pageLoading || authLoading) return <div className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 200px)'}}><LoadingSpinner size="lg" /></div>;
  if (error && !project) return <div className="alert alert-danger text-center container mt-5">{error} <Link to="/projects">Go to Projects</Link></div>;
  if (!project) return <div className="text-center py-5 container text-template-muted">Project not found or you do not have access.</div>;

  const placeholderCover = "/ProjectDetailsImage.avif";

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-md-4">
        <Row className="mb-3 align-items-center px-2">
            <Col>
                <Link to="/projects" className="d-flex align-items-center text-template-muted text-decoration-none hover-underline small">
                    <ArrowLeft size={20} className="me-2" /> Back to Projects
                </Link>
            </Col>
            <Col xs="auto" className="d-flex flex-wrap gap-2 justify-content-end">
                {isOwner && (
                    <>
                        <RBButton variant="outline-warning" size="sm" as={Link} to={`/edit-project/${project._id}`} className="d-flex align-items-center btn-h8">
                            <PencilSquare size={14} className="me-1"/> Edit Project
                        </RBButton>
                         <RBButton variant="outline-info" size="sm" as={Link} to={`/team/${project._id}`} className="d-flex align-items-center btn-h8">
                            <PeopleFill size={14} className="me-1"/> Manage Team
                        </RBButton>
    
                        {canDeleteProject && ( 
                            <RBButton 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => setShowDeleteConfirmModal(true)} 
                                className="d-flex align-items-center btn-h8"
                                disabled={isDeletingProject}
                            >
                                <Trash3Fill size={14} className="me-1"/> Delete Project
                            </RBButton>
                        )}
                    </>
                )}
                {canAccessChat && (
                    <RBButton 
                        variant="outline-success" size="sm" as={Link} to={`/chat/${project._id}`}
                        className="d-flex align-items-center btn-h8"
                    >
                        <ChatDotsFill size={14} className="me-1"/> Group Chat
                    </RBButton>
                )}
            </Col>
        </Row>
        
        <Image src={placeholderCover} fluid className="rounded-xl mb-4 shadow-sm" style={{maxHeight: '450px', width: '100%', objectFit: 'cover'}} />

        <Row className="px-2 mb-4">
            <Col md={8}>
                <h1 className="h1 text-template-dark fw-bolder mb-2">{project.title}</h1>
                <div className="d-flex gap-2 mb-3 flex-wrap">
                    <Badge pill bg="info-subtle" text="info" className="border border-info-subtle border-opacity-50">
                        Status: {project.status}
                    </Badge>
                </div>
                <p className="text-template-muted lead fs-6 mb-0">{project.description}</p>
            </Col>
            <Col md={4} className="mt-3 mt-md-0 text-md-end d-flex flex-column align-items-md-end">
                {canRequest && (
                    <RBButton
                        variant="primary" size="lg"
                        className="btn-h12 fw-bold bg-template-accent text-template-dark border-0 w-100 w-md-auto"
                        onClick={handleRequestToJoin}
                        disabled={isRequestingJoin || checkingRequestStatus}
                    >
                        {isRequestingJoin || checkingRequestStatus ? <LoadingSpinner size="sm" as="span" animation="border" className="me-2"/> : <BoxArrowInRight size={18} className="me-2"/>} 
                        {checkingRequestStatus ? 'Checking Status...' : (isRequestingJoin ? 'Sending Request...' : 'Request to Join')}
                    </RBButton>
                )}
                {hasPendingJoinRequest && (
                    <RBButton variant="outline-secondary" size="lg" className="btn-h12 fw-bold w-100 w-md-auto" disabled>
                        <ClockHistory size={18} className="me-2"/> Join Request Pending
                    </RBButton>
                )}
                {isMember && !isOwner && ( 
                    <p className="text-success fw-semibold mt-2 mb-0 w-100 w-md-auto text-center text-md-end">You are a member of this project.</p>
                )}
                 {isOwner && (
                    <p className="text-info fw-semibold mt-2 mb-0 w-100 w-md-auto text-center text-md-end">You are the owner of this project.</p>
                )}
                {canLeave && (
                     <RBButton
                        variant="outline-danger"
                        onClick={handleLeaveProject}
                        disabled={isLeavingProject}
                        className="w-100 w-md-auto btn-h10 fw-medium mt-2"
                    >
                        {isLeavingProject ? <LoadingSpinner size="sm" as="span" animation="border" className="me-2"/> : <BoxArrowLeft size={18} className="me-2"/>} 
                        Leave Project
                    </RBButton>
                )}
            </Col>
        </Row>

        <Row className="mt-2 px-2">
            <Col md={12}>
                <h3 className="h5 text-template-dark fw-bold mb-2 pt-3">Required Skills</h3>
                <div className="d-flex flex-wrap gap-2">
                {(project.requiredSkills || []).length > 0 ? (
                    project.requiredSkills.map((skillValue, index) => {
                        const skillLabel = allSkillOptions.find(s => s.value === skillValue)?.label || skillValue;
                        return <SkillTag key={index} skill={skillLabel} />;
                    })
                ) : <p className="text-template-muted small">No specific skills listed.</p>}
                </div>
            
                <h3 className="h5 text-template-dark fw-bold mb-2 pt-4">Project Owner</h3>
                {project.owner ? (
                    <Link to={`/profile/${project.owner._id}`} className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 text-decoration-none hover-bg-light-darken mb-3">
                        <UserAvatar user={project.owner} size="lg" />
                        <div>
                            <p className="fw-medium text-template-dark mb-0">{project.owner.name}</p>
                            <p className="small text-template-muted text-truncate-2-lines mb-0" title={project.owner.bio}>{project.owner.bio || 'User profile.'}</p>
                        </div>
                    </Link>
                ) : <p className="text-template-muted small">Owner information not available.</p>}
            </Col>
        </Row>

        <Row className="mt-4 px-2">
            <Col>
                <h3 className="h5 text-template-dark fw-bold mb-3 pt-2">Team Members ({(project.teamMembers || []).length})</h3>
                {(project.teamMembers && project.teamMembers.length > 0) ? (
                    <Row xs={1} sm={2} lg={3} className="g-3">
                    {project.teamMembers.map(member => (
                        <Col key={member._id}>
                            <Card as={Link} to={`/profile/${member._id}`} className="text-decoration-none h-100 shadow-sm hover-shadow">
                                <Card.Body className="d-flex align-items-center gap-2 p-3">
                                    <UserAvatar user={member} size="md" />
                                    <div>
                                        <p className="small fw-medium text-template-dark mb-0 text-truncate">{member.name || 'N/A'}</p>
                                        <p className="small text-template-muted mb-0 text-truncate">{member.email || 'Role not specified'}</p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                    </Row>
                ) : <p className="text-template-muted small">No other team members (besides the owner, if applicable).</p>}
            </Col>
        </Row>


        <Modal show={showDeleteConfirmModal} onHide={() => {if(!isDeletingProject) setShowDeleteConfirmModal(false);}} centered backdrop="static">
            <Modal.Header closeButton={!isDeletingProject}>
                <Modal.Title className="h5 text-danger d-flex align-items-center">
                    <Trash3Fill size={20} className="me-2"/> Confirm Project Deletion
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you absolutely sure you want to delete the project "<strong>{project.title}</strong>"?</p>
                <p className="text-danger fw-bold">This action is irreversible and will permanently remove the project and all its associated data.</p>
                
                {isOwner && project.teamMembers && project.teamMembers.length > 1 && 
                 !(project.teamMembers.length === 1 && project.teamMembers[0]?._id === currentUser?._id) &&
                    (
                    <p className="text-warning mt-2 small">
                        <strong>Warning:</strong> This project has other members. Deleting it will remove their access and the project data for everyone involved.
                    </p>
                )}
            </Modal.Body>
            <Modal.Footer>
                <RBButton variant="secondary" onClick={() => setShowDeleteConfirmModal(false)} disabled={isDeletingProject}>
                    Cancel
                </RBButton>
                <RBButton variant="danger" onClick={handleDeleteProject} disabled={isDeletingProject}>
                    {isDeletingProject ? <LoadingSpinner size="sm" as="span" animation="border" className="me-2"/> : null}
                    Yes, Delete Project
                </RBButton>
            </Modal.Footer>
        </Modal>
    </Container>
  );
};

export default ProjectDetailsPage;