const mysql = require('mysql2');

console.log('Before creating connection');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'harika114',
  database: 'myapp',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL!');
    db.query('CREATE DATABASE IF NOT EXISTS myapp', (err) => {
      if (err) {
        console.error('Error creating database:', err);
      } else {
        console.log('Database "myapp" created (if it didn\'t exist)');
        
        db.query('USE myapp', (err) => {
          if (err) {
            console.error('Error switching to mypen database:', err);
          } else {
            console.log('Using database "myapp"');
            db.query(`CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              username VARCHAR(255) UNIQUE NOT NULL,
              password VARCHAR(255) NOT NULL
            )`, (err) => {
              if (err) {
                console.error('Error creating users table:', err);
              } else {
                console.log('Table "users" created (if it didn\'t exist)');
                db.query('SELECT COUNT(*) AS count FROM users', (err, results) => {
                  if (err) {
                    console.error('Error counting users:', err);
                  } else {
                    const count = results[0].count;
                    if (count < 5) {
                      const defaultUsers = [
                        { username: 'Hasiniuser', password: 'harika114' },
                        { username: 'Kirtiuser', password: 'kirit1583' },
                        { username: 'Srinivas Reddy', password: 'srinu24' },
                        { username: 'Vijaya laxmi', password: 'vijaya@17' },
                        { username: 'Rakesh', password: 'sunny28' },
                      ];
                      const insertQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
                      defaultUsers.forEach((user) => {
                        db.query(insertQuery, [user.username, user.password], (err) => {
                          if (err) {
                            console.error('Error inserting default user:', err);
                          } else {
                            console.log(`Inserted default user: ${user.username}`);
                          }
                        });
                      });
                    } else {
                      console.log('Database already contains 5 or more users. Skipping default values insertion.');
                    }
                  }
                });
              }
            });
            db.query(`CREATE TABLE IF NOT EXISTS code_snippets (
              id INT AUTO_INCREMENT PRIMARY KEY,
              username VARCHAR(255) NOT NULL,
              html TEXT,
              css TEXT,
              js TEXT,
              project_title VARCHAR(255),
              project_id VARCHAR(36)
            )`, (err) => {
              if (err) {
                console.error('Error creating code_snippets table:', err);
              } else {
                console.log('Table "code_snippets" created (if it didn\'t exist)');
              }
            });
          }
        });
      }
    });
  }
});

module.exports = db;
