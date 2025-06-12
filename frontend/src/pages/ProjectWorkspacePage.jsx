// src/pages/ProjectWorkspacePage.js
import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Button, Alert, Row, Col, Card as BootstrapCard, ListGroup, Modal, Form } from 'react-bootstrap'; // Alert might still be used for general errors
import { toast } from 'react-toastify';
import { ArrowClockwise as RefreshIcon } from 'react-bootstrap-icons'; // Removed BellFill

import { 
    getTasksForProject, 
    updateTask as apiUpdateTask, 
    createTask as apiCreateTask,
    deleteTask as apiDeleteTask,
    submitTaskForReview as apiSubmitTaskForReview,  // Ensured these are consistently named
    approveReviewedTask as apiApproveReviewedTask, 
    rejectReviewedTask as apiRejectReviewedTask   
} from '../services/taskService';
import { getProjectById } from '../services/projectService';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import KanbanColumn from '../components/workspace/KanbanColumn';
import CreateTaskModal from '../components/workspace/CreateTaskModal';
import TaskDetailModal from '../components/workspace/TaskDetailModal';

export const OWNER_COLUMN_ORDER = ['To Do', 'In Progress', 'Review', 'Done'];
export const MEMBER_COLUMN_ORDER = ['To Do', 'For Review', 'Done'];

export const WORKFLOW_STATUSES = {
    ASSIGNED_TO_SELF_TODO: 'assigned_to_self_todo',
    ASSIGNED_TO_MEMBER: 'assigned_to_member',    
    SUBMITTED_FOR_REVIEW: 'submitted_for_review',
    REJECTED_BY_OWNER: 'rejected_by_owner',  
    APPROVED_COMPLETED: 'approved_completed',
    OVERDUE: 'overdue',
    DUE_SOON: 'due_soon'
};

const initialColumnsData = () => { /* ... same ... */ 
    const data = {};
    OWNER_COLUMN_ORDER.forEach(status => {
        data[String(status)] = { id: String(status), title: String(status), tasks: [] };
    });
    return JSON.parse(JSON.stringify(data));
};

// No mock APIs needed here anymore if taskService.js is complete

const ProjectWorkspacePage = () => {
  const { id: projectId } = useParams();
  const { user: currentUser } = useContext(AuthContext);

  const [project, setProject] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const currentColumnOrder = useMemo(() => 
    isProjectOwner ? OWNER_COLUMN_ORDER : MEMBER_COLUMN_ORDER, 
  [isProjectOwner]);

  const allUsersListForAssigneeDropdown = useMemo(() => { /* ... same ... */ 
    if (!project || !currentUser) return [];
    const members = project.teamMembers || [];
    const ownerUser = project.owner ? { _id: project.owner._id, name: project.owner.name, email: project.owner.email } : null;
    const uniqueUsers = ownerUser ? [ownerUser] : [];
    members.forEach(member => {
        if (!ownerUser || member._id !== ownerUser._id) { uniqueUsers.push(member); }
    });
    return uniqueUsers;
  }, [project, currentUser]);

  const updateTaskInState = useCallback((updatedTaskFromServer) => { /* ... same ... */ 
    setAllTasks(prevTasks => {
        let taskFound = false;
        const newTasks = prevTasks.map(t => {
            if (t._id === updatedTaskFromServer._id) {
                taskFound = true;
                return { ...t, ...updatedTaskFromServer, updatedAt: new Date(updatedTaskFromServer.updatedAt || Date.now()).toISOString() };
            }
            return t;
        });
        if (!taskFound && updatedTaskFromServer._id && !prevTasks.find(t=> t._id === updatedTaskFromServer._id)) {
             newTasks.push({ ...updatedTaskFromServer, updatedAt: new Date(updatedTaskFromServer.updatedAt || Date.now()).toISOString() });
        }
        return newTasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    });
  }, []);
  
  const processTaskDeadlineAndReviewStates = useCallback((tasksToCheck) => { /* ... same ... */ 
    const now = new Date().getTime();
    const soonThreshold = 3 * 24 * 60 * 60 * 1000; 
    let overallChange = false;
    const updatedTasks = tasksToCheck.map(task => {
        let newWorkflowStatus = task.workflowStatus;
        let taskChangedThisIteration = false;
        if (task.workflowStatus !== WORKFLOW_STATUSES.APPROVED_COMPLETED && task.workflowStatus !== WORKFLOW_STATUSES.SUBMITTED_FOR_REVIEW) {
            if (task.deadline) {
                const deadlineTime = new Date(task.deadline).getTime();
                if (deadlineTime < now) {
                    if (task.workflowStatus !== WORKFLOW_STATUSES.OVERDUE) { newWorkflowStatus = WORKFLOW_STATUSES.OVERDUE; taskChangedThisIteration = true; }
                } else if (deadlineTime - now <= soonThreshold) {
                    if (task.workflowStatus !== WORKFLOW_STATUSES.DUE_SOON && task.workflowStatus !== WORKFLOW_STATUSES.OVERDUE) { newWorkflowStatus = WORKFLOW_STATUSES.DUE_SOON; taskChangedThisIteration = true; }
                } else {
                    if (task.workflowStatus === WORKFLOW_STATUSES.OVERDUE || task.workflowStatus === WORKFLOW_STATUSES.DUE_SOON) {
                        newWorkflowStatus = task.assignee?._id === currentUser?._id && isProjectOwner ? WORKFLOW_STATUSES.ASSIGNED_TO_SELF_TODO : WORKFLOW_STATUSES.ASSIGNED_TO_MEMBER;
                        taskChangedThisIteration = true;
                    }
                }
            }
        }
        if (taskChangedThisIteration) overallChange = true;
        return { ...task, workflowStatus: newWorkflowStatus };
    });
    return { finalTasks: updatedTasks, anyChange: overallChange };
  }, [currentUser?._id, isProjectOwner]);

  const fetchWorkspaceData = useCallback(async (isManualRefresh = false) => { /* ... same ... */ 
    if (!isManualRefresh) setLoading(true); else setIsRefreshing(true);
    setError(null);
    try {
      if (!currentUser?._id) { 
          if (!isManualRefresh) setLoading(false); else setIsRefreshing(false);
          setError("User authentication is pending."); return; 
      }
      const projectData = await getProjectById(projectId);
      setProject(projectData); 
      const ownerStatus = projectData.owner._id === currentUser._id;
      setIsProjectOwner(ownerStatus);
      const isMember = projectData.teamMembers.some(member => member._id === currentUser._id);
      if (!isMember && !ownerStatus) throw new Error('Access Denied.');
      let tasksData = await getTasksForProject(projectId);
      const { finalTasks } = processTaskDeadlineAndReviewStates(tasksData);
      setAllTasks(finalTasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      if(isManualRefresh) toast.success("Workspace refreshed!");
    } catch (err) { 
        const msg = err.response?.data?.message || err.message || 'Error loading data.';
        setError(msg); toast.error(msg);
        if (err.response?.status === 404 || err.response?.status === 403) window.location.href = "/projects"; 
    } finally { 
      if (!isManualRefresh) setLoading(false); else setIsRefreshing(false);
    }
  }, [projectId, currentUser?._id, processTaskDeadlineAndReviewStates]);

  useEffect(() => { /* ... same ... */ 
    let intervalId;
    if (currentUser && projectId) {
      fetchWorkspaceData();
      intervalId = setInterval(() => {
        setAllTasks(prevTasks => {
            const { finalTasks, anyChange } = processTaskDeadlineAndReviewStates(prevTasks);
            return anyChange ? finalTasks : prevTasks;
        });
      }, 30000); 
    }
    return () => clearInterval(intervalId);
  }, [currentUser, projectId, fetchWorkspaceData, processTaskDeadlineAndReviewStates]);

  const handleTaskCreated = (newTaskDataFromModal) => { /* ... same ... */ 
    const tempId = `temp-${Date.now()}`;
    const assigneeIsOwner = newTaskDataFromModal.assigneeId === currentUser._id;
    const initialStatus = assigneeIsOwner ? OWNER_COLUMN_ORDER[0] : OWNER_COLUMN_ORDER[1];
    const initialWorkflowStatus = assigneeIsOwner ? WORKFLOW_STATUSES.ASSIGNED_TO_SELF_TODO : WORKFLOW_STATUSES.ASSIGNED_TO_MEMBER;
    const assigneeObj = allUsersListForAssigneeDropdown.find(m => m._id === newTaskDataFromModal.assigneeId);
    if (!assigneeObj) { toast.error("Assignee is mandatory."); return; }
    if (!newTaskDataFromModal.deadline) { toast.error("Deadline is mandatory."); return; }
    const taskForAPI = {
        projectId: projectId, title: newTaskDataFromModal.title, description: newTaskDataFromModal.description,
        assignee: newTaskDataFromModal.assigneeId, deadline: newTaskDataFromModal.deadline,
        status: initialStatus, workflowStatus: initialWorkflowStatus,
        priority: newTaskDataFromModal.priority || 'Medium'
    };
    const taskForUI = { ...taskForAPI, _id: tempId, assignee: assigneeObj, createdBy: {_id: currentUser._id, name: currentUser.name}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), comments: [] };
    setAllTasks(prev => [taskForUI, ...prev].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    setShowCreateModal(false);
    apiCreateTask(taskForAPI)
      .then(createdTaskFromAPI => {
        setAllTasks(prev => prev.map(t => t._id === tempId ? createdTaskFromAPI : t).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        toast.success(`Task "${createdTaskFromAPI.title}" created!`);
      })
      .catch(err => { 
        const apiError = err.response?.data?.message || "Failed to create task on server.";
        toast.error(apiError);
        setAllTasks(prev => prev.filter(t => t._id !== tempId));
      });
  };
  
  const handleSubmitForReview = async (taskId) => {
    const taskOriginal = allTasks.find(t => t._id === taskId);
    if (!taskOriginal) { toast.error("Task not found."); return; }
    const optimisticUpdate = { 
        ...taskOriginal, 
        status: OWNER_COLUMN_ORDER[2], 
        workflowStatus: WORKFLOW_STATUSES.SUBMITTED_FOR_REVIEW,
        updatedAt: new Date().toISOString()
    };
    updateTaskInState(optimisticUpdate);
    try {
      // --- USE IMPORTED SERVICE FUNCTION ---
      const updatedTaskFromApi = await apiSubmitTaskForReview(taskId); 
      updateTaskInState(updatedTaskFromApi); 
      // toast.info removed as per request
    } catch(err) { 
        toast.error(err.response?.data?.message || "Failed to submit for review. Reverting."); 
        updateTaskInState(taskOriginal);
    }
  };

  const handleApproveTask = async (taskId) => {
    const taskOriginal = allTasks.find(t => t._id === taskId);
    if (!taskOriginal) { toast.error("Task not found."); return; }
    try {
      // --- USE IMPORTED SERVICE FUNCTION ---
      const updatedTaskFromApi = await apiApproveReviewedTask(taskId);
      updateTaskInState(updatedTaskFromApi);
      toast.success(`Task "${taskOriginal.title}" approved!`);
    } catch(err) { toast.error(err.response?.data?.message || "Failed to approve."); }
  };

  const handleOpenRejectionModal = (task) => { 
    setSelectedTaskForModal(task); setRejectionReason(""); setShowRejectionModal(true);
  };

  const handleConfirmRejectTask = async () => { 
    if (!selectedTaskForModal) return;
    if (!rejectionReason.trim() && isProjectOwner) { toast.warn("Reason required."); return; }
    const taskToReject = allTasks.find(t => t._id === selectedTaskForModal._id);
    if(!taskToReject) { toast.error("Task to reject not found."); return; }
    try {
      // --- USE IMPORTED SERVICE FUNCTION ---
      const updatedTaskFromApi = await apiRejectReviewedTask(selectedTaskForModal._id, rejectionReason, taskToReject.assignee?._id, currentUser._id); 
      updateTaskInState(updatedTaskFromApi);
      toast.warn(`Task "${taskToReject.title}" rejected.`);
      setShowRejectionModal(false); setSelectedTaskForModal(null);
    } catch(err) { toast.error(err.response?.data?.message || "Failed to reject."); }
  };
  
  const handleOpenTaskDetail = (task) => { 
    setSelectedTaskForModal(task); setShowTaskDetailModal(true);
  };
  const handleTaskDetailsUpdated = (updatedTask) => { 
    updateTaskInState(updatedTask);
  };
  const handleDeleteTaskOwner = async (taskId) => { /* ... same ... */ 
    if (!isProjectOwner) return;
    const taskToDelete = allTasks.find(t => t._id === taskId);
    if (!taskToDelete) return;
    if (window.confirm(`Delete task: "${taskToDelete.title}"?`)) {
        try {
            await apiDeleteTask(taskId); 
            setAllTasks(prev => prev.filter(t => t._id !== taskId));
            toast.success("Task deleted.");
            setShowTaskDetailModal(false); setSelectedTaskForModal(null);
        } catch (err) { toast.error(err.response?.data?.message || "Failed to delete task."); }
    }
  };
  const handleOwnerMarkSelfTaskDone = async (taskId) => { /* ... same ... */ 
    if (!isProjectOwner) return;
    const taskToComplete = allTasks.find(t => t._id === taskId && t.assignee?._id === currentUser._id);
    if (!taskToComplete) { toast.error("Task error."); return; }
    const apiPayload = { status: OWNER_COLUMN_ORDER[3], workflowStatus: WORKFLOW_STATUSES.APPROVED_COMPLETED };
    const optimisticUpdate = { ...taskToComplete, ...apiPayload, updatedAt: new Date().toISOString() };
    updateTaskInState(optimisticUpdate);
    try {
        const updatedTaskFromApi = await apiUpdateTask(taskId, apiPayload);
        updateTaskInState(updatedTaskFromApi); 
        toast.success(`Task "${taskToComplete.title}" done.`);
    } catch (error) {
        toast.error("Update failed. Reverting.");
        updateTaskInState(taskToComplete); 
    }
  };

  const columnsContent = useMemo(() => { /* ... same ... */ 
    const cols = {};
    currentColumnOrder.forEach(statusKey => { cols[statusKey] = { id: statusKey, title: statusKey, tasks: [] }; });
    allTasks.forEach(task => {
      if (isProjectOwner) {
        if (task.status && cols[task.status]) { cols[task.status].tasks.push(task); } 
        else { const fb = OWNER_COLUMN_ORDER[0]; if(cols[fb]) cols[fb].tasks.push(task); }
      } else { 
        if (task.assignee?._id === currentUser._id) {
          if (task.workflowStatus === WORKFLOW_STATUSES.SUBMITTED_FOR_REVIEW && cols[MEMBER_COLUMN_ORDER[1]]) {
            cols[MEMBER_COLUMN_ORDER[1]].tasks.push(task);
          } else if (task.workflowStatus === WORKFLOW_STATUSES.APPROVED_COMPLETED && cols[MEMBER_COLUMN_ORDER[2]]) {
            cols[MEMBER_COLUMN_ORDER[2]].tasks.push(task);
          } else if (
            (task.workflowStatus === WORKFLOW_STATUSES.ASSIGNED_TO_MEMBER || 
             task.workflowStatus === WORKFLOW_STATUSES.REJECTED_BY_OWNER ||
             task.workflowStatus === WORKFLOW_STATUSES.OVERDUE ||
             task.workflowStatus === WORKFLOW_STATUSES.DUE_SOON 
            ) && 
            cols[MEMBER_COLUMN_ORDER[0]] && task.workflowStatus !== WORKFLOW_STATUSES.APPROVED_COMPLETED 
          ) {
            cols[MEMBER_COLUMN_ORDER[0]].tasks.push(task);
          }
        }
      }
    });
    for (const key in cols) {
        cols[key].tasks.sort((a,b) => new Date(a.deadline || Infinity) - new Date(b.deadline || Infinity) || new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return currentColumnOrder.map(statusId => cols[String(statusId)] || { id: String(statusId), title: String(statusId), tasks: [] });
  }, [allTasks, isProjectOwner, currentUser?._id, currentColumnOrder]);
  
  // tasksPendingOwnerReviewList is no longer needed as a separate state.
  // The notification box will derive from allTasks directly.
  const tasksForOwnerNotification = useMemo(() => 
    isProjectOwner ? allTasks.filter(t => t.workflowStatus === WORKFLOW_STATUSES.SUBMITTED_FOR_REVIEW && t.status === OWNER_COLUMN_ORDER[2]) : [],
  [allTasks, isProjectOwner]);


  if (loading && !project && !isRefreshing) return <div className="d-flex vh-100 justify-content-center align-items-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <Container className="text-center mt-5"><Alert variant="danger">{error}</Alert></Container>;
  if (!project && !loading && !isRefreshing) return <div className="text-center mt-5">Project data could not be loaded.</div>;

  return (
    <Container fluid className="p-md-3 p-2 bg-light min-vh-100">
      <header className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom bg-white p-3 rounded shadow-sm">
        <div>
            <h1 className="h4 mb-1 text-primary fw-bold">{project?.title || 'Loading...'} - Workspace</h1>
            <Link to={`/projects/${projectId}`} className="text-secondary small"><i className="fas fa-arrow-left me-1"></i> Back</Link>
        </div>
        <div className="d-flex align-items-center">
            <Button variant="outline-secondary" size="sm" onClick={() => fetchWorkspaceData(true)} disabled={isRefreshing || loading} className="me-2 shadow-sm">
                <RefreshIcon size={16} className={isRefreshing ? 'animate-spin' : ''}/> {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            {isProjectOwner && (
                <Button variant="primary" onClick={() => setShowCreateModal(true)} size="sm" className="shadow-sm">
                <i className="fas fa-plus me-2"></i>New Task
                </Button>
            )}
        </div>
      </header>

      {/* REMOVED Owner Notification Box from here, owner sees tasks directly in 'Review' column */}
      {/* {isProjectOwner && tasksForOwnerNotification.length > 0 && ( ... )} */}

      <Row className="flex-nowrap gx-3" style={{ overflowX: 'auto', paddingBottom: '1rem', minHeight: 'calc(100vh - 200px)' }}> {/* Adjusted minHeight */}
        {columnsContent.map(column => (
          column ? ( 
            <Col key={String(column.id)} xs={10} sm={8} md={isProjectOwner ? 5 : 6} lg={isProjectOwner ? 4 : 5} xl={isProjectOwner ? 3 : 4}
              style={{minWidth: isProjectOwner ? '280px' : '300px'}}>
              <KanbanColumn
                title={column.title}
                tasks={column.tasks || []}
                isProjectOwner={isProjectOwner}
                currentUserId={currentUser?._id}
                onTaskClick={handleOpenTaskDetail} 
                onSubmitForReview={handleSubmitForReview}
                onApproveTask={handleApproveTask}
                onRejectTask={handleOpenRejectionModal}
                onOwnerMarkSelfTaskDone={handleOwnerMarkSelfTaskDone} 
              />
            </Col>
          ) : <Col key={`placeholder-col-${Math.random()}`} style={{minWidth: '280px'}}><BootstrapCard><BootstrapCard.Body>Loading column...</BootstrapCard.Body></BootstrapCard></Col>
        ))}
      </Row>

      {isProjectOwner && (
        <CreateTaskModal
            show={showCreateModal} handleClose={() => setShowCreateModal(false)}
            onTaskCreated={handleTaskCreated}
            teamMembers={project?.teamMembers || []} 
            currentUserId={currentUser?._id} currentUser={currentUser}
            isOwnerCreating={true}
        />
      )}

    {selectedTaskForModal && ( 
        <TaskDetailModal
          show={showTaskDetailModal}
          handleClose={() => {setSelectedTaskForModal(null); setShowTaskDetailModal(false);}}
          task={selectedTaskForModal}
          onTaskUpdate={handleTaskDetailsUpdated} 
          onTaskDelete={handleDeleteTaskOwner}   
          availableStatuses={OWNER_COLUMN_ORDER} 
          currentUserId={currentUser?._id} currentUser={currentUser} 
          isProjectOwner={isProjectOwner}
          allUsers={allUsersListForAssigneeDropdown} 
        />
      )}

    {selectedTaskForModal && showRejectionModal && isProjectOwner && (
        <Modal show={showRejectionModal} onHide={() => setShowRejectionModal(false)} centered>
            <Modal.Header closeButton><Modal.Title>Reject Task: {selectedTaskForModal.title}</Modal.Title></Modal.Header>
            <Modal.Body>
                <Form.Group controlId="rejectionReason">
                    <Form.Label>Reason for Rejection (mandatory)</Form.Label>
                    <Form.Control as="textarea" rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Provide feedback..."/>
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowRejectionModal(false)}>Cancel</Button>
                <Button variant="danger" onClick={handleConfirmRejectTask} disabled={!rejectionReason.trim()}>Confirm Rejection</Button>
            </Modal.Footer>
        </Modal>
    )}
    </Container>
  );
};

export default ProjectWorkspacePage;