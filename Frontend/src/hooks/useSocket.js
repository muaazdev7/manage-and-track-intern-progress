import { useContext } from 'react';

import SocketContext from '../context/socket-context';

/** The live socket, or null before it connects / after logout. */
const useSocket = () => useContext(SocketContext);

export default useSocket;
