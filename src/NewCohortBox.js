import { useState } from 'react'
import NavBar from './components/NavBar'
import SearchBar from './components/SearchBar';
import './NewCohortBox.css';
import { useAuth } from './context/AuthContext';

function NewCohortBox(){
    const [searchBarClass, setSearchBarClass] = useState(' hidden')
    const [members, setMembers] = useState([]);
    const [chatName, setChatName] = useState('');
    const [chatNiche, setChatNiche] = useState('');
    const { user, accessToken } = useAuth();

    function handleCreate(e){
        e.preventDefault();

        let participants = [user.id];

        for(let member of members){
            participants.push(member._id);
        }

        const body = {
            participants,
            chatAdmin: user.id,
            chatName,
            chatNiche
        }

        fetch(`/api/start-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(body)
        }).then(response => {
            if(!response.ok){
                throw new Error('Request Failed!');
            }

            return response.json();
        }).then(data => {
            console.log(data);
        }).catch(err => {
            console.error(err);
        })
    }

    // ---------- new-cohort-box === ncb ----------

    return (
        <div className='ncb-container'>
            <title>Create New CohortBox | CohortBox</title>
            <NavBar/>
            <div className='ncb-body-container'>
                <h4 className='ncb-heading'>START A NEW COHORT BOX</h4>
                <div className='ncb-options-container'>
                    <div className='ncb-select-members'>
                        <SearchBar searchBarClass={searchBarClass} setSearchBarClass={setSearchBarClass} members={members} setMembers={setMembers}/>
                        <button className='ncb-select-members-btn' onClick={() => setSearchBarClass('')}>SELECT MEMBERS FOR YOUR COHORT BOX</button>
                        {
                            members.length > 0 ? (
                                <p className='ncb-member-count'>{members.length} MEMBERS SELECTED</p>
                            ) : (
                                <p></p>
                            )
                        }
                    </div>
                    <div className='ncb-chatname'>
                        <h4 className='ncb-chatname-heading'>CHOOSE COHORT BOX NAME</h4>
                        <input className='ncb-chatname-input' type='text' placeholder='ENTER NAME' onChange={e => setChatName(e.target.value)}/>
                    </div>
                    <div className='ncb-chatname'>
                        <h4 className='ncb-chatname-heading'>SELECT COHORT BOX CHAT NICHE</h4>
                        <input className='ncb-chatname-input' type='text' placeholder='ENTER CHAT NICHE' onChange={e => setChatNiche(e.target.value)}/>
                    </div>
                    <button className='ncb-add-btn' onClick={handleCreate}>CREATE</button>
                </div>
            </div>
        </div>
    )
}

export default NewCohortBox;