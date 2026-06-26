import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

// This is a custom "Hook" to make using the socket easier later
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // 1. Connect to the backend
        const newSocket = io(import.meta.env.VITE_API_URL);
        setSocket(newSocket);

        // 2. Cleanup: Close the pipe when the browser tab closes
        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};