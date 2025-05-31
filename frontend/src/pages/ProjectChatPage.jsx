import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
// New chat service functions
import { getChatRoomForProject, getMessagesForChatRoom, postChatMessage } from '../services/chatService'; 
import LoadingSpinner from '../components/common/LoadingSpinner';
import UserAvatar from '../components/user/UserAvatar';
import { toast } from 'react-toastify';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import RBButton from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import { SendFill, PeopleFill, ArrowLeft } from 'react-bootstrap-icons';
import { formatDistanceToNow } from 'date-fns';


const ProjectChatPage = () => {
    const { projectId } = useParams();
    const { user: currentUser } = useContext(AuthContext);
    const socket = useContext(SocketContext);

    const [chatRoom, setChatRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]); // Map or array of user IDs/names
    const messagesEndRef = useRef(null); // To scroll to bottom

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]); // Scroll when messages change

    // Fetch chat room details and initial messages
    useEffect(() => {
        if (!projectId || !currentUser?._id) return;
        setLoading(true);
        const fetchRoomAndMessages = async () => {
            try {
                const roomData = await getChatRoomForProject(projectId);
                setChatRoom(roomData);
                if (roomData?._id) {
                    const messagesData = await getMessagesForChatRoom(roomData._id); // Add pagination later
                    setMessages(messagesData.reverse()); // Assuming backend sends newest first
                }
            } catch (error) {
                toast.error("Failed to load chat room: " + (error.response?.data?.message || error.message));
                // Handle navigation or error display
            } finally {
                setLoading(false);
            }
        };
        fetchRoomAndMessages();
    }, [projectId, currentUser]);

    // Socket.IO listeners
    useEffect(() => {
        if (!socket || !chatRoom?._id) return;

        socket.emit('joinChatRoom', chatRoom._id);
        console.log(`Emitted joinChatRoom for ${chatRoom._id}`);

        const handleNewMessage = (message) => {
            console.log("New chat message received via socket:", message);
            // Ensure sender info is populated if needed, or assume backend does it
            if (message.chatRoomId === chatRoom._id) {
                setMessages(prevMessages => [...prevMessages, message]);
            }
        };
        
        // Listener for users currently in this chat room (backend needs to emit this)
        const handleOnlineUsersInRoom = (usersList) => {
            console.log("Online users in room:", usersList);
            setOnlineUsers(usersList); // Expects an array of user objects/IDs
        };

        socket.on('newChatMessage', handleNewMessage);
        socket.on('onlineUsersInRoom', handleOnlineUsersInRoom); // Custom event

        return () => {
            socket.emit('leaveChatRoom', chatRoom._id);
            socket.off('newChatMessage', handleNewMessage);
            socket.off('onlineUsersInRoom', handleOnlineUsersInRoom);
            console.log(`Emitted leaveChatRoom for ${chatRoom._id}`);
        };
    }, [socket, chatRoom]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatRoom?._id || !currentUser?._id) return;
        setSending(true);
        try {
            // The HTTP post will save it, and socket will broadcast to others.
            // The sender will also receive the broadcast message.
            await postChatMessage(chatRoom._id, { text: newMessage });
            setNewMessage(''); // Clear input after successful HTTP post
        } catch (error) {
            toast.error("Failed to send message: " + (error.response?.data?.message || error.message));
        } finally {
            setSending(false);
        }
    };

    if (loading) return <Container className="text-center py-5"><LoadingSpinner size="lg" /></Container>;
    if (!chatRoom) return <Container className="text-center py-5"><p className="text-danger">Could not load chat room details.</p><Link to={`/projects/${projectId}`}>Back to Project</Link></Container>;

    return (
        <Container fluid="lg" className="py-3 d-flex flex-column" style={{ height: 'calc(100vh - 56px)' }}> {/* Adjust height based on navbar */}
            <Row className="mb-2 align-items-center">
                <Col xs="auto">
                    <Link to={`/projects/${projectId}`} className="text-muted"><ArrowLeft size={24} /></Link>
                </Col>
                <Col>
                    <h4 className="mb-0 text-template-dark">{chatRoom.name || "Project Chat"}</h4>
                    <small className="text-muted d-flex align-items-center">
                        <PeopleFill size={16} className="me-1" /> {chatRoom.members?.length} members
                        {onlineUsers.length > 0 && ` (${onlineUsers.length} online)`}
                    </small>
                </Col>
                {/* Optionally show online users list button/modal */}
            </Row>

            <Card className="flex-grow-1 d-flex flex-column shadow-sm">
                <Card.Body className="flex-grow-1 p-0 d-flex flex-column">
                    <ListGroup variant="flush" className="flex-grow-1 overflow-auto p-3" style={{maxHeight: '70vh'}}>
                        {messages.map(msg => (
                            <ListGroup.Item key={msg._id} className={`d-flex mb-2 border-0 p-0 ${msg.sender?._id === currentUser?._id ? 'justify-content-end' : ''}`}>
                                <div className={`p-2 rounded-3 mw-75 ${msg.sender?._id === currentUser?._id ? 'bg-primary text-white' : 'bg-light text-dark'}`} style={{wordBreak: 'break-word'}}>
                                    {msg.sender?._id !== currentUser?._id && (
                                        <small className="fw-bold d-block text-muted">{msg.sender?.name || 'User'}</small>
                                    )}
                                    {msg.text}
                                    <small className="d-block text-opacity-75 mt-1" style={{fontSize: '0.7rem'}}>
                                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                    </small>
                                </div>
                            </ListGroup.Item>
                        ))}
                        <div ref={messagesEndRef} />
                    </ListGroup>
                    <Form onSubmit={handleSendMessage} className="p-3 border-top">
                        <InputGroup>
                            <Form.Control
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                disabled={sending}
                                className="form-control-h14 rounded-start-3"
                            />
                            <RBButton variant="primary" type="submit" disabled={sending || !newMessage.trim()} className="rounded-end-3 btn-h14">
                                {sending ? <LoadingSpinner size="sm" animation="grow" /> : <SendFill />}
                            </RBButton>
                        </InputGroup>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};
export default ProjectChatPage;