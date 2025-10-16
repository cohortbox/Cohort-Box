import './SearchBar.css'
import searchImg from '../images/magnifying-glass.png';
import closeImg from '../images/close.png';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function SearchBar({ searchBarClass, setSearchBarClass, members, setMembers, chatId, addParticipant }){
    const navigate = useNavigate();
    const [users, setUsers] = useState([])
    const [query, setQuery] = useState('');
    const { accessToken, user } = useAuth();

    function HideSearch(){
        setSearchBarClass(' hidden')
    }

    function handleSearch(e){
        e.preventDefault();
        fetch(`/api/return-users?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'authorization': `Bearer ${accessToken}`
            },
            credentials: 'include'
        }).then(response => {
            if(!response.ok){
                throw new Error('Request Failed!');
            }
            return response.json();
        }).then(data => {
            setUsers(data.users);
        }).catch(err => {
            console.error(err);
        })
    }

    function handleAdd(e, user){
        e.preventDefault();
        setMembers(prev => {
            for(const member of prev){
                if(member._id === user._id) return prev;
            }
            return [...prev, user]
        })
    }

    function handleRemove(e, id){
        e.preventDefault();
        setMembers(prev => prev.filter(member => member._id !== id));
    }

    function handleAddParticipants(e){
        e.preventDefault();

        if(members.length === 0) return;

        const participants = [];

        for(let member of members){
            participants.push(member._id);
        }

        const body = {
            participants,
            chatId
        }

        fetch('api/chat/participant', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`
            },
            credentials: 'include',
            body: JSON.stringify(body)
        }).then(response => {
            if(!response.ok){
                throw new Error('Request Failed!');
            }else{
                setMembers([]);
                setSearchBarClass(' hidden');
            }
        }).catch(err => {
            console.error(err);
        })
    }

    return (
        <div className={'search-bar' + searchBarClass}>
            <div className={'form-usersbox-container' + searchBarClass} style={{width: `${addParticipant ? '100%' : '80%'}`}}>
                <form onSubmit={handleSearch} className='search-bar-form'>
                    <input className={'search-input' + searchBarClass} placeholder='Search' onChange={(e) => setQuery(e.target.value)}/>
                </form>
                <div className='selected-users-box'>
                    {
                        members.length > 0 ? (
                            members.map((member, index) => 
                                <div key={index} className='selected-member-container'>
                                    <h5 className='selected-member-name'>{member.firstName + " " + member.lastName}</h5>
                                    <button className='close-btn' onClick={(e) => handleRemove(e, member._id)}><img className='close-img' src={closeImg}/></button>
                                </div>
                            )
                        ) : (
                            <p>No Users Selected</p>
                        )
                    }
                </div>
                <div className={'users-box' + searchBarClass}>
                    <div>
                        {
                            users.length > 0 ? 
                                users.map((u, index) => {
                                    if(u._id !== user.id)
                                    return (
                                        <div key={index} className={'user' + searchBarClass}>
                                            <h2>{u.firstName + ' ' + u.lastName}</h2>
                                            {   !members.includes(u) ? (
                                                    <button className='add-friend-btn' onClick={(e) => handleAdd(e, u)}>Add</button> 
                                                ) :
                                                (
                                                    <button className='add-friend-btn' disabled>Added</button> 
                                                )
                                            }
                                        </div>
                                        )
                                }) 
                        
                        : (
                            <p className={'no-user-paragraph' + searchBarClass}>No users found!</p>
                        )}
                    </div>
                </div> 
                { addParticipant && <button className='search-bar-add-participant-btn' onClick={handleAddParticipants}>Add</button> }
            </div>
            <div className={'search-background' + searchBarClass} onClick={HideSearch}></div>
            {/* <button className='search-btn' onClick={() => { setSearchBarClass('') }}><img className='search-img' src= {searchImg} alt='Search Icon' /></button> */}
        </div>
    )
}

export default SearchBar;