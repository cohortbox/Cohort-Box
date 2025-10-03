import './Post.css';
import userImg from '../images/sample.png';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import left from '../images/left-arrow.png';
import right from '../images/right-arrow.png';
import VideoPlayer from './VideoPlayer';

function Post({ post }) {
    const [mainIndex, setMainIndex] = useState(0);

    return (
        <div className='post-container'>
            <div className='post-heading-container'>
                <div className='chat-img-container'>
                    <img className='chat-img' src={userImg} alt="user"/>
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
            <div className='post-btn-container'>
                <button className='post-btn border-right'>React</button>
                <button className='post-btn'>Share</button>
            </div>
        </div>
    )
}

export default Post;
