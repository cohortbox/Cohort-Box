import './SignUp.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'


function SignUp() {

  const apiUrl = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();
  const { login } = useAuth();

  function Signup(e){
    e.preventDefault();

    const fNameInput = document.getElementById('fName');
    const lNameInput = document.getElementById('lName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const fName = fNameInput.value.trim();
    const lName = lNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if(fName === "") { fNameInput.style.borderColor = 'red'; return }
    if(lName === "") { lNameInput.style.borderColor = 'red'; return }
    if(email === "") { emailInput.style.borderColor = 'red'; return }
    if(password === "") { passwordInput.style.borderColor = 'red'; return }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailRegex.test(email)){
      emailInput.style.borderColor = 'red';
      return;
    }



    fetch(`${apiUrl}/api/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: fName,
        lastName:  lName,
        email: email,
        password: password
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
      navigate('/')
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
                </div>
                <button type='submit' className='signup-btn' typeof='submit'>Create Account</button>
                <Link to='/login' className='link-to-login'>Already have an account?</Link>
            </form>
        </div>   
    </div>
  );
}

export default SignUp;