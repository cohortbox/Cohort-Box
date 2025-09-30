// src/context/SocketContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { connectSocket } from "../socket/socket"; // adjust if your path differs
import { useAuth } from "./AuthContext";

// Shape of what the context provides
const SocketContext = createContext(null);

/**
 * SocketProvider
 * - Establishes exactly one socket connection for the app (per logged-in session)
 * - Registers the user on connect
 * - Keeps the JWT in sync via `updateToken`
 * - Cleans up on unmount or auth changes
 */
export const SocketProvider = ({ children }) => {
  const { user, accessToken, loading } = useAuth();
  const [socket, setSocket] = useState(null);

  // Connect / disconnect lifecycle
  useEffect(() => {
    // Only attempt connection when we have a token and auth is done loading
    if (loading || !accessToken) return;

    const s = connectSocket(accessToken);

    // Register the user once the transport is up
    s.on("connect", () => {
      if (user?.id) {
        s.emit("register", user.id);
      }
    });

    setSocket(s);

    return () => {
      try {
        s.removeAllListeners();
        s.disconnect();
      } catch {}
      setSocket(null);
    };
  }, [accessToken, loading, user?.id]);

  // Keep token fresh on the existing connection
  useEffect(() => {
    if (!socket || !accessToken) return;
    socket.emit("updateToken", accessToken);
  }, [socket, accessToken]);

  // Stable helper emits (nice for DX, optional to use)
  const api = useMemo(() => {
    if (!socket) {
      // Return no-op fallbacks until socket is ready (prevents undefined checks everywhere)
      const noop = () => {};
      return {
        socket: null,
        emit: noop,
        sendPrivateMessage: noop,
        markMessagesRead: noop,
        reactToMessage: noop,
        deleteMessage: noop,
        deleteChatMessages: noop,
        setTyping: noop,
        chatOpened: noop,
        updateToken: noop,
      };
    }

    return {
      socket,
      emit: socket.emit.bind(socket),

      // --- Common emits your app already uses ---
      sendPrivateMessage: ({ chatId, to, text, tempId, attachments }) =>
        socket.emit("privateMessage", { chatId, to, text, tempId, attachments }),

      markMessagesRead: ({ chatId, msgId, to }) =>
        socket.emit("privateMessageRead", { chatId, msgId, to }),

      reactToMessage: ({ msgId, emoji }) =>
        socket.emit("reaction", { msgId, emoji }),

      deleteMessage: ({ chatId, msgId }) =>
        socket.emit("deleteMessage", { chatId, msgId }),

      deleteChatMessages: ({ chatId }) =>
        socket.emit("deleteMessages", chatId),

      setTyping: ({ chatId, typing, username, userId }) =>
        socket.emit("typing", { chatId, typing, username, userId }),

      chatOpened: (chatId) => socket.emit("chatOpened", chatId),

      updateToken: (token) => socket.emit("updateToken", token),
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={api}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * useSocket
 * - Access the socket instance and helper emit functions
 *
 * Example:
 * const { socket, sendPrivateMessage } = useSocket();
 */
export const useSocket = () => useContext(SocketContext);

/**
 * useSocketEvent(eventName, handler, deps?)
 * - Subscribes to a socket event with automatic cleanup
 * - Keeps the latest handler via a ref to avoid stale closures
 *
 * Example:
 * useSocketEvent("message", (msg) => { ... }, [selectedChat?._id]);
 */
export const useSocketEvent = (eventName, handler, deps = []) => {
  const { socket } = useSocket();
  const savedHandler = useRef(handler);

  // Keep ref in sync with the latest handler
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler, ...deps]);

  useEffect(() => {
    if (!socket || !eventName) return;

    const listener = (...args) => savedHandler.current?.(...args);
    socket.on(eventName, listener);

    return () => {
      socket.off(eventName, listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, eventName, ...deps]);
};
