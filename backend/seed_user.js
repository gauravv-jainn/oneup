const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    const username = 'admin';
    const password = 'password123';

    try {
        const userCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
            [username, hashedPassword, 'admin']
        );

        console.log('Admin user created successfully');
        console.log('Username: admin');
        console.log('Password: password123');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
