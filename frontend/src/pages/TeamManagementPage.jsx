// frontend/src/pages/TeamManagementPage.jsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'; // useLocation is correctly imported
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
import ReactSelect from 'react-select';
import { ArrowLeft, PersonDashFill, PersonPlusFill, EnvelopePlusFill } from 'react-bootstrap-icons';

const TeamManagementPage = () => {
  const { projectId } = useParams();
  const { user: currentUser, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation(); // <<< This is correctly defined from the hook

  const [project, setProject] = useState(null);
  const [allUsersOptions, setAllUsersOptions] = useState([]);
  const [selectedUserToInvite, setSelectedUserToInvite] = useState(null);
  
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [invitingUser, setInvitingUser] = useState(false);

  const fetchProjectAndUsers = useCallback(async () => {
    if (!currentUser?._id || !projectId) {
      // Use the 'location' from useLocation() if needed for state in navigate
      if(!currentUser?._id && !authLoading && projectId) { 
          toast.info("Please log in to manage teams.");
          navigate("/login", { state: { from: location }, replace: true }); // 'location' here is from the hook
      }
      if (!projectId) {
          console.error("TeamManagementPage: ProjectId is missing.");
          toast.error("Project ID is missing. Cannot load team management.");
          navigate("/projects", { replace: true }); 
      }
      setPageLoading(false);
      return;
    }
    
    //console.log(`TeamManagementPage: Fetching project ${projectId}. Current user: ${currentUser._id}`);
    setPageLoading(true); setError(null);

    try {
      const projectData = await getProjectById(projectId);
      //console.log("TeamManagementPage: Fetched projectData:", projectData);
      if (!projectData) {
          toast.error("Project not found.");
          navigate("/projects", { replace: true }); return;
      }
      if (currentUser._id !== projectData.owner._id) {
        toast.error("You are not authorized to manage this team.");
        navigate(`/projects/${projectId}`, { replace: true }); return;
      }
      setProject(projectData);

      const usersData = await getAllUsers();
      const ownerId = projectData.owner?._id?.toString();
      const teamMemberIds = (projectData.teamMembers || []).map(tm => tm._id?.toString()).filter(Boolean);
      const currentTeamAndOwnerIds = ownerId ? [ownerId, ...teamMemberIds] : [...teamMemberIds];
      const uniqueCurrentTeamAndOwnerIds = [...new Set(currentTeamAndOwnerIds)];

      const availableUsers = usersData
        .filter(u => u._id && !uniqueCurrentTeamAndOwnerIds.includes(u._id.toString()))
        .map(u => ({ value: u._id, label: `${u.name} (${u.email})`, avatar: u.avatar }));
      setAllUsersOptions(availableUsers);

    } catch (err) {
      const message = err.response?.data?.message || "Could not load team data.";
      setError(message); toast.error(message);
      console.error("TeamManagementPage: Error in fetchProjectAndUsers -", err);
    } finally {
      setPageLoading(false);
    }
  // --- VVV CORRECTED DEPENDENCY ARRAY VVV ---
  // `location` (from useLocation) is stable and typically doesn't need to be a dependency 
  // unless the logic *inside* this useCallback specifically reacts to location changes.
  // Here, it's only used in the navigate call, which is fine.
  }, [projectId, currentUser, navigate, authLoading]); 
  // --- AAA CORRECTED DEPENDENCY ARRAY AAA ---
  
  useEffect(() => {
    if (!authLoading && currentUser) {
        fetchProjectAndUsers();
    }
  }, [authLoading, currentUser, fetchProjectAndUsers]);


  const handleRemoveMember = async (memberIdToRemove, memberName) => {
    if (!project || !project.owner || !currentUser || currentUser._id !== project.owner._id) {
        toast.error("Unauthorized action or project data missing.");
        console.error("TeamManagementPage: Pre-condition for remove failed. Project:", project, "CurrentUser:", currentUser);
        return;
    }
    if (memberIdToRemove === project.owner._id) {
        toast.error("Project owner cannot be removed from the team via this action.");
        return;
    }
    if (!memberIdToRemove) {
        toast.error("Internal Error: Member ID to remove is missing.");
        console.error("TeamManagementPage: handleRemoveMember called with undefined memberIdToRemove.");
        return;
    }

    //console.log(`TeamManagementPage: Confirming removal of member ${memberIdToRemove} (Name: ${memberName}) from project ${project._id}`); 

    if (window.confirm(`Are you sure you want to remove ${memberName || 'this member'} from the project "${project.title}"?`)) {
      setRemovingMemberId(memberIdToRemove);
      try {
        await removeTeamMember(project._id, memberIdToRemove); 
        toast.success(`${memberName || 'Team member'} removed successfully.`);
        fetchProjectAndUsers(); 
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to remove member.");
      } finally {
        setRemovingMemberId(null);
      }
    } else {
        console.log("TeamManagementPage: User cancelled member removal.");
    }
  };

  const handleInviteUser = async () => {
   // console.log("TeamManagementPage: handleInviteUser triggered.");
   // console.log("TeamManagementPage: selectedUserToInvite:", selectedUserToInvite);
    //console.log("TeamManagementPage: project:", project);

    if (!selectedUserToInvite || !selectedUserToInvite.value) { 
      toast.warn("Please select a user to invite."); return; 
    }
    if (!project || !project._id) { 
      toast.error("Project data not loaded. Cannot send invite."); return; 
    }

    setInvitingUser(true);
    try {
        await sendInvitation(project._id, selectedUserToInvite.value, { message: `You've been invited to join project: ${project.title}` }); 
        toast.success(`Invitation sent to ${selectedUserToInvite.label.split(' (')[0]}.`);
        setSelectedUserToInvite(null);
        fetchProjectAndUsers(); 
    } catch (err) {
        console.error("TeamManagementPage: Error sending invitation", err.response?.data || err.message);
        toast.error(err.response?.data?.message || "Failed to send invitation.");
    } finally {
        setInvitingUser(false);
    }
  };
  
  const CustomOption = ({ innerProps, isDisabled, data, ...props }) =>
    !isDisabled ? (
      <div {...innerProps} {...props} className="d-flex align-items-center p-2 react-select-option-hover">
        <UserAvatar user={{avatar: data.avatar, name: data.label.split(' (')[0]}} size="sm" className="me-2" />
        <span className="small">{data.label}</span>
      </div>
    ) : null;

  const currentTeamMembers = project?.teamMembers || [];

  if (pageLoading || authLoading) return <div className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 200px)'}}><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="alert alert-danger text-center container mt-5">{error}</div>;
  if (!project) return <div className="text-center py-5 container text-template-muted">Project data could not be loaded or access is denied.</div>;

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
                {/* Invite New Members Section */}
                <div className="mb-5 pb-4 border-bottom">
                    <h2 className="h5 fw-semibold text-template-dark mb-3">Invite New Members</h2>
                    <Row className="g-2 align-items-end">
                        <Col md>
                            <Form.Label htmlFor="userInviteSelect" className="small text-template-dark fw-medium">Search and select user to invite:</Form.Label>
                            <ReactSelect
                                inputId="userInviteSelect"
                                options={allUsersOptions}
                                value={selectedUserToInvite}
                                onChange={setSelectedUserToInvite}
                                placeholder="Search by name or email..."
                                isClearable
                                components={{ Option: CustomOption }}
                                className="basic-single"
                                classNamePrefix="react-select"
                                styles={{ control: base => ({ ...base, minHeight: '56px', borderRadius: '0.75rem' })}}
                            />
                        </Col>
                        <Col xs="auto">
                            <RBButton 
                                onClick={handleInviteUser} 
                                disabled={!selectedUserToInvite || invitingUser} 
                                variant="primary" 
                                className="btn-h14 w-100 w-md-auto bg-template-accent text-template-dark fw-bold border-0"
                            >
                                {invitingUser ? <LoadingSpinner size="sm" color="dark"/> : <EnvelopePlusFill size={18} className="me-1"/>} 
                                Send Invite
                            </RBButton>
                        </Col>
                    </Row>
                </div>

                {/* Current Team List Section */}
                <div>
                    <h2 className="h5 fw-semibold text-template-dark mb-3">Current Team Members ({currentTeamMembers.length})</h2>
                    {currentTeamMembers.length > 0 ? (
                    <ListGroup variant="flush">
                        {currentTeamMembers.map(member => {
                            if (!member || typeof member._id === 'undefined') {
                                console.error("TeamManagementPage - Member object or member._id is undefined for:", member);
                                return null; 
                            }
                            return (
                                <ListGroup.Item key={member._id} className="d-flex justify-content-between align-items-center p-3 px-0">
                                    <Link to={`/profile/${member._id}`} className="d-flex align-items-center gap-3 text-decoration-none group">
                                        <UserAvatar user={member} size="md" />
                                        <div>
                                            <p className="small fw-medium text-template-dark mb-0 group-hover-text-primary">{member.name || 'N/A'}</p>
                                            <p className="small text-template-muted mb-0">{member.email || 'N/A'}</p>
                                            {project.owner && member._id === project.owner._id && (
                                                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill small mt-1">Owner</span>
                                            )}
                                        </div>
                                    </Link>
                                    
                                    {currentUser && project.owner && currentUser._id === project.owner._id && member._id !== project.owner._id && (
                                        <RBButton 
                                            variant="outline-danger" 
                                            size="sm" 
                                            onClick={() => {
                                                handleRemoveMember(member._id, member.name);
                                            }} 
                                            disabled={removingMemberId === member._id}
                                            className="btn-h8 p-1"
                                            title="Remove member"
                                        >
                                            {removingMemberId === member._id ? <LoadingSpinner size="sm"/> : <PersonDashFill size={16} />}
                                        </RBButton>
                                    )}
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                    ) : (
                    <p className="text-template-muted small">The project owner is the only member currently, or no members found.</p>
                    )}
                </div>
            </Card.Body>
        </Card>
    </Container>
  );
};

export default TeamManagementPage;