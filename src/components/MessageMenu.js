import { useState, useEffect, useRef } from "react";
import { useFloating, offset, flip } from "@floating-ui/react";
import dotsImg from "../images/dots.png";
import reportImg from '../images/report.png';
import replyImg from '../images/reply-fontcolor.png';
import copyImg from '../images/copy-fontcolor.png';
import reactImg from '../images/reaction-fontcolor.png';
import delImg from '../images/trash-fontcolor.png';
import "./MessageMenu.css";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import ReportMenu from "./ReportMenu";

function MessageMenu({ setIsReply, setRepliedTo, msg, setMessages }) {
  const {socket} = useSocket();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [showReport, setShowReport] = useState(false);

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

  const handleCopy = async () => {
    try{
      await navigator.clipboard.writeText(msg.text);
    }catch(err){
      console.error(err)
    }
  }
  const handleDelete = () => {
    socket.emit('deleteMessage', msg);
    setMessages(prev => prev.filter(prevMsg => prevMsg._id !== msg._id ));
    setOpen(false)
  }

  function handleReport(e){
    e.preventDefault();
    setShowReport(true)
  }

  return (
    <div className="mm-container">
      <button
        ref={btnRef}
        className="mm-btn"
        onClick={() => setOpen((prev) => !prev)}
      >
        <img className="mm-btn-img" src={dotsImg} alt="menu" />
      </button>

      {open && (
        <div ref={menuRef} style={floatingStyles} className="mm-menu-container">
            <button className="mm-inner-btn" onClick={() => {setIsReply(true); setRepliedTo(msg)}}> <img className="mm-img" src={replyImg}/> Reply</button>
            { msg.type === 'text' &&
              <button className="mm-inner-btn" onClick={handleCopy}><img className="mm-img" src={copyImg}/>Copy</button>
            }
            <button className="mm-inner-btn"><img className="mm-img" src={reactImg}/>React</button>
            { msg.from._id === user.id &&
              <button className="mm-inner-btn" onClick={handleDelete}><img className="mm-img" src={delImg}/>Delete</button>
            }
            { msg.from._id !== user.id &&
              <button className="mm-inner-btn" onClick={handleReport}><img className="mm-img" src={reportImg}/>Report</button>
            }
        </div>
      )}
      { showReport && <ReportMenu targetId={msg._id} targetModel={'Message'} setSelfState={setShowReport}/>}
    </div>
  );
}

export default MessageMenu;
