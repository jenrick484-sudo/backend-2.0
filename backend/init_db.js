// init_db.js
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    const email = 'Daihoadmin123';
    const plainPassword = 'Daiho@123';
    const emailLower = email.toLowerCase();

    // Check if user exists
    const { rows } = await client.query('SELECT id FROM admins WHERE email = $1', [emailLower]);
    if (rows.length) {
      console.log('Admin user already exists. Skipping insert.');
    } else {
      const saltRounds = 10;
      const hash = await bcrypt.hash(plainPassword, saltRounds);
      await client.query('INSERT INTO admins (email, password_hash) VALUES ($1, $2)', [emailLower, hash]);
      console.log('Admin user created:', emailLower);
    }
  } catch (err) {
    console.error('DB init error', err);
  } finally {
    client.release();
    process.exit();
  }
}

init();