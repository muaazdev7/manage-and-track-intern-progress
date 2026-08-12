import { createContext } from 'react';

/**
 * The context object lives in its own module so AuthContext.jsx exports only
 * a component, which is what React Fast Refresh requires.
 */
export const AuthContext = createContext(null);

export default AuthContext;
