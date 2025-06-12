// src/pages/ProjectDetailsPage.js
import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
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
import { Alert } from 'react-bootstrap'; // Import Alert directly
import { 
    ArrowLeft, 
    PencilSquare, 
    PeopleFill, 
    ChatDotsFill, 
    BoxArrowInRight,
    BoxArrowLeft,
    ClockHistory,
    Trash3Fill,
    Kanban
    // PersonXFill is no longer needed here as remove button is gone
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
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  // Removed states related to direct member removal from this page
  // const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  // const [memberToRemove, setMemberToRemove] = useState(null);
  // const [isRemovingMember, setIsRemovingMember] = useState(false);

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

      if (currentUser?._id && projectData?._id) {
        try {
            const sentRequests = await getSentCollaborationRequests(); 
            const pendingRequestForThisProject = sentRequests.find(
                req => 
                    (req.project?._id === projectData._id || req.project === projectData._id) && 
                    req.status === 'Pending' &&
                    (req.requester?._id === currentUser._id || req.requester === currentUser._id)
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
      setError(message); 
      toast.error(message);
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
  
  const handleConfirmLeaveProject = async () => {
    if (!project?._id || !currentUser?._id || isLeavingProject) return;
    
    setIsLeavingProject(true);
    try {
      await removeTeamMember(project._id, currentUser._id); // removeTeamMember is from projectService
      toast.success("You have successfully left the project.");
      setShowLeaveConfirmModal(false);
      fetchProjectDataAndStatus(); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave project.");
    } finally {
      setIsLeavingProject(false);
    }
  };

  const handleDeleteProject = async () => {
    // Permission check already handled by canOwnerDeleteProjectIfSoleMember
    if (!project?._id || !canOwnerDeleteProjectIfSoleMember || isDeletingProject) return; 
    
    setIsDeletingProject(true);
    try {
        await deleteProject(project._id);
        toast.success(`Project "${project.title}" has been deleted.`);
        setShowDeleteConfirmModal(false);
        navigate('/dashboard', {replace: true});
    } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete project.");
    } finally {
        setIsDeletingProject(false); 
    }
  };

  // Removed direct member removal handlers from this page
  // const handleOpenRemoveMemberModal = (member) => { ... };
  // const handleConfirmRemoveMember = async () => { ... };
  
  const isOwner = useMemo(() => currentUser && project && project.owner?._id === currentUser._id, [currentUser, project]);
  const isMember = useMemo(() => currentUser && project && project.teamMembers?.some(member => member._id === currentUser._id), [currentUser, project]);
  
  const canAccessWorkspaceAndChat = useMemo(() => currentUser && project && (isOwner || isMember), [currentUser, project, isOwner, isMember]);
  const canRequestToJoin = useMemo(() => currentUser && project && !isOwner && !isMember && !hasPendingJoinRequest && !checkingRequestStatus, [currentUser, project, isOwner, isMember, hasPendingJoinRequest, checkingRequestStatus]);
  const canLeaveProject = useMemo(() => currentUser && project && isMember && !isOwner, [currentUser, project, isMember, isOwner]);
  
  // Specific condition for project deletion by owner if they are the ONLY member
  const canOwnerDeleteProjectIfSoleMember = useMemo(() => {
    return isOwner && project && project.teamMembers?.length === 1 && project.teamMembers[0]?._id === currentUser?._id;
  }, [isOwner, project, currentUser?._id]);


  if (pageLoading || authLoading) return <div className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 200px)'}}><LoadingSpinner size="lg" /></div>;
  if (error && !project) return <Container className="mt-5"><Alert variant="danger" className="text-center">{error} <Link to="/projects">Go to Projects</Link></Alert></Container>;
  if (!project) return <Container className="text-center py-5 text-muted">Project not found or you do not have access.</Container>;

  const placeholderCover = "/ProjectDetailsImage.avif";

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-md-3">
        <Row className="mb-3 align-items-center">
            <Col>
                <Link to="/projects" className="d-flex align-items-center text-secondary text-decoration-none small">
                    <ArrowLeft size={18} className="me-2" /> Back to Projects
                </Link>
            </Col>
            <Col xs="auto" className="d-flex flex-wrap gap-2 justify-content-end">
                {isOwner && (
                    <>
                        <RBButton variant="outline-primary" size="sm" as={Link} to={`/edit-project/${project._id}`} className="d-flex align-items-center">
                            <PencilSquare size={14} className="me-1"/> Edit Project
                        </RBButton>
                         <RBButton 
                            variant="outline-secondary" 
                            size="sm" 
                            as={Link}
                            to={`/team/${project._id}`} 
                            className="d-flex align-items-center"
                         >
                            <PeopleFill size={14} className="me-1"/> Manage Team
                        </RBButton>
                        {/* DELETE PROJECT BUTTON - Only if owner and sole member */}
                        {canOwnerDeleteProjectIfSoleMember && ( 
                            <RBButton 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => setShowDeleteConfirmModal(true)} 
                                className="d-flex align-items-center"
                                disabled={isDeletingProject}
                            >
                                <Trash3Fill size={14} className="me-1"/> Delete Project
                            </RBButton>
                        )}
                    </>
                )}
                {canAccessWorkspaceAndChat && (
                    <>
                        <RBButton 
                            variant="outline-success" size="sm" as={Link} to={`/chat/${project._id}`}
                            className="d-flex align-items-center"
                        >
                            <ChatDotsFill size={14} className="me-1"/> Group Chat
                        </RBButton>
                        <RBButton 
                            variant="primary"
                            size="sm"
                            as={Link}
                            to={`/project/${project._id}/workspace`}
                            className="d-flex align-items-center" 
                        >
                           <Kanban size={14} className="me-1" /> Project Workspace 
                        </RBButton>
                    </>
                )}
            </Col>
        </Row>
        
        <Image 
            src={project.coverImage || placeholderCover} 
            onError={(e) => { e.target.onerror = null; e.target.src = placeholderCover; }}
            fluid 
            className="rounded-3 mb-4 shadow-sm" 
            style={{maxHeight: '400px', width: '100%', objectFit: 'cover'}} 
        />

        <Row className="mb-4">
            <Col md={8}>
                <h1 className="h2 text-dark fw-bold mb-2">{project.title}</h1>
                <div className="d-flex gap-2 mb-3 flex-wrap">
                    <Badge pill bg="info" text="white">
                        Status: {project.status}
                    </Badge>
                </div>
                <p className="text-secondary lead fs-6 mb-0">{project.description}</p>
            </Col>
            <Col md={4} className="mt-3 mt-md-0 text-md-end d-flex flex-column align-items-md-end justify-content-start">
                {canRequestToJoin && (
                    <RBButton
                        variant="success" size="lg"
                        className="fw-bold w-100 w-md-auto shadow-sm"
                        onClick={handleRequestToJoin}
                        disabled={isRequestingJoin || checkingRequestStatus}
                    >
                        {isRequestingJoin || checkingRequestStatus ? <LoadingSpinner size="sm" as="span" animation="border" className="me-2"/> : <BoxArrowInRight size={18} className="me-2"/>} 
                        {checkingRequestStatus ? 'Checking...' : (isRequestingJoin ? 'Sending...' : 'Request to Join')}
                    </RBButton>
                )}
                {hasPendingJoinRequest && (
                    <RBButton variant="outline-secondary" size="lg" className="fw-bold w-100 w-md-auto" disabled>
                        <ClockHistory size={18} className="me-2"/> Request Pending
                    </RBButton>
                )}
                {isMember && !isOwner && ( 
                    <div className="alert alert-success py-2 px-3 small w-100 w-md-auto text-center text-md-start">You are a member of this project.</div>
                )}
                 {isOwner && (
                    <div className="alert alert-info py-2 px-3 small w-100 w-md-auto text-center text-md-start">You are the owner of this project.</div>
                )}
                {canLeaveProject && (
                     <RBButton
                        variant="outline-danger"
                        onClick={() => setShowLeaveConfirmModal(true)}
                        disabled={isLeavingProject}
                        className="w-100 w-md-auto fw-medium mt-2 btn-sm"
                    >
                        {isLeavingProject ? <LoadingSpinner size="sm" as="span" animation="border" className="me-2"/> : <BoxArrowLeft size={16} className="me-2"/>} 
                        Leave Project
                    </RBButton>
                )}
            </Col>
        </Row>

         <Row className="mt-2">
            <Col md={12}>
                <h3 className="h5 text-dark fw-semibold mb-2 pt-3 border-top">Required Skills</h3>
                <div className="d-flex flex-wrap gap-2">
                {(project.requiredSkills || []).length > 0 ? (
                    project.requiredSkills.map((skillValue, index) => {
                        const skillLabel = allSkillOptions.find(s => s.value === skillValue)?.label || skillValue;
                        return <SkillTag key={index} skill={skillLabel} />;
                    })
                ) : <p className="text-secondary small">No specific skills listed.</p>}
                </div>
            
                <h3 className="h5 text-dark fw-semibold mb-2 pt-4 mt-3 border-top">Project Owner</h3>
                {project.owner ? (
                    <Link to={`/profile/${project.owner._id}`} className="d-flex align-items-center gap-3 p-3 bg-white rounded-3 text-decoration-none shadow-hover mb-3 border">
                        <UserAvatar user={project.owner} size="lg" />
                        <div>
                            <p className="fw-bold text-dark mb-0">{project.owner.name}</p>
                            <p className="small text-secondary text-truncate mb-0" style={{maxWidth: '300px'}} title={project.owner.bio}>{project.owner.bio || 'User profile.'}</p>
                        </div>
                    </Link>
                ) : <p className="text-secondary small">Owner information not available.</p>}
            </Col>
        </Row>
<Row className="mt-4">
            <Col>
                <div className="d-flex align-items-baseline mb-3 pt-2 border-top"> {/* Use flex for alignment */}
                    <h3 className="h5 text-dark fw-semibold mb-0"> {/* Remove mb-3 from h3 */}
                        Team Members
                    </h3>
                    {/* Display count only if there are members */}
                    {(project.teamMembers && project.teamMembers.length > 0) && (
                        <span className="ms-2 text-muted small">
                            ({project.teamMembers.length})
                        </span>
                    )}
                </div>
                {(project.teamMembers && project.teamMembers.length > 0) ? (
                    <Row xs={1} sm={2} lg={3} xl={4} className="g-3">
                    {project.teamMembers.map(member => (
                        <Col key={member._id}>
                            <Card as={Link} to={`/profile/${member._id}`} className="text-decoration-none h-100 shadow-sm hover-lift border-0">
                                <Card.Body className="d-flex align-items-center gap-2 p-3">
                                    <UserAvatar user={member} size="md" />
                                    <div>
                                        <p className="small fw-bold text-dark mb-0 text-truncate">{member.name || 'N/A'}</p>
                                        <p className="small text-secondary mb-0 text-truncate">{member.title || member.email || 'Team Member'}</p>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                    </Row>
                ) : <p className="text-secondary small">No team members currently on this project (other than the owner, if applicable).</p>}
            </Col>
        </Row>

        {/* Leave Project Confirmation Modal (no changes needed) */}
        <Modal show={showLeaveConfirmModal} onHide={() => {if(!isLeavingProject) setShowLeaveConfirmModal(false);}} centered>
            <Modal.Header closeButton={!isLeavingProject}>
                <Modal.Title className="h5 text-warning d-flex align-items-center">
                    <BoxArrowLeft size={22} className="me-2"/> Confirm Leave Project
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure you want to leave the project "<strong>{project.title}</strong>"?</p>
                <p className="text-muted small">You will lose access to this project's workspace and group chat. This action cannot be undone by yourself.</p>
            </Modal.Body>
            <Modal.Footer>
                <RBButton variant="secondary" onClick={() => setShowLeaveConfirmModal(false)} disabled={isLeavingProject}>
                    Cancel
                </RBButton>
                <RBButton variant="danger" onClick={handleConfirmLeaveProject} disabled={isLeavingProject}>
                    {isLeavingProject ? <LoadingSpinner size="sm" as="span" animation="border" className="me-2"/> : null}
                    Yes, Leave Project
                </RBButton>
            </Modal.Footer>
        </Modal>

        {/* Delete Project Modal (no changes in structure, but display logic for button changed) */}
        <Modal show={showDeleteConfirmModal} onHide={() => {if(!isDeletingProject) setShowDeleteConfirmModal(false);}} centered backdrop="static">
            <Modal.Header closeButton={!isDeletingProject}>
                <Modal.Title className="h5 text-danger d-flex align-items-center">
                    <Trash3Fill size={20} className="me-2"/> Confirm Project Deletion
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you absolutely sure you want to delete the project "<strong>{project.title}</strong>"?</p>
                <p className="text-danger fw-bold">This action is irreversible and will permanently remove all project data, including tasks and chat history.</p>
                
                {/* This warning is still relevant if the condition for showing delete button changes */}
                {isOwner && project.teamMembers && project.teamMembers.length > 1 && 
                 !(project.teamMembers.length === 1 && project.teamMembers[0]?._id === currentUser?._id) &&
                    (
                    <Alert variant="warning" className="mt-2 small">
                        <strong>Warning:</strong> This project has other team members. Deleting it will remove their access and all associated project data for everyone. Consider removing them first via "Manage Team".
                    </Alert>
                )}
                 {isOwner && project.teamMembers && project.teamMembers.length > 0 && 
                    !(project.teamMembers.length === 1 && project.teamMembers[0]?._id === currentUser?._id) &&
                    !canOwnerDeleteProjectIfSoleMember && (
                        <Alert variant="info" className="mt-2 small">
                            To delete this project, please remove all other team members first via the "Manage Team" page.
                        </Alert>
                    )
                }
            </Modal.Body>
            <Modal.Footer>
                <RBButton variant="secondary" onClick={() => setShowDeleteConfirmModal(false)} disabled={isDeletingProject}>
                    Cancel
                </RBButton>
                <RBButton variant="danger" onClick={handleDeleteProject} disabled={isDeletingProject || !canOwnerDeleteProjectIfSoleMember}>
                    {isDeletingProject ? <LoadingSpinner size="sm" as="span" animation="border" className="me-2"/> : null}
                    Yes, Delete Project
                </RBButton>
            </Modal.Footer>
        </Modal>

        {/* REMOVED the "Remove Member" modal from this page */}
        {/* {memberToRemove && ( ... )} */}
    </Container>
  );
};

export default ProjectDetailsPage;