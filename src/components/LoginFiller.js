import './LoginFiller.css';

export default function LoginFiller({message = 'To get full experience!'}) {
    return (
        <div className='login-filler-container'>
            <h1>
                {message}
            </h1>
            <a href='/login' style={{textDecoration: 'none'}}>
                Login
            </a>
        </div>
    )
}