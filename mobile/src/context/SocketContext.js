import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API_BASE_URL } from "../api/client";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(API_BASE_URL, { transports: ["websocket"] });
    return () => socketRef.current?.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socketRef}>{children}</SocketContext.Provider>
  );
}

// Usage: const socket = useSocket(); socket.current.emit(...)
export function useSocket() {
  return useContext(SocketContext);
}
