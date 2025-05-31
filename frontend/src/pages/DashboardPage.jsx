// src/pages/DashboardPage.jsx
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
  BsFolder,
  BsCheckCircle,
  BsXCircle
} from 'react-icons/bs';

import ProjectCard from '../components/project/ProjectCard';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  const [createdProjects, setCreatedProjects] = useState([]);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [receivedInvites, setReceivedInvites] = useState([]);

  const [loadingStates, setLoadingStates] = useState({
    created: true, joined: true, sent: true, receivedReq: true, invites: true,
  });

  const [actionLoading, setActionLoading] = useState({});

  const fetchSection = useCallback(async (key, serviceCall, process = d => d.projects ?? d) => {
    if (!user?._id) return;
    setLoadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const data = await serviceCall();
      const result = process(data);
      switch (key) {
        case 'created':
          setCreatedProjects(result);
          break;
        case 'joined':
          setJoinedProjects(result);
          break;
        case 'sent':
          setSentRequests(result.filter(req => req.status === 'Pending'));
          break;
        case 'receivedReq':
          setReceivedRequests(result.filter(req => req.status === 'Pending'));
          break;
        case 'invites':
          setReceivedInvites(result.filter(inv => inv.status === 'Pending'));
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
    fetchSection('created', () => getProjects({ listType: 'myCreated' }));
    fetchSection('joined', () => getProjects({ listType: 'myJoined' }));
    fetchSection('sent', getSentCollaborationRequests);
    fetchSection('receivedReq', getReceivedCollaborationRequests);
    fetchSection('invites', getReceivedInvitations);
  }, [fetchSection]);

  useEffect(() => {
    if (user?._id) fetchAll();
  }, [user, fetchAll]);

  const handleResponse = async (id, status, type) => {
    setActionLoading(prev => ({ ...prev, [id]: true }));
    const isAccept = status === 'Accepted';
    const fn = type === 'invite' ? respondToInvitation : respondToCollaborationRequest;
    try {
      await fn(id, status);
      toast.success(`${type === 'invite' ? 'Invitation' : 'Request'} ${status.toLowerCase()}!`);
      if (type === 'invite') {
        fetchSection('invites', getReceivedInvitations);
      } else {
        fetchSection('receivedReq', getReceivedCollaborationRequests);
      }
      if (isAccept) fetchSection('joined', () => getProjects({ listType: 'myJoined' }));
    } catch (err) {
      toast.error('Action failed.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const renderActionItem = (item, type) => {
    const title = item.project?.title || 'Project Title';
    const link = item.project ? `/projects/${item.project._id || item.project}` : '#';

    return (
      <ListGroup.Item key={item._id} className="d-flex justify-content-between align-items-center p-3">
        <div className="d-flex align-items-center">
          {type === 'sent' && <BsSend size={20} className="me-2 text-primary" />}
          {type === 'received' && <BsInbox size={20} className="me-2 text-warning" />}
          {type === 'invite' && <BsInbox size={20} className="me-2 text-success" />}
          <div>
            <Link to={link} className="fw-bold text-decoration-none text-dark">{title}</Link>
            <div className="small text-muted">
              {type === 'sent' && `To: ${item.projectOwner?.name || 'Owner'} - Status: ${item.status}`}
              {type === 'received' && `From: ${item.requester?.name || 'User'}`}
              {type === 'invite' && `From: ${item.inviter?.name || 'User'}`}
            </div>
          </div>
        </div>
        {(type === 'received' || type === 'invite') && (
          <div className="d-flex gap-2">
            <RBButton
              size="sm"
              variant="success"
              onClick={() => handleResponse(item._id, 'Accepted', type === 'invite' ? 'invite' : 'request')}
              disabled={actionLoading[item._id]}
            >
              {actionLoading[item._id] ? <LoadingSpinner size="sm" /> : <><BsCheckCircle className="me-1" /> Accept</>}
            </RBButton>
            <RBButton
              size="sm"
              variant="danger"
              onClick={() => handleResponse(item._id, type === 'invite' ? 'Declined' : 'Rejected', type === 'invite' ? 'invite' : 'request')}
              disabled={actionLoading[item._id]}
            >
              {actionLoading[item._id] ? <LoadingSpinner size="sm" /> : <><BsXCircle className="me-1" /> {type === 'invite' ? 'Decline' : 'Reject'}</>}
            </RBButton>
          </div>
        )}
      </ListGroup.Item>
    );
  };

 const renderSection = (title, key, items, type = 'project', emptyMessage) => (
  <Card className="mb-4 shadow-sm">
    <Card.Header as="h5" className="fw-bold d-flex">
      {key === 'created' && <BsFolder size={20} className="me-2 text-primary" />}
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
      type === 'project' ? (
        <Row xs={1} md={2} lg={3} className="g-3 p-3">
          {items.map(project => (
            <Col key={project._id}>
              <ProjectCard project={project} />
            </Col>
          ))}
        </Row>
      ) : (
        <ListGroup variant="flush">
          {items.map(item => renderActionItem(item, type))}
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
          <BsArrowRepeat className={Object.values(loadingStates).some(Boolean) ? 'spinner-border spinner-border-sm' : ''} /> Refresh
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
  'sent', 
  'You have no pending join requests.'
)}

{renderSection(
  'Recieved Join Requests (For Your Projects)', 
  'receivedReq', 
  receivedRequests, 
  'received', 
  'No join requests received for your projects.'
)}

{renderSection(
  'Recieved Collaboration Invites', 
  'invites', 
  receivedInvites, 
  'invite', 
  'You have no pending collaboration invites.'
)}

    </Container>
  );
};

export default DashboardPage;

