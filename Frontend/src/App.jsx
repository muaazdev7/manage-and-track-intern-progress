import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import homeFor from './routes/homeFor';
import DashboardLayout from './components/layout/DashboardLayout';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/Dashboard';
import Interns from './pages/admin/Interns';
import InternDetail from './pages/admin/InternDetail';
import Tasks from './pages/admin/Tasks';
import AdminTaskDetail from './pages/admin/TaskDetail';
import Review from './pages/admin/Review';

import InternDashboard from './pages/intern/Dashboard';
import MyTasks from './pages/intern/MyTasks';
import InternTaskDetail from './pages/intern/TaskDetail';
import Profile from './pages/intern/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

/** Full-screen spinner shown while the session check is in flight. */
const BootScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-accent)]" />
  </div>
);

/**
 * Nothing renders until the /auth/me check settles — otherwise ProtectedRoute
 * sees user === null on first paint and flashes the login page on every refresh.
 */
const AppRoutes = () => {
  const { loading, user } = useAuth();

  if (loading) return <BootScreen />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePassword />} />

        <Route element={<DashboardLayout />}>
          {/* Admin */}
          <Route element={<RoleRoute allow="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/interns" element={<Interns />} />
            <Route path="/admin/interns/:id" element={<InternDetail />} />
            <Route path="/admin/tasks" element={<Tasks />} />
            <Route path="/admin/tasks/:id" element={<AdminTaskDetail />} />
            <Route path="/admin/review" element={<Review />} />
          </Route>

          {/* Intern */}
          <Route element={<RoleRoute allow="intern" />}>
            <Route path="/intern" element={<InternDashboard />} />
            <Route path="/intern/tasks" element={<MyTasks />} />
            <Route path="/intern/tasks/:id" element={<InternTaskDetail />} />
            <Route path="/intern/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to={homeFor(user)} replace />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      {/* Inside AuthProvider: the socket only opens once we know who is logged in. */}
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
          {/* Painted from the Nocturne tokens — the library's default is a
              white card, which would glare against the dark ground. */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontSize: '14px',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-divider)',
                boxShadow: 'var(--shadow-md)',
              },
              success: { iconTheme: { primary: '#93dcc0', secondary: '#232532' } },
              error: { iconTheme: { primary: '#f2a6a6', secondary: '#232532' } },
            }}
          />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
