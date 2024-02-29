const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const app = express();

app.use(express.static(__dirname + '/views'));
app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false,
}));

app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());

app.use((req, res, next) => {
  res.locals.isLoggedIn = req.session.isAuthenticated || false;
  next();
});

//home page
app.get('/', (req, res) => {
  if (req.session.isLoggedIn) {
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [req.session.username], (err, results) => {
      if (err) {
        console.error('Error fetching user:', err);
      } else {
        const user = results[0];
        res.render('index', { isLoggedIn: req.session.isLoggedIn, username: user.username });
      }
    });
  } else {
    res.render('index', { isLoggedIn: req.session.isLoggedIn, username: null }); 
  }
});

//registration page
app.get('/register', (req, res) => {
  res.render('register.ejs');
});

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(query, [username, hashedPassword], (err, result) => {
      if (err) {
        console.error('Error occurred during registration:', err); 
        return res.status(500).send(`Registration failed. Error: ${err.message}`); 
      }
      res.redirect('/login');
    });
  } catch (error) {
    console.error('Error occurred during registration:', error);
    res.status(500).send(`Registration failed. Error: ${error.message}`); 
  }
});


app.get('/login', (req, res) => {
  res.render('login.ejs');
});


app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], async (err, results) => {
      if (err || results.length === 0) {
        res.send('Invalid username or password');
      } else {
        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          req.session.isLoggedIn = true;
          req.session.username = user.username;
          res.redirect('/');
        } else {
          res.send('Invalid username or password');
        }
      }
    });
  } catch (error) {
    res.send('Error occurred during login');
  }
});

app.get('/profile', (req, res) => {
  if (req.session.isLoggedIn) {
   res.render('profile.ejs', { username: req.session.username });
  } else {
    res.redirect('/login');
  }
});

app.get('/dashboard', async (req, res) => {
  if (req.session.isLoggedIn) {
    const selectedProjectTitle = req.query.project;

    const query = 'SELECT html, css, js, project_id FROM code_snippets WHERE username = ? AND project_title = ?';
    db.query(query, [req.session.username, selectedProjectTitle], (err, results) => {
      if (err) {
        console.error('Error fetching code:', err);
      } else {
        console.log('Query Results:', results);
        const codeSnippet = results[0];
        
        res.render('dashboard.ejs', {
          username: req.session.username,
          savedHtml: codeSnippet ? codeSnippet.html : '',
          savedCss: codeSnippet ? codeSnippet.css : '',
          savedJs: codeSnippet ? codeSnippet.js : '',
          projectTitle: selectedProjectTitle, 
          project_id: codeSnippet ? codeSnippet.project_id : '', 
        });
      }
    });
  } else {
    res.redirect('/login');
  }
});


app.get('/guest_dashboard', (req, res) => {
  res.render('guest_dashboard.ejs');
});

app.get('/from-guest-dashboard', (req, res) => {
  if (req.session.isLoggedIn) {
    const guestCode = req.session.guestCode || { html: '', css: '', js: '' };
    res.render('dashboard.ejs', {
      username: req.session.username,
      savedHtml: guestCode.html,
      savedCss: guestCode.css,
      savedJs: guestCode.js,
    });
  } else {
    res.redirect('/login');
  }
});

app.post('/save-code', (req, res) => {
  console.log('Received request:', req.body);
  if (req.session.isLoggedIn) {
    const { username } = req.session;
    const { html, css, js, project_title } = req.body;

    console.log("projectTitle:", project_title);

    const project_id = uuidv4();

    const queryForCount = 'SELECT COUNT(*) AS count FROM code_snippets WHERE username = ?';
    db.query(queryForCount, [username], (countErr, countResult) => {
      if (countErr) {
        console.error('Error occurred during code saving:', countErr);
        res.json({ success: false, message: 'Error occurred during code saving' });
      } else {
        console.log("countResult:", countResult);
        const defaultTitle = `untitled${countResult[0].count + 1}`;
        const finalProjectTitle = project_title || defaultTitle;

        console.log("Final Title :",finalProjectTitle);

        const query = 'INSERT INTO code_snippets (username, html, css, js, project_title, project_id) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [username, html, css, js, finalProjectTitle, project_id], (err, result) => {
          if (err) {
            console.error('Error occurred during code saving:', err);
            res.json({ success: false, message: 'Error occurred during code saving' });
          } else {
            const shareableLink = `http://localhost:8080/project/${project_id}`;
            res.json({ success: true, message: 'Code saved successfully', shareableLink });
          }          
        });
      }
    });
  } else {
    res.json({ success: false, message: 'Not logged in' });
  }
});


app.get('/project/:project_id', (req, res) => {
  const project_id = req.params.project_id;

  const query = 'SELECT * FROM code_snippets WHERE project_id = ?';
  db.query(query, [project_id], (err, results) => {
    if (err) {
      console.error('Error fetching code snippet:', err);
    } else {
      const codeSnippet = results[0];
      res.render('code_viewer.ejs', {
        savedHtml: codeSnippet.html,
        savedCss: codeSnippet.css,
        savedJs: codeSnippet.js,
      });
    }
  });
});

app.get('/my-works', (req, res) => {
  if (req.session.isLoggedIn) {
    const query = 'SELECT DISTINCT project_title FROM code_snippets WHERE username = ?';
    db.query(query, [req.session.username], (err, results) => {
      if (err) {
        console.error('Error fetching project titles:', err);
      } else {
        const projectTitles = results.map(result => result.project_title);
        res.render('my-works.ejs', {
          username: req.session.username,
          projectTitles: projectTitles,
        });
      }
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error occurred during logout:', err);
    }
    res.redirect('/');
  });
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});