import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Leaderboard = ({ sessionId, data }) => {
    const [ranks, setRanks] = useState(data || []);

    useEffect(() => {
        if (data !== undefined) {
            setRanks(data);
            return;
        }

        if (!sessionId) return;

        const fetchRanks = async () => {
            try {
                const res = await api.get(`/sessions/${sessionId}/leaderboard`);
                setRanks(res.data);
            } catch (err) {
                console.error('Leaderboard fetch failed', err);
            }
        };
        fetchRanks();
    }, [sessionId, data]);

    useEffect(() => {
        if (data) setRanks(data);
    }, [data]);

    return (
        <div className="leaderboard-card">
            <h3>🏆 Participation Leaderboard</h3>
            {ranks.length === 0 ? (
                <p>No leaderboard data available yet.</p>
            ) : (
                ranks.map((row, index) => (
                    <div key={index} className="leader-row">
                        <span>{index + 1}. {row.voter_name || 'Anonymous'}</span>
                        <strong>{row.points} pts</strong>
                    </div>
                ))
            )}
        </div>
    );
};

export default Leaderboard;