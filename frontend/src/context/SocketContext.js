import React, { createContext, useEffect, useState, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext'; 

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001/api';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, loading: authLoading } = useContext(AuthContext); 

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (user && !socket) {
      
      const newSocket = io(SOCKET_URL, {
        // transports: ['websocket'], // Optional: Force websocket if polling issues
        // You can pass auth token here if your backend verifies it on connection
        // query: { token: localStorage.getItem('token') }
      });

      newSocket.on('connect', () => {
        //console.log('Socket connected:', newSocket.id);
        if (user?._id) {
          newSocket.emit('registerUser', user._id);
        }
      });

      newSocket.on('disconnect', (reason) => {
       // console.log('Socket disconnected:', reason);
        // if (reason === 'io server disconnect') {
        //   newSocket.connect();
        // }
      });

      newSocket.on('connect_error', (err) => {
        //console.error('Socket connection error:', err.message);
      });
      
      setSocket(newSocket);
      return () => {
        //console.log('Cleaning up socket connection.');
        newSocket.close();
        setSocket(null);
      };
    } else if (!user && socket) {
      console.log('User logged out, disconnecting socket.');
      socket.close();
      setSocket(null);
    }
  }, [user, authLoading,socket]); 

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};