import React, { createContext, useEffect, useState, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext'; // To get user ID

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001/api';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, loading: authLoading } = useContext(AuthContext); // Get user and auth loading state

  useEffect(() => {
    // Don't try to connect if auth is still loading
    if (authLoading) {
      return;
    }

    if (user && !socket) {
      // Connect if user is logged in and socket isn't already connected
      const newSocket = io(SOCKET_URL, {
        // transports: ['websocket'], // Optional: Force websocket if polling issues
        // You can pass auth token here if your backend verifies it on connection
        // query: { token: localStorage.getItem('token') }
      });

      newSocket.on('connect', () => {
        //console.log('Socket connected:', newSocket.id);
        // Register user with backend socket service
        if (user?._id) {
          newSocket.emit('registerUser', user._id);
        }
      });

      newSocket.on('disconnect', (reason) => {
       // console.log('Socket disconnected:', reason);
        // Potentially attempt to reconnect if not a deliberate disconnect
        // if (reason === 'io server disconnect') {
        //   newSocket.connect();
        // }
      });

      newSocket.on('connect_error', (err) => {
        //console.error('Socket connection error:', err.message);
      });
      
      setSocket(newSocket);

      // Cleanup on component unmount or when user logs out
      return () => {
        //console.log('Cleaning up socket connection.');
        newSocket.close();
        setSocket(null);
      };
    } else if (!user && socket) {
      // If user logs out and socket exists, disconnect it
      //console.log('User logged out, disconnecting socket.');
      socket.close();
      setSocket(null);
    }
  }, [user, authLoading]); // Re-run if user, authLoading state, or socket instance changes

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};