// src/components/workspace/TaskCard.js
import React from 'react';
import { Card, Badge as BootstrapBadge, Button, Stack, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
    CalendarCheck, PersonCircle, ExclamationTriangleFill, 
    CheckCircleFill, XCircleFill, ArrowRepeat, Upload, 
    ChatSquareQuote, CheckSquareFill, HourglassSplit, 
    ClockFill 
} from 'react-bootstrap-icons';
import { OWNER_COLUMN_ORDER, MEMBER_COLUMN_ORDER, WORKFLOW_STATUSES } from '../../pages/ProjectWorkspacePage';

const getPriorityStyling = (priority) => { /* ... same ... */ 
    switch (priority?.toLowerCase()) {
        case 'high': return { variant: 'danger', icon: <ExclamationTriangleFill className="me-1" /> };
        case 'medium': return { variant: 'warning', icon: <ClockFill className="me-1" /> };
        case 'low': return { variant: 'success', icon: <CheckCircleFill className="me-1"/> };
        default: return { variant: 'secondary', icon: null };
    }
};

const TaskCard = React.memo(({ 
    task, 
    isProjectOwner, 
    currentUserId, 
    columnTitle, 
    onTaskClick, 
    onSubmitForReview,
    onApproveTask,
    onRejectTask, // This function in parent opens the rejection modal
    onOwnerMarkSelfTaskDone 
}) => {
  const priorityStyling = getPriorityStyling(task.priority);
  const isAssignedToCurrentUser = task.assignee?._id === currentUserId;

  const isOverdue = task.workflowStatus === WORKFLOW_STATUSES.OVERDUE;
  const isDueSoon = task.workflowStatus === WORKFLOW_STATUSES.DUE_SOON;
  const isSubmittedForReview = task.workflowStatus === WORKFLOW_STATUSES.SUBMITTED_FOR_REVIEW;
  const isRejectedByOwner = task.workflowStatus === WORKFLOW_STATUSES.REJECTED_BY_OWNER;
  const isCompleted = task.workflowStatus === WORKFLOW_STATUSES.APPROVED_COMPLETED;

  const showSubmitForReviewButton = !isProjectOwner && 
                                    isAssignedToCurrentUser &&
                                    (task.workflowStatus === WORKFLOW_STATUSES.ASSIGNED_TO_MEMBER || 
                                     task.workflowStatus === WORKFLOW_STATUSES.REJECTED_BY_OWNER ||
                                     task.workflowStatus === WORKFLOW_STATUSES.OVERDUE ||
                                     task.workflowStatus === WORKFLOW_STATUSES.DUE_SOON 
                                    ) &&
                                    task.workflowStatus !== WORKFLOW_STATUSES.SUBMITTED_FOR_REVIEW &&
                                    task.workflowStatus !== WORKFLOW_STATUSES.APPROVED_COMPLETED &&
                                    columnTitle === MEMBER_COLUMN_ORDER[0]; 
                                    
  const showOwnerReviewControls = isProjectOwner && 
                                  task.workflowStatus === WORKFLOW_STATUSES.SUBMITTED_FOR_REVIEW &&
                                  task.status === OWNER_COLUMN_ORDER[2]; 
  
  const showOwnerMarkSelfDoneButton = isProjectOwner &&
                                      isAssignedToCurrentUser && 
                                      task.status === OWNER_COLUMN_ORDER[0] && 
                                      task.workflowStatus === WORKFLOW_STATUSES.ASSIGNED_TO_SELF_TODO &&
                                      !isCompleted;

  let cardBorderColor = 'transparent'; 
  let cardBgColor = 'white';
  let cardTextColor = '#212529';
  let titleIcon = null;

  if (isCompleted) { 
    cardBorderColor = '#198754'; cardBgColor = '#d1e7dd'; cardTextColor = '#0f5132';
    titleIcon = <OverlayTrigger placement="top" overlay={<Tooltip>Completed!</Tooltip>}><CheckCircleFill size={16} className="me-1 text-success"/></OverlayTrigger>;
  } else if (isOverdue) { 
    cardBorderColor = '#dc3545'; cardBgColor = '#f8d7da'; cardTextColor = '#58151c';
    titleIcon = <OverlayTrigger placement="top" overlay={<Tooltip>Task Overdue!</Tooltip>}><ExclamationTriangleFill size={16} className="me-1 text-danger"/></OverlayTrigger>;
  } else if (isSubmittedForReview) { 
    cardBorderColor = '#0dcaf0'; cardBgColor = '#cff4fc'; cardTextColor = '#055160';
    titleIcon = <OverlayTrigger placement="top" overlay={<Tooltip>Pending Owner Review</Tooltip>}><ChatSquareQuote size={16} className="me-1 text-info"/></OverlayTrigger>;
  } else if (isDueSoon) { 
    cardBorderColor = '#ffc107'; cardBgColor = '#fff9e0'; cardTextColor = '#665120';
    titleIcon = <OverlayTrigger placement="top" overlay={<Tooltip>Deadline Approaching!</Tooltip>}><HourglassSplit size={16} className="me-1 text-warning"/></OverlayTrigger>;
  } else if (isRejectedByOwner) { 
    cardBorderColor = '#6c757d'; cardBgColor = '#e9ecef'; cardTextColor = '#41464b'; 
    titleIcon = <OverlayTrigger placement="top" overlay={<Tooltip>Review Rejected - Rework</Tooltip>}><ArrowRepeat size={16} className="me-1 text-secondary"/></OverlayTrigger>;
  }

  // --- GET LATEST REJECTION COMMENT ---
  let latestRejectionComment = null;
  if (isRejectedByOwner && task.comments && task.comments.length > 0) {
    // Find the most recent comment of type 'rejection'
    const rejectionComments = task.comments.filter(c => c.type === 'rejection');
    if (rejectionComments.length > 0) {
        latestRejectionComment = rejectionComments.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    }
  }
  // --- END GET LATEST REJECTION COMMENT ---

  return (
    <div
        style={{ userSelect: 'none', marginBottom: '10px', borderRadius: '0.375rem' }}
        onClick={() => onTaskClick(task)} 
        className="task-card-clickable-wrapper"
    >
        <Card
          className="shadow-sm task-card-hover" 
          style={{
            cursor: 'pointer',
            backgroundColor: cardBgColor,
            border: `1px solid ${cardBorderColor !== 'transparent' ? cardBorderColor : '#dee2e6'}`,
            borderLeft: `5px solid ${cardBorderColor !== 'transparent' ? cardBorderColor : (priorityStyling.variant === 'secondary' ? '#adb5bd' : getComputedStyle(document.documentElement).getPropertyValue('--bs-' + priorityStyling.variant) || '#adb5bd')}`,
            color: cardTextColor,
            opacity: isCompleted ? 0.75 : 1,
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <Card.Body className="p-2 p-md-3">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <Card.Title as="h6" className="mb-0 fw-bold" style={{ fontSize: '0.95rem' }}>
                {titleIcon}
                {task.title}
              </Card.Title>
              {task.priority && (
                    <BootstrapBadge 
                      pill 
                      bg={priorityStyling.variant}
                      className="ms-2 text-capitalize"
                      text={priorityStyling.variant === 'warning' ? 'dark' : 'white'}
                      style={{fontSize: '0.7rem', padding: '0.3em 0.6em'}}
                    >
                      {priorityStyling.icon} {task.priority}
                    </BootstrapBadge>
                  )}
            </div>

            {task.description && ( 
                 <Card.Text className="small mb-2" style={{fontSize: '0.85rem', lineHeight: '1.4', color: (isSubmittedForReview || isOverdue || isRejectedByOwner || isDueSoon) ? 'inherit' : '#6c757d' }}>
                    {task.description.substring(0, 100) + (task.description.length > 100 ? '...' : '')}
                </Card.Text>
            )}

            <Stack direction="horizontal" gap={3} className="small flex-wrap mb-2" style={{color: (isSubmittedForReview || isOverdue || isRejectedByOwner || isDueSoon) ? 'inherit' : '#6c757d' }}>
                {task.assignee && ( <div className="d-flex align-items-center" title={`Assigned to: ${task.assignee.name}`}><PersonCircle size={14} className="me-1"/>{task.assignee.name?.split(' ')[0]}</div>)}
                {task.deadline && ( <div className={`d-flex align-items-center ${isOverdue && !isSubmittedForReview ? 'text-danger fw-bold' : (isDueSoon && !isSubmittedForReview ? 'text-warning fw-bold' : '')}`} title={`Deadline: ${new Date(task.deadline).toLocaleDateString()}`}><CalendarCheck size={14} className="me-1"/>{new Date(task.deadline).toLocaleDateString()}</div>)}
            </Stack>
            
            {/* --- DISPLAY LATEST REJECTION COMMENT --- */}
            {latestRejectionComment && (
                <div className="mt-2 mb-2 p-2 bg-secondary-subtle border border-secondary rounded small"> {/* Changed to secondary-subtle */}
                    <strong>Owner Feedback:</strong> {latestRejectionComment.text.replace(/^Rejected: /i, '')} {/* Remove "Rejected: " prefix for display */}
                </div>
            )}
            {/* --- END DISPLAY --- */}

            {(showSubmitForReviewButton || showOwnerReviewControls || showOwnerMarkSelfDoneButton) && (
                <div className="mt-2 pt-2 border-top d-flex justify-content-end">
                    {showSubmitForReviewButton && ( <Button variant="outline-primary" size="sm" onClick={(e) => { e.stopPropagation(); onSubmitForReview(task._id);}} className="py-1 px-2"><Upload className="me-1"/> Submit for Review</Button>)}
                    {showOwnerReviewControls && (<Stack direction="horizontal" gap={2}><Button variant="outline-danger" size="sm" onClick={(e) => { e.stopPropagation(); onRejectTask(task);}} className="py-1 px-2"><XCircleFill /> Reject</Button><Button variant="success" size="sm" onClick={(e) => { e.stopPropagation(); onApproveTask(task._id);}} className="py-1 px-2"><CheckCircleFill /> Approve</Button></Stack>)}
                    {showOwnerMarkSelfDoneButton && (<Button variant="outline-success" size="sm" onClick={(e) => { e.stopPropagation(); onOwnerMarkSelfTaskDone(task._id);}} className="py-1 px-2"><CheckSquareFill className="me-1"/> Mark as Done</Button>)}
                </div>
            )}
          </Card.Body>
        </Card>
    </div>
  );
});

export default TaskCard;