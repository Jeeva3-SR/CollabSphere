import React, { createContext, useEffect, useState, useContext, useRef } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';
export const SocketContext = createContext(null); 
export const SocketProvider = ({ children }) => {
  const [socketInstance, setSocketInstance] = useState(null); 
  const { user, loading: authLoading } = useContext(AuthContext);
  const socketRef = useRef(null);

  useEffect(() => {
    if (authLoading) {
      if (socketRef.current) {
        console.log('Auth loading, ensuring previous socket is disconnected.');
        socketRef.current.close();
        socketRef.current = null;
        setSocketInstance(null); 
      }
      return;
    }

    if (user) {
      if (!socketRef.current) { 
        //console.log('User logged in, creating and connecting socket.');
        const newSocket = io(SOCKET_URL, {

        });

        newSocket.on('connect', () => {
          //console.log('Socket connected:', newSocket.id);
          if (user?._id) {
            newSocket.emit('registerUser', user._id);
          }
        });

        newSocket.on('disconnect', (reason) => {
          //console.log('Socket disconnected:', reason);
          // if (reason === 'io server disconnect' && user) { // only reconnect if user is still logged in
          //   newSocket.connect();
          // }
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message, err.data);
        });

        socketRef.current = newSocket;
        setSocketInstance(newSocket);  
      }
    } else {
      if (socketRef.current) {
        //console.log('User logged out or not present, disconnecting socket.');
        socketRef.current.close();
        socketRef.current = null;
        setSocketInstance(null); 
      }
    }

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection in useEffect cleanup.');
        socketRef.current.close();
        socketRef.current = null;
        setSocketInstance(null); 
      }
    };
  }, [user, authLoading]);

  return (
    <SocketContext.Provider value={socketInstance}>
      {children}
    </SocketContext.Provider>
  );
};