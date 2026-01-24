import { useState } from 'react';
import './SettingsChange.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SettingsChange({setSelfState, config, user, setUser, showAlert}){
    const {accessToken, logout} = useAuth();
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState(user?.firstName ? user?.firstName : '');
    const [lastName, setLastName] = useState(user?.lastName ? user?.lastName : '');
    const [about, setAbout] = useState(user?.about);
    const [changeSuccess, setChangeSuccess] = useState(false);
    const [currPass, setCurrPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [newAgainPass, setNewAgainPass] = useState('');

    function handleDisplayNameChange(){
        if(!accessToken) return;
        if(!firstName.trim()) return;
        if(!lastName.trim()) return;

        let body = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
        }

        fetch('/api/user/display-name', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(body),
        })
            .then(res => {
                if (!res.ok) throw new Error('Update failed');
                if(res.status === 200) setChangeSuccess(true)
                return res.json();
            })
            .then(data => {
                console.log(data);
                if(data.user){
                    setUser(data.user)
                }
                setSelfState(false); // close modal
            }).catch(err => {
                console.error(err);
            });
    }

    function handleAbout(e) {
        const value = e.target.value;

        // Enforce 120 characters max
        if (value.length <= 120) {
            setAbout(value);
        }
    }

    function handleAboutChange() {
        if (!accessToken) return;
        if (!about || !about.trim()) return;

        fetch('/api/user/about', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                about: about.trim(),
            }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Update failed');
                return res.json();
            })
            .then(data => {
                if (data.user) {
                    setUser(data.user); // sync parent state
                    setChangeSuccess(true);
                    setSelfState(false); // close modal
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    function handlePasswordChange(e){
        if(!accessToken) return;
        if(!currPass || !currPass.trim()){
            document.getElementById('currPass').style.borderColor = 'red';
            return;
        }
        if(!newPass || !newPass.trim()) {
            document.getElementById('newPass').style.borderColor = 'red';
            return;
        }
        if(!newAgainPass || !newAgainPass.trim()) {
            document.getElementById('newAgainPass').style.borderColor = 'red';
            return;
        }
        if(newPass.length < 8 || newAgainPass.length < 8) return;
        if(newPass !== newAgainPass) {
            document.getElementById('newPass').style.borderColor = 'red';
            document.getElementById('newAgainPass').style.borderColor = 'red';
            document.getElementById('notMatch').style.display = 'block';
            return;
        }

        fetch('/api/user/password', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                currentPassword: currPass,
                newPassword: newPass,
            }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Password update failed');
                if(res.status === 200){
                    showAlert('Password Changed', true);
                    logout();
                    navigate('/login')
                }
                return res.json();
            })
            .then(() => {
                setChangeSuccess(true);
                setCurrPass('');
                setNewPass('');
                setNewAgainPass('');
                setSelfState(false);
            })
            .catch(err => {
                console.error(err);
                alert('Current password is incorrect');
            });

    }

    function handleDeleteAcc(e){
        e.preventDefault();
        if(!accessToken) return;

        fetch('/api/user', {
            method: 'DELETE',
            headers: {
                'authorization': `Bearer ${accessToken}`,
            },
            credentials: 'include',
        })
            .then(res => {
                if (!res.ok) throw new Error('Delete failed');
                return res.json();
            })
            .then(() => {
                showAlert('Account deleted successfully', true);
                logout();
                navigate('/signup');
            })
            .catch(err => {
                console.error(err);
                showAlert('Failed to delete account', false);
            });
    }

    return (
        <div className='settings-change-container'>
            <div className='settings-change-body'>
                {
                    config === 'displayName' && (
                        <div className='settings-display-name-form'>
                            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder='First Name'/>
                            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder='Last Name'/>
                            <button onClick={handleDisplayNameChange}>Change</button>
                        </div>
                    )
                }

                {
                    config === 'about' && (
                        <div className='settings-about-form'>
                            <textarea value={about} onChange={handleAbout} placeholder='Tell Everyone About Yourself (120)'/>
                            <p>{about?.length || 0}/120</p>
                            <button onClick={handleAboutChange}>Change</button>
                        </div>
                    )
                }
                {
                    config === 'password' && (
                        <div className='settings-password-form'>
                            <input type='password' id='currPass' value={currPass} onChange={(e) => setCurrPass(e.target.value)} placeholder='Current Password'/>
                            <input type='password' id='newPass' value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder='New Password'/>
                            <input type='password' id='newAgainPass' value={newAgainPass} onChange={(e) => setNewAgainPass(e.target.value)} placeholder='Re-Type New Password'/>
                            <p>Password should be longer than 8 Characters</p>
                            <p id='notMatch' style={{color: 'red', display: 'none', fontSize: '0.7rem'}}>Passwords Don't match</p>
                            <button onClick={handlePasswordChange}>Change</button>
                        </div>
                    )
                }
                {
                    config === 'deleteAcc' && (
                        <div className='settings-delete-acc-form'>
                            <p>Are you sure you want to delete your account?</p>
                            <div>
                                <button onClick={handleDeleteAcc} className='yes'>Yes</button>
                                <button onClick={() => setSelfState(false)} className='no'>No</button>
                            </div>
                        </div>
                    )
                }
                {changeSuccess && <p>Change Successful!</p>}
            </div>
            <div className='settings-change-background' onClick={() => setSelfState(false)}></div>
        </div>
    )
}