// src/components/workspace/TaskDetailModal.js
import React, { useState, useEffect} from 'react';
import { Modal, Button, Form, Row, Col, Alert, Badge as BootstrapBadge } from 'react-bootstrap';
import { updateTask as apiUpdateTask } from '../../services/taskService';
import { toast } from 'react-toastify';
import { OWNER_COLUMN_ORDER, WORKFLOW_STATUSES } from '../../pages/ProjectWorkspacePage';

const TaskDetailModal = ({ 
    show, 
    handleClose, 
    task: initialTask,
    onTaskUpdate,
    onTaskDelete,
    currentUserId, 
    currentUser, 
    isProjectOwner,
    allUsers = [] 
}) => {
  const [task, setTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false); // Only owner can set this to true
  const [formData, setFormData] = useState({ /* ... */ });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTask(initialTask); 
      setFormData({ /* ... default formData ... */
        title: initialTask.title || '',
        description: initialTask.description || '',
        status: initialTask.status || OWNER_COLUMN_ORDER[0],
        priority: initialTask.priority || 'Medium',
        assignee: initialTask.assignee?._id || '',
        deadline: initialTask.deadline ? new Date(initialTask.deadline).toISOString().split('T')[0] : ''
      });
      // Team members cannot edit, so isEditing is always false for them initially.
      // Owner can choose to edit.
      setIsEditing(false); 
      setFormError('');
    }
  }, [initialTask, show]);

  if (!task) return null;

  // Permissions within the modal
  const canOwnerEditDetails = isProjectOwner;
  const canOwnerDelete = isProjectOwner;

  const handleChange = (e) => { /* ... same ... */ 
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => { /* ... same, but guarded by canOwnerEditDetails ... */ 
    if (!canOwnerEditDetails) return;
    if (!formData.title.trim()) { setFormError("Title is required."); return; }
    if (!formData.assignee) { setFormError("Assignee is mandatory."); return; }
    if (!formData.deadline) { setFormError("Deadline is mandatory."); return; }
    setFormError('');

    let newWorkflowStatus = task.workflowStatus; 
    if (formData.status !== task.status) {
        const assigneeForWorkflow = formData.assignee || task.assignee?._id;
        if (assigneeForWorkflow === currentUserId) { 
            if (formData.status === OWNER_COLUMN_ORDER[0]) newWorkflowStatus = WORKFLOW_STATUSES.ASSIGNED_TO_SELF_TODO;
            else if (formData.status === OWNER_COLUMN_ORDER[1]) newWorkflowStatus = WORKFLOW_STATUSES.ASSIGNED_TO_SELF_TODO; // Or a specific "owner_in_progress"
            else if (formData.status === OWNER_COLUMN_ORDER[2]) newWorkflowStatus = WORKFLOW_STATUSES.SUBMITTED_FOR_REVIEW;
            else if (formData.status === OWNER_COLUMN_ORDER[3]) newWorkflowStatus = WORKFLOW_STATUSES.APPROVED_COMPLETED;
        } else { 
            if (formData.status === OWNER_COLUMN_ORDER[0]) newWorkflowStatus = WORKFLOW_STATUSES.ASSIGNED_TO_MEMBER;
            else if (formData.status === OWNER_COLUMN_ORDER[1]) newWorkflowStatus = WORKFLOW_STATUSES.ASSIGNED_TO_MEMBER;
            else if (formData.status === OWNER_COLUMN_ORDER[2]) newWorkflowStatus = WORKFLOW_STATUSES.SUBMITTED_FOR_REVIEW;
            else if (formData.status === OWNER_COLUMN_ORDER[3]) newWorkflowStatus = WORKFLOW_STATUSES.APPROVED_COMPLETED;
        }
    }
    
    const updatedTaskData = {
      title: formData.title, description: formData.description,
      status: formData.status, workflowStatus: newWorkflowStatus,
      priority: formData.priority, assignee: formData.assignee, 
      deadline: formData.deadline,
    };
    
    try {
      const response = await apiUpdateTask(task._id, updatedTaskData);
      onTaskUpdate(response); 
      toast.success("Task details updated!");
      setIsEditing(false);
    } catch (err) { /* ... error handling ... */ 
        const apiErrorMessage = err.response?.data?.message || "Error updating task.";
        toast.error(apiErrorMessage);
        setFormError(apiErrorMessage);
    }
  };

  const getPriorityBadgeVariant = (p) => { /* ... same ... */ 
    switch (p?.toLowerCase()) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'secondary';
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{isEditing && isProjectOwner ? `Edit: ${task.title}` : `Task: ${task.title}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {formError && <Alert variant="danger">{formError}</Alert>}
        {!(isEditing && isProjectOwner) ? ( // VIEW MODE for everyone, or if owner is not editing
          <> 
            <Row className="mb-2"><Col md={3}><strong className="text-muted">Status:</strong></Col><Col><BootstrapBadge bg="primary" pill>{task.status}</BootstrapBadge> <em className="small text-muted">({task.workflowStatus})</em></Col></Row>
            <Row className="mb-2"><Col md={3}><strong className="text-muted">Priority:</strong></Col><Col><BootstrapBadge bg={getPriorityBadgeVariant(task.priority)} text={task.priority?.toLowerCase() === 'medium' ? 'dark' : 'white'} pill>{task.priority || 'Normal'}</BootstrapBadge></Col></Row>
            <Row className="mb-3"><Col md={3}><strong className="text-muted">Assigned to:</strong></Col><Col>{task.assignee?.name || <span className="text-muted fst-italic">Unassigned</span>}</Col></Row>
            <Row className="mb-3"><Col md={3}><strong className="text-muted">Deadline:</strong></Col><Col className={new Date(task.deadline) < new Date() && task.workflowStatus !== WORKFLOW_STATUSES.APPROVED_COMPLETED ? "text-danger fw-bold" : ""}>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}</Col></Row>
            <strong className="text-muted">Description:</strong>
            <div className="p-2 mt-1 bg-light rounded border" style={{ whiteSpace: 'pre-wrap', minHeight: '80px', maxHeight: '200px', overflowY: 'auto'  }}>{task.description || <span className="text-muted fst-italic">No description.</span>}</div>
            
            {task.comments && task.comments.length > 0 && 
                task.comments.filter(c => c.text?.startsWith("Rejected:")).slice(-1).map(comment => ( // Show latest rejection
                <div className="mt-3" key={comment.createdAt || Math.random()}>
                    <strong className="text-danger">Latest Rejection Feedback:</strong>
                    <div className="p-2 mt-1 bg-danger-subtle border border-danger-subtle rounded small" style={{ whiteSpace: 'pre-wrap'}}>
                        {comment.text.substring(10).trim()}
                    </div>
                </div>
            ))}
            <hr/>
            <Row className="small text-muted mt-3"><Col md={6}><strong>Created by:</strong> {task.createdBy?.name || 'N/A'} on {new Date(task.createdAt).toLocaleDateString()}</Col><Col md={6} className="text-md-end"><strong>Last Updated:</strong> {new Date(task.updatedAt).toLocaleString()}</Col></Row>
          </>
        ) : ( /* EDITING FORM (Only Owner can reach here via Edit button) */
          <Form>
            <Form.Group className="mb-3"><Form.Label>Title <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} /></Form.Group>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Status (Column)</Form.Label><Form.Select name="status" value={formData.status} onChange={handleChange}>
                {OWNER_COLUMN_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Priority</Form.Label><Form.Select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
              </Form.Select></Form.Group></Col>
            </Row>
            <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Assignee <span className="text-danger">*</span></Form.Label><Form.Select name="assignee" value={formData.assignee} onChange={handleChange} required>
                    <option value="" disabled>Select Assignee...</option>
                    {allUsers.map(user => (<option key={user._id} value={user._id}>{user.name || user.username}</option>))}
                </Form.Select></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Deadline <span className="text-danger">*</span></Form.Label><Form.Control type="date" name="deadline" value={formData.deadline} onChange={handleChange} required min={new Date().toISOString().split("T")[0]}/></Form.Group></Col>
            </Row>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer className="justify-content-between">
        <div>
            {isProjectOwner && !isEditing && canOwnerDelete && ( // Show delete only for owner in view mode
                 <Button variant="outline-danger" size="sm" onClick={() => onTaskDelete(task._id)} className="me-2">
                    <i className="fas fa-trash-alt me-1"></i> Delete
                </Button>
            )}
        </div>
        <div>
            {isProjectOwner && !isEditing && (
                <Button variant="info" size="sm" onClick={() => setIsEditing(true)} className="me-2 text-white"><i className="fas fa-edit me-1"></i> Edit</Button>
            )}
            {isProjectOwner && isEditing && (
                <Button variant="outline-secondary" size="sm" onClick={() => setIsEditing(false)} className="me-2">Cancel</Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleClose} className="me-2">Close</Button>
            {isProjectOwner && isEditing && (
                <Button variant="success" size="sm" onClick={handleSaveChanges}><i className="fas fa-save me-1"></i> Save</Button>
            )}
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default TaskDetailModal;