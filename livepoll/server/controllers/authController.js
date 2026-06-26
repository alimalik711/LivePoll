const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // FIXED: Added missing import
const pool = require('../db');




const register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. Validation: Check if all fields are provided
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 2. Check for existing user
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 3. Hashing the password
        // We use a "salt factor" of 10.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        

    const newUser = await pool.query(

    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
    [username, email, hashedPassword]
    
    );
    // TODO: Step 5 - Send a success response
    res.status(201).json({ message: "User created successfully", user: newUser.rows[0] });

        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // 2. Check if user exists
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const user = userResult.rows[0];

        // 3. Compare passwords
        const isMatch = await bcrypt.compare(password, user.password_hash);

        // FIXED: Guard Clause pattern. Exit early if not a match.
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // 4. Generate JWT
        // We include the userId so we know who owns the polls created later.
        const token = jwt.sign(
            { userId: user.id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // 5. Send Response 
        // We send the token in a cookie for security AND return user info for the UI
        res.cookie('token', token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
            maxAge: 3600000 // 1 hour
        });

        // We also send the token in the body for easy testing/frontend access
        return res.status(200).json({ 
            message: "Login successful", 
            token, 
            user: { id: user.id, username: user.username, email: user.email } 
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// This returns the user data if the token is valid
const getMe = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [req.user.userId]);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

const logout = async (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: "Logged out successfully" });
};

module.exports = { register, login , getMe, logout };