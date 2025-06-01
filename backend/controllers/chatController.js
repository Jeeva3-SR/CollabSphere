import ChatRoom from '../models/ChatRoom.js';
import ChatMessage from '../models/ChatMessage.js';
import Project from '../models/Project.js'; 
import User from '../models/User.js'; 
import { io } from '../server.js'; 


const getChatRoomForProject = async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  //console.log(`Attempting to get/create chat room for project: ${projectId}, user: ${userId}`);

  try {
    const project = await Project.findById(projectId).populate('teamMembers', 'name avatar'); // Populate for member check
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }


    const isMember = project.teamMembers.some(member => member._id.toString() === userId);
    if (!isMember && project.owner.toString() !== userId) { 
      return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
    }

    let chatRoom = await ChatRoom.findOne({ projectId })
                                 .populate('members', 'name avatar email _id');

    if (!chatRoom) {
      const projectOwner = await User.findById(project.owner);
      chatRoom = new ChatRoom({
        projectId,
        name: `${project.title} Chat`,
        members: [project.owner, ...project.teamMembers.map(tm => tm._id)].filter((v, i, a) => a.findIndex(t => (t._id || t).equals(v._id || v)) === i) 
      });
      await chatRoom.save();
      chatRoom = await ChatRoom.findById(chatRoom._id).populate('members', 'name avatar email _id');
    } else {
        const projectMemberIds = [project.owner.toString(), ...project.teamMembers.map(tm => tm._id.toString())];
        const uniqueProjectMemberIds = [...new Set(projectMemberIds)]; 
        const membersToAdd = uniqueProjectMemberIds.filter(pmId => !chatRoom.members.some(cm => cm._id.toString() === pmId));
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


const getMessagesForChatRoom = async (req, res) => {
  const { chatRoomId } = req.params;
  const userId = req.user.id;
  const { limit = 50, beforeTimestamp } = req.query; 

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
      .populate('sender', 'name avatar _id') 
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    //console.log(`Fetched ${messages.length} messages for chatRoomId: ${chatRoomId}`);
    res.json(messages);
  } catch (error) {
    //console.error('Error in getMessagesForChatRoom:', error);
    res.status(500).json({ message: 'Server error while fetching messages.' });
  }
};


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
      readBy: [senderId] 
    });
    await newMessage.save();

    newMessage = await ChatMessage.findById(newMessage._id)
                                  .populate('sender', 'name avatar _id')
                                  .exec();
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


export {
  getChatRoomForProject,
  getMessagesForChatRoom,
  postMessage
};