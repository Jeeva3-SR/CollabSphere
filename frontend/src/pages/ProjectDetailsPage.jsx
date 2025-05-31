// frontend/src/pages/ProjectDetailsPage.jsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getProjectById, removeTeamMember } from '../services/projectService';
import { sendCollaborationRequest, getSentCollaborationRequests } from '../services/collaborationService'; // Added getSentCollaborationRequests
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import UserAvatar from '../components/user/UserAvatar';
import SkillTag from '../components/project/SkillTag';
import { toast } from 'react-toastify';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Image from 'react-bootstrap/Image';
import RBButton from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card';

import { 
    ArrowLeft, 
    PencilSquare, 
    PeopleFill, 
    ChatDotsFill, 
    BoxArrowInRight,
    BoxArrowLeft,
    ClockHistory // Icon for pending request
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
  const [hasPendingJoinRequest, setHasPendingJoinRequest] = useState(false);
  const [checkingRequestStatus, setCheckingRequestStatus] = useState(false); // For loading state of pending request check

  const fetchProjectDataAndStatus = useCallback(async () => {
    if (!projectIdFromParams) {
        toast.error("Project ID is missing.");
        navigate("/projects", {replace: true});
        return;
    }
    setPageLoading(true); 
    setCheckingRequestStatus(true); // Start checking status
    setError(null); 
    setHasPendingJoinRequest(false); // Reset pending status

    try {
      const projectData = await getProjectById(projectIdFromParams);
      setProject(projectData);

      // After fetching project, check if current user has a pending request for THIS project
      if (currentUser && projectData) {
        try {
            const sentRequests = await getSentCollaborationRequests(); // Fetch all sent requests by current user
            const pendingRequestForThisProject = sentRequests.find(
                req => 
                    (req.project?._id === projectData._id || req.project === projectData._id) && 
                    req.status === 'Pending'
            );
            setHasPendingJoinRequest(!!pendingRequestForThisProject);
            //console.log("Pending request for this project:", !!pendingRequestForThisProject);
        } catch (reqError) {
           // console.error("Failed to fetch sent requests status:", reqError);
            // Don't block page load for this, assume no pending request if fetch fails
            setHasPendingJoinRequest(false); 
        }
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
  }, [projectIdFromParams, navigate, currentUser]); // currentUser is a dependency now

  useEffect(() => {
    // Only fetch if auth is not loading AND either currentUser exists OR it's a public project view (where currentUser might be null)
    // For checking pending requests, currentUser must exist.
    if (!authLoading) {
         fetchProjectDataAndStatus();
    }
  }, [authLoading, currentUser, fetchProjectDataAndStatus]); // fetchProjectDataAndStatus is memoized


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
      setHasPendingJoinRequest(true); // Optimistically update UI
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send join request. You may have already requested or are a member.");
    } finally {
      setIsRequestingJoin(false);
    }
  };

  const handleLeaveProject = async () => {
    if (!project?._id || !currentUser?._id) return;
    if (window.confirm("Are you sure you want to leave this project?")) {
      setIsLeavingProject(true);
      try {
        await removeTeamMember(project._id, currentUser._id); 
        toast.success("You have successfully left the project.");
        navigate('/dashboard'); 
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to leave project.");
      } finally {
        setIsLeavingProject(false);
      }
    }
  };
  
  const isOwner = currentUser && project && project.owner?._id === currentUser._id;
  const isMember = currentUser && project && project.teamMembers?.some(member => member._id === currentUser._id);
  const canAccessChat = currentUser && project && (isOwner || isMember);
  const canRequest = currentUser && project && !isOwner && !isMember && !hasPendingJoinRequest; // Condition relies on hasPendingJoinRequest state
  const canLeave = currentUser && project && isMember && !isOwner;

  if (pageLoading || authLoading) return <div className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 200px)'}}><LoadingSpinner size="lg" /></div>;
  if (error && !project) return <div className="alert alert-danger text-center container mt-5">{error} <Link to="/projects">Go to Projects</Link></div>; // Show error only if project failed to load entirely
  if (!project) return <div className="text-center py-5 container text-template-muted">Project not found or you do not have access.</div>; // Fallback if project is null after loading

  const placeholderCover = "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=60";

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
        
        <Image src={project.coverImage || placeholderCover} fluid className="rounded-xl mb-4 shadow-sm" style={{maxHeight: '450px', width: '100%', objectFit: 'cover'}} />

        <Row className="px-2 mb-4">
            <Col md={8}>
                <h1 className="h1 text-template-dark fw-bolder mb-2">{project.title}</h1>
                <div className="d-flex gap-2 mb-3 flex-wrap">
                    <Badge pill bg={project.isPublic ? 'success-subtle' : 'danger-subtle'} text={project.isPublic ? 'success' : 'danger'} className="border border-opacity-50">
                        {project.isPublic ? 'Public Project' : 'Private Project'}
                    </Badge>
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
                        disabled={isRequestingJoin || checkingRequestStatus} // Disable while checking status too
                    >
                        {isRequestingJoin ? <LoadingSpinner size="sm" /> : <BoxArrowInRight size={18} className="me-2"/>} 
                        Request to Join
                    </RBButton>
                )}
                {hasPendingJoinRequest && ( // If user has a pending request
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
                {canLeave && ( // Leave button for members (not owners)
                     <RBButton
                        variant="outline-danger"
                        onClick={handleLeaveProject}
                        disabled={isLeavingProject}
                        className="w-100 w-md-auto btn-h10 fw-medium mt-2" // Added mt-2 for spacing
                    >
                        {isLeavingProject ? <LoadingSpinner size="sm" /> : <BoxArrowLeft size={18} className="me-2"/>} 
                        Leave Project
                    </RBButton>
                )}
            </Col>
        </Row>

        <Row className="mt-2 px-2">
            <Col md={12}> {/* Changed to full width for better layout on smaller screens before wrapping */}
                <h3 className="h5 text-template-dark fw-bold mb-2 pt-3">Required Skills</h3>
                <div className="d-flex flex-wrap gap-2">
                {(project.requiredSkills || []).length > 0 ? (
                    project.requiredSkills.map((skill, index) => <SkillTag key={index} skill={skill} />)
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
    </Container>
  );
};

export default ProjectDetailsPage;