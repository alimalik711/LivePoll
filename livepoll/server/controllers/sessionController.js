const pool = require('../db');

const createSession = async (req, res) => {
    const { name } = req.body;
    const presenterId = req.user.userId; // Wait! How do we get this? (See Socratic Question below)

    // Generate a random 6-char code (e.g., A1B2C3)
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        const result = await pool.query(
            'INSERT INTO sessions (presenter_id, name, join_code) VALUES ($1, $2, $3) RETURNING *',
            [presenterId, name, joinCode]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error creating session" });
    }
};






const createQuestion = async (req, res) => {
    const { sessionId } = req.params;
    const { questionText, options } = req.body;
    const presenterId = req.user.userId;

    try {
        // SECURITY CHECK: Does this user own this session?
        const sessionCheck = await pool.query(
            'SELECT * FROM sessions WHERE id = $1 AND presenter_id = $2',
            [sessionId, presenterId]
        );

        if (sessionCheck.rows.length === 0) {
            return res.status(403).json({ message: "You do not have permission to edit this session." });
        }

        // START TRANSACTION (All or nothing)
        await pool.query('BEGIN');

        // 1. Create the question (Removed presenter_id)
        const questionResult = await pool.query(
            'INSERT INTO questions (session_id, question_text) VALUES ($1, $2) RETURNING *',
            [sessionId, questionText]
        );
        const question = questionResult.rows[0];

        // 2. Create the options
        for (const optionText of options) {
            await pool.query(
                'INSERT INTO options (question_id, option_text) VALUES ($1, $2)',
                [question.id, optionText]
            );
        }

        // COMMIT TRANSACTION
        await pool.query('COMMIT');

        res.status(201).json({ ...question, options });

    } catch (err) {
        // If anything failed, UNDO everything
        await pool.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: "Error creating question" });
    }
};


const getSessionDetails = async (req, res) => {
    const { sessionId } = req.params;
    const presenterId = req.user.userId;

    try {
        const sessionResult = await pool.query(
            'SELECT * FROM sessions WHERE id = $1 AND presenter_id = $2',
            [sessionId, presenterId]
        );
        if (sessionResult.rows.length === 0) return res.status(403).json({ message: "Forbidden" });

        const session = sessionResult.rows[0];

        // 1. Get ALL questions for the sidebar
        const questionsResult = await pool.query(
            'SELECT * FROM questions WHERE session_id = $1 ORDER BY created_at ASC',
            [sessionId]
        );

        // 2. NEW: Find if there is a CURRENTLY OPEN question
        const activeQResult = await pool.query(
            "SELECT * FROM questions WHERE session_id = $1 AND status = 'open' LIMIT 1",
            [sessionId]
        );

        let activeQuestion = null;
        if (activeQResult.rows.length > 0) {
            activeQuestion = activeQResult.rows[0];
            // Get the current totals for this active question
            const totals = await pool.query(
                'SELECT o.id, o.option_text, COUNT(v.id) AS count FROM options o LEFT JOIN votes v ON o.id = v.option_id WHERE o.question_id = $1 GROUP BY o.id',
                [activeQuestion.id]
            );
            activeQuestion.options = totals.rows;
        }

        res.status(200).json({
            session,
            questions: questionsResult.rows,
            activeQuestion // This is the "Recovery" data
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error" });
    }
};

// Export it along with your other functions
const getSessions = async (req, res) => {
    const presenterId = req.user.userId; // Get the ID from the JWT token

    try {
        // Find all sessions created by this presenter
        const result = await pool.query(
            'SELECT * FROM sessions WHERE presenter_id = $1 ORDER BY created_at DESC',
            [presenterId]
        );
        
        // Send the list back to the frontend
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Fetch Sessions Error:", err);
        res.status(500).json({ message: "Error fetching sessions" });
    }
};

// Export it

const getLeaderboard = async (req, res) => {
    const { sessionId } = req.params;

    try {
        const result = await pool.query(`
            /* We count how many votes exist for each token in this session */
            SELECT voter_token, COALESCE(MAX(voter_name), 'Anonymous') as voter_name, COUNT(*) as points 
            FROM votes 
            WHERE question_id IN (SELECT id FROM questions WHERE session_id = $1)
            GROUP BY voter_token
            ORDER BY points DESC
            LIMIT 10
        `, [sessionId]);

        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Leaderboard fetch error:", err);
        res.status(500).json({ message: "Error fetching leaderboard" });
    }
};


module.exports = { createSession, createQuestion, getSessionDetails, getSessions, getLeaderboard };