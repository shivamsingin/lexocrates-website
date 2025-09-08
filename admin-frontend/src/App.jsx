import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BlogList from './pages/BlogList';
import Categories from './pages/Categories';
import Tags from './pages/Tags';
import BlogEditor from './components/Blog/BlogEditor';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Files from './pages/Files';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Main Layout Component
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className={`flex flex-col w-0 flex-1 overflow-hidden ${sidebarOpen ? 'main-content-sidebar-open' : 'main-content'}`}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
};

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/blog" element={
        <ProtectedRoute>
          <MainLayout>
            <BlogList />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/blog/new" element={
        <ProtectedRoute>
          <MainLayout>
            <BlogEditor onSave={() => window.history.back()} onCancel={() => window.history.back()} />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/blog/edit/:id" element={
        <ProtectedRoute>
          <MainLayout>
            <BlogEditor onSave={() => window.history.back()} onCancel={() => window.history.back()} />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/categories" element={
        <ProtectedRoute>
          <MainLayout>
            <Categories />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/tags" element={
        <ProtectedRoute>
          <MainLayout>
            <Tags />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute>
          <MainLayout>
            <Users />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/files" element={
        <ProtectedRoute>
          <MainLayout>
            <Files />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <Settings />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
