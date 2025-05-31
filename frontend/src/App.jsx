import React, { useContext, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import NavbarComponent from './components/Layout/NavbarComponent.jsx'; // Renamed to avoid conflict
// import Footer from './components/Layout/Footer';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectFeedPage from './pages/ProjectFeedPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import CreateProjectPage from './pages/CreateProjectPage';
import EditProjectPage from './pages/EditProjectPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import TeamManagementPage from './pages/TeamManagementPage';
import NotFoundPage from './pages/NotFoundPage';
import PrivateRoute from './components/common/PrivateRoute';
import { AuthContext } from './context/AuthContext';
import { SocketContext } from './context/SocketContext';
import { toast } from 'react-toastify';
import ProjectChatPage from './pages/ProjectChatPage';
//import Container from 'react-bootstrap/Container'; // For main layout container
import MyProjectsPage from './pages/MyProjectsPage';

function App() {
  const location = useLocation();
  const { user, loadUser } = useContext(AuthContext);
  const socket = useContext(SocketContext);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

 // frontend/src/App.js
useEffect(() => {
  if (socket && user) {
    socket.emit('registerUser', user._id);
    
    socket.on('newNotification', (notification) => {
      console.log('FRONTEND: New notification received via socket:', notification); // <<< KEY LOG
      toast.info(`🔔 ${notification.message}`, { /* ... */ });
      // Potentially update unread count state here
    });

    return () => socket.off('newNotification');
  }
}, [socket, user]);

  const pagesWithOwnHeader = ['/login', '/register'];
  const useGenericNavbar = !pagesWithOwnHeader.includes(location.pathname) && location.pathname !== '/';

  return (
    // group-design-root class added in index.css to apply font globally
    <div className="d-flex flex-column min-vh-100 bg-white group-design-root">
      {useGenericNavbar && <NavbarComponent />}
      
      {/* 'layout-container' from template is now handled by Bootstrap's Container or custom CSS */}
      {/* 'px-40 flex flex-1 justify-center py-5' from template becomes Bootstrap Container or similar */}
      {/* 'layout-content-container flex flex-col max-w-[960px] flex-1' from template also handled by Container */}

      <main className="flex-grow-1 d-flex flex-column"> {/* This main tag will wrap routes */}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat/:projectId" element={<PrivateRoute><ProjectChatPage /></PrivateRoute>} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/my-projects" element={<PrivateRoute><MyProjectsPage /></PrivateRoute>} /> 
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/projects" element={<PrivateRoute><ProjectFeedPage /></PrivateRoute>} />
          <Route path="/projects/:id" element={<PrivateRoute><ProjectDetailsPage /></PrivateRoute>} />
          <Route path="/create-project" element={<PrivateRoute><CreateProjectPage /></PrivateRoute>} />
          <Route path="/edit-project/:projectId" element={<PrivateRoute><EditProjectPage /></PrivateRoute>} />
          <Route path="/profile/:userId" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
          <Route path="/team/:projectId" element={<PrivateRoute><TeamManagementPage /></PrivateRoute>} />
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {/* {useGenericNavbar && <Footer />} */}
    </div>
  );
}

export default App;