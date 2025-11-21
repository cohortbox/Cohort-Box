import { useContext, useState, createContext, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState('');
    const [user, setUser] = useState(accessToken ? jwtDecode(accessToken) : null);
    const refreshIntervalID = useRef(null);
    const [loading, setLoading] = useState(true);

    const login = (token) => {
        setAccessToken(token);
        setUser(jwtDecode(token))
    }

    const logout = async () => {
        try{
            console.log('Logging Out!')
            await fetch(`/api/logout`, {
                method: 'POST',
                credentials: 'include'
            }) 
            if (refreshIntervalID.current) {
                clearInterval(refreshIntervalID.current);
                refreshIntervalID.current = null;
            }
            setAccessToken(null);
            setUser(null);
        }catch(err){
            console.log("Could not Logout! Error: ", err)
        }
       
    }

    const refreshAccessToken = async () => {
        try {
            const res = await fetch(`/api/refresh`, {
                method: 'GET',
                credentials: 'include' // Needed if using HTTP-only cookie for refresh token
            });
            const data = await res.json();

            if (data.accessToken) {
                login(data.accessToken);
            } else {
                logout();
            }
        } catch (err) {
            console.error("Failed to refresh token", err);
            logout();
        }
    };

    useEffect(() => {
        if(!accessToken){
            setLoading(false)
        }
    }, [accessToken])

    useEffect(() => {
        const initAuth = async () => {
            if (!accessToken) {
                await refreshAccessToken();
            }
        }
        initAuth();
    }, []);

    useEffect(() => {
        if (refreshIntervalID.current) {
                clearInterval(refreshIntervalID.current);
        }
        if(accessToken){
            refreshIntervalID.current = setInterval(() => {
                refreshAccessToken();
            }, 9 * 60 * 1000)
        }
    }, [accessToken])

    return (
        <AuthContext.Provider value = {{accessToken, loading, user, login, logout}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);