import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TestInstructions from './pages/TestInstructions';
import TestPage from './pages/TestPage';
import ResultPage from './pages/ResultPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUploadTest from './pages/AdminUploadTest';
import AdminAttempts from './pages/AdminAttempts';
import AdminEditTest from './pages/AdminEditTest';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />

          {/* Student Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute role="student"><StudentDashboard /></PrivateRoute>
          } />
          <Route path="/test/:testId/instructions" element={
            <PrivateRoute role="student"><TestInstructions /></PrivateRoute>
          } />
          <Route path="/test/:testId/attempt" element={
            <PrivateRoute role="student"><TestPage /></PrivateRoute>
          } />
          <Route path="/result/:attemptId" element={
            <PrivateRoute role="student"><ResultPage /></PrivateRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>
          } />
          <Route path="/admin/upload" element={
            <PrivateRoute role="admin"><AdminUploadTest /></PrivateRoute>
          } />
          <Route path="/admin/test/:testId/edit" element={
            <PrivateRoute role="admin"><AdminEditTest /></PrivateRoute>
          } />
          <Route path="/admin/test/:testId/attempts" element={
            <PrivateRoute role="admin"><AdminAttempts /></PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
