import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: 'rgba(13, 20, 38, 0.92)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                padding: '0.8rem 1.2rem',
                borderRadius: '0.6rem',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
                textAlign: 'left'
            }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
                    {payload[0].payload.name}
                </p>
                <p style={{ margin: '0.3rem 0 0 0', color: '#818cf8', fontWeight: 600, fontSize: '0.85rem' }}>
                    Votes: <span style={{ color: '#ffffff', fontWeight: 800 }}>{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

const ResultsChart = ({ data }) => {
    // Transform the data for Recharts
    const chartData = data.map(opt => ({
        name: opt.option_text,
        votes: parseInt(opt.count || 0) // Postgres counts come back as strings
    }));

    return (
        <div style={{ width: '100%', height: 320, marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }} >
                    <defs>
                        <linearGradient id="barGrad0" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7}/>
                        </linearGradient>
                        <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.7}/>
                        </linearGradient>
                        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f472b6" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#db2777" stopOpacity={0.7}/>
                        </linearGradient>
                        <linearGradient id="barGrad3" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#d97706" stopOpacity={0.7}/>
                        </linearGradient>
                        <linearGradient id="barGrad4" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.7}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        stroke="#94a3b8" 
                        allowDecimals={false}
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
                    <Bar dataKey="votes" radius={[8, 8, 0, 0]} barSize={45}>
                        {chartData.map((entry, index) => {
                            const gradId = `url(#barGrad${index % 5})`;
                            return <Cell key={`cell-${index}`} fill={gradId} />;
                        })}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ResultsChart;