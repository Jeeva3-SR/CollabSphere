// src/components/workspace/UpdateTaskStatusModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const UpdateTaskStatusModal = ({ show, handleClose, task, onStatusUpdate, availableStatuses }) => {
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (task) {
      setNewStatus(task.status); // Initialize with current task status
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newStatus || newStatus === task.status) {
      handleClose(); // No change or no selection
      return;
    }
    onStatusUpdate({ ...task, status: newStatus });
  };

  if (!task) return null; // Don't render if no task is selected

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update Task: <span className="fw-normal">{task.title}</span></Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <p><strong>Current Status:</strong> {task.status}</p>
          <Form.Group controlId="taskStatusUpdate">
            <Form.Label>New Status</Form.Label>
            <Form.Select 
              value={newStatus} 
              onChange={(e) => setNewStatus(e.target.value)}
              required
            >
              {availableStatuses.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {/* You can add more editable fields here if needed, e.g., description, priority */}
          <div className="mt-3">
            <strong>Description:</strong>
            <p className="text-muted" style={{whiteSpace: 'pre-wrap'}}>{task.description || 'No description provided.'}</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!newStatus || newStatus === task.status}>
            Update Status
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UpdateTaskStatusModal;