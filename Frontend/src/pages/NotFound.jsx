import { Link } from 'react-router-dom';

import useAuth from '../hooks/useAuth';
import homeFor from '../routes/homeFor';

const NotFound = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <p className="text-5xl font-semibold text-brand-600">404</p>
      <h1 className="mt-3 text-lg font-semibold text-slate-900">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">
        That page doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link
        to={isAuthenticated ? homeFor(user) : '/login'}
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        {isAuthenticated ? 'Back to dashboard' : 'Go to login'}
      </Link>
    </div>
  );
};

export default NotFound;
