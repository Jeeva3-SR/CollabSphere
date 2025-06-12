import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getProjects } from '../services/projectService';
import {
  getReceivedCollaborationRequests,
  getSentCollaborationRequests,
  respondToCollaborationRequest,
  getReceivedInvitations,
  respondToInvitation
} from '../services/collaborationService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import RBButton from 'react-bootstrap/Button';
import {
  BsArrowRepeat,
  BsSend,
  BsInbox,
  BsPeople,
  BsCheckCircle,
  BsXCircle
} from 'react-icons/bs';
import ProjectCard from '../components/project/ProjectCard';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  const [joinedProjects, setJoinedProjects] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [receivedInvites, setReceivedInvites] = useState([]);

  const [loadingStates, setLoadingStates] = useState({
    joined: true, sent: true, receivedReq: true, invites: true,
  });

  const [actionLoading, setActionLoading] = useState({}); // This is for individual item actions

  const fetchSection = useCallback(async (key, serviceCall, process = d => d.projects ?? d) => {
    if (!user?._id) return;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const data = await serviceCall();
      const result = process(data); // data.projects for getProjects, data (array) for others
      switch (key) {
        case 'joined':
          // Ensure result is an array, getProjects might return { projects: [...] }
          setJoinedProjects(Array.isArray(result) ? result : (result?.projects || []));
          break;
        case 'sent':
          setSentRequests(Array.isArray(result) ? result.filter(req => req.status === 'Pending') : []);
          break;
        case 'receivedReq':
          setReceivedRequests(Array.isArray(result) ? result.filter(req => req.status === 'Pending') : []);
          break;
        case 'invites':
          setReceivedInvites(Array.isArray(result) ? result.filter(inv => inv.status === 'Pending') : []);
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error(`Failed to load ${key}.`);
      console.error(`Error in ${key}:`, error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  }, [user]);

  const fetchAll = useCallback(() => {
    // Pass a function for getProjects to match signature if listType is dynamic
    fetchSection('joined', () => getProjects({ listType: 'myJoined' }));
    fetchSection('sent', getSentCollaborationRequests, data => data); // Pass data directly if it's already an array
    fetchSection('receivedReq', getReceivedCollaborationRequests, data => data);
    fetchSection('invites', getReceivedInvitations, data => data);
  }, [fetchSection]);

  useEffect(() => {
    if (user?._id) fetchAll();
  }, [user, fetchAll]);

  // This handleResponse is correctly defined and will be passed down
  const handleResponse = async (id, status, type) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    const isAccept = status === 'Accepted';
    const fn = type === 'invite' ? respondToInvitation : respondToCollaborationRequest;
    try {
      await fn(id, status);
      toast.success(`${type === 'invite' ? 'Invitation' : 'Request'} ${status.toLowerCase()}!`);
      // Refresh relevant sections
      if (type === 'invite') {
        fetchSection('invites', getReceivedInvitations, data => data);
      } else { // 'request'
        fetchSection('receivedReq', getReceivedCollaborationRequests, data => data);
      }
      // If accepted, also refresh joined projects
      if (isAccept) {
        fetchSection('joined', () => getProjects({ listType: 'myJoined' }));
      }
    } catch (err) {
      toast.error('Action failed.');
      console.error('Error handling response:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // renderActionItem is fine, its parameters will be supplied correctly by renderSection
  const renderActionItem = (item, type, handleResponseFn, currentActionLoading) => {
    const projectTitle = item.project?.title || 'Project Title';
    const projectLink = item.project ? `/projects/${item.project._id || item.project}` : '#';

    let actorName = 'User';
    let actorId = null;
    let actorLabel = '';

    if (type === 'received') { // 'received' refers to receivedReq for this component's state
        actorName = item.requester?.name || 'User';
        actorId = item.requester?._id;
        actorLabel = 'From: ';
    } else if (type === 'invite') {
        actorName = item.inviter?.name || 'User';
        actorId = item.inviter?._id;
        actorLabel = 'From: ';
    }

    const actorProfileLink = actorId ? `/profile/${actorId}` : null;

    return (
      <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center">
          {type === 'sent' && <BsSend size={20} className="me-2 text-primary" />}
          {type === 'received' && <BsInbox size={20} className="me-2 text-warning" />} {/* for receivedReq */}
          {type === 'invite' && <BsInbox size={20} className="me-2 text-success" />} {/* for invites */}
          
          <div>
            <Link to={projectLink} className="fw-bold text-decoration-none text-dark">{projectTitle}</Link>
            <div className="small text-muted">
              {type === 'sent' && `To: ${item.projectOwner?.name || 'Owner'} - Status: ${item.status}`}
              
              {(type === 'received' || type === 'invite') && (
                <>
                  {actorLabel}
                  {actorProfileLink ? (
                    <Link to={actorProfileLink} className="text-decoration-none text-primary text-decoration-underline">
                      {actorName}
                    </Link>
                  ) : (
                    actorName
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {(type === 'received' || type === 'invite') && (
          <div className="d-flex gap-2">
            <RBButton
              size="sm"
              variant="success"
              onClick={() => handleResponseFn(item._id, 'Accepted', type === 'invite' ? 'invite' : 'request')}
              disabled={currentActionLoading[item._id]}
            >
              {currentActionLoading[item._id] ? <LoadingSpinner size="sm" /> : <><BsCheckCircle className="me-1" /> Accept</>}
            </RBButton>
            <RBButton
              size="sm"
              variant="danger"
              onClick={() => handleResponseFn(item._id, type === 'invite' ? 'Declined' : 'Rejected', type === 'invite' ? 'invite' : 'request')}
              disabled={currentActionLoading[item._id]}
            >
              {currentActionLoading[item._id] ? <LoadingSpinner size="sm" /> : <><BsXCircle className="me-1" /> {type === 'invite' ? 'Decline' : 'Reject'}</>}
            </RBButton>
          </div>
        )}
      </ListGroup.Item>
    );
  };

 const renderSection = (title, key, items, sectionType, emptyMessage) => (
  <Card className="mb-4 shadow-sm">
    <Card.Header as="h5" className="fw-bold d-flex align-items-center">
      {key === 'joined' && <BsPeople size={20} className="me-2 text-info" />}
      {key === 'sent' && <BsSend size={20} className="me-2 text-primary" />}
      {key === 'receivedReq' && <BsInbox size={20} className="me-2 text-warning" />}
      {key === 'invites' && <BsInbox size={20} className="me-2 text-success" />}
      {title}
    </Card.Header>

    {loadingStates[key] ? (
      <Card.Body className="text-center p-5">
        <LoadingSpinner size="lg" />
      </Card.Body>
    ) : items.length > 0 ? (
      sectionType === 'project' ? (
        <Row xs={1} md={2} lg={3} className="g-3 p-3">
          {items.map(project => (
            <Col key={project._id}>
              <ProjectCard project={project} />
            </Col>
          ))}
        </Row>
      ) : (
        <ListGroup variant="flush">
          {/* *** THIS IS THE CORRECTED CALL *** */}
          {/* Pass handleResponse and actionLoading from DashboardPage scope */}
          {items.map(item => renderActionItem(item, sectionType, handleResponse, actionLoading))}
        </ListGroup>
      )
    ) : (
      <Card.Body className="text-muted p-4">
        {emptyMessage || 'No items to display.'}
      </Card.Body>
    )}
  </Card>
);


  return (
    <Container fluid="lg" className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
        <h1 className="h2 fw-bold">Welcome, {user?.name || 'User'}</h1>
        <RBButton
          variant="outline-secondary"
          onClick={fetchAll}
          disabled={Object.values(loadingStates).some(Boolean)}
        >
          <BsArrowRepeat className={Object.values(loadingStates).some(Boolean) ? 'spinner-border spinner-border-sm me-1' : 'me-1'} />
           Refresh
        </RBButton>
      </div>

      {renderSection(
        'Projects you joined',
        'joined',
        joinedProjects,
        'project',
        'You haven’t joined any projects yet.'
      )}

      {renderSection(
        'Your Pending Join Requests',
        'sent',
        sentRequests,
        'sent', // This 'type' is passed to renderActionItem
        'You have no pending join requests.'
      )}

      {renderSection(
        'Received Join Requests (For Your Projects)',
        'receivedReq',
        receivedRequests,
        'received', // This 'type' is passed to renderActionItem
        'No join requests received for your projects.'
      )}

      {renderSection(
        'Received Collaboration Invites',
        'invites',
        receivedInvites,
        'invite', // This 'type' is passed to renderActionItem
        'You have no pending collaboration invites.'
      )}
    </Container>
  );
};

export default DashboardPage;