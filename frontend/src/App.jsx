import { useContext, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import NavbarComponent from './components/Layout/NavbarComponent.jsx'; 
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
import ProjectChatPage from './pages/ProjectChatPage.jsx'
import PrivateRoute from './components/common/PrivateRoute';
import { AuthContext } from './context/AuthContext';
import { SocketContext } from './context/SocketContext';
import { toast } from 'react-toastify';
import MyProjectsPage from './pages/MyProjectsPage.jsx';


function App() {
  const location = useLocation();
  const { user, loadUser } = useContext(AuthContext);
  const socket = useContext(SocketContext);

  useEffect(() => {
    loadUser();
  }, [loadUser]);


useEffect(() => {
  if (socket && user) {
    socket.emit('registerUser', user._id);
    
    socket.on('newNotification', (notification) => {
      //console.log('FRONTEND: New notification received via socket:', notification); // <<< KEY LOG
      toast.info(`🔔 ${notification.message}`, { /* ... */ });

    });

    return () => socket.off('newNotification');
  }
}, [socket, user]);

  const pagesWithOwnHeader = ['/login', '/register'];
  const useGenericNavbar = !pagesWithOwnHeader.includes(location.pathname) && location.pathname !== '/';

  return (
    <div className="d-flex flex-column min-vh-100 bg-white group-design-root">
      {useGenericNavbar && <NavbarComponent />}
      <main className="flex-grow-1 d-flex flex-column">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path='/chat/:projectId' element={<ProjectChatPage/>}/>
          <Route path ='/my-projects' element={<MyProjectsPage/>}/>
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
    </div>
  );
}

export default App;