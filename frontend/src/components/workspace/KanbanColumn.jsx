// src/components/workspace/KanbanColumn.js
import React from 'react';
import TaskCard from './TaskCard';
import { Card, Badge } from 'react-bootstrap';

const KanbanColumn = React.memo(({ 
    title, 
    tasks, 
    isProjectOwner, 
    currentUserId,
    onTaskClick,
    onSubmitForReview,
    onApproveTask,
    onRejectTask,
    onOwnerMarkSelfTaskDone // Ensure this is passed
}) => {
  return (
    <Card className="h-100 shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
      <Card.Header as="h6" className="text-center text-uppercase small fw-bold py-2" style={{backgroundColor: '#e9ecef', color: '#495057', borderBottom: '1px solid #dee2e6'}}>
        {title} <Badge pill bg="dark" text="white" className="ms-1">{tasks.length}</Badge>
      </Card.Header>
      <Card.Body className="p-2" style={{ overflowY: 'auto', minHeight: '300px', maxHeight: 'calc(100vh - 280px)'}}>
        {tasks.length === 0 && (<div className="text-center text-muted small mt-4 p-3 border border-dashed rounded"><p className="mb-1">No tasks.</p></div>)}
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            isProjectOwner={isProjectOwner}
            currentUserId={currentUserId}
            columnTitle={title} // The title/status of the current column
            onTaskClick={onTaskClick}
            onSubmitForReview={onSubmitForReview}
            onApproveTask={onApproveTask}
            onRejectTask={onRejectTask}
            onOwnerMarkSelfTaskDone={onOwnerMarkSelfTaskDone} // Pass it down
          />
        ))}
      </Card.Body>
    </Card>
  );
});
export default KanbanColumn;