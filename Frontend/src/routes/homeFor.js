/**
 * Where each role belongs when they land on '/' or wander somewhere
 * they shouldn't. Lives outside RoleRoute.jsx so that file only exports
 * a component (keeps React Fast Refresh working).
 */
export const homeFor = (user) => (user?.role === 'admin' ? '/admin' : '/intern');

export default homeFor;
