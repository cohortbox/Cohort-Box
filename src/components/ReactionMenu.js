import { useState, useEffect, useRef } from "react";
import { useFloating, offset, flip, autoUpdate } from "@floating-ui/react";
import reactImg from "../images/reaction-fontcolor.png";
import "./ReactionMenu.css";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import EmojiPicker from "emoji-picker-react";

function ReactionMenu({ msg, isPost = false, onReactLocal }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  // Floating UI for main reactions menu
  const { refs: menuRefs, floatingStyles: menuStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(4), flip()],
    whileElementsMounted: autoUpdate,
  });

  // Floating UI for emoji picker (separate instance)
  const { refs: emojiRefs, floatingStyles: emojiStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(4), flip()],
    whileElementsMounted: autoUpdate,
  });

  const menuBtnRef = menuRefs.setReference;
  const emojiBtnRef = emojiRefs.setReference;

  // Click outside handling
  useEffect(() => {
    function handleClickOutside(e) {
      const menuEl = menuRefs.floating.current;
      const menuBtnEl = menuRefs.reference.current;
      const emojiEl = emojiRefs.floating.current;
      const emojiBtnEl = emojiRefs.reference.current;

      if (
        open &&
        menuEl &&
        menuBtnEl &&
        !menuEl.contains(e.target) &&
        !menuBtnEl.contains(e.target) &&
        (!emojiEl || !emojiEl.contains(e.target)) &&
        (!emojiBtnEl || !emojiBtnEl.contains(e.target))
      ) {
        setOpen(false);
        setShowEmoji(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, menuRefs, emojiRefs]);

  const reactions = [
    { emoji: "😭", label: "crying" },
    { emoji: "💀", label: "dead" },
    { emoji: "🥀", label: "rose" },
    { emoji: "🔥", label: "fire" },
    { emoji: "❤️", label: "love" },
  ];

  // Handle reaction click
  const handleReact = (emoji) => {
    if (!emoji) return;

    // Optimistic UI update for posts
    if (isPost && typeof onReactLocal === "function") {
      onReactLocal(emoji, user.id);
    }

    // Server update
    socket.emit("reaction", {
      emoji,
      msgId: msg._id,
      userId: user.id,
      chatId: msg.chatId,
      isPost,
    });

    setOpen(false);
    setShowEmoji(false);
  };

  // EmojiPicker callback
  const handleEmojiClick = (emojiData) => {
    handleReact(emojiData.emoji);
  };

  return (
    <div className={isPost ? "rm-container width-on-post" : "rm-container"}>
      {/* Reactions button */}
      <button
        ref={menuBtnRef}
        className={isPost ? "rm-btn-post" : "rm-btn"}
        onClick={(e) => {
          e.preventDefault();
          setOpen((prev) => !prev);
        }}
        type="button"
      >
        <img className="rm-btn-img" src={reactImg} alt="menu" />
        {isPost && "React"}
      </button>

      {/* Main reactions menu */}
      {open && (
        <div ref={menuRefs.setFloating} style={menuStyles} className="rm-menu-container">
          {reactions.map((r) => (
            <button
              key={r.label}
              className="rm-inner-btn"
              onClick={() => handleReact(r.emoji)}
              type="button"
            >
              {r.emoji}
            </button>
          ))}

          {/* Emoji picker toggle */}
          <button
            type="button"
            className="emoji-btn"
            ref={emojiBtnRef}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowEmoji((v) => !v)}
          >
            😊
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div ref={emojiRefs.setFloating} style={emojiStyles} className="rm-menu-container">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" defaultSkinTone="white" />
        </div>
      )}
    </div>
  );
}

export default ReactionMenu;
