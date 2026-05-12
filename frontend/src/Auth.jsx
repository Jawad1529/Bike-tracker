import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/auth';

function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const endpoint = isLogin ? '/login' : '/signup';
            const payload = isLogin ? { email, password } : { name, email, password };
            const res = await axios.post(`${API}${endpoint}`, payload);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            onLogin(res.data.user, res.data.token);
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>🏍️ Bike Turn Tracker</h1>
                <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {error && <p className="auth-error">{error}</p>}
                    <button type="submit" className="btn btn-done">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </button>
                </form>

                <p className="auth-switch">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <span onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                        {isLogin ? 'Sign Up' : 'Login'}
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Auth;
