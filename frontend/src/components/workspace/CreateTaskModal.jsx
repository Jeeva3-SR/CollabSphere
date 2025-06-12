// src/components/workspace/CreateTaskModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';

const CreateTaskModal = ({ 
    show, 
    handleClose, 
    onTaskCreated, 
    teamMembers = [], 
    currentUserId, 
    currentUser,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState(''); 
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
        setTitle('');
        setDescription('');
        setDeadline('');
        setPriority('Medium');
        setError('');
        // Default assignee to the owner (current user)
        if (currentUserId) {
            setAssigneeId(currentUserId);
        } else {
            setAssigneeId(''); // Should not happen if currentUser is always available for owner
        }
    }
  }, [show, currentUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!assigneeId) { setError('Assignee is mandatory.'); return; } 
    if (!deadline) { setError('Deadline is mandatory.'); return; }   
    
    setError('');
    onTaskCreated({ title, description, assigneeId, deadline, priority });
    // Parent (ProjectWorkspacePage) will handle closing
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Create New Task</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3" controlId="taskTitleCreate">
            <Form.Label>Title <span className="text-danger">*</span></Form.Label>
            <Form.Control type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Enter task title"/>
          </Form.Group>

          <Form.Group className="mb-3" controlId="taskDescriptionCreate">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description of the task"/>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="taskAssigneeCreate">
                <Form.Label>Assign To <span className="text-danger">*</span></Form.Label>
                <Form.Select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required>
                  <option value="" disabled={assigneeId !== ""}>Select Assignee...</option> {/* Allow selecting if default is not desired */}
                  {currentUser && (
                    <option value={currentUser._id}>Me ({currentUser.name})</option>
                  )}
                  {teamMembers
                    .filter(member => member._id !== currentUser?._id) 
                    .map(member => (
                    <option key={member._id} value={member._id}>
                      {member.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="taskDeadlineCreate">
                <Form.Label>Deadline <span className="text-danger">*</span></Form.Label>
                <Form.Control type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required min={new Date().toISOString().split("T")[0]}/>
              </Form.Group>
            </Col>
          </Row>
           <Form.Group className="mb-3" controlId="taskPriorityCreateModal">
                <Form.Label>Priority</Form.Label>
                <Form.Select 
                    name="priority" 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </Form.Select>
            </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" type="submit">Create Task</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateTaskModal;