// src/index.js - FINAL CORRECTED CODE

import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import './index.css'; 
import App from './App';

// CORRECTED: Reverting to the filename that exists in your project
import reposrtWebVitals from './reposrtWebVitals'; 

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // StrictMode is removed to allow react-beautiful-dnd to function
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);

// This function call should match the import name
reposrtWebVitals();