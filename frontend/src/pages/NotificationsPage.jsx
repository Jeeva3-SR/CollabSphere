import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getNotifications, markNotificationsAsRead } from '../services/notificationService';
import { respondToCollaborationRequest, respondToInvitation } from '../services/collaborationService';
import NotificationItem from '../components/notification/NotificationItem';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';
import RBButton from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { XCircle } from 'react-bootstrap-icons';
import { CheckCircleFill, EnvelopeExclamationFill, CheckAll } from 'react-bootstrap-icons';

const NotificationsPage = () => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Now storing the action string ('Accepted', 'Rejected', 'Declined', '') for each notification id
  const [actionLoading, setActionLoading] = useState({}); 

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      const message = err.response?.data?.message || "Could not load notifications.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (notificationId = null) => {
    const idsToMark = notificationId 
      ? [notificationId] 
      : notifications.filter(n => !n.isRead).map(n => n._id);

    if (idsToMark.length === 0) return;

    try {
      await markNotificationsAsRead(idsToMark);
      setNotifications(prev => 
        prev.map(n => idsToMark.includes(n._id) ? { ...n, isRead: true } : n)
      );
      if (!notificationId) toast.success("All notifications marked as read.");
    } catch (err) {
      toast.error("Failed to mark notification(s) as read.");
    }
  };

  const handleAction = async (notification, action) => {
    const { type, _id: notifId, collaborationId } = notification;
    if (!collaborationId) {
      toast.error("Action cannot be performed: Missing reference ID in notification.");
      return;
    }
    setActionLoading(prev => ({ ...prev, [notifId]: action }));
    try {
      if (type === 'REQUEST_RECEIVED') {
        await respondToCollaborationRequest(collaborationId, action);
      } else if (type === 'INVITE_RECEIVED') {
        await respondToInvitation(collaborationId, action);
      }
      toast.success(`Action '${action}' successful!`);
      await handleMarkAsRead(notifId);
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to perform action.");
    } finally {
      setActionLoading(prev => ({ ...prev, [notifId]: '' }));
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center container mt-5">{error}</div>;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
        <h1 className="h2 text-template-dark fw-bolder">Notifications</h1>
        {unreadCount > 0 && (
          <RBButton variant="outline-secondary" size="sm" onClick={() => handleMarkAsRead(null)} className="btn-h8">
            <CheckAll size={18} className="me-1" /> Mark All as Read ({unreadCount})
          </RBButton>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="text-center shadow-sm border-light">
          <Card.Body className="p-5">
            <EnvelopeExclamationFill size={64} className="text-black-50 mb-3" />
            <Card.Title className="h4 text-template-dark">No notifications yet.</Card.Title>
            <Card.Text className="text-template-muted">
              Check back later for updates on your projects and collaborations.
            </Card.Text>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-light">
          <ListGroup variant="flush">
            {notifications.map(notification => (
              <React.Fragment key={notification._id}>
                <NotificationItem notification={notification} onMarkAsRead={() => handleMarkAsRead(notification._id)} />
                {!notification.isRead && (notification.type === 'REQUEST_RECEIVED' || notification.type === 'INVITE_RECEIVED') && notification.collaborationId && (
                  <div className={`px-3 pb-3 pt-1 d-flex justify-content-end gap-2 ${notification.isRead ? 'bg-white' : 'bg-light'}`}>
                    <RBButton
                      size="sm"
                      variant="success"
                      onClick={() => handleAction(notification, 'Accepted')}
                      disabled={!!actionLoading[notification._id]}
                      className="btn-h8 d-flex align-items-center"
                    >
                      {actionLoading[notification._id] === 'Accepted' ? <LoadingSpinner size="sm" color="light" className="me-1" /> : <CheckCircleFill size={14} className="me-1" />}
                      Accept
                    </RBButton>
                    <RBButton
                      size="sm"
                      variant="danger"
                      onClick={() => handleAction(notification, notification.type === 'REQUEST_RECEIVED' ? 'Rejected' : 'Declined')}
                      disabled={!!actionLoading[notification._id]}
                      className="btn-h8 d-flex align-items-center"
                    >
                      {(actionLoading[notification._id] === 'Rejected' || actionLoading[notification._id] === 'Declined') ? (
                        <LoadingSpinner size="sm" color="light" className="me-1" />
                      ) : (
                        <XCircle size={14} className="me-1" />
                      )}
                      {notification.type === 'REQUEST_RECEIVED' ? 'Reject' : 'Decline'}
                    </RBButton>
                  </div>
                )}
              </React.Fragment>
            ))}
          </ListGroup>
        </Card>
      )}
    </Container>
  );
};

export default NotificationsPage;
