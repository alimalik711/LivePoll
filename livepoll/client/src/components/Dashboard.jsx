import React, { useEffect, useState } from 'react';
import api from '../api/axios'; // Our pre-configured Axios
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await api.get('/sessions');
                setSessions(response.data);
            } catch (err) {
                console.error("Failed to fetch sessions", err);
                // If unauthorized (unlogged), send them back to login page
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchSessions();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            navigate('/login');
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    if (loading) return <div className="loading">Loading your polls...</div>;

    return (
        <div className="animated-fade-in" style={{ width: '100%' }}>
            <header className="dashboard-header">
                <div className="header-logo">
                    ⚡ LivePoll
                </div>
                <div className="header-user">
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-container" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2>Presenter Dashboard</h2>
                    <Link to="/create-session" className="btn-primary"> + Create New Session</Link>
                </div>
                
                <div className="session-list">
                    {sessions.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem 0' }}>You haven't created any polls yet.</p>
                    ) : (
                        sessions.map(session => (
                            <div key={session.id} className="session-card">
                                <div className="session-card-info">
                                    <h3>{session.name}</h3>
                                    <p style={{ margin: 0 }}>Invite Code: <span className="highlight" style={{ fontSize: '0.85rem', padding: '0.2rem 0.6rem' }}>{session.join_code}</span></p>
                                </div>
                                <Link to={`/presenter/${session.id}`} className="btn-secondary">
                                    Manage Poll
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;