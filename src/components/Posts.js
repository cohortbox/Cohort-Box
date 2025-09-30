import './Posts.css'
import NavBar from './NavBar';
import Post from './Post';
import testImg from '../images/sample2.png'
import testImgii from '../images/test.jpg'
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Posts(){

    const [posts, setPosts] = useState([]);
    const { accessToken, loading } = useAuth();
    
    useEffect(() => {
        if (!accessToken) return;
        if(loading) return;

        fetch(`${process.env.REACT_APP_API_BASE_URL}/api/return-posts`, {
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
                    posts.map((post, index) => (
                        <Post key={index} post={post}/>
                    ))
                }
                
            </div>
        </div>
    )
}

export default Posts;