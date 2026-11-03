const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { db, logAudit } = require('./db.cjs');
const { seedDatabase } = require('./seed.cjs');
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

app.post('/api/attempts/:attemptId/submit', requireAuth, (req, res) => {
  const { attemptId } = req.params;
  const { answers } = req.body;

  const attempt = db.prepare('SELECT * FROM attempts WHERE id = ? AND user_id = ?').get(attemptId, req.user.id);
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
  if (attempt.status !== 'in_progress') return res.status(400).json({ error: 'Attempt already submitted' });

  const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY position').all(attempt.quiz_id);
  let score = 0;
  const total = questions.length;

  const insertAnswer = db.prepare(`
    INSERT INTO answers (attempt_id, question_id, selected_index, code_submission, is_correct)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT DO NOTHING
  `);
  const updateAnswer = db.prepare('UPDATE answers SET selected_index = ?, code_submission = ?, is_correct = ? WHERE attempt_id = ? AND question_id = ?');

  for (const q of questions) {
    const userAnswer = (answers || []).find((a) => a.question_id === q.id);
    if (!userAnswer) continue;

    if (q.type === 'mcq') {
      const correct = userAnswer.selected_index === q.correct_index ? 1 : 0;
      if (correct) score++;
      const ex = db.prepare('SELECT id FROM answers WHERE attempt_id = ? AND question_id = ?').get(attemptId, q.id);
      if (ex) {
        updateAnswer.run(userAnswer.selected_index, null, correct, attemptId, q.id);
      } else {
        try { insertAnswer.run(attemptId, q.id, userAnswer.selected_index, null, correct); } catch {}
      }
    } else if (q.type === 'coding') {
      const submittedCode = userAnswer.code_submission || '';
      let codingScore = 0;
      let totalTests = 1;

      try {
        const opts = JSON.parse(q.options_json);
        const testCases = Array.isArray(opts.testCases) ? opts.testCases : [];
        totalTests = testCases.length || 1;

        // Detect function name
        let fnName = opts.functionName;
        if (!fnName) {
          const m = submittedCode.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/) ||
                    submittedCode.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\(.*\)\s*=>)/);
          fnName = m ? m[1] : null;
        }

        const sandboxConsole = { log: () => {}, warn: () => {}, error: () => {}, info: () => {} };

        for (const tc of testCases) {
          try {
            const sandbox = { console: sandboxConsole };
            vm.createContext(sandbox);
            vm.runInContext(submittedCode, sandbox, { timeout: 3000 });
            if (fnName) {
              const result = vm.runInContext(`(function(){ return JSON.stringify(${fnName}(${tc.input})); })()`, sandbox, { timeout: 3000 });
              const clean = (s) => String(s).replace(/\s+/g, '').toLowerCase();
              if (clean(result) === clean(tc.expected)) codingScore++;
            }
          } catch {}
        }
      } catch {}

      // Award fractional point: passed / total, award 1 if all pass, else proportional
      const proportion = totalTests > 0 ? codingScore / totalTests : 0;
      const pointsAwarded = Math.round(proportion);
      score += pointsAwarded;

      const isCorrect = codingScore === totalTests && totalTests > 0 ? 1 : 0;
      const ex = db.prepare('SELECT id FROM answers WHERE attempt_id = ? AND question_id = ?').get(attemptId, q.id);
      if (ex) {
        updateAnswer.run(null, submittedCode, isCorrect, attemptId, q.id);
      } else {
        try { insertAnswer.run(attemptId, q.id, null, submittedCode, isCorrect); } catch {}
      }
    }
  }

  db.prepare(`
    UPDATE attempts SET score = ?, total = ?, status = 'completed', submitted_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(score, total, attemptId);

  const quiz = db.prepare('SELECT title FROM quizzes WHERE id = ?').get(attempt.quiz_id);
  logAudit(req.user.id, req.user.name, 'CODE_SUBMITTED', `Submitted quiz "${quiz?.title}" — score ${score}/${total}`);

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  res.json({ success: true, attemptId: Number(attemptId), score, total, percentage });
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
// Workspace Code Runner (child process, isolated, with timeout)
// -----------------------------------------------------------------------------
const { spawn } = require('child_process');
const pathModule = require('path');

app.post('/api/workspace/run', requireAuth, (req, res) => {
  const { questionId, language = 'javascript', code, testCases: clientTestCases } = req.body;

  // Determine test cases: if questionId provided, use server-side (including hidden) cases
  let testCasesToRun = Array.isArray(clientTestCases) ? clientTestCases : [];
  let functionName = null;

  if (questionId) {
    const q = db.prepare('SELECT options_json FROM questions WHERE id = ?').get(questionId);
    if (q) {
      try {
        const opts = JSON.parse(q.options_json);
        if (Array.isArray(opts.testCases)) testCasesToRun = opts.testCases;
        functionName = opts.functionName || null;
      } catch {}
    }
    logAudit(req.user.id, req.user.name, 'CODE_RUN', `Ran code for question ${questionId} (lang: ${language})`);
  }

  const payload = JSON.stringify({ language, code, testCases: testCasesToRun, functionName });
  const runnerPath = pathModule.join(__dirname, 'runner.cjs');

  // Spawn isolated child process — no env vars passed
  const child = spawn(process.execPath, [runnerPath], {
    env: {},                // strip all environment variables
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 5000,
  });

  let stdout = '';
  let stderr = '';
  let timedOut = false;
  const MAX_OUTPUT = 50 * 1024; // 50 KB

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
    if (stdout.length > MAX_OUTPUT) { stdout = stdout.slice(0, MAX_OUTPUT); }
  });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  child.stdin.write(payload);
  child.stdin.end();

  const killer = setTimeout(() => {
    timedOut = true;
    child.kill('SIGKILL');
  }, 5000);

  child.on('close', () => {
    clearTimeout(killer);

    if (timedOut) {
      return res.json({
        success: false,
        allPassed: false,
        error: 'Execution timed out (5 s). Check for infinite loops.',
        results: [],
        consoleLogs: [],
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      return res.json({
        success: false,
        allPassed: false,
        error: stderr || 'Runner produced no output.',
        results: [],
        consoleLogs: [],
      });
    }

    const allPassed = parsed.results.length > 0 && parsed.results.every(r => r.passed);
    const passedCount = parsed.results.filter(r => r.passed).length;

    res.json({
      success: true,
      allPassed,
      passedCount,
      totalCount: parsed.results.length,
      results: parsed.results,
      consoleLogs: parsed.consoleLogs || [],
      error: parsed.error || null,
    });
  });

  child.on('error', (err) => {
    clearTimeout(killer);
    res.json({ success: false, allPassed: false, error: err.message, results: [], consoleLogs: [] });
  });
});

// Check Coder Full IDE status
app.get('/api/workspace/status', async (req, res) => {
  const coderUrl = process.env.VITE_CODER_URL || process.env.CODER_URL || 'http://localhost:3000';
  let online = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const resp = await fetch(coderUrl, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    if (resp && resp.status) {
      online = true;
    }
  } catch (err) {
    online = false;
  }
  res.json({ online, url: coderUrl });
});

// Log workspace opened in audit logs
app.post('/api/workspace/open-log', (req, res) => {
  const user = getAuthUser(req);
  const userId = user ? user.id : null;
  const userName = user ? user.name : 'Candidate';
  const coderUrl = process.env.VITE_CODER_URL || process.env.CODER_URL || 'http://localhost:3000';
  logAudit(userId, userName, 'WORKSPACE_OPENED', `Opened Full IDE (Coder) at ${coderUrl}`);
  res.json({ success: true });
});

// Autosave coding answer
app.post('/api/attempts/:attemptId/autosave', requireAuth, (req, res) => {
  const { attemptId } = req.params;
  const { questionId, code } = req.body;
  if (!questionId || code === undefined) return res.json({ success: false });

  const attempt = db.prepare('SELECT * FROM attempts WHERE id = ? AND user_id = ?').get(attemptId, req.user.id);
  if (!attempt) return res.status(403).json({ error: 'Forbidden' });

  const existing = db.prepare('SELECT id FROM answers WHERE attempt_id = ? AND question_id = ?').get(attemptId, questionId);
  if (existing) {
    db.prepare('UPDATE answers SET code_submission = ? WHERE id = ?').run(code, existing.id);
  } else {
    db.prepare('INSERT INTO answers (attempt_id, question_id, code_submission) VALUES (?, ?, ?)').run(attemptId, questionId, code);
  }
  res.json({ success: true });
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

// =============================================================================
// Cloud Workspaces & Assignments Subsystem
// =============================================================================
const fsPromises = require('fs').promises;
const os = require('os');

// Helper to execute commands in temporary workspace directory
async function runInTempWorkspace(files, command, hiddenTestFile) {
  const tmpDir = pathModule.join(os.tmpdir(), `qf-ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  await fsPromises.mkdir(tmpDir, { recursive: true });

  try {
    for (const f of files) {
      const filePath = pathModule.join(tmpDir, f.path);
      await fsPromises.mkdir(pathModule.dirname(filePath), { recursive: true });
      await fsPromises.writeFile(filePath, f.content || '', 'utf8');
    }

    if (hiddenTestFile) {
      await fsPromises.writeFile(pathModule.join(tmpDir, 'tests.js'), hiddenTestFile, 'utf8');
    }

    const trimmed = (command || '').trim();
    if (!trimmed) {
      return { output: '', exitCode: 0, testResults: [] };
    }

    if (trimmed === 'clear') {
      return { output: '', clear: true, exitCode: 0, testResults: [] };
    }

    let bin = '';
    let args = [];

    if (trimmed === 'npm test') {
      bin = process.execPath;
      args = ['tests.js'];
    } else if (trimmed === 'ls' || trimmed.startsWith('ls ')) {
      bin = 'ls';
      args = trimmed.slice(2).trim().split(/\s+/).filter(Boolean);
    } else if (trimmed.startsWith('cat ')) {
      bin = 'cat';
      args = trimmed.slice(4).trim().split(/\s+/).filter(Boolean);
      if (args.some(a => a.includes('..') || pathModule.isAbsolute(a))) {
        return { output: 'cat: path traversal disallowed', exitCode: 1, testResults: [] };
      }
    } else if (trimmed.startsWith('node ')) {
      bin = process.execPath;
      const targetFile = trimmed.slice(5).trim();
      if (targetFile.includes('..') || pathModule.isAbsolute(targetFile)) {
        return { output: 'node: path traversal disallowed', exitCode: 1, testResults: [] };
      }
      args = [targetFile];
    } else if (trimmed.startsWith('python ') || trimmed.startsWith('python3 ')) {
      bin = trimmed.startsWith('python3 ') ? 'python3' : 'python';
      const targetFile = trimmed.replace(/^python[3]?\s+/, '').trim();
      if (targetFile.includes('..') || pathModule.isAbsolute(targetFile)) {
        return { output: 'python: path traversal disallowed', exitCode: 1, testResults: [] };
      }
      args = [targetFile];
    } else {
      return {
        output: `Command not allowed: "${trimmed}". Whitelisted: node <file>, python <file>, npm test, ls, cat <file>, clear`,
        exitCode: 127,
        testResults: [],
      };
    }

    return await new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      const MAX_OUTPUT = 50 * 1024;

      const child = spawn(bin, args, {
        cwd: tmpDir,
        env: {
          NODE_PATH: tmpDir,
          PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
        },
        timeout: 5000,
      });

      child.stdout.on('data', (d) => {
        stdout += d.toString();
        if (stdout.length > MAX_OUTPUT) stdout = stdout.slice(0, MAX_OUTPUT) + '\n[Output capped at 50KB]';
      });

      child.stderr.on('data', (d) => {
        stderr += d.toString();
        if (stderr.length > MAX_OUTPUT) stderr = stderr.slice(0, MAX_OUTPUT) + '\n[Stderr capped]';
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, 5000);

      child.on('close', (code) => {
        clearTimeout(timer);
        let testResults = [];
        let cleanOutput = stdout;

        if (cleanOutput.includes('__TEST_RESULTS__')) {
          const parts = cleanOutput.split('__TEST_RESULTS__');
          cleanOutput = parts[0];
          try {
            testResults = JSON.parse(parts[1].trim());
          } catch {}
        }

        if (timedOut) {
          resolve({
            output: cleanOutput + '\n[Error: Command timed out after 5 seconds (check infinite loops)]',
            exitCode: 124,
            testResults,
          });
        } else {
          const fullOutput = cleanOutput + (stderr ? (cleanOutput ? '\n' : '') + stderr : '');
          resolve({
            output: fullOutput,
            exitCode: code ?? 0,
            testResults,
          });
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          output: `Execution error: ${err.message}`,
          exitCode: 1,
          testResults: [],
        });
      });
    });
  } finally {
    try {
      await fsPromises.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

// 1. List Assignments
app.get('/api/assignments', requireAuth, (req, res) => {
  if (req.user.role === 'admin') {
    const assignments = db.prepare(`
      SELECT a.*,
        (SELECT COUNT(*) FROM workspaces w WHERE w.assignment_id = a.id) as workspace_count,
        (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) as submission_count
      FROM assignments a
      ORDER BY a.id DESC
    `).all();

    for (const a of assignments) {
      a.files = db.prepare('SELECT id, path FROM assignment_files WHERE assignment_id = ?').all(a.id);
    }
    return res.json({ assignments });
  }

  // Student view: filter by assignment eligibility
  const allAssignments = db.prepare('SELECT id, title, description, difficulty, time_limit_minutes, assigned_to, created_at FROM assignments ORDER BY id DESC').all();
  const eligible = allAssignments.filter((a) => {
    if (a.assigned_to === 'all') return true;
    try {
      const parsed = JSON.parse(a.assigned_to);
      return Array.isArray(parsed) && parsed.includes(req.user.id);
    } catch {
      return false;
    }
  });

  for (const a of eligible) {
    const ws = db.prepare('SELECT id, status, started_at, last_active_at, auto_stop_at FROM workspaces WHERE user_id = ? AND assignment_id = ?').get(req.user.id, a.id);
    a.workspace = ws || { status: 'not_started' };

    // Check if auto-stop expired
    if (ws && ws.status === 'running' && ws.auto_stop_at && new Date(ws.auto_stop_at) < new Date()) {
      a.workspace.status = 'submitted';
    }

    const sub = db.prepare('SELECT score, total, submitted_at FROM submissions WHERE user_id = ? AND assignment_id = ?').get(req.user.id, a.id);
    a.submission = sub || null;
  }

  res.json({ assignments: eligible });
});

// 2. Get Single Assignment
app.get('/api/assignments/:id', requireAuth, (req, res) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  // Hide secret test file from students
  if (req.user.role !== 'admin') {
    delete assignment.hidden_test_file;
  }

  const files = db.prepare('SELECT id, path, content FROM assignment_files WHERE assignment_id = ?').all(assignment.id);
  res.json({ assignment, files });
});

// 3. Create Assignment (Admin)
app.post('/api/assignments', requireAdmin, (req, res) => {
  const { title, description, difficulty = 'Medium', time_limit_minutes = 30, starter_files = [], hidden_test_file = '', assigned_to = 'all' } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const insertAssignment = db.prepare(`
    INSERT INTO assignments (title, description, difficulty, time_limit_minutes, hidden_test_file, assigned_to)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = insertAssignment.run(
    title.trim(),
    description || '',
    difficulty,
    Number(time_limit_minutes) || 30,
    hidden_test_file || '',
    typeof assigned_to === 'string' ? assigned_to : JSON.stringify(assigned_to)
  );

  const assignmentId = result.lastInsertRowid;
  const insertFile = db.prepare('INSERT INTO assignment_files (assignment_id, path, content) VALUES (?, ?, ?)');
  for (const f of starter_files) {
    if (f.path && f.path.trim()) {
      insertFile.run(assignmentId, f.path.trim(), f.content || '');
    }
  }

  logAudit(req.user.id, req.user.name, 'ASSIGNMENT_CREATED', `Created assignment: "${title}" (id: ${assignmentId})`);
  res.json({ id: assignmentId, success: true });
});

// 4. Update Assignment (Admin)
app.put('/api/assignments/:id', requireAdmin, (req, res) => {
  const { title, description, difficulty, time_limit_minutes, starter_files, hidden_test_file, assigned_to } = req.body;
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  db.prepare(`
    UPDATE assignments
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        difficulty = COALESCE(?, difficulty),
        time_limit_minutes = COALESCE(?, time_limit_minutes),
        hidden_test_file = COALESCE(?, hidden_test_file),
        assigned_to = COALESCE(?, assigned_to)
    WHERE id = ?
  `).run(
    title,
    description,
    difficulty,
    time_limit_minutes ? Number(time_limit_minutes) : null,
    hidden_test_file,
    assigned_to ? (typeof assigned_to === 'string' ? assigned_to : JSON.stringify(assigned_to)) : null,
    assignment.id
  );

  if (Array.isArray(starter_files)) {
    db.prepare('DELETE FROM assignment_files WHERE assignment_id = ?').run(assignment.id);
    const insertFile = db.prepare('INSERT INTO assignment_files (assignment_id, path, content) VALUES (?, ?, ?)');
    for (const f of starter_files) {
      if (f.path && f.path.trim()) {
        insertFile.run(assignment.id, f.path.trim(), f.content || '');
      }
    }
  }

  res.json({ success: true });
});

// 5. Delete Assignment (Admin)
app.delete('/api/assignments/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 6. Submissions for Assignment (Admin)
app.get('/api/assignments/:id/submissions', requireAdmin, (req, res) => {
  const submissions = db.prepare(`
    SELECT s.*, u.name as user_name, u.email as user_email, w.started_at, w.auto_stop_at
    FROM submissions s
    JOIN users u ON u.id = s.user_id
    JOIN workspaces w ON w.id = s.workspace_id
    WHERE s.assignment_id = ?
    ORDER BY s.id DESC
  `).all(req.params.id);

  res.json({ submissions });
});

// 7. View Submitted Workspace Files (Read-only for Admin or User)
app.get('/api/submissions/:id/files', requireAuth, (req, res) => {
  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  if (req.user.role !== 'admin' && submission.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const files = db.prepare('SELECT path, content FROM workspace_files WHERE workspace_id = ? ORDER BY path').all(submission.workspace_id);
  res.json({ submission, files });
});

// 8. Launch Workspace (Provision / Start)
app.post('/api/assignments/:id/workspace/launch', requireAuth, (req, res) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

  let workspace = db.prepare('SELECT * FROM workspaces WHERE user_id = ? AND assignment_id = ?').get(req.user.id, assignment.id);
  let newlyCreated = false;

  if (!workspace) {
    const autoStopMins = assignment.time_limit_minutes || 30;
    const wsRes = db.prepare(`
      INSERT INTO workspaces (user_id, assignment_id, status, started_at, last_active_at, auto_stop_at)
      VALUES (?, ?, 'running', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, datetime('now', '+' || ? || ' minutes'))
    `).run(req.user.id, assignment.id, autoStopMins);

    workspace = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(wsRes.lastInsertRowid);
    newlyCreated = true;

    // Seed workspace_files from assignment_files
    const starterFiles = db.prepare('SELECT path, content FROM assignment_files WHERE assignment_id = ?').all(assignment.id);
    const insertWsFile = db.prepare('INSERT INTO workspace_files (workspace_id, path, content) VALUES (?, ?, ?)');
    for (const f of starterFiles) {
      insertWsFile.run(workspace.id, f.path, f.content);
    }

    logAudit(req.user.id, req.user.name, 'WORKSPACE_CREATED', `Created workspace for assignment "${assignment.title}"`);
    logAudit(req.user.id, req.user.name, 'WORKSPACE_STARTED', `Started workspace ${workspace.id}`);
  } else {
    // If stopped, resume it
    if (workspace.status === 'stopped' || workspace.status === 'not_started') {
      db.prepare(`
        UPDATE workspaces
        SET status = 'running',
            last_active_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(workspace.id);
      workspace.status = 'running';
      logAudit(req.user.id, req.user.name, 'WORKSPACE_STARTED', `Resumed workspace ${workspace.id}`);
    }
  }

  const files = db.prepare('SELECT path, content FROM workspace_files WHERE workspace_id = ? ORDER BY path').all(workspace.id);
  res.json({ workspace, files, newlyCreated });
});

// 9. Get Workspace Details & Active State
app.get('/api/workspaces/:id', requireAuth, async (req, res) => {
  const workspace = db.prepare(`
    SELECT w.*, a.title as assignment_title, a.description as assignment_description,
           a.difficulty as assignment_difficulty, a.time_limit_minutes, a.hidden_test_file
    FROM workspaces w
    JOIN assignments a ON a.id = w.assignment_id
    WHERE w.id = ?
  `).get(req.params.id);

  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  if (req.user.role !== 'admin' && workspace.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const files = db.prepare('SELECT path, content FROM workspace_files WHERE workspace_id = ? ORDER BY path').all(workspace.id);

  // Auto-stop & Auto-submit verification
  if (workspace.status === 'running' && workspace.auto_stop_at && new Date(workspace.auto_stop_at) < new Date()) {
    workspace.status = 'submitted';
    db.prepare("UPDATE workspaces SET status = 'submitted' WHERE id = ?").run(workspace.id);

    // Auto-grade if not submitted yet
    const existingSub = db.prepare('SELECT id FROM submissions WHERE workspace_id = ?').get(workspace.id);
    if (!existingSub) {
      const runResult = await runInTempWorkspace(files, 'npm test', workspace.hidden_test_file);
      const passedCount = runResult.testResults.filter(r => r.passed).length;
      const totalCount = runResult.testResults.length || 8;

      db.prepare(`
        INSERT INTO submissions (workspace_id, user_id, assignment_id, score, total, test_results_json)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(workspace.id, workspace.user_id, workspace.assignment_id, passedCount, totalCount, JSON.stringify(runResult.testResults));

      logAudit(workspace.user_id, req.user.name, 'WORKSPACE_AUTOSTOPPED', `Workspace ${workspace.id} auto-stopped on time expiry.`);
      logAudit(workspace.user_id, req.user.name, 'ASSIGNMENT_SUBMITTED', `Auto-submitted assignment "${workspace.assignment_title}" (${passedCount}/${totalCount})`);
    }
  }

  delete workspace.hidden_test_file; // Never send to client

  const submission = db.prepare('SELECT score, total, test_results_json, submitted_at FROM submissions WHERE workspace_id = ?').get(workspace.id);
  if (submission && submission.test_results_json) {
    try { submission.testResults = JSON.parse(submission.test_results_json); } catch {}
  }

  res.json({ workspace, files, submission });
});

// 10. Stop Workspace
app.post('/api/workspaces/:id/stop', requireAuth, (req, res) => {
  const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(req.params.id);
  if (!ws) return res.status(404).json({ error: 'Workspace not found' });
  if (req.user.role !== 'admin' && ws.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  if (ws.status !== 'submitted') {
    db.prepare("UPDATE workspaces SET status = 'stopped' WHERE id = ?").run(ws.id);
    logAudit(req.user.id, req.user.name, 'WORKSPACE_STOPPED', `Stopped workspace ${ws.id}`);
  }
  res.json({ success: true, status: 'stopped' });
});

// 11. Start / Resume Workspace
app.post('/api/workspaces/:id/start', requireAuth, (req, res) => {
  const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(req.params.id);
  if (!ws) return res.status(404).json({ error: 'Workspace not found' });
  if (req.user.role !== 'admin' && ws.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  if (ws.status !== 'submitted') {
    db.prepare("UPDATE workspaces SET status = 'running', last_active_at = CURRENT_TIMESTAMP WHERE id = ?").run(ws.id);
    logAudit(req.user.id, req.user.name, 'WORKSPACE_STARTED', `Started workspace ${ws.id}`);
  }
  res.json({ success: true, status: 'running' });
});

// 12. Reset / Delete Workspace
app.delete('/api/workspaces/:id', requireAuth, (req, res) => {
  const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(req.params.id);
  if (!ws) return res.status(404).json({ error: 'Workspace not found' });
  if (req.user.role !== 'admin' && ws.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  db.prepare('DELETE FROM workspace_files WHERE workspace_id = ?').run(ws.id);
  db.prepare('DELETE FROM workspaces WHERE id = ?').run(ws.id);
  res.json({ success: true });
});

// 13. Save / Upsert File in Workspace
app.post('/api/workspaces/:id/files', requireAuth, (req, res) => {
  const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(req.params.id);
  if (!ws) return res.status(404).json({ error: 'Workspace not found' });
  if (req.user.role !== 'admin' && ws.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  if (ws.status === 'submitted') {
    return res.status(400).json({ error: 'Workspace is submitted and locked.' });
  }

  const { path, content, files } = req.body;
  const upsertStmt = db.prepare(`
    INSERT INTO workspace_files (workspace_id, path, content)
    VALUES (?, ?, ?)
    ON CONFLICT(workspace_id, path) DO UPDATE SET content = excluded.content
  `);

  if (Array.isArray(files)) {
    for (const f of files) {
      if (f.path) upsertStmt.run(ws.id, f.path.trim(), f.content || '');
    }
  } else if (path) {
    upsertStmt.run(ws.id, path.trim(), content || '');
  }

  db.prepare('UPDATE workspaces SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?').run(ws.id);
  logAudit(req.user.id, req.user.name, 'FILE_SAVED', `Saved file "${path || 'batch'}" in workspace ${ws.id}`);
  res.json({ success: true });
});

// 14. Delete File in Workspace
app.delete('/api/workspaces/:id/files', requireAuth, (req, res) => {
  const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(req.params.id);
  if (!ws) return res.status(404).json({ error: 'Workspace not found' });
  if (req.user.role !== 'admin' && ws.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { path } = req.body;
  if (!path) return res.status(400).json({ error: 'Path required' });

  db.prepare('DELETE FROM workspace_files WHERE workspace_id = ? AND path = ?').run(ws.id, path.trim());
  res.json({ success: true });
});

// 15. Rename File in Workspace
app.post('/api/workspaces/:id/files/rename', requireAuth, (req, res) => {
  const ws = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(req.params.id);
  if (!ws) return res.status(404).json({ error: 'Workspace not found' });
  if (req.user.role !== 'admin' && ws.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) return res.status(400).json({ error: 'Both oldPath and newPath required' });

  db.prepare('UPDATE workspace_files SET path = ? WHERE workspace_id = ? AND path = ?').run(newPath.trim(), ws.id, oldPath.trim());
  res.json({ success: true });
});

// 16. Terminal Command Execution (Whitelisted)
app.post('/api/workspaces/:id/exec', requireAuth, async (req, res) => {
  const ws = db.prepare(`
    SELECT w.*, a.hidden_test_file
    FROM workspaces w
    JOIN assignments a ON a.id = w.assignment_id
    WHERE w.id = ?
  `).get(req.params.id);

  if (!ws) return res.status(404).json({ error: 'Workspace not found' });
  if (req.user.role !== 'admin' && ws.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { command } = req.body;
  if (!command || !command.trim()) {
    return res.json({ output: '', exitCode: 0, testResults: [] });
  }

  const files = db.prepare('SELECT path, content FROM workspace_files WHERE workspace_id = ?').all(ws.id);
  const result = await runInTempWorkspace(files, command, ws.hidden_test_file);

  logAudit(req.user.id, req.user.name, 'COMMAND_RUN', `Ran in workspace ${ws.id}: "${command.slice(0, 50)}"`);
  res.json(result);
});

// 17. Submit Assignment & Final Grade
app.post('/api/workspaces/:id/submit', requireAuth, async (req, res) => {
  const ws = db.prepare(`
    SELECT w.*, a.title as assignment_title, a.hidden_test_file
    FROM workspaces w
    JOIN assignments a ON a.id = w.assignment_id
    WHERE w.id = ?
  `).get(req.params.id);

  if (!ws) return res.status(404).json({ error: 'Workspace not found' });
  if (req.user.role !== 'admin' && ws.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  // If already submitted, return existing submission
  const existing = db.prepare('SELECT * FROM submissions WHERE workspace_id = ?').get(ws.id);
  if (existing) {
    try { existing.testResults = JSON.parse(existing.test_results_json); } catch {}
    return res.json({ submission: existing });
  }

  const files = db.prepare('SELECT path, content FROM workspace_files WHERE workspace_id = ?').all(ws.id);
  const runResult = await runInTempWorkspace(files, 'npm test', ws.hidden_test_file);

  const passedCount = runResult.testResults.filter(r => r.passed).length;
  const totalCount = runResult.testResults.length || 8;

  const subRes = db.prepare(`
    INSERT INTO submissions (workspace_id, user_id, assignment_id, score, total, test_results_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(ws.id, ws.user_id, ws.assignment_id, passedCount, totalCount, JSON.stringify(runResult.testResults));

  db.prepare("UPDATE workspaces SET status = 'submitted' WHERE id = ?").run(ws.id);

  logAudit(req.user.id, req.user.name, 'ASSIGNMENT_SUBMITTED', `Submitted assignment "${ws.assignment_title}" with score ${passedCount}/${totalCount}`);

  res.json({
    submission: {
      id: subRes.lastInsertRowid,
      score: passedCount,
      total: totalCount,
      percentage: Math.round((passedCount / totalCount) * 100),
      testResults: runResult.testResults,
      submitted_at: new Date().toISOString(),
    },
  });
});

// Start listening on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[QuizForge Backend] Running on http://127.0.0.1:${PORT}`);
});
