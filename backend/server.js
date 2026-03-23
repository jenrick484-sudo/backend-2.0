require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html from public folder
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password, remember } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const q = 'SELECT id, email, password_hash FROM admins WHERE email = $1 LIMIT 1';
    const { rows } = await pool.query(q, [email.toLowerCase()]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // Create JWT token (short-lived)
    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'devsecret', {
      expiresIn: remember ? '30d' : '2h'
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Example protected route
app.get('/admin', (req, res) => {
  res.send('<h2>Admin dashboard placeholder</h2><p>Protected area.</p>');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});