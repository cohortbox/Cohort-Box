import './Post.css';
import userImg from '../images/sample.png';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import left from '../images/left-arrow.png';
import right from '../images/right-arrow.png';
import VideoPlayer from './VideoPlayer';
import ReactionMenu from './ReactionMenu';

function Post({ post }) {
    const [mainIndex, setMainIndex] = useState(0);

    function groupReactions(reactions = []) {
        const map = {};
        for (let r of reactions) {
            if (!map[r.emoji]) map[r.emoji] = 0;
        }
        return Object.entries(map).map(([emoji, count]) => ({ emoji, count }));
    }


    const msg = useMemo(() => {
        return {
            ...post,
            chatId: typeof post.chatId === "object" ? post.chatId._id : post.chatId,
        };
    }, [post]);

    const grouped = useMemo(() => groupReactions(post?.reactions), [post?.reactions]);

    return (
        <div className='post-container'>
            <div className='post-heading-container'>
                <div className='post-chat-img-container'>
                    <img className='post-chat-img' src={post.chatId.chatDp} alt="user"/>
                </div>
                <div className='post-names-container'>
                    <h3 className='chat-name'><Link to={'/'+post.chatId._id.toString()} style={{textDecoration: 'none', color: '#c5cad3'}}>{post.chatId.chatName}</Link></h3>
                    <p className='post-username'>posted by <Link to={'/profile/'+post.from._id.toString()} style={{textDecoration: 'none', color: '#878792'}}>{post.from.firstName + ' ' + post.from.lastName}</Link></p>
                </div>
            </div>
            <div className='post-media-container'>
                { post.media[mainIndex].type === 'image' ? (
                    <img className='post-media' src={post.media[mainIndex].url} alt="media"/>
                ) : (
                    <VideoPlayer src={post.media[mainIndex].url}/>
                )}
                { post.media.length > 1 &&
                    <div className='media-controls-container'>
                        <div className='media-images-num-container'>
                            <div className='media-images-num'>
                                { (mainIndex + 1) + '/' + (post.media.length) }
                            </div>
                        </div>
                        <div className='controls'>
                            <div className='control' onClick={(e) => {
                                e.preventDefault();
                                setMainIndex(mainIndex === 0 ? 0 : mainIndex - 1)
                            }}>
                                <img src={left} alt="left"/>
                            </div>
                            <div className='control' onClick={(e) => {
                                e.preventDefault();
                                setMainIndex(mainIndex === post.media.length - 1 ? mainIndex : mainIndex + 1)
                            }}>
                                <img src={right} alt="right"/>
                            </div>
                        </div>
                    </div>
                }
            </div>
            {grouped.length > 0 && (
                <div className="post-reactions-row">
                    {grouped.map((r) => (
                        <div key={r.emoji} className="post-reaction-pill">
                            <span className="post-reaction-emoji">{r.emoji}</span>
                            <span className="post-reaction-count">{r.count}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className='post-btn-container'>
                <button className='post-btn border-right'><ReactionMenu msg={msg} isPost={true}/></button>
                <button className='post-btn'>Share</button>
            </div>
        </div>
    )
}

export default Post;
