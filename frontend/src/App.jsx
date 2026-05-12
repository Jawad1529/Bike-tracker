import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import toast, { Toaster } from 'react-hot-toast';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import Auth from './Auth';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API = `${import.meta.env.VITE_API_URL}/api/turns`;

function App() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [dragIndex, setDragIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
        }
    }, []);

    const handleLogin = (userData, tokenData) => {
        setUser(userData);
        setToken(tokenData);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
    };

    const isAdmin = user?.role === 'admin';

    const authHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchData = async () => {
        try {
            const res = await axios.get(API);
            setData(res.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (user) fetchData(); }, [user]);

    const markDone = async () => {
        await axios.post(`${API}/complete`, {}, authHeaders());
        fetchData();
    };

    const markAbsent = async () => {
        await axios.post(`${API}/absent`, {}, authHeaders());
        fetchData();
    };

    const markMiss = async () => {
        await axios.post(`${API}/miss`, {}, authHeaders());
        fetchData();
    };

    const resetTurns = async () => {
        if (window.confirm('Reset all turns? This clears history.')) {
            await axios.post(`${API}/reset`, {}, authHeaders());
            fetchData();
        }
    };

    const setTurn = async (index) => {
        if (!isAdmin) return;
        await axios.post(`${API}/set/${index}`, {}, authHeaders());
        fetchData();
    };

    const handleDragStart = (index) => {
        if (!isAdmin) return;
        setDragIndex(index);
    };

    const handleDragOver = (e, index) => {
        if (!isAdmin) return;
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = async (index) => {
        if (!isAdmin) return;
        if (dragIndex === null || dragIndex === index) {
            setDragIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newMembers = [...data.members];
        const [dragged] = newMembers.splice(dragIndex, 1);
        newMembers.splice(index, 0, dragged);

        const memberNames = newMembers.map(m => m.name);
        await axios.post(`${API}/reorder`, { members: memberNames }, authHeaders());
        setDragIndex(null);
        setDragOverIndex(null);
        fetchData();
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    if (!user) return <Auth onLogin={handleLogin} />;
    if (loading) return <div className="app"><p>Loading...</p></div>;
    if (!data) return <div className="app"><p>Error loading data. Is the backend running?</p></div>;

    const currentMember = data.members[data.currentIndex];
    const nextIndex = (data.currentIndex + 1) % data.members.length;
    const nextMember = data.members[nextIndex];

    const memberStats = data.members.map(m => {
        const completed = data.history.filter(h => h.name === m.name && h.status === 'completed').length;
        const absent = data.history.filter(h => h.name === m.name && h.status === 'absent').length;
        const miss = data.history.filter(h => h.name === m.name && h.status === 'miss').length;
        return { name: m.name, completed, absent, miss };
    });

    const totalCompleted = memberStats.reduce((sum, m) => sum + m.completed, 0);
    const fairShare = Math.floor(totalCompleted / data.members.length);
    const repetitions = memberStats.map(m => ({
        name: m.name,
        extra: m.completed > fairShare ? m.completed - fairShare : 0
    }));

    const chartData = {
        labels: memberStats.map(m => m.name),
        datasets: [
            {
                label: 'Turns Completed',
                data: memberStats.map(m => m.completed),
                backgroundColor: 'rgba(39, 174, 96, 0.7)',
                borderRadius: 4
            },
            {
                label: 'Absent',
                data: memberStats.map(m => m.absent),
                backgroundColor: 'rgba(230, 126, 34, 0.7)',
                borderRadius: 4
            },
            {
                label: 'Missed',
                data: memberStats.map(m => m.miss),
                backgroundColor: 'rgba(192, 57, 43, 0.7)',
                borderRadius: 4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#ccc' } },
            title: { display: false }
        },
        scales: {
            x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#aaa', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    };

    return (
        <div className="app">
            <div className="top-bar">
                <span>👤 {user.name} ({user.role})</span>
                <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
            </div>

            <h1>🏍️ Bike Turn Tracker</h1>
            <p className="subtitle">Fair rotation — no one gets overburdened</p>

            <div className="current-turn">
                <h2>Current Turn</h2>
                <div className="name">{currentMember.name}</div>
                <p className="next">Next up: <strong>{nextMember.name}</strong></p>
                {isAdmin && (
                    <div className="buttons">
                        <button className="btn btn-done" onClick={markDone}>✅ Done</button>
                        <button className="btn btn-absent" onClick={markAbsent}>🚫 Absent</button>
                        <button className="btn btn-miss" onClick={markMiss}>❌ Miss</button>
                        <button className="btn btn-reset" onClick={resetTurns}>🔄 Reset</button>
                    </div>
                )}
            </div>

            <div className="members-grid">
                {data.members.map((m, i) => {
                    const stats = memberStats.find(s => s.name === m.name);
                    const rep = repetitions.find(r => r.name === m.name);
                    return (
                        <div
                            key={m.name}
                            className={`member-card ${i === data.currentIndex ? 'active' : ''} ${dragOverIndex === i ? 'drag-over' : ''} ${dragIndex === i ? 'dragging' : ''}`}
                            onClick={() => setTurn(i)}
                            draggable={isAdmin}
                            onDragStart={() => handleDragStart(i)}
                            onDragOver={(e) => handleDragOver(e, i)}
                            onDrop={() => handleDrop(i)}
                            onDragEnd={handleDragEnd}
                            style={{ cursor: isAdmin ? 'grab' : 'default' }}
                            title={isAdmin ? 'Click to set turn • Drag to reorder' : 'View only'}
                        >
                            {rep.extra > 0 && (
                                <div className="repeat-badge" title={`${rep.extra} extra turn(s) ahead of others`}>
                                    🔁 {rep.extra}
                                </div>
                            )}
                            <div className="order">#{i + 1}</div>
                            <div className="member-name">{m.name}</div>
                            <div className="stats">
                                ✅ {stats.completed} | 🚫 {stats.absent} | ❌ {stats.miss}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="chart-container">
                <h3>📊 Turn Statistics</h3>
                <Bar data={chartData} options={chartOptions} />
            </div>

            {data.history.length > 0 && (
                <div className="history">
                    <h3>📋 History (Recent)</h3>
                    {data.history.slice(-10).reverse().map((h, i) => (
                        <div key={i} className="history-item">
                            <span>{h.name}</span>
                            <span className={`status-${h.status}`}>
                                {h.status === 'completed' ? '✅ Done' : h.status === 'absent' ? '🚫 Absent' : '❌ Miss'}
                            </span>
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>
                                {new Date(h.date).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default App;
