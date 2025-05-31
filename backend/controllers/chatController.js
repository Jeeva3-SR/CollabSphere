import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';
import Project from '../models/Project.js'; // To verify project existence and user membership
import User from '../models/User.js'; // To populate sender details
import { io } from '../server.js'; // Assuming io is exported from server.js

// @desc    Get or Create Chat Room for a Project
// @route   GET /api/chat/room/:projectId
// @access  Private (User must be a member of the project)
const getChatRoomForProject = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  //console.log(`Attempting to get/create chat room for project: ${projectId}, user: ${userId}`);

  try {
    const project = await Project.findById(projectId).populate('teamMembers', 'name avatar'); // Populate for member check
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Ensure the current user is a member of the project to access its chat
    const isMember = project.teamMembers.some(member => member._id.toString() === userId);
    if (!isMember && project.owner.toString() !== userId) { // Owner is implicitly a member
        // If project owner is not in teamMembers array explicitly, check against project.owner
        // This check might be redundant if owner is always in teamMembers
      return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
    }

    let chatRoom = await ChatRoom.findOne({ projectId })
                                 .populate('members', 'name avatar email _id'); // Populate member details

    if (!chatRoom) {
      // If chat room doesn't exist, create it (should ideally be created with project)
      // This is a fallback in case it wasn't created.
      //console.log(`Chat room for project ${projectId} not found, creating one.`);
      const projectOwner = await User.findById(project.owner);
      chatRoom = new ChatRoom({
        projectId,
        name: `${project.title} Chat`,
        members: [project.owner, ...project.teamMembers.map(tm => tm._id)].filter((v, i, a) => a.findIndex(t => (t._id || t).equals(v._id || v)) === i) // Deduplicate members including owner
      });
      await chatRoom.save();
      // Re-populate after save to get the same structure
      chatRoom = await ChatRoom.findById(chatRoom._id).populate('members', 'name avatar email _id');
    } else {
        // Ensure current project members are synced with chat room members
        // This can be important if team members changed after chat room creation
        const projectMemberIds = [project.owner.toString(), ...project.teamMembers.map(tm => tm._id.toString())];
        const uniqueProjectMemberIds = [...new Set(projectMemberIds)]; // Ensure unique IDs

        // Find members to add to chat
        const membersToAdd = uniqueProjectMemberIds.filter(pmId => !chatRoom.members.some(cm => cm._id.toString() === pmId));
        // Find members to remove from chat (if they left the project)
        const membersToRemove = chatRoom.members.filter(cm => !uniqueProjectMemberIds.includes(cm._id.toString())).map(cm => cm._id);

        if (membersToAdd.length > 0 || membersToRemove.length > 0) {
            //console.log(`Syncing chat room members for project ${projectId}. Adding: ${membersToAdd.length}, Removing: ${membersToRemove.length}`);
            if (membersToAdd.length > 0) {
                chatRoom.members.push(...membersToAdd);
            }
            if (membersToRemove.length > 0) {
                chatRoom.members = chatRoom.members.filter(member => !membersToRemove.some(idToRemove => idToRemove.equals(member._id)));
            }
            await chatRoom.save();
            // Re-populate after save
            chatRoom = await ChatRoom.findById(chatRoom._id).populate('members', 'name avatar email _id');
        }
    }


    res.json(chatRoom);
  } catch (error) {
    //console.error('Error in getChatRoomForProject:', error);
    res.status(500).json({ message: 'Server error while fetching chat room.' });
  }
};

// @desc    Get Messages for a Chat Room
// @route   GET /api/chat/messages/:chatRoomId
// @access  Private (User must be a member of the chat room)
const getMessagesForChatRoom = async (req, res) => {
  const { chatRoomId } = req.params;
  const userId = req.user.id;
  const { limit = 50, beforeTimestamp } = req.query; // For pagination

  //console.log(`Fetching messages for chatRoomId: ${chatRoomId}, user: ${userId}`);

  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found.' });
    }
    if (!chatRoom.members.map(m => m.toString()).includes(userId)) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this chat room.' });
    }

    let query = { chatRoomId };
    if (beforeTimestamp) {
      query.timestamp = { $lt: new Date(beforeTimestamp) };
    }

    const messages = await ChatMessage.find(query)
      .populate('sender', 'name avatar _id') // Populate sender details
      .sort({ timestamp: -1 }) // Get newest messages first for pagination (frontend will reverse for display)
      .limit(parseInt(limit));

    //console.log(`Fetched ${messages.length} messages for chatRoomId: ${chatRoomId}`);
    res.json(messages); // Frontend will typically reverse this for display (oldest to newest)
  } catch (error) {
    //console.error('Error in getMessagesForChatRoom:', error);
    res.status(500).json({ message: 'Server error while fetching messages.' });
  }
};

// @desc    Post a new Message to a Chat Room
// @route   POST /api/chat/messages/:chatRoomId
// @access  Private (User must be a member of the chat room)
const postMessage = async (req, res) => {
  const { chatRoomId } = req.params;
  const { text } = req.body;
  const senderId = req.user.id;

  //console.log(`Posting message to chatRoomId: ${chatRoomId} by user: ${senderId}`);

  if (!text || text.trim() === '') {
    return res.status(400).json({ message: 'Message text cannot be empty.' });
  }

  try {
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found.' });
    }
    if (!chatRoom.members.map(m => m.toString()).includes(senderId)) {
      return res.status(403).json({ message: 'Access denied. You cannot post in this chat room.' });
    }

    let newMessage = new ChatMessage({
      chatRoomId,
      sender: senderId,
      text: text.trim(),
      readBy: [senderId] // Sender has read it
    });
    await newMessage.save();

    // Populate sender details for broadcasting
    newMessage = await ChatMessage.findById(newMessage._id)
                                  .populate('sender', 'name avatar _id')
                                  .exec();

    // Broadcast the new message to all clients in the Socket.IO room for this chatRoomId
    // The Socket.IO room name should be the chatRoomId
    if (io) {
      io.to(chatRoomId.toString()).emit('newChatMessage', newMessage);
      //console.log(`Message broadcasted to room: ${chatRoomId}`);
    } else {
      //console.warn('Socket.IO server (io) not available for broadcasting message.');
    }
    
    res.status(201).json(newMessage);
  } catch (error) {
    //console.error('Error in postMessage:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: "Validation Error", errors: messages });
    }
    res.status(500).json({ message: 'Server error while posting message.' });
  }
};

// TODO: Add controllers for managing online status if need
// ed,
// e.g., marking messages as read, etc.

export {
  getChatRoomForProject,
  getMessagesForChatRoom,
  postMessage
};