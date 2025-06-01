import React, { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getNotifications, markNotificationsAsRead } from '../services/notificationService';
import { respondToCollaborationRequest, respondToInvitation } from '../services/collaborationService';
import NotificationItem from '../components/notification/NotificationItem';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-toastify';

// Import eventBus and the event name
import eventBus, { NOTIFICATION_REFETCH_EVENT } from '../utils/eventBus'; 

import Container from 'react-bootstrap/Container';
import ListGroup from 'react-bootstrap/ListGroup';
import RBButton from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { XCircle, CheckCircleFill, EnvelopeExclamationFill, CheckAll } from 'react-bootstrap-icons';

const NotificationsPage = () => {
  const { user, setUnreadNotificationsCount } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({}); 

  const fetchNotifications = useCallback(async (isRefetch = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (!isRefetch) setLoading(true); // Full load for initial, subtle for refetch
    setError(null);
    try {
      const data = await getNotifications();
      setNotifications(data);
      if (setUnreadNotificationsCount) {
          const unread = data.filter(n => !n.isRead).length;
          setUnreadNotificationsCount(unread); // Sync global count with fresh data
      }
    } catch (err) {
      const message = err.response?.data?.message || "Could not load notifications.";
      setError(message);
      toast.error(message);
    } finally {
      if (!isRefetch) setLoading(false);
    }
  }, [user, setUnreadNotificationsCount]);

  useEffect(() => {
    fetchNotifications(false); // Initial fetch on mount
    
    const handleRefetchEvent = () => {
        console.log("NotificationsPage: NOTIFICATION_REFETCH_EVENT received, refetching notifications...");
        fetchNotifications(true); // Indicate it's a refetch (e.g., for a more subtle loading state)
    };
    
    // Add event listener
    eventBus.addEventListener(NOTIFICATION_REFETCH_EVENT, handleRefetchEvent);

    // Cleanup: remove event listener when component unmounts
    return () => {
      eventBus.removeEventListener(NOTIFICATION_REFETCH_EVENT, handleRefetchEvent);
    };
  }, [fetchNotifications]); // fetchNotifications is memoized

  const handleMarkAsRead = async (notificationId = null) => {
    const idsToMark = notificationId 
      ? [notificationId] 
      : notifications.filter(n => !n.isRead).map(n => n._id);

    if (idsToMark.length === 0) return;

    const originalNotifications = [...notifications]; // For potential rollback
    
    // Optimistic UI update
    setNotifications(prev => 
      prev.map(n => idsToMark.includes(n._id) ? { ...n, isRead: true } : n)
    );
    if (setUnreadNotificationsCount) { // Update global count optimistically
        const newUnreadCount = notifications.filter(n => !n.isRead && !idsToMark.includes(n._id)).length;
        setUnreadNotificationsCount(newUnreadCount);
    }

    try {
      await markNotificationsAsRead(idsToMark);
      if (!notificationId) toast.success("All notifications marked as read.");
    } catch (err) {
      toast.error("Failed to mark notification(s) as read.");
      setNotifications(originalNotifications); // Rollback optimistic update
      // Refetch to ensure global count is accurate after error
      if (setUnreadNotificationsCount) fetchNotifications(true); 
    }
  };

  const handleAction = async (notification, action) => {
    const { type, _id: notifId, collaborationId } = notification;
    if (!collaborationId && (type === 'REQUEST_RECEIVED' || type === 'INVITE_RECEIVED')) {
      toast.error("Action cannot be performed: Missing reference ID for this notification type.");
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
      fetchNotifications(true); // Refetch to get updated list, read status, and counts
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to perform action.");
    } finally {
      setActionLoading(prev => ({ ...prev, [notifId]: '' }));
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return <div className="alert alert-danger text-center container mt-5">{error}</div>;
  }

  const currentLocalUnreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4 px-2">
        <h1 className="h2 text-template-dark fw-bolder">Notifications</h1>
        {notifications.length > 0 && currentLocalUnreadCount > 0 && (
          <RBButton 
            variant="outline-secondary" 
            size="sm" 
            onClick={() => handleMarkAsRead(null)} 
            className="btn-h8 d-flex align-items-center"
            disabled={loading && actionLoading === 'markAllRead'} // Specific loading for this button if desired
          >
            {actionLoading === 'markAllRead' ? <LoadingSpinner size="sm" className="me-1"/> : <CheckAll size={18} className="me-1" />} 
            Mark All as Read ({currentLocalUnreadCount})
          </RBButton>
        )}
      </div>

      {notifications.length === 0 && !loading ? (
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
          {loading && notifications.length > 0 && (
            <div className="text-center p-3 border-bottom">
                <LoadingSpinner size="md"/> <span className="ms-2 small text-muted">Refreshing notifications...</span>
            </div>
          )}
          <ListGroup variant="flush">
            {notifications.map(notification => (
              <React.Fragment key={notification._id}>
                <NotificationItem 
                    notification={notification} 
                    onMarkAsRead={() => handleMarkAsRead(notification._id)} 
                />
                {!notification.isRead && 
                 (notification.type === 'REQUEST_RECEIVED' || notification.type === 'INVITE_RECEIVED') && 
                 notification.collaborationId && (
                  <div className={`px-3 pb-3 pt-2 d-flex justify-content-end gap-2 ${notification.isRead ? 'bg-white' : 'bg-light-subtle border-top-0'}`}>
                    <RBButton
                      size="sm" variant="success"
                      onClick={() => handleAction(notification, 'Accepted')}
                      disabled={!!actionLoading[notification._id]}
                      className="btn-h8 d-flex align-items-center"
                    >
                      {actionLoading[notification._id] === 'Accepted' ? <LoadingSpinner size="sm" variant="light" className="me-1" /> : <CheckCircleFill size={14} className="me-1" />}
                      Accept
                    </RBButton>
                    <RBButton
                      size="sm" variant="danger"
                      onClick={() => handleAction(notification, notification.type === 'REQUEST_RECEIVED' ? 'Rejected' : 'Declined')}
                      disabled={!!actionLoading[notification._id]}
                      className="btn-h8 d-flex align-items-center"
                    >
                      {(actionLoading[notification._id] === 'Rejected' || actionLoading[notification._id] === 'Declined') ? (
                        <LoadingSpinner size="sm" variant="light" className="me-1" />
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