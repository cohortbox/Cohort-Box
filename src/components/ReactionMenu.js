import { useState, useEffect} from "react";
import { useFloating, offset, flip } from "@floating-ui/react";
import reactImg from "../images/reaction-fontcolor.png";
import "./ReactionMenu.css";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

function ReactionMenu({ msg }) {
  const {socket} = useSocket();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(4), flip()],
  });

  const btnRef = refs.setReference;
  const menuRef = refs.setFloating;

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        open &&
        refs.reference.current &&
        refs.floating.current &&
        !refs.reference.current.contains(e.target) &&
        !refs.floating.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, refs]);

  const reactions = [
    { emoji: "👍", label: "like" },
    { emoji: "❤️", label: "love" },
    { emoji: "😂", label: "haha" },
    { emoji: "😢", label: "cry" },
    { emoji: "😡", label: "angry" },
    { emoji: "😈", label: "devil" },
  ];

  const handleReact = (e, emoji) => {
    e.preventDefault();
    socket.emit('reaction', ({ emoji, msgId: msg._id, userId: user.id, chatId: msg.chatId }))
    setOpen(false)
  }

  return (
    <div className="rm-container">
      <button
        ref={btnRef}
        className="rm-btn"
        onClick={() => setOpen((prev) => !prev)}
      >
        <img className="rm-btn-img" src={reactImg} alt="menu" />
      </button>

      {open && (
        <div ref={menuRef} style={floatingStyles} className="rm-menu-container">
            {reactions.map((r) => (
              <button key={r.label} className="rm-inner-btn" onClick={(e) => handleReact(e, r.emoji)}>
                {r.emoji}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default ReactionMenu;
