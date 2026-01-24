import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './Home';
import Signup from './SignUp';
import Login from './login';
import Posts from './login';
import Profile from './Profile';
import NewCohortBox from './NewCohortBox';
import VerifyEmail from './VerifyEmail';
import PhotoStep from './PhotoStep';
import FriendRequestPopup from './components/FriendRequestPopup';
import LandingPage from './LandingPage';
import Settings from './Settings';

// ADMIN IMPORTS
import { AdminAuthProvider } from './admin/context/AdminAuthContext';
import AdminRoute from './admin/components/AdminRoute';
import AdminLogin from './admin/pages/Login';
import AdminDashboard from './admin/pages/Dashboard';
import AdminUsers from './admin/pages/Users';
import AdminReports from './admin/pages/Reports';

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <FriendRequestPopup />

        <Routes>
          {/* ADMIN ROUTES */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminUsers />
            </AdminRoute>
          } />
          <Route path="/admin/reports" element={
            <AdminRoute>
              <AdminReports />
            </AdminRoute>
          } />

          {/* USER ROUTES */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/new-cohort-box" element={<NewCohortBox />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/change-dp/:method/:id" element={<PhotoStep />} />
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/settings" element={<Settings />} />

          {/* HOME / CHAT */}
          <Route path="/:chatId?" element={<Home />} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
