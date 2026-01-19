import "./Post.css";
import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import left from "../images/left-arrow.png";
import right from "../images/right-arrow.png";
import VideoPlayer from "./VideoPlayer";
import ReactionMenu from "./ReactionMenu";

function getReactionSummary(reactions = [], topN = 2) {
  const map = {};
  let total = 0;

  for (let r of reactions) {
    if (!r?.emoji) continue;
    total += 1;
    map[r.emoji] = (map[r.emoji] || 0) + 1;
  }

  const top = Object.entries(map)
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count) // highest first
    .slice(0, topN);

  return { top, total };
}


function Post({ post }) {
  const [mainIndex, setMainIndex] = useState(0);

  // ✅ keep a local copy so we can update reactions instantly
  const [postState, setPostState] = useState(post);

  // keep in sync if parent sends new post object
  useEffect(() => {
    setPostState(post);
  }, [post]);

  // ✅ msg wrapper: ensure chatId is an ID (not populated object)
  const msg = useMemo(() => {
    return {
      ...postState,
      chatId: typeof postState.chatId === "object" ? postState.chatId._id : postState.chatId,
    };
  }, [postState]);

  // ✅ Optimistic local reaction update (toggle/change per user)
  function onReactLocal(emoji, userId) {
    setPostState((prev) => {
      const prevReactions = Array.isArray(prev.reactions) ? [...prev.reactions] : [];

      const idx = prevReactions.findIndex(
        (r) => r?.userId?.toString?.() === userId || r?.userId === userId
      );

      if (idx !== -1) {
        // user already reacted
        if (prevReactions[idx].emoji === emoji) {
          // toggle off
          prevReactions.splice(idx, 1);
        } else {
          // change reaction
          prevReactions[idx] = { ...prevReactions[idx], emoji };
        }
      } else {
        // add new
        prevReactions.push({ userId, emoji });
      }

      return { ...prev, reactions: prevReactions };
    });
  }

    const summary = useMemo(
        () => getReactionSummary(postState?.reactions, 2),
        [postState?.reactions]
    );

  return (
    <div className="post-container">
      <div className="post-heading-container">
        <div className="post-chat-img-container">
          <img className="post-chat-img" src={postState.chatId.chatDp} alt="user" />
        </div>
        <div className="post-names-container">
          <h3 className="chat-name">
            <Link
              to={"/" + postState.chatId._id.toString()}
              style={{ textDecoration: "none", color: "#c5cad3" }}
            >
              {postState.chatId.chatName}
            </Link>
          </h3>
          <p className="post-username">
            posted by{" "}
            <Link
              to={"/profile/" + postState.from._id.toString()}
              style={{ textDecoration: "none", color: "#878792" }}
            >
              {postState.from.firstName + " " + postState.from.lastName}
            </Link>
          </p>
        </div>
      </div>

      <div className="post-media-container">
        {postState.media[mainIndex].type === "image" ? (
          <img className="post-media" src={postState.media[mainIndex].url} alt="media" />
        ) : (
          <VideoPlayer src={postState.media[mainIndex].url} />
        )}

        {postState.media.length > 1 && (
          <div className="media-controls-container">
            <div className="media-images-num-container">
              <div className="media-images-num">
                {mainIndex + 1}/{postState.media.length}
              </div>
            </div>
            <div className="controls">
              <div
                className="control"
                onClick={(e) => {
                  e.preventDefault();
                  setMainIndex(mainIndex === 0 ? 0 : mainIndex - 1);
                }}
              >
                <img src={left} alt="left" />
              </div>
              <div
                className="control"
                onClick={(e) => {
                  e.preventDefault();
                  setMainIndex(mainIndex === postState.media.length - 1 ? mainIndex : mainIndex + 1);
                }}
              >
                <img src={right} alt="right" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Show reaction counts */}
          {summary.total > 0 && (
              <div className="post-reactions-row">
                  <div className="post-reaction-pill">
                      <span className="post-reaction-emojis">
                          {summary.top.map((t) => (
                              <span key={t.emoji}>{t.emoji}</span>
                          ))}
                      </span>

                      <span className="post-reaction-count">{summary.total}</span>
                  </div>
              </div>
          )}

      <div className="post-btn-container">
        {/* ✅ DO NOT wrap ReactionMenu in a <button> (it already contains a button) */}
        <div className="post-btn border-right">
          <ReactionMenu msg={msg} isPost={true} onReactLocal={onReactLocal} />
        </div>

        <button className="post-btn" type="button">
          Share
        </button>
      </div>
    </div>
  );
}

export default Post;
