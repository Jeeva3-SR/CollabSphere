import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { formatDistanceToNow } from 'date-fns';
import UserAvatar from '../user/UserAvatar';
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import {
    PersonPlusFill, // REQUEST_RECEIVED, INVITE_RECEIVED
    CheckCircleFill as CheckCircleIcon, // REQUEST_ACCEPTED, INVITE_ACCEPTED (using Bootstrap alias)
    XCircleFill as XCircleIcon,   // REQUEST_REJECTED, INVITE_DECLINED (using Bootstrap alias)
    PeopleFill as UsersIcon,      // TEAM_MEMBER_JOINED (using Bootstrap alias)
    PersonDashFill as UserMinusIcon, // TEAM_MEMBER_LEFT (using Bootstrap alias)
    InfoCircleFill as InformationCircleIcon, // Generic (using Bootstrap alias)
    ChatDotsFill, // For NEW_MESSAGE
} from 'react-bootstrap-icons';


const getNotificationIconAndStyle = (type) => {
    // Using Bootstrap Icons
    switch (type) {
        case 'REQUEST_RECEIVED':
        case 'INVITE_RECEIVED':
            return { icon: <PersonPlusFill size={22} className="text-primary" />, variant: 'primary-subtle' };
        case 'REQUEST_ACCEPTED':
        case 'INVITE_ACCEPTED':
            return { icon: <CheckCircleIcon size={22} className="text-success" />, variant: 'success-subtle' };
        case 'REQUEST_REJECTED':
        case 'INVITE_DECLINED':
            return { icon: <XCircleIcon size={22} className="text-danger" />, variant: 'danger-subtle' };
        case 'TEAM_MEMBER_JOINED':
            return { icon: <UsersIcon size={22} className="text-info" />, variant: 'info-subtle' };
        case 'TEAM_MEMBER_LEFT':
            return { icon: <UserMinusIcon size={22} className="text-warning" />, variant: 'warning-subtle' };
        case 'NEW_MESSAGE': // New type
            return { icon: <ChatDotsFill size={22} className="text-primary" />, variant: 'primary-subtle' };
        default:
            return { icon: <InformationCircleIcon size={22} className="text-secondary" />, variant: 'secondary-subtle' };
    }
};

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const navigate = useNavigate();
  const { icon, variant: badgeVariant } = getNotificationIconAndStyle(notification.type);

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }

    // Navigation logic
    if (notification.type === 'NEW_MESSAGE' && notification.projectId) {
      // Assuming messages are tied to projects and you have a route like /projects/:id/messages
      // Or navigate to a general messages page filtered by this project/conversation
      navigate(`/projects/${notification.projectId._id || notification.projectId}?tab=messages`); // Example
    } else if (notification.type.includes('REQUEST') || notification.type.includes('INVITE')) {
        navigate('/notifications'); // Stay on notifications page for actions
    } else if (notification.projectId) {
      navigate(`/projects/${notification.projectId._id || notification.projectId}`);
    } else if (notification.relatedUser) {
      navigate(`/profile/${notification.relatedUser._id || notification.relatedUser}`);
    }
    // else, no specific navigation, stays on current page or default behavior
  };

  return (
    <ListGroup.Item
        action // Makes it behave like a link with hover/focus styles
        onClick={handleClick} // Use custom handler for more control
        className={`d-flex align-items-start gap-3 p-3 ${notification.isRead ? 'bg-white' : `bg-${badgeVariant} text-dark` }`}
        style={{ cursor: 'pointer' }}
    >
      <div className="flex-shrink-0 mt-1">
        {notification.relatedUser && (notification.type !== 'NEW_MESSAGE' || !notification.projectId) ? ( // Show user avatar unless it's a new message *within* a project context
            <UserAvatar user={notification.relatedUser} size="md" />
        ) : (
            icon
        )}
      </div>
      <div className="flex-grow-1">
        <p className={`mb-1 small ${notification.isRead ? 'text-muted' : 'fw-semibold'}`}>
          {notification.message}
        </p>
        {notification.projectId && notification.projectId.title && (
             <p className="small text-muted mt-0 mb-1">
                Project: <Link to={`/projects/${notification.projectId._id || notification.projectId}`} onClick={(e) => e.stopPropagation()} className="text-decoration-none fw-semibold hover-underline">{notification.projectId.title}</Link>
            </p>
        )}
        <small className="text-muted">
          {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
        </small>
      </div>
      {!notification.isRead && (
        <div className="flex-shrink-0 ms-auto mt-1">
          <Badge bg="primary" pill> </Badge> {/* Small dot for unread */}
        </div>
      )}
    </ListGroup.Item>
  );
};

export default NotificationItem;