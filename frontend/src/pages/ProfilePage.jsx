import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    getUserProfileById, 
    updateUserProfile as updateUserService 
} from '../services/userService'; // Removed uploadUserProfilePicture
import { getProjects } from '../services/projectService';
import { sendInvitation } from '../services/collaborationService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import UserAvatar from '../components/user/UserAvatar';
import SkillTag from '../components/project/SkillTag';
import ProjectCard from '../components/project/ProjectCard';
import { toast } from 'react-toastify';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import RBButton from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
// import Image from 'react-bootstrap/Image'; // Not strictly needed if not showing file preview
import ReactSelect from 'react-select';

import Input from '../components/common/Input';
import TextArea from '../components/common/TextArea';

import { 
    BriefcaseFill, 
    PeopleFill as JoinedProjectsIcon,
    PencilFill, 
    EnvelopeFill, 
    Github, 
    Linkedin, 
    // CameraFill, // Removed
    TrashFill, 
    Folder2Open as CreatedProjectsIcon
} from 'react-bootstrap-icons';

const skillOptions = [ // Keep your skillOptions array
  { value: 'javascript', label: 'JavaScript' }, { value: 'react', label: 'React' },
  // ... (full list of skills)
  { value: 'data-analysis', label: 'Data Analysis'}
];

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser, updateUserContext, logout, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [userProjects, setUserProjects] = useState({ created: [], joined: [] });
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
      name: '', bio: '', githubLink: '', linkedinLink: '', avatar: '' // Avatar is now just a URL
  });
  const [selectedEditSkills, setSelectedEditSkills] = useState([]);
  const [editFormLoading, setEditFormLoading] = useState(false);

  // Removed states related to file upload: profilePicFile, picPreview (direct file), uploadingPic, fileInputRef

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentUserOwnedProjects, setCurrentUserOwnedProjects] = useState([]);
  const [selectedProjectToInvite, setSelectedProjectToInvite] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const isOwnProfile = currentUser && currentUser._id === userId;

  const fetchProfileAndProjects = useCallback(async () => {
    if (!userId) return;
    setPageLoading(true); setError(null);
    try {
      const profileData = await getUserProfileById(userId);
      setProfileUser(profileData);

      // Initialize edit form data if it's the current user's profile
      if (currentUser && profileData._id === currentUser._id) {
        setEditFormData({
            name: profileData.name || '', 
            bio: profileData.bio || '',
            githubLink: profileData.githubLink || '', 
            linkedinLink: profileData.linkedinLink || '',
            avatar: profileData.avatar || '', // The current avatar URL
        });
        setSelectedEditSkills(
            (profileData.skills || []).map(s => skillOptions.find(opt => opt.value === s) || { value: s, label: s }).filter(Boolean)
        );
      }
      
      const targetUserIdForProjectLists = userId;

      const [createdRes, joinedRes] = await Promise.all([
        getProjects({ listType: 'myCreated', userIdForFilter: targetUserIdForProjectLists, limit: 6 }),
        getProjects({ listType: 'myJoined', userIdForFilter: targetUserIdForProjectLists, limit: 6 })
      ]);
      setUserProjects({ 
          created: createdRes.projects || [], 
          joined: (joinedRes.projects || []).filter(jp => !(createdRes.projects || []).find(cp => cp._id === jp._id)) // Avoid duplicates
      });

    } catch (err) {
      const message = err.response?.data?.message || "Could not load profile data.";
      setError(message); toast.error(message);
      if(err.response?.status === 404) navigate("/404", { replace: true });
    } finally {
      setPageLoading(false);
    }
  }, [userId, currentUser, navigate]); 
  
  useEffect(() => {
    if (!authLoading) { // Ensure currentUser context is resolved before fetching
        fetchProfileAndProjects();
    }
  }, [authLoading, fetchProfileAndProjects]); // fetchProfileAndProjects is now stable

  useEffect(() => {
    const fetchOwnedProjectsForInvite = async () => {
        if (currentUser && !isOwnProfile && profileUser) { 
            try {
                const res = await getProjects({ listType: 'myCreated' }); // Fetches projects owned by currentUser
                setCurrentUserOwnedProjects(res.projects || []);
            } catch (error) { console.error("Failed to fetch current user's owned projects for invite:", error); }
        }
    };
    if (!authLoading && currentUser) {
        fetchOwnedProjectsForInvite();
    }
  }, [currentUser, isOwnProfile, profileUser, authLoading]);


  const handleEditChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  const handleEditSkillsChange = (selected) => setSelectedEditSkills(selected || []);

  const handleUpdateProfile = async (e) => { // Renamed from handleUpdateProfileText
    e.preventDefault();
    setEditFormLoading(true);
    const skillsArray = selectedEditSkills.map(s => s.value);
    try {
      // The `avatar` field in `editFormData` will now just be the URL string
      const dataToUpdate = { ...editFormData, skills: skillsArray }; 
      const updatedUser = await updateUserService(dataToUpdate);
      
      setProfileUser(updatedUser); 
      updateUserContext(updatedUser); // Update global auth context
      toast.success("Profile updated successfully!");
      setIsEditing(false); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setEditFormLoading(false);
    }
  };
  
  const handleInviteToProject = async () => {
    if (!selectedProjectToInvite) { toast.error("Please select a project."); return; }
    setIsInviting(true);
    try {
        await sendInvitation(selectedProjectToInvite, userId); // from collaborationService
        toast.success(`Invitation sent to ${profileUser.name}!`);
        setShowInviteModal(false); setSelectedProjectToInvite('');
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send invitation.");
    } finally {
        setIsInviting(false);
    }
  };

  const handleDeleteAccountConfirm = () => setShowDeleteConfirmModal(true);

  const handleDeleteAccount = async () => {
    if (!currentUser || !isOwnProfile) return; // Extra safety
    setIsDeletingAccount(true);
    try {
        // You'll need a backend endpoint/service for this.
        // For example: await deleteMyAccountService();
        // This is a placeholder, actual deletion needs backend implementation.
        // Assuming a service like `deleteMyAccount` in `userService.js` that calls `DELETE /api/users/me`
        // const res = await deleteMyAccountService(); 
        // toast.success(res.message || "Account deleted successfully.");
        toast.warn("Account deletion feature backend not fully implemented in this example."); // Placeholder
        setShowDeleteConfirmModal(false);
        // logout(); // Logout the user
        // navigate('/'); // Redirect to homepage
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete account.");
    } finally {
        setIsDeletingAccount(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original profileUser data
    if (profileUser) {
        setEditFormData({
            name: profileUser.name || '', bio: profileUser.bio || '',
            githubLink: profileUser.githubLink || '', linkedinLink: profileUser.linkedinLink || '',
            avatar: profileUser.avatar || '',
        });
        setSelectedEditSkills(
            (profileUser.skills || []).map(s => skillOptions.find(opt => opt.value === s) || { value: s, label: s }).filter(Boolean)
        );
    }
  };

  if (pageLoading || authLoading) return <div className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 200px)'}}><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="alert alert-danger text-center container mt-5">{error}</div>;
  if (!profileUser) return <div className="text-center py-5 container text-template-muted">User profile not found.</div>;

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-md-4">
      <Card className="shadow-lg border-light">
        <Card.Body className="p-4 p-sm-5">
          {/* Profile Header */}
          <Row className="align-items-center align-items-sm-start pb-4 mb-4 border-bottom">
            <Col xs="auto" className="text-center text-sm-start mb-3 mb-sm-0">
              {/* UserAvatar now just uses the URL from profileUser or editFormData */}
              <UserAvatar user={isEditing && isOwnProfile ? { ...profileUser, avatar: editFormData.avatar } : profileUser} size="xl" className="shadow-sm" />
            </Col>
            <Col className="text-center text-sm-start">
              <h1 className="h2 text-template-dark fw-bolder mb-1">{isEditing && isOwnProfile ? editFormData.name : profileUser.name}</h1>
              <p className="text-template-muted mb-2">{profileUser.email}</p> {/* Email is not editable here */}
              { (isEditing && isOwnProfile ? editFormData.bio : profileUser.bio) && 
                <p className="text-template-dark small mb-2">{isEditing && isOwnProfile ? editFormData.bio : profileUser.bio}</p>
              }
              <div className="d-flex flex-wrap justify-content-center justify-content-sm-start gap-3 small">
                {(isEditing && isOwnProfile ? editFormData.githubLink : profileUser.githubLink) && ( 
                    <a href={isEditing && isOwnProfile ? editFormData.githubLink : profileUser.githubLink} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none d-flex align-items-center"> <Github size={16} className="me-1" /> GitHub </a> 
                )}
                {(isEditing && isOwnProfile ? editFormData.linkedinLink : profileUser.linkedinLink) && ( 
                    <a href={isEditing && isOwnProfile ? editFormData.linkedinLink : profileUser.linkedinLink} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none d-flex align-items-center"> <Linkedin size={16} className="me-1" /> LinkedIn </a> 
                )}
              </div>
            </Col>
            <Col xs={12} sm="auto" className="mt-3 mt-sm-0 text-center text-sm-end">
              {isOwnProfile ? (
                <RBButton 
                  onClick={() => { 
                    const newEditingState = !isEditing;
                    setIsEditing(newEditingState); 
                    if (newEditingState) { // Entering edit mode
                        setEditFormData({ name: profileUser.name || '', bio: profileUser.bio || '', githubLink: profileUser.githubLink || '', linkedinLink: profileUser.linkedinLink || '', avatar: profileUser.avatar || '' });
                        setSelectedEditSkills((profileUser.skills || []).map(s => skillOptions.find(opt => opt.value === s) || { value: s, label: s }).filter(Boolean));
                    }
                  }} 
                  variant="outline-secondary" size="sm" className="btn-h8"
                > <PencilFill size={14} className="me-1"/> {isEditing ? 'Cancel Edit' : 'Edit Profile'} </RBButton>
              ) : ( currentUser && ( <RBButton onClick={() => setShowInviteModal(true)} variant="primary" size="sm" className="btn-h8 bg-template-accent text-template-dark fw-bold border-0"> <EnvelopeFill size={14} className="me-1" /> Invite to Project </RBButton> )
              )}
            </Col>
          </Row>

          {/* Editing Form */}
          {isEditing && isOwnProfile && (
            <Card className="mb-4 bg-light border-dashed">
              <Card.Body>
                <h3 className="h5 fw-semibold mb-3 text-template-dark">Edit Your Profile</h3>
                <Form onSubmit={handleUpdateProfile}>
                  <Input label="Name" name="name" value={editFormData.name} onChange={handleEditChange} required className="mb-3"/>
                  <TextArea label="Bio" name="bio" value={editFormData.bio} onChange={handleEditChange} rows={3} placeholder="A short bio about yourself..." className="mb-3"/>
                  <Input label="GitHub Link" name="githubLink" value={editFormData.githubLink} onChange={handleEditChange} placeholder="https://github.com/yourusername" className="mb-3"/>
                  <Input label="LinkedIn Link" name="linkedinLink" value={editFormData.linkedinLink} onChange={handleEditChange} placeholder="https://linkedin.com/in/yourprofile" className="mb-3"/>
                  <Input label="Avatar URL" name="avatar" value={editFormData.avatar} onChange={handleEditChange} placeholder="Paste an image URL for your avatar" className="mb-3"/>
                  <Form.Group className="mb-3">
                      <Form.Label className="text-template-dark fw-medium">Skills</Form.Label>
                      <ReactSelect isMulti name="skills" options={skillOptions} className="basic-multi-select" classNamePrefix="react-select" value={selectedEditSkills} onChange={handleEditSkillsChange} menuPortalTarget={document.body} styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}/>
                  </Form.Group>
                  <div className="d-flex gap-2">
                      <RBButton type="submit" variant="primary" disabled={editFormLoading}>{editFormLoading ? <LoadingSpinner size="sm" color="light"/> : 'Save Profile Changes'}</RBButton>
                      <RBButton type="button" variant="outline-secondary" onClick={handleCancelEdit}>Cancel</RBButton>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* Profile Details View (when not editing) */}
          {!isEditing && (
            <>
              <div className="mb-4"> <h3 className="h5 fw-semibold text-template-dark mb-2 d-flex align-items-center"><BriefcaseFill size={18} className="me-2 text-primary"/> Skills</h3> <div className="d-flex flex-wrap gap-2"> {(profileUser.skills || []).length > 0 ? profileUser.skills.map(skillValue => <SkillTag key={skillValue} skill={skillOptions.find(s=>s.value === skillValue)?.label || skillValue} />) : <p className="text-template-muted small">No skills listed.</p>} </div> </div>
              <div className="mb-4"> <h3 className="h5 fw-semibold text-template-dark mb-3 d-flex align-items-center"><CreatedProjectsIcon size={18} className="me-2 text-primary"/> Projects Created ({(userProjects.created || []).length})</h3> {(userProjects.created && userProjects.created.length > 0) ? ( <Row xs={1} sm={2} lg={3} className="g-3"> {userProjects.created.map(p => <Col key={p._id} className="d-flex align-items-stretch"><ProjectCard project={p} /></Col>)} </Row> ) : <p className="text-template-muted small">No projects created by this user.</p>} </div>
             
            </>
          )}
          
          {/* Danger Zone for account deletion */}
          {isOwnProfile && !isEditing && ( 
            <Card className="mt-5 border-danger shadow-sm"> 
              <Card.Header className="bg-danger-subtle text-danger-emphasis fw-bold">Danger Zone</Card.Header> 
              <Card.Body className="text-center"> 
                <Card.Text className="text-danger mb-3 small"> Deleting your account is permanent. This action cannot be undone. </Card.Text> 
                <RBButton variant="danger" onClick={handleDeleteAccountConfirm} disabled={isDeletingAccount}> 
                  <TrashFill size={16} className="me-1"/> {isDeletingAccount ? 'Processing...' : 'Delete My Account'} 
                </RBButton> 
              </Card.Body> 
            </Card> 
          )}
        </Card.Body>
      </Card>

      {/* Invite to Project Modal (same as before) */}
      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered> 
        <Modal.Header closeButton> <Modal.Title className="h5 text-template-dark">Invite {profileUser?.name} to a Project</Modal.Title> </Modal.Header> 
        <Modal.Body> {(currentUserOwnedProjects || []).length > 0 ? ( <Form.Group controlId="projectInviteSelect"> <Form.Label className="text-template-dark fw-medium">Select one of your projects:</Form.Label> <Form.Select value={selectedProjectToInvite} onChange={(e) => setSelectedProjectToInvite(e.target.value)} className="form-control-h14 rounded-xl"> <option value="">-- Select a project --</option> {currentUserOwnedProjects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)} </Form.Select> </Form.Group> ) : <p className="text-template-muted">You don't own any projects to invite this user to.</p>} </Modal.Body> 
        <Modal.Footer> <RBButton variant="outline-secondary" onClick={() => setShowInviteModal(false)}>Cancel</RBButton> <RBButton variant="primary" onClick={handleInviteToProject} disabled={isInviting || !selectedProjectToInvite}> {isInviting ? <LoadingSpinner size="sm"/> : 'Send Invite'} </RBButton> </Modal.Footer> 
      </Modal>
      
      {/* Delete Account Confirmation Modal (same as before) */}
      <Modal show={showDeleteConfirmModal} onHide={() => setShowDeleteConfirmModal(false)} centered backdrop="static"> 
        <Modal.Header closeButton> <Modal.Title className="h5 text-danger">Confirm Account Deletion</Modal.Title> </Modal.Header> 
        <Modal.Body> <p>Are you absolutely sure you want to delete your account?</p> <p className="fw-bold text-danger small">This action cannot be undone.</p> </Modal.Body> 
        <Modal.Footer> <RBButton variant="secondary" onClick={() => setShowDeleteConfirmModal(false)} disabled={isDeletingAccount}> Cancel </RBButton> <RBButton variant="danger" onClick={handleDeleteAccount} disabled={isDeletingAccount}> {isDeletingAccount ? <LoadingSpinner size="sm" /> : 'Yes, Delete My Account'} </RBButton> </Modal.Footer> 
      </Modal>
    </Container>
  );
};

export default ProfilePage;