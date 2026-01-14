import './SignUp.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'
import { useRef, useState } from 'react';


function SignUp() {

  const navigate = useNavigate();
  const { login } = useAuth();
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const usernameTimerRef = useRef(null);

  function usernameCheck() {
    const usernameInput = document.getElementById("username");
    const username = usernameInput.value.trim();

    if(!/^[a-z0-9._]+$/.test(username)){
      usernameInput.borderColor = "red"
    }

    // ✅ clear old debounce timer (if user typed again)
    if (usernameTimerRef.current) {
      clearTimeout(usernameTimerRef.current);
    }

    // ✅ if empty, reset instantly (no API call)
    if (username === "") {
      usernameInput.style.borderColor = "";
      setUsernameAvailable(null);
      return;
    }

    // ✅ optional quick validation (no API call)
    if (username.length < 3) {
      usernameInput.style.borderColor = "red";
      setUsernameAvailable(false);
      return;
    }

    // ✅ debounce request by 500ms
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/check-username?username=${encodeURIComponent(username)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await res.json();

        if (res.ok && data.available === true) {
          usernameInput.style.borderColor = "green";
          setUsernameAvailable(true);
        } else {
          usernameInput.style.borderColor = "red";
          setUsernameAvailable(false);
        }
      } catch (err) {
        console.error("Username check failed:", err);
        usernameInput.style.borderColor = "red";
        setUsernameAvailable(false);
      }
    }, 500);
  }


  function Signup(e){
    e.preventDefault();

    const fNameInput = document.getElementById('fName');
    const lNameInput = document.getElementById('lName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    
    const username = usernameInput.value.trim();
    const fName = fNameInput.value.trim();
    const lName = lNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if(fName === "") { fNameInput.style.borderColor = 'red'; return }
    if(lName === "") { lNameInput.style.borderColor = 'red'; return }
    if(email === "") { emailInput.style.borderColor = 'red'; return }
    if(password === "") { passwordInput.style.borderColor = 'red'; return }
    if(!usernameAvailable) { usernameInput.style.borderColor = 'red'; return }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailRegex.test(email)){
      emailInput.style.borderColor = 'red';
      return;
    }



    fetch(`/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: fName,
        lastName: lName,
        email: email,
        password: password,
        username: username
      }),
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Sign Up failed with status ' + response.status, response.message);
      }
      return response.json();
    })
    .then(data => {
      console.log(data.message);
      console.log('Access Token:', data.accessToken);
      // Store token in localStorage or memory
      login(data.accessToken);
      navigate('/verify-email')
    })
    .catch(error => {
      console.error('Sign Up error:', error);
    });
  }


  return (
    <div className='SignUp'>
      <title>Signup - CohortBox</title>
        <div className='signup-box'>
            <h1 className='signup-head'>Sign Up</h1>
            <form className='signup-form' onSubmit={Signup}>
                <div className='signup-inputs-container'>
                    <input type='text' placeholder='First Name' className='signup-input' id='fName'/>
                    <input type='text' placeholder='Last Name' className='signup-input' id='lName'/>
                    <input type='text' placeholder='Email' className='signup-input' id='email'/>
                    <input type='password' placeholder='Password' className='signup-input' id='password'/>
                    <input type='text' placeholder='Username' className='signup-input' id='username' onChange={usernameCheck}/>
                </div>
                <button type='submit' className='signup-btn' typeof='submit'>Create Account</button>
                <Link to='/login' className='link-to-login'>Already have an account?</Link>
            </form>
        </div>   
    </div>
  );
}

export default SignUp;