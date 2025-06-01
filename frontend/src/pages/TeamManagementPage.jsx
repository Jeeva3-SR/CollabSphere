import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getProjectById, removeTeamMember } from '../services/projectService';
import { getAllUsers } from '../services/userService';
import { sendInvitation } from '../services/collaborationService';
import UserAvatar from '../components/user/UserAvatar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Form from 'react-bootstrap/Form';
import RBButton from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import ReactSelect from 'react-select';
import Badge from 'react-bootstrap/Badge';
import { ArrowLeft, PersonDashFill, PersonPlusFill, ShieldFillExclamation} from 'react-bootstrap-icons';

const TeamManagementPage = () => {
  const { projectId } = useParams();
  const { user: currentUser, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsersOptions, setAllUsersOptions] = useState([]);
  const [selectedUserToInvite, setSelectedUserToInvite] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false); 
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null); 


  const fetchProjectAndUsers = useCallback(async () => {
    if (!currentUser || !projectId) return; 
    setPageLoading(true); setError(null);
    try {
      const projectData = await getProjectById(projectId);
      if (!projectData || (currentUser._id !== projectData.owner._id)) {
        toast.error("Unauthorized to manage this team or project not found.");
        navigate(projectData ? `/projects/${projectId}` : "/dashboard", {replace: true});
        setPageLoading(false);
        return;
      }
      setProject(projectData);
      setTeamMembers(projectData.teamMembers || []);

      const usersData = await getAllUsers();
      const existingMemberIds = (projectData.teamMembers || []).map(tm => tm._id).concat(projectData.owner._id);
      const availableUsers = usersData
        .filter(u => !existingMemberIds.includes(u._id))
        .map(u => ({ value: u._id, label: `${u.name} (${u.email})`, avatar: u.avatar }));
      setAllUsersOptions(availableUsers);

    } catch (err) {
      const message = err.response?.data?.message || "Could not load team data.";
      setError(message); toast.error(message);
      if (err.response?.status === 404 || err.response?.status === 403) {
        navigate(`/projects`, {replace: true});
      }
    } finally {
      setPageLoading(false);
    }
  }, [projectId, currentUser, navigate]);
  
  useEffect(() => {
    if (!authLoading) {
        fetchProjectAndUsers();
    }
  }, [authLoading, fetchProjectAndUsers]);

  const initiateRemoveMember = (memberId, memberName) => {
    if (!project || !currentUser || currentUser._id !== project.owner?._id) {
        toast.error("Unauthorized action.");
        return;
    }
    if (memberId === project.owner._id) {
        toast.error("Project owner cannot be removed.");
        return;
    }
    if (!memberId) {
        toast.error("Internal Error: Member ID missing.");
        return;
    }
    setMemberToRemove({ id: memberId, name: memberName });
    setShowRemoveMemberModal(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove || !memberToRemove.id || !project?._id) return;

    setIsActionLoading(true);
    try {
      await removeTeamMember(project._id, memberToRemove.id); 
      toast.success(`${memberToRemove.name || 'Team member'} removed successfully.`);
      setShowRemoveMemberModal(false);
      await fetchProjectAndUsers(); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member.");
    } finally {
      setIsActionLoading(false);
      if (!error) setMemberToRemove(null); 
    }
  };

  const handleInviteUser = async () => {
    if (!selectedUserToInvite) { toast.warn("Please select a user to invite."); return; }
    setIsActionLoading(true);
    try {
        await sendInvitation(projectId, selectedUserToInvite.value);
        toast.success(`Invitation sent to ${selectedUserToInvite.label.split(' (')[0]}.`);
        setSelectedUserToInvite(null);
        await fetchProjectAndUsers();
    } catch (err) {
        toast.error(err.response?.data?.message || "Failed to send invitation.");
    } finally {
        setIsActionLoading(false);
    }
  };
  
  const CustomOptionForUserSelect = ({ innerProps, isDisabled, data }) =>
    !isDisabled ? (
      <div {...innerProps} className="d-flex align-items-center p-2 react-select-option-hover">
        <UserAvatar user={{avatar: data.avatar, name: data.label.split(' (')[0]}} size="sm" className="me-2" />
        <span className="small">{data.label}</span>
      </div>
    ) : null;

  if (pageLoading || authLoading) return <div className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 200px)'}}><LoadingSpinner size="lg" /></div>;
  if (error && !project) return <div className="alert alert-danger text-center container mt-5">{error} <Link to="/dashboard">Go to Dashboard</Link></div>;
  if (!project) return <div className="text-center py-5 container text-template-muted">Project not found or you do not have access to manage this team.</div>;

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-md-4">
        <Row className="mb-4 align-items-center px-2">
            <Col>
                <RBButton variant="link" onClick={() => navigate(`/projects/${projectId}`)} className="d-flex align-items-center text-template-muted text-decoration-none p-0 hover-underline">
                    <ArrowLeft size={20} className="me-2" /> Back to Project
                </RBButton>
            </Col>
            <Col xs={12} md="auto" className="text-center text-md-end mt-2 mt-md-0">
                 <h1 className="h3 text-template-dark fw-bolder mb-0">Team Management</h1>
                 <p className="text-template-muted small mb-0">{project.title}</p>
            </Col>
        </Row>

        <Card className="shadow-lg border-light">
            <Card.Body className="p-4 p-sm-5">
                <div className="mb-5 pb-4 border-bottom">
                    <h2 className="h5 fw-semibold text-template-dark mb-3">Invite New Members</h2>
                    <Row className="g-2 align-items-end">
                        <Col md>
                            <Form.Label htmlFor="userInviteSelectTeamPage" className="small text-template-dark fw-medium">Search and select user to invite:</Form.Label>
                            <ReactSelect
                                inputId="userInviteSelectTeamPage"
                                options={allUsersOptions}
                                value={selectedUserToInvite}
                                onChange={setSelectedUserToInvite}
                                placeholder="Search by name or email..."
                                isClearable
                                components={{ Option: CustomOptionForUserSelect }}
                                className="basic-single"
                                classNamePrefix="react-select"
                                styles={{ control: base => ({ ...base, minHeight: '56px', borderRadius: '0.75rem' })}}
                                menuPortalTarget={document.body}
                            />
                        </Col>
                        <Col xs="auto">
                            <RBButton 
                                onClick={handleInviteUser} 
                                disabled={!selectedUserToInvite || isActionLoading} 
                                variant="primary" 
                                className="btn-h14 w-100 w-md-auto bg-template-accent text-template-dark fw-bold border-0"
                            >
                                {isActionLoading && !memberToRemove ? <LoadingSpinner size="sm" color="dark" as="span" animation="border"/> : <PersonPlusFill size={18} className="me-1"/>} 
                                {isActionLoading && !memberToRemove ? 'Inviting...' : 'Send Invite'}
                            </RBButton>
                        </Col>
                    </Row>
                </div>

                
                <div>
                    <h2 className="h5 fw-semibold text-template-dark mb-3">Current Team Members ({teamMembers.length})</h2>
                    {teamMembers.length > 0 ? (
                    <ListGroup variant="flush">
                        {teamMembers.map(member => (
                        <ListGroup.Item key={member._id} className="d-flex justify-content-between align-items-center p-3 px-0">
                            <Link to={`/profile/${member._id}`} className="d-flex align-items-center gap-3 text-decoration-none group">
                                <UserAvatar user={member} size="md" />
                                <div>
                                    <p className="small fw-medium text-template-dark mb-0 group-hover-text-primary">{member.name}</p>
                                    <p className="small text-template-muted mb-0">{member.email}</p>
                                    {member._id === project.owner?._id && <Badge pill bg="warning-subtle" text="warning-emphasis" className="small border border-warning-subtle mt-1">Owner</Badge>}
                                </div>
                            </Link>
                            {member._id !== project.owner?._id && (
                            <RBButton 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => initiateRemoveMember(member._id, member.name)}
                                disabled={isActionLoading}
                                className="btn-h8 p-1"
                                title={`Remove ${member.name}`}
                            >
                                <PersonDashFill size={16} />
                            </RBButton>
                            )}
                        </ListGroup.Item>
                        ))}
                    </ListGroup>
                    ) : (
                    <p className="text-template-muted small">No members in this team yet (besides the owner).</p>
                    )}
                </div>
            </Card.Body>
        </Card>

        
        <Modal show={showRemoveMemberModal} onHide={() => { if(!isActionLoading) setShowRemoveMemberModal(false); }} centered backdrop="static">
            <Modal.Header closeButton={!isActionLoading}>
                <Modal.Title className="h5 text-danger d-flex align-items-center">
                    <ShieldFillExclamation size={22} className="me-2 text-danger"/> Confirm Member Removal
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure you want to remove 
                    <strong> {memberToRemove?.name || 'this member'} </strong> 
                    from the project "<strong>{project?.title}</strong>"?
                </p>
                <p className="small text-muted">This action will revoke their access to the project.</p>
            </Modal.Body>
            <Modal.Footer>
                <RBButton variant="secondary" onClick={() => setShowRemoveMemberModal(false)} disabled={isActionLoading}>
                    Cancel
                </RBButton>
                <RBButton 
                    variant="danger" 
                    onClick={confirmRemoveMember} 
                    disabled={isActionLoading}
                >
                    {isActionLoading && memberToRemove ? <LoadingSpinner size="sm" as="span" animation="border" className="me-2"/> : null}
                    Yes, Remove Member
                </RBButton>
            </Modal.Footer>
        </Modal>
    </Container>
  );
};

export default TeamManagementPage;