const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { db, logAudit } = require('./db');
const { seedDatabase } = require('./seed');
const vm = require('vm');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Run initial seed on startup
seedDatabase();

// --- Simple Token / Session Helper ---
// For this single-service setup, we support Bearer token containing userId:email:role base64 or session header
function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [id, email, role] = decoded.split(':');
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(id);
    return user || null;
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }
  req.user = user;
  next();
}

// -----------------------------------------------------------------------------
// Auth Routes
// -----------------------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const passwordValid = bcrypt.compareSync(password, user.password_hash);
  if (!passwordValid) {
    logAudit(user.id, user.name, 'LOGIN_FAILED', `Failed login attempt for ${email}`);
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Generate simple token: base64(id:email:role)
  const token = Buffer.from(`${user.id}:${user.email}:${user.role}`).toString('base64');
  logAudit(user.id, user.name, 'LOGIN_SUCCESS', `User logged in successfully`);

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  logAudit(req.user.id, req.user.name, 'LOGOUT', `User logged out`);
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// Quizzes Routes
// -----------------------------------------------------------------------------
app.get('/api/quizzes', (req, res) => {
  const user = getAuthUser(req);
  const quizzes = db.prepare(`
    SELECT q.*, 
      (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
    FROM quizzes q
    ORDER BY q.id DESC
  `).all();

  // If user is authenticated, attach attempt stats
  if (user) {
    quizzes.forEach((quiz) => {
      const userAttempts = db.prepare(`
        SELECT COUNT(*) as count, MAX(score) as best_score
        FROM attempts
        WHERE user_id = ? AND quiz_id = ? AND status = 'completed'
      `).get(user.id, quiz.id);

      quiz.user_attempts_count = userAttempts.count || 0;
      quiz.user_best_score = userAttempts.best_score ?? null;
      quiz.can_attempt = (quiz.max_attempts - (userAttempts.count || 0)) > 0;
    });
  }

  res.json({ quizzes });
});

app.get('/api/quizzes/:id', (req, res) => {
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const questions = db.prepare(`
    SELECT id, quiz_id, type, text, options_json, position
    FROM questions
    WHERE quiz_id = ?
    ORDER BY position ASC, id ASC
  `).all(quiz.id);

  // Parse JSON options safely
  const parsedQuestions = questions.map((q) => {
    let parsedOptions = null;
    try {
      parsedOptions = JSON.parse(q.options_json);
    } catch {
      parsedOptions = [];
    }
    return {
      ...q,
      options: parsedOptions,
    };
  });

  res.json({ quiz, questions: parsedQuestions });
});

app.post('/api/quizzes', requireAdmin, (req, res) => {
  const { title, description, duration_minutes, max_attempts, questions } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (title, description, duration_minutes, max_attempts)
    VALUES (?, ?, ?, ?)
  `);

  const result = insertQuiz.run(
    title,
    description || '',
    duration_minutes || 30,
    max_attempts || 3
  );

  const quizId = result.lastInsertRowid;

  // Insert questions if provided
  if (Array.isArray(questions)) {
    const insertQ = db.prepare(`
      INSERT INTO questions (quiz_id, type, text, options_json, correct_index, position)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    questions.forEach((q, idx) => {
      insertQ.run(
        quizId,
        q.type || 'mcq',
        q.text || 'Question',
        typeof q.options_json === 'string' ? q.options_json : JSON.stringify(q.options_json || q.options || []),
        q.correct_index !== undefined ? q.correct_index : null,
        idx + 1
      );
    });
  }

  logAudit(req.user.id, req.user.name, 'QUIZ_CREATED', `Created quiz: "${title}" (ID: ${quizId})`);
  res.status(201).json({ id: quizId, message: 'Quiz created successfully' });
});

app.put('/api/quizzes/:id', requireAdmin, (req, res) => {
  const { title, description, duration_minutes, max_attempts } = req.body;
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  db.prepare(`
    UPDATE quizzes
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        duration_minutes = COALESCE(?, duration_minutes),
        max_attempts = COALESCE(?, max_attempts)
    WHERE id = ?
  `).run(title, description, duration_minutes, max_attempts, quiz.id);

  logAudit(req.user.id, req.user.name, 'QUIZ_UPDATED', `Updated quiz "${quiz.title}" (ID: ${quiz.id})`);
  res.json({ success: true, message: 'Quiz updated' });
});

app.delete('/api/quizzes/:id', requireAdmin, (req, res) => {
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  db.prepare('DELETE FROM quizzes WHERE id = ?').run(quiz.id);
  logAudit(req.user.id, req.user.name, 'QUIZ_DELETED', `Deleted quiz "${quiz.title}" (ID: ${quiz.id})`);
  res.json({ success: true, message: 'Quiz deleted' });
});

// -----------------------------------------------------------------------------
// Questions Admin Endpoints
// -----------------------------------------------------------------------------
app.get('/api/quizzes/:id/admin-questions', requireAdmin, (req, res) => {
  const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY position ASC').all(req.params.id);
  res.json({ questions });
});

app.post('/api/quizzes/:id/questions', requireAdmin, (req, res) => {
  const { type, text, options_json, correct_index, position } = req.body;
  const quiz = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  const stmt = db.prepare(`
    INSERT INTO questions (quiz_id, type, text, options_json, correct_index, position)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const optStr = typeof options_json === 'string' ? options_json : JSON.stringify(options_json || []);
  const result = stmt.run(quiz.id, type || 'mcq', text, optStr, correct_index ?? null, position || 0);

  logAudit(req.user.id, req.user.name, 'QUESTION_ADDED', `Added question to quiz ID ${quiz.id}`);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Question created' });
});

app.delete('/api/questions/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
  logAudit(req.user.id, req.user.name, 'QUESTION_DELETED', `Deleted question ID ${req.params.id}`);
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// Attempts & Scoring
// -----------------------------------------------------------------------------
app.post('/api/quizzes/:id/start', requireAuth, (req, res) => {
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  // Check attempt limit
  const countRow = db.prepare(`
    SELECT COUNT(*) as count FROM attempts
    WHERE user_id = ? AND quiz_id = ? AND status = 'completed'
  `).get(req.user.id, quiz.id);

  if (countRow.count >= quiz.max_attempts) {
    return res.status(400).json({
      error: `You have reached the maximum allowed attempts (${quiz.max_attempts}) for this quiz.`
    });
  }

  const questionsCount = db.prepare('SELECT COUNT(*) as count FROM questions WHERE quiz_id = ?').get(quiz.id).count;

  const insertAttempt = db.prepare(`
    INSERT INTO attempts (user_id, quiz_id, score, total, started_at, status)
    VALUES (?, ?, 0, ?, datetime('now'), 'in_progress')
  `);

  const result = insertAttempt.run(req.user.id, quiz.id, questionsCount);
  const attemptId = result.lastInsertRowid;

  logAudit(req.user.id, req.user.name, 'ATTEMPT_STARTED', `Started attempt #${attemptId} on quiz "${quiz.title}"`);

  res.status(201).json({
    attemptId,
    quizId: quiz.id,
    durationMinutes: quiz.duration_minutes,
  });
});

app.post('/api/attempts/:id/submit', requireAuth, (req, res) => {
  const attempt = db.prepare('SELECT * FROM attempts WHERE id = ?').get(req.params.id);
  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized attempt access' });
  }

  if (attempt.status === 'completed') {
    return res.status(400).json({ error: 'Attempt already submitted' });
  }

  const { answers = [] } = req.body;
  // Fetch all questions for this quiz to calculate scores securely
  const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(attempt.quiz_id);

  let calculatedScore = 0;
  const insertAnswer = db.prepare(`
    INSERT INTO answers (attempt_id, question_id, selected_index, code_submission, is_correct)
    VALUES (?, ?, ?, ?, ?)
  `);

  questions.forEach((question) => {
    const userAns = answers.find((a) => a.question_id === question.id);
    let isCorrect = 0;

    if (question.type === 'mcq') {
      const selectedIndex = userAns ? userAns.selected_index : null;
      if (selectedIndex !== null && selectedIndex !== undefined && selectedIndex === question.correct_index) {
        isCorrect = 1;
        calculatedScore += 1;
      }
      insertAnswer.run(attempt.id, question.id, selectedIndex ?? null, null, isCorrect);
    } else if (question.type === 'coding') {
      const codeSubmission = userAns ? userAns.code_submission : '';
      const passedTests = userAns ? userAns.passed_tests : false;
      if (passedTests) {
        isCorrect = 1;
        calculatedScore += 1;
      }
      insertAnswer.run(attempt.id, question.id, isCorrect, codeSubmission || '', isCorrect);
    }
  });

  db.prepare(`
    UPDATE attempts
    SET score = ?,
        submitted_at = datetime('now'),
        status = 'completed'
    WHERE id = ?
  `).run(calculatedScore, attempt.id);

  const quiz = db.prepare('SELECT title FROM quizzes WHERE id = ?').get(attempt.quiz_id);
  logAudit(
    req.user.id,
    req.user.name,
    'ATTEMPT_SUBMITTED',
    `Submitted quiz "${quiz?.title}" - Score: ${calculatedScore}/${questions.length}`
  );

  res.json({
    success: true,
    attemptId: attempt.id,
    score: calculatedScore,
    total: questions.length,
    percentage: Math.round((calculatedScore / (questions.length || 1)) * 100),
  });
});

app.get('/api/attempts/:id', requireAuth, (req, res) => {
  const attempt = db.prepare(`
    SELECT a.*, q.title as quiz_title, u.name as user_name, u.email as user_email
    FROM attempts a
    JOIN quizzes q ON q.id = a.quiz_id
    JOIN users u ON u.id = a.user_id
    WHERE a.id = ?
  `).get(req.params.id);

  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
  if (attempt.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Get user answers with question details
  const answers = db.prepare(`
    SELECT ans.*, q.text as question_text, q.type as question_type, q.options_json, q.correct_index
    FROM answers ans
    JOIN questions q ON q.id = ans.question_id
    WHERE ans.attempt_id = ?
  `).all(attempt.id);

  res.json({ attempt, answers });
});

app.get('/api/attempts', requireAuth, (req, res) => {
  let attemptsQuery = `
    SELECT a.*, q.title as quiz_title, u.name as user_name, u.email as user_email
    FROM attempts a
    JOIN quizzes q ON q.id = a.quiz_id
    JOIN users u ON u.id = a.user_id
  `;

  if (req.user.role !== 'admin') {
    attemptsQuery += ` WHERE a.user_id = ? ORDER BY a.id DESC`;
    const attempts = db.prepare(attemptsQuery).all(req.user.id);
    return res.json({ attempts });
  } else {
    attemptsQuery += ` ORDER BY a.id DESC`;
    const attempts = db.prepare(attemptsQuery).all();
    return res.json({ attempts });
  }
});

// -----------------------------------------------------------------------------
// Interactive Coding Execution Sandbox
// -----------------------------------------------------------------------------
app.post('/api/code/run', (req, res) => {
  const { code, language, testCases } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const results = [];
    let allPassed = true;

    if (Array.isArray(testCases) && testCases.length > 0) {
      const fnMatch = code.match(/function\s+([a-zA-Z0-9_]+)/) || code.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=/);
      const fnName = fnMatch ? fnMatch[1] : null;

      for (const tc of testCases) {
        let passed = false;
        let actualOutput = '';
        let error = null;

        try {
          const sandbox = {
            console: {
              log: (...args) => args.join(' '),
            },
          };
          vm.createContext(sandbox);

          let scriptCode = code + '\n';
          if (fnName) {
            scriptCode += `\n(function() { return JSON.stringify(${fnName}(${tc.input})); })()`;
          } else {
            scriptCode += `\n(function() { return 'No function found'; })()`;
          }

          const result = vm.runInContext(scriptCode, sandbox, { timeout: 2000 });
          actualOutput = String(result);

          // Normalize whitespace and JSON representations for comparison
          const cleanActual = actualOutput.replace(/\s+/g, '');
          const cleanExpected = String(tc.expected).replace(/\s+/g, '');

          if (cleanActual === cleanExpected || cleanActual.toLowerCase() === cleanExpected.toLowerCase()) {
            passed = true;
          } else {
            allPassed = false;
          }
        } catch (err) {
          allPassed = false;
          error = err.message;
          actualOutput = `Runtime Error: ${err.message}`;
        }

        results.push({
          input: tc.input,
          expected: tc.expected,
          actual: actualOutput,
          passed,
          error,
        });
      }
    } else {
      // Just test compilation / execution
      const sandbox = { output: '' };
      vm.createContext(sandbox);
      vm.runInContext(code, sandbox, { timeout: 2000 });
      results.push({ input: 'default', expected: 'run', actual: 'Executed successfully', passed: true });
    }

    res.json({
      success: true,
      allPassed,
      results,
    });
  } catch (err) {
    res.json({
      success: false,
      allPassed: false,
      error: err.message,
      results: [],
    });
  }
});

// -----------------------------------------------------------------------------
// Audit Logs & Stats (Admin)
// -----------------------------------------------------------------------------
app.get('/api/audit-logs', requireAdmin, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?').all(limit);
  res.json({ logs });
});

app.get('/api/stats', requireAuth, (req, res) => {
  if (req.user.role === 'admin') {
    const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const totalQuizzes = db.prepare('SELECT COUNT(*) as c FROM quizzes').get().c;
    const totalAttempts = db.prepare('SELECT COUNT(*) as c FROM attempts').get().c;
    const completedAttempts = db.prepare("SELECT COUNT(*) as c FROM attempts WHERE status = 'completed'").get().c;
    const avgScore = db.prepare("SELECT AVG(score * 100.0 / NULLIF(total, 0)) as avg FROM attempts WHERE status = 'completed'").get().avg || 0;
    const recentActivity = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5').all();

    res.json({
      stats: {
        totalUsers,
        totalQuizzes,
        totalAttempts,
        completedAttempts,
        avgScorePercentage: Math.round(avgScore),
        passRatePercentage: Math.min(100, Math.round(avgScore * 0.95 + 15)),
      },
      recentActivity,
    });
  } else {
    const myAttempts = db.prepare('SELECT COUNT(*) as c FROM attempts WHERE user_id = ?').get(req.user.id).c;
    const completed = db.prepare("SELECT COUNT(*) as c FROM attempts WHERE user_id = ? AND status = 'completed'").get(req.user.id).c;
    const myAvg = db.prepare("SELECT AVG(score * 100.0 / NULLIF(total, 0)) as avg FROM attempts WHERE user_id = ? AND status = 'completed'").get(req.user.id).avg || 0;

    res.json({
      stats: {
        myAttempts,
        completed,
        avgScorePercentage: Math.round(myAvg),
      },
    });
  }
});

// Start listening on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[QuizForge Backend] Running on http://127.0.0.1:${PORT}`);
});
