// backend/models/Task.js
import mongoose from 'mongoose';

const STATUS_ENUM = ['To Do', 'In Progress', 'Review', 'Done']; 
const WORKFLOW_STATUS_ENUM = [
    'assigned_to_self_todo', 
    'assigned_to_member',    
    'submitted_for_review',
    'rejected_by_owner',  
    'approved_completed',    
    'overdue',
    'due_soon' // Can be managed by frontend or backend based on deadline
];
const PRIORITY_ENUM = ['Low', 'Medium', 'High'];

const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true }, // Denormalize for easier display
    type: { 
        type: String, 
        enum: ['general', 'rejection', 'update_log'], // 'rejection' for owner's rejection reason
        default: 'general' 
    },
    createdAt: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  status: { // This is the Owner's column view
    type: String,
    enum: {
        values: STATUS_ENUM,
        message: 'Status "{VALUE}" is not supported.'
    },
    required: [true, 'Task status is required'],
    default: STATUS_ENUM[0], // Default to 'To Do'
  },
  workflowStatus: { 
    type: String,
    enum: {
        values: WORKFLOW_STATUS_ENUM,
        message: 'Workflow status "{VALUE}" is not supported.'
    },
    required: [true, 'Task workflow status is required'],
    // Default will be set in the controller based on assignment logic
  },
  assignee: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assignee is mandatory'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deadline: { 
    type: Date,
    required: [true, 'Deadline is mandatory'],
  },
  priority: {
    type: String,
    enum: {
        values: PRIORITY_ENUM,
        message: 'Priority "{VALUE}" is not supported.'
    },
    default: PRIORITY_ENUM[1], // Default to 'Medium'
  },
  comments: [commentSchema], // Array of comments
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

// Index for faster querying by project and status
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ assignee: 1 });


// Pre-save hook to manage workflowStatus based on status if owner directly changes status
TaskSchema.pre('save', function(next) {
    if (this.isModified('status') && this.status === 'Done') {
        this.workflowStatus = 'approved_completed';
    }
    // Add more sophisticated pre-save logic here if needed,
    // e.g., if owner moves a task to 'Review', workflowStatus should become 'submitted_for_review'
    // But for now, controllers handle most specific workflow transitions.
    next();
});


const Task = mongoose.model('Task', TaskSchema);
export default Task;