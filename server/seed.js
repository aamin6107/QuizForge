const bcrypt = require('bcryptjs');
const { db, logAudit } = require('./db');

function seedDatabase() {
  console.log('Seeding QuizForge SQLite database...');

  // 1. Seed Users
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount === 0) {
    const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
    const userPasswordHash = bcrypt.hashSync('User@123', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);

    const adminResult = insertUser.run(
      'Admin User',
      'admin@quizforge.com',
      adminPasswordHash,
      'admin'
    );

    const studentResult = insertUser.run(
      'Aamin',
      'user@quizforge.com',
      userPasswordHash,
      'user'
    );

    console.log('Seeded users: admin@quizforge.com and user@quizforge.com');
    logAudit(adminResult.lastInsertRowid, 'Admin User', 'USER_CREATED', 'Seeded initial Administrator account');
    logAudit(studentResult.lastInsertRowid, 'Aamin', 'USER_CREATED', 'Seeded initial Student account');
  }

  // 2. Seed Quizzes & Questions
  const quizCount = db.prepare('SELECT COUNT(*) AS count FROM quizzes').get().count;
  if (quizCount === 0) {
    const insertQuiz = db.prepare(`
      INSERT INTO quizzes (title, description, duration_minutes, max_attempts)
      VALUES (?, ?, ?, ?)
    `);

    const insertQuestion = db.prepare(`
      INSERT INTO questions (quiz_id, type, text, options_json, correct_index, position)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // --- Quiz 1: TypeScript & Modern JavaScript Fundamentals ---
    const quiz1Result = insertQuiz.run(
      'TypeScript & Modern JavaScript Fundamentals',
      'Assess your core understanding of types, async patterns, event loops, and write an algorithmic solution in the coding workspace.',
      25,
      3
    );
    const quiz1Id = quiz1Result.lastInsertRowid;

    // 4 MCQs + 1 Coding question
    insertQuestion.run(
      quiz1Id,
      'mcq',
      'What is the primary difference between TypeScript "interface" and "type" aliases when defining object shapes?',
      JSON.stringify([
        'Interfaces can be merged through declaration merging, while type aliases cannot.',
        'Type aliases support inheritance with "extends", while interfaces do not.',
        'Interfaces only exist at runtime and produce JavaScript code.',
        'Type aliases cannot be used for union types.'
      ]),
      0,
      1
    );

    insertQuestion.run(
      quiz1Id,
      'mcq',
      'In the JavaScript Event Loop, which microtask queue has the highest priority over standard timer tasks (like setTimeout)?',
      JSON.stringify([
        'requestAnimationFrame callbacks',
        'Promise.then() / process.nextTick() microtasks',
        'setInterval() execution loop',
        'DOM Mutation Observer macroscopic events'
      ]),
      1,
      2
    );

    insertQuestion.run(
      quiz1Id,
      'mcq',
      'What will "typeof null" return in standard ECMAScript engines?',
      JSON.stringify([
        '"null"',
        '"undefined"',
        '"object"',
        '"boolean"'
      ]),
      2,
      3
    );

    insertQuestion.run(
      quiz1Id,
      'mcq',
      'Which utility type in TypeScript constructs a type with all properties of T set to optional?',
      JSON.stringify([
        'Required<T>',
        'Partial<T>',
        'Readonly<T>',
        'Record<string, T>'
      ]),
      1,
      4
    );

    // Coding Question for Quiz 1
    insertQuestion.run(
      quiz1Id,
      'coding',
      'Write a function "twoSum(nums: number[], target: number): number[]" that returns the indices of the two numbers such that they add up to target. You may assume each input has exactly one solution.',
      JSON.stringify({
        language: 'javascript',
        starterCode: `function twoSum(nums, target) {
  // Your code here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
        testCases: [
          { input: '[2, 7, 11, 15], 9', expected: '[0, 1]' },
          { input: '[3, 2, 4], 6', expected: '[1, 2]' },
          { input: '[3, 3], 6', expected: '[0, 1]' }
        ]
      }),
      null,
      5
    );

    // --- Quiz 2: Full-Stack Web Development & APIs ---
    const quiz2Result = insertQuiz.run(
      'Full-Stack Architecture & API Design',
      'Test your architecture expertise on REST principles, database transactions, HTTP protocols, and algorithmic string processing.',
      30,
      2
    );
    const quiz2Id = quiz2Result.lastInsertRowid;

    insertQuestion.run(
      quiz2Id,
      'mcq',
      'Which HTTP status code is most appropriate when a resource has been successfully created as a result of a POST request?',
      JSON.stringify([
        '200 OK',
        '201 Created',
        '204 No Content',
        '302 Found'
      ]),
      1,
      1
    );

    insertQuestion.run(
      quiz2Id,
      'mcq',
      'What does the "I" in ACID database properties stand for, guaranteeing concurrent transactions do not interfere with one another?',
      JSON.stringify([
        'Integrity',
        'Idempotence',
        'Isolation',
        'Immutability'
      ]),
      2,
      2
    );

    insertQuestion.run(
      quiz2Id,
      'mcq',
      'What header is required by CORS preflight requests when sending custom authorization tokens like Bearer tokens?',
      JSON.stringify([
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Methods',
        'Cache-Control: private'
      ]),
      1,
      3
    );

    insertQuestion.run(
      quiz2Id,
      'mcq',
      'In a SQLite or relational database, which type of index is most effective for speeding up range queries on numeric columns?',
      JSON.stringify([
        'B-Tree index',
        'Hash index',
        'Full-text search index (FTS)',
        'Bitwise bitmap index'
      ]),
      0,
      4
    );

    // Coding Question for Quiz 2
    insertQuestion.run(
      quiz2Id,
      'coding',
      'Write a function "isPalindrome(str: string): boolean" that determines if a string is a palindrome, considering only alphanumeric characters and ignoring cases.',
      JSON.stringify({
        language: 'javascript',
        starterCode: `function isPalindrome(str) {
  // Your code here
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}`,
        testCases: [
          { input: '"A man, a plan, a canal: Panama"', expected: 'true' },
          { input: '"race a car"', expected: 'false' },
          { input: '" "', expected: 'true' }
        ]
      }),
      null,
      5
    );

    console.log('Seeded 2 quizzes with 5 questions each (including coding challenges)!');
    logAudit(1, 'Admin User', 'QUIZ_CREATED', 'Seeded TypeScript & Modern JavaScript Fundamentals');
    logAudit(1, 'Admin User', 'QUIZ_CREATED', 'Seeded Full-Stack Architecture & API Design');

    // Also add a sample attempt so the admin dashboard has realistic initial activity
    const userRow = db.prepare('SELECT id FROM users WHERE email = ?').get('user@quizforge.com');
    if (userRow) {
      const attemptRes = db.prepare(`
        INSERT INTO attempts (user_id, quiz_id, score, total, started_at, submitted_at, status)
        VALUES (?, ?, 4, 5, datetime('now', '-2 hours'), datetime('now', '-1 hours'), 'completed')
      `).run(userRow.id, quiz1Id);

      logAudit(userRow.id, 'Alex Mercer', 'ATTEMPT_SUBMITTED', `Completed quiz: TypeScript & Modern JavaScript Fundamentals with score 4/5`);
    }
  }

  console.log('Database seeding complete.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
