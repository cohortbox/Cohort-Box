import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket, useSocketEvent } from "../context/SocketContext";

export default function useHomeChat() {
  const paramChatId = useParams().chatId;
  const navigate = useNavigate();
  const location = useLocation();

  const { user, accessToken, loading } = useAuth();
  const { markMessagesRead, chatOpened } = useSocket();

  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showLiveChat, setShowLiveChat] = useState(true);
  const [userChats, setUserChats] = useState([]);
  const [isNewMessage, setIsNewMessage] = useState(false);
  const [newMessageChatIds, setNewMessageChatIds] = useState([]);

  const focusMessageId = location.state?.focusMessageId ?? null;

  const clearFocus = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };

  useEffect(() => {
    if (!accessToken && !loading) {
      navigate("/login");
    }
  }, [accessToken, loading, navigate]);

  useEffect(() => {
    if (!accessToken || !paramChatId || loading) return;

    fetch(`/api/chats/${paramChatId}`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Request Failed!");
        return res.json();
      })
      .then((data) => setSelectedChat(data.chat))
      .catch((err) => {
        console.error(err);
        navigate("/crash");
      });
  }, [paramChatId, accessToken, loading, navigate]);

  useEffect(() => {
    if (!accessToken || loading) return;

    fetch(`/api/chats`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            setChats([]);
            return null;
          }
          throw new Error("Request Failed with Status: " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        if (data?.chats) setChats(data.chats);
      })
      .catch((err) => {
        console.error(err);
        navigate("/crash");
      });
  }, [accessToken, loading, navigate]);

  useEffect(() => {
    if (!accessToken || loading) return;

    fetch("/api/users", {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Request failed: " + res.status);
        return res.json();
      })
      .then((data) => setUsers(data.users || []))
      .catch((err) => {
        console.error(err);
        navigate("/crash");
      });
  }, [accessToken, loading, navigate]);

  useEffect(() => {
    if (!accessToken || loading || !user?.id) return;

    fetch(`/api/user-chats/${encodeURIComponent(user.id)}`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Request failed: " + res.status);
        return res.json();
      })
      .then((data) => setUserChats(data.chats || []))
      .catch((err) => {
        console.error(err);
        navigate("/crash");
      });
  }, [accessToken, loading, user?.id, navigate]);

  const updateReactions = (existing = [], data) => {
    const filtered = existing.filter(
      (r) => String(r.userId) !== String(data.userId)
    );

    return [...filtered, { userId: data.userId, emoji: data.emoji }];
  };

  useSocketEvent("message", (msg) => {
    if (!msg || !user?.id) return;

    const messageWithTimestamp = {
      ...msg,
      timestamp: Date.now(),
    };

    if (String(messageWithTimestamp.from?._id) === String(user.id)) return;

    if (
      userChats.some(
        (uChat) => String(messageWithTimestamp.chatId) === String(uChat._id)
      )
    ) {
      if (String(messageWithTimestamp.chatId) !== String(selectedChat?._id)) {
        setNewMessageChatIds((prev) => [
          ...prev,
          messageWithTimestamp.chatId,
        ]);
        setIsNewMessage(true);
      }
    }

    const isForSelected =
      selectedChat &&
      String(messageWithTimestamp.chatId) === String(selectedChat._id);

    if (isForSelected) {
      markMessagesRead({
        chatId: selectedChat._id,
        msgId: messageWithTimestamp._id,
        to: messageWithTimestamp.from._id,
      });

      setMessages((prev) => [messageWithTimestamp, ...prev]);
    } else {
      setChats((prev) =>
        prev.map((chat) =>
          String(chat._id) === String(messageWithTimestamp.chatId)
            ? {
                ...chat,
                noOfUnreadMessages: (chat.noOfUnreadMessages || 0) + 1,
              }
            : chat
        )
      );
    }
  }, [selectedChat?._id, user?.id, userChats]);

  useSocketEvent("messagesBatch", ({ chatId, messages }) => {
    if (!Array.isArray(messages) || messages.length === 0) return;

    const isForSelected =
      selectedChat && String(chatId) === String(selectedChat._id);

    if (isForSelected) {
      const stampedMessages = messages.map((msg) => ({
        ...msg,
        timestamp: Date.now(),
      }));

      setMessages((prev) => [...stampedMessages.reverse(), ...prev]);
    } else {
      setChats((prev) =>
        prev.map((chat) =>
          String(chat._id) === String(chatId)
            ? {
                ...chat,
                noOfUnreadMessages:
                  (chat.noOfUnreadMessages || 0) + messages.length,
              }
            : chat
        )
      );
    }
  }, [selectedChat?._id]);

  useSocketEvent("typing", (data) => {
    if (
      !selectedChat ||
      String(data.chatId) !== String(selectedChat._id) ||
      String(data.userId) === String(user?.id)
    ) {
      return;
    }

    if (data.typing) {
      setTypingUsers((prev) => {
        if (prev.find((u) => String(u.userId) === String(data.userId))) {
          return prev;
        }

        return [...prev, { userId: data.userId, username: data.username }];
      });
    } else {
      setTypingUsers((prev) =>
        prev.filter((u) => String(u.userId) !== String(data.userId))
      );
    }
  }, [selectedChat?._id, user?.id]);

  useSocketEvent("reaction", ({ emoji, msgId, userId }) => {
    setMessages((prev) =>
      prev.map((msg) =>
        String(msg._id) === String(msgId)
          ? {
              ...msg,
              reactions: updateReactions(msg.reactions, {
                emoji,
                msgId,
                userId,
              }),
            }
          : msg
      )
    );
  }, []);

  useSocketEvent("deleteMessage", (serverMsg) => {
    if (!selectedChat || String(serverMsg.chatId) !== String(selectedChat._id)) {
      return;
    }

    setMessages((prev) =>
      prev.filter((msg) => String(msg._id) !== String(serverMsg._id))
    );
  }, [selectedChat?._id]);

  useSocketEvent("participantRemoved", ({ userId, chatId, msg }) => {
    setChats((prev) =>
      prev.map((chat) =>
        String(chat._id) === String(chatId)
          ? {
              ...chat,
              participants: chat.participants.filter(
                (p) => String(p._id) !== String(userId)
              ),
            }
          : chat
      )
    );

    if (selectedChat && String(selectedChat._id) === String(chatId)) {
      setMessages((prev) => [msg, ...prev]);
    }
  }, [selectedChat?._id]);

  useSocketEvent("participantAccepted", ({ chatId, user }) => {
    setChats((prev) =>
      prev.map((chat) =>
        String(chat._id) === String(chatId)
          ? {
              ...chat,
              participants: [...chat.participants, user],
            }
          : chat
      )
    );
  }, []);

  useSocketEvent("participantRequested", ({ chatId, msg }) => {
    if (selectedChat && String(selectedChat._id) === String(chatId)) {
      setMessages((prev) => [msg, ...prev]);
    }
  }, [selectedChat?._id]);

  useEffect(() => {
    if (!selectedChat) return;

    setChats((prev) =>
      prev.map((chat) =>
        String(chat._id) === String(selectedChat._id)
          ? { ...chat, noOfUnreadMessages: 0 }
          : chat
      )
    );

    setNewMessageChatIds((prev) => {
      const next = prev.filter(
        (c) => String(c) !== String(selectedChat._id)
      );

      setIsNewMessage(next.length > 0);
      return next;
    });

    chatOpened(selectedChat._id);
  }, [selectedChat, chatOpened]);

  return {
    loading,
    accessToken,
    user,

    paramChatId,
    focusMessageId,
    clearFocus,

    messages,
    setMessages,

    chats,
    setChats,

    users,
    setUsers,

    typingUsers,
    setTypingUsers,

    selectedChat,
    setSelectedChat,

    showLiveChat,
    setShowLiveChat,

    userChats,
    setUserChats,

    isNewMessage,
    setIsNewMessage,

    newMessageChatIds,
    setNewMessageChatIds,
  };
}