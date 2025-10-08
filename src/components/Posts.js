import './Posts.css'
import NavBar from './NavBar';
import Post from './Post';
import testImg from '../images/sample2.png'
import testImgii from '../images/test.jpg'
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FeedAd from './FeedAd.js';

function Posts(){

    const [posts, setPosts] = useState([]);
    const { accessToken, loading } = useAuth();
    
    useEffect(() => {
        if (!accessToken) return;
        if(loading) return;

        fetch(`/api/return-posts`, {
            method: 'GET',
            headers: {
                'authorization': `Bearer ${accessToken}`
            }
        }).then(response => {
            if(response.status === 404){
                return null;
            }
            if(!response.ok){
                throw new Error('Request Failed!');
            }
            return response.json();
        }).then(data => {
            if (!data) {
                setPosts([]);
                return;
            }
            setPosts(data.posts)
        })
    },[accessToken])

    return (
        <div className='posts-page'>
            <div className='posts-container'>
                {
                    posts.map((post, index) => {
                        const showAd = index > 0 && index % 5 === 0;

                        if (showAd) {
                        // 🟩 Return ad first, then the next post
                        return (
                            <>
                                <FeedAd key={`ad-${index}`} />
                                <Post key={post._id} post={post} />
                            </>
                        );
                        }

                        // 🟦 Otherwise just show a post
                        return <Post key={post._id} post={post} />;
                    })
                }
                
            </div>
        </div>
    )
}

export default Posts;