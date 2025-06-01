import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
    getUserProfileById, 
    updateUserProfile as updateUserService,
    deleteAccount as deleteUserService
} from '../services/userService';
import { getProjects } from '../services/projectService';
import { sendInvitation } from '../services/collaborationService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import UserAvatar from '../components/user/UserAvatar';
import SkillTag from '../components/project/SkillTag';
import ProjectCard from '../components/project/ProjectCard';
import { toast } from 'react-toastify';
import {
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import RBButton from 'react-bootstrap/Button'; 
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Input from '../components/common/Input'; 
import TextArea from '../components/common/TextArea'; 
import SkillSelectionModal from '../components/common/SkillSelectionModal'; 
import { Badge
   } from 'react-bootstrap';
import { 
    BriefcaseFill, 
   TagFill,
    XCircleFill,
    PencilFill, 
    EnvelopeFill, 
    Github, 
    Linkedin, 
    TrashFill, 
    ShieldLockFill,
    Folder2Open as CreatedProjectsIcon
} from 'react-bootstrap-icons';

import { skillOptions as allSkillOptions } from '../utils/constants'; 

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser, updateUserContext, logout, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [userProjects, setUserProjects] = useState({ created: []});
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
      name: '', bio: '', githubLink: '', linkedinLink: ''
  });
  const [editFormSkills, setEditFormSkills] = useState([]); 
  const [editFormLoading, setEditFormLoading] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [currentUserOwnedProjects, setCurrentUserOwnedProjects] = useState([]);
  const [selectedProjectToInvite, setSelectedProjectToInvite] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const isOwnProfile = currentUser && currentUser._id === userId;

  const initializeEditForm = useCallback((userToEdit) => {
    if (userToEdit) {
        setEditFormData({
            name: userToEdit.name || '', 
            bio: userToEdit.bio || '',
            githubLink: userToEdit.githubLink || '', 
            linkedinLink: userToEdit.linkedinLink || ''
        });
        setEditFormSkills(
            (userToEdit.skills || []).map(skillValue => 
                allSkillOptions.find(opt => opt.value === skillValue) || { value: skillValue, label: skillValue }
            ).filter(Boolean)
        );
    }
  }, []); 

  const fetchProfileAndProjects = useCallback(async () => {
    if (!userId) {
        toast.error("User ID is missing.");
        navigate("/404", {replace: true}); 
        return;
    }
    setPageLoading(true); setError(null);
    try {
      const profileData = await getUserProfileById(userId);
      setProfileUser(profileData);

      if (currentUser && profileData._id === currentUser._id) {
        initializeEditForm(profileData);
      }
      
      const targetUserIdForProjectLists = userId;
         const [createdRes] = await Promise.all([
        getProjects({ listType: 'myCreated', userIdForFilter: targetUserIdForProjectLists, limit: 6 })
      ]);
      setUserProjects({ 
          created: createdRes.projects || []
      });
    } catch (err) {
      const message = err.response?.data?.message || "Could not load profile data.";
      setError(message); toast.error(message);
      if(err.response?.status === 404) navigate("/404", { replace: true });
    } finally {
      setPageLoading(false);
    }
  }, [userId, currentUser, navigate, initializeEditForm]);
  
  useEffect(() => {
    if (!authLoading) { 
        fetchProfileAndProjects();
    }
  }, [authLoading, fetchProfileAndProjects]);

  useEffect(() => {
    const fetchOwnedProjectsForInvite = async () => {
        if (currentUser && !isOwnProfile && profileUser) { 
            try {
                const res = await getProjects({ createdBy: currentUser._id });
                setCurrentUserOwnedProjects(res.projects || []);
            } catch (error) { console.error("Failed to fetch current user's owned projects for invite:", error); }
        }
    };
    if (!authLoading && currentUser) {
        fetchOwnedProjectsForInvite();
    }
  }, [currentUser, isOwnProfile, profileUser, authLoading]);

  const handleEditChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  
  const handleUserSkillsUpdateFromModal = (skillsFromModal) => {
    setEditFormSkills(skillsFromModal);
  };

  const removeSkillFromEditForm = (skillValueToRemove) => {
    setEditFormSkills(prevSkills => prevSkills.filter(skill => skill.value !== skillValueToRemove));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setEditFormLoading(true);
    const skillsValueArray = editFormSkills.map(s => s.value);
    try {
      const dataToUpdate = { ...editFormData, skills: skillsValueArray }; 
      const updatedUser = await updateUserService(dataToUpdate);
      
      setProfileUser(updatedUser); 
      updateUserContext(updatedUser); 
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
        await sendInvitation(selectedProjectToInvite, userId);
        toast.success(`Invitation sent to ${profileUser.name}!`);
        setShowInviteModal(false); setSelectedProjectToInvite('');
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to send invitation.");
    } finally {
        setIsInviting(false);
    }
  };

  const handleDeleteAccountAttempt = () => {
    setShowDeleteAccountModal(true);
    setDeletePassword('');
    setDeleteAccountError('');
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deletePassword) { setDeleteAccountError('Password is required.'); return; }
    setDeleteAccountError('');
    setIsDeletingAccount(true);
    try {
        await deleteUserService({ password: deletePassword });
        toast.success("Account deleted successfully. You will be logged out.");
        setShowDeleteAccountModal(false);
        logout(); 
        navigate('/'); 
    } catch (error) {
        const message = error.response?.data?.message || "Failed to delete account. Please check your password.";
        setDeleteAccountError(message);
        toast.error(message);
    } finally {
        setIsDeletingAccount(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profileUser) {
        initializeEditForm(profileUser);
    }
  };
  
  const [showUserSkillEditModal, setShowUserSkillEditModal] = useState(false);


  if (pageLoading || authLoading) return <div className="d-flex justify-content-center align-items-center" style={{minHeight: 'calc(100vh - 200px)'}}><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="alert alert-danger text-center container mt-5">{error}</div>;
  if (!profileUser) return <div className="text-center py-5 container text-template-muted">User profile not found.</div>;

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-md-4">
      <Card className="shadow-lg border-light">
        <Card.Body className="p-4 p-sm-5">
          <Row className="align-items-center align-items-sm-start pb-4 mb-4 border-bottom">
            <Col xs="auto" className="text-center text-sm-start mb-3 mb-sm-0">
              <UserAvatar user={isEditing && isOwnProfile ? { ...profileUser, avatar: editFormData.avatar, name: editFormData.name } : profileUser} size="xl" className="shadow-sm" />
            </Col>
            <Col className="text-center text-sm-start">
              <h1 className="h2 text-template-dark fw-bolder mb-1">{isEditing && isOwnProfile ? editFormData.name : profileUser.name}</h1>
              <p className="text-template-muted mb-2">{profileUser.email}</p>
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
                    if (newEditingState && profileUser) { 
                        initializeEditForm(profileUser);
                    } else if (!newEditingState && profileUser) { 
                        initializeEditForm(profileUser);
                    }
                  }} 
                  variant="outline-secondary" size="sm" className="btn-h8"
                > <PencilFill size={14} className="me-1"/> {isEditing ? 'Cancel Edit' : 'Edit Profile'} </RBButton>
              ) : ( currentUser && ( <RBButton onClick={() => setShowInviteModal(true)} variant="primary" size="sm" className="btn-h8 bg-template-accent text-template-dark fw-bold border-0"> <EnvelopeFill size={14} className="me-1" /> Invite to Project </RBButton> )
              )}
            </Col>
          </Row>

          {isEditing && isOwnProfile && (
            <Card className="mb-4 bg-light border-dashed">
              <Card.Body>
                <h3 className="h5 fw-semibold mb-3 text-template-dark">Edit Your Profile</h3>
                <Form onSubmit={handleUpdateProfile}>
                  <Input label="Name" name="name" value={editFormData.name} onChange={handleEditChange} required className="mb-3"/>
                  <TextArea label="Bio" name="bio" value={editFormData.bio} onChange={handleEditChange} rows={3} placeholder="A short bio about yourself..." className="mb-3"/>
                  <Input label="GitHub Link" name="githubLink" value={editFormData.githubLink} onChange={handleEditChange} placeholder="https://github.com/yourusername" className="mb-3"/>
                  <Input label="LinkedIn Link" name="linkedinLink" value={editFormData.linkedinLink} onChange={handleEditChange} placeholder="https://linkedin.com/in/yourprofile" className="mb-3"/>

                  
                  <Form.Group className="mb-3">
                    <Form.Label className="text-template-dark fw-medium d-block mb-1">Your Skills</Form.Label>
                    <div 
                      className="p-2 border rounded-xl form-control d-flex align-content-start flex-wrap gap-1 mb-2" 
                      style={{ minHeight: '56px', overflowY: 'auto', cursor: 'default' }}
                      onClick={() => setShowUserSkillEditModal(true)}
                      title="Click to Add/Edit Your Skills"
                    >
                      {editFormSkills.length > 0 ? editFormSkills.map(skill => (
                        <Badge 
                          key={`edit-form-${skill.value}`} 
                          pill bg="primary-subtle" text="primary-emphasis" 
                          className="d-flex align-items-center p-2 border border-primary-subtle me-1 mb-1"
                        >
                          <TagFill size={12} className="me-1"/> {skill.label}
                          <XCircleFill 
                            size={16} className="ms-1 cursor-pointer opacity-75 hover-opacity-100" 
                            onClick={(e) => { e.stopPropagation(); removeSkillFromEditForm(skill.value);}}
                            style={{cursor: 'pointer'}} title={`Remove ${skill.label}`}
                          />
                        </Badge>
                      )) : (
                        <span className="text-template-muted small align-self-center">No skills selected. Click below to add.</span>
                      )}
                    </div>
                    <RBButton 
                      type="button" 
                      variant="outline-secondary" 
                      onClick={() => setShowUserSkillEditModal(true)} 
                      className="w-100 btn-h10 d-flex align-items-center justify-content-center"
                    >
                       <PlusCircleIcon style={{ width: '20px', height: '20px' }} className="me-1 me-sm-2" /> Add/Edit Your Skills
                    </RBButton>
                  </Form.Group>

                  <div className="d-flex gap-2">
                      <RBButton type="submit" variant="primary" disabled={editFormLoading}>
                        {editFormLoading ? <LoadingSpinner size="sm" as="span" animation="border" className="me-1"/> : null}
                        {editFormLoading ? 'Saving...' : 'Save Profile Changes'}
                      </RBButton>
                      <RBButton type="button" variant="outline-secondary" onClick={handleCancelEdit}>Cancel</RBButton>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {!isEditing && (
            <>
              <div className="mb-4">
                <h3 className="h5 fw-semibold text-template-dark mb-2 d-flex align-items-center">
                    <BriefcaseFill size={18} className="me-2 text-primary"/> Skills
                </h3>
                <div className="d-flex flex-wrap gap-2">
                  {(profileUser.skills || []).length > 0 ? 
                    profileUser.skills.map(skillValue => {
                        const skillLabel = allSkillOptions.find(s=>s.value === skillValue)?.label || skillValue;
                        return <SkillTag key={skillValue} skill={skillLabel} />;
                    }) 
                    : <p className="text-template-muted small">No skills listed.</p>}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="h5 fw-semibold text-template-dark mb-3 d-flex align-items-center">
                    <CreatedProjectsIcon size={18} className="me-2 text-primary"/> Projects Created ({(userProjects.created || []).length})
                </h3>
                {(userProjects.created && userProjects.created.length > 0) ? (
                  <Row xs={1} sm={2} lg={3} className="g-3">
                    {userProjects.created.map(p => <Col key={p._id} className="d-flex align-items-stretch"><ProjectCard project={p} /></Col>)}
                  </Row>
                ) : <p className="text-template-muted small">No projects created by this user.</p>}
              </div>
            
            </>
          )}
          
          {isOwnProfile && !isEditing && ( 
            <Card className="mt-5 border-danger shadow-sm"> 
              <Card.Header className="bg-danger-subtle text-danger-emphasis fw-bold">Danger Zone</Card.Header> 
              <Card.Body className="text-center"> 
                <Card.Text className="text-danger mb-3 small"> Deleting your account is permanent and will remove all your data. This action cannot be undone. </Card.Text> 
                <RBButton variant="danger" onClick={handleDeleteAccountAttempt} disabled={isDeletingAccount}> 
                  <TrashFill size={16} className="me-1"/> {isDeletingAccount ? 'Processing...' : 'Delete My Account'} 
                </RBButton> 
              </Card.Body> 
            </Card> 
          )}
        </Card.Body>
      </Card>

      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered>
        <Modal.Header closeButton> <Modal.Title className="h5 text-template-dark">Invite {profileUser?.name} to a Project</Modal.Title> </Modal.Header>
        <Modal.Body>
          {(currentUserOwnedProjects || []).length > 0 ? (
            <Form.Group controlId="projectInviteSelectModalProfile">
              <Form.Label className="text-template-dark fw-medium">Select one of your projects:</Form.Label>
              <Form.Select value={selectedProjectToInvite} onChange={(e) => setSelectedProjectToInvite(e.target.value)} className="form-control-h14 rounded-xl">
                <option value="">-- Select a project --</option>
                {currentUserOwnedProjects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </Form.Select>
            </Form.Group>
          ) : <p className="text-template-muted">You don't own any projects to invite this user to.</p>}
        </Modal.Body>
        <Modal.Footer>
          <RBButton variant="outline-secondary" onClick={() => setShowInviteModal(false)}>Cancel</RBButton>
          <RBButton variant="primary" onClick={handleInviteToProject} disabled={isInviting || !selectedProjectToInvite}>
            {isInviting ? <LoadingSpinner size="sm" as="span" animation="border"/> : 'Send Invite'}
          </RBButton>
        </Modal.Footer>
      </Modal>
      
      <Modal show={showDeleteAccountModal} onHide={() => setShowDeleteAccountModal(false)} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title className="h5 text-danger d-flex align-items-center"><ShieldLockFill size={20} className="me-2"/>Confirm Account Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-template-muted">This action is irreversible. All your projects you own and other personal data will be permanently deleted.</p>
          <p className="fw-bold">Please enter your password to confirm:</p>
          <Form.Control
            type="password"
            placeholder="Your Password"
            value={deletePassword}
            onChange={(e) => { setDeletePassword(e.target.value); setDeleteAccountError(''); }}
            isInvalid={!!deleteAccountError}
            className="form-control-h14 rounded-xl"
          />
          {deleteAccountError && <Form.Text className="text-danger small">{deleteAccountError}</Form.Text>}
        </Modal.Body>
        <Modal.Footer>
          <RBButton variant="secondary" onClick={() => setShowDeleteAccountModal(false)} disabled={isDeletingAccount}> Cancel </RBButton>
          <RBButton variant="danger" onClick={handleConfirmDeleteAccount} disabled={isDeletingAccount || !deletePassword}>
            {isDeletingAccount ? <LoadingSpinner size="sm" as="span" animation="border" className="me-2"/> : null}
            {isDeletingAccount ? 'Deleting...' : 'Delete My Account Permanently'}
          </RBButton>
        </Modal.Footer>
      </Modal>

      <SkillSelectionModal
        show={showUserSkillEditModal}
        handleClose={() => setShowUserSkillEditModal(false)}
        onSkillsConfirm={handleUserSkillsUpdateFromModal} 
        initialSelectedSkills={editFormSkills} 
        allSkillOptions={allSkillOptions}
      />
    </Container>
  );
};

export default ProfilePage;