const bcrypt = require('bcryptjs');
const { db, logAudit } = require('./db.cjs');

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
  const insertQuiz = db.prepare(`
    INSERT INTO quizzes (title, description, duration_minutes, max_attempts)
    VALUES (?, ?, ?, ?)
  `);

  const insertQuestion = db.prepare(`
    INSERT INTO questions (quiz_id, type, text, options_json, correct_index, position)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const quizCount = db.prepare('SELECT COUNT(*) AS count FROM quizzes').get().count;
  if (quizCount === 0) {

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

      logAudit(userRow.id, 'Aamin', 'ATTEMPT_SUBMITTED', `Completed quiz: TypeScript & Modern JavaScript Fundamentals with score 4/5`);
    }
  }

  // --- Seed standalone coding demo questions (Quiz 3 & 4 style) ---
  // Only seed if we haven't already seeded more than 2 quizzes
  const quizCountNow = db.prepare('SELECT COUNT(*) AS count FROM quizzes').get().count;
  if (quizCountNow === 2) {
    // Quiz 3: Reverse Words
    const quiz3 = insertQuiz.run(
      'Coding Challenges: Strings & Loops',
      'Practice common algorithmic patterns — reverse words, FizzBuzz, and more. Includes hidden test cases graded automatically.',
      20, 5
    );
    const q3Id = quiz3.lastInsertRowid;

    insertQuestion.run(
      q3Id, 'coding',
      'Write a function reverseWords(str) that reverses the order of words in a string. Words are separated by single spaces.',
      JSON.stringify({
        language: 'javascript',
        functionName: 'reverseWords',
        starterCode: `function reverseWords(str) {\n  // Your code here\n  return str.split(' ').reverse().join(' ');\n}`,
        testCases: [
          { input: '"hello world"', expected: '"world hello"', hidden: false },
          { input: '"the sky is blue"', expected: '"blue is sky the"', hidden: false },
          { input: '"QuizForge built-in workspace"', expected: '"workspace built-in QuizForge"', hidden: true },
          { input: '"one"', expected: '"one"', hidden: true },
        ],
      }),
      null, 1
    );

    // FizzBuzz question
    insertQuestion.run(
      q3Id, 'coding',
      'Write a function fizzBuzz(n) that returns an array of strings from 1 to n. For multiples of 3 return "Fizz", multiples of 5 return "Buzz", both return "FizzBuzz", otherwise the number as a string.',
      JSON.stringify({
        language: 'javascript',
        functionName: 'fizzBuzz',
        starterCode: `function fizzBuzz(n) {\n  const result = [];\n  for (let i = 1; i <= n; i++) {\n    if (i % 15 === 0) result.push('FizzBuzz');\n    else if (i % 3 === 0) result.push('Fizz');\n    else if (i % 5 === 0) result.push('Buzz');\n    else result.push(String(i));\n  }\n  return result;\n}`,
        testCases: [
          { input: '5', expected: '["1","2","Fizz","4","Buzz"]', hidden: false },
          { input: '15', expected: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', hidden: false },
          { input: '1', expected: '["1"]', hidden: true },
        ],
      }),
      null, 2
    );

    // MCQ question in quiz 3
    insertQuestion.run(q3Id, 'mcq',
      'What is the time complexity of reversing a string of length n?',
      JSON.stringify(['O(1)', 'O(n)', 'O(n²)', 'O(log n)']),
      1, 3
    );

    logAudit(1, 'Admin User', 'QUIZ_CREATED', 'Seeded Coding Challenges: Strings & Loops');
  }

  // 3. Seed Demo Assignment: Student Grade Calculator
  const assignmentCount = db.prepare('SELECT COUNT(*) AS count FROM assignments').get().count;
  if (assignmentCount === 0) {
    const studentUser = db.prepare("SELECT id FROM users WHERE email = 'user@quizforge.com'").get();
    const assignedTarget = studentUser ? JSON.stringify([studentUser.id]) : 'all';

    const insertAssignment = db.prepare(`
      INSERT INTO assignments (title, description, difficulty, time_limit_minutes, hidden_test_file, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertAssFile = db.prepare(`
      INSERT INTO assignment_files (assignment_id, path, content)
      VALUES (?, ?, ?)
    `);

    const readmeContent = `# Student Grade Calculator

Welcome to the **Student Grade Calculator** assignment! In this project, you will implement core grading algorithms in \`utils.js\` and verify them using \`index.js\` and the test suite.

## Objectives

Open \`utils.js\` and implement the three exported functions:

### 1. \`calculateAverage(scores)\`
- Receives an array of numeric scores (e.g., \`[85, 90, 78]\`).
- Returns the numerical average rounded to 2 decimal places.
- **Edge case**: If \`scores\` is empty or undefined, return \`0\`.

### 2. \`getGrade(avg)\`
- Receives a numeric average score.
- Returns the letter grade string based on standard academic tiers:
  - **'A'**: \`avg >= 90\`
  - **'B'**: \`avg >= 80 && avg < 90\`
  - **'C'**: \`avg >= 70 && avg < 80\`
  - **'D'**: \`avg >= 60 && avg < 70\`
  - **'F'**: \`avg < 60\`

### 3. \`topStudents(students, n)\`
- Receives an array of student objects: \`{ name: string, scores: number[] }\`
- Calculates each student's average score using \`calculateAverage\`.
- Sorts students by average score in **descending order**.
- Returns the top \`n\` students as an array of objects: \`{ name: string, average: number, grade: string }\`
- **Edge cases**:
  - If \`n\` is greater than \`students.length\`, return all students sorted.
  - If two students have identical averages, preserve their relative order.

## Testing Your Code

In the terminal below, run:
\`\`\`bash
# Run sample script
node index.js

# Run test assertions
npm test
\`\`\`
When you are confident in your solution, click **Submit Assignment** in the top navigation bar!
`;

    const utilsContent = `/**
 * Student Grade Calculator Utility Functions
 */

/**
 * Calculates the mean average of an array of numeric scores.
 * @param {number[]} scores - Array of test scores
 * @returns {number} Average score rounded to 2 decimal places, or 0 if empty.
 */
function calculateAverage(scores) {
  if (!scores || !Array.isArray(scores) || scores.length === 0) {
    return 0;
  }
  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / scores.length;
  return Math.round(avg * 100) / 100;
}

/**
 * Converts a numerical average into a letter grade.
 * A >= 90, B >= 80, C >= 70, D >= 60, else F
 * @param {number} avg - Student's numerical average
 * @returns {string} Letter grade ('A' | 'B' | 'C' | 'D' | 'F')
 */
function getGrade(avg) {
  if (typeof avg !== 'number') return 'F';
  if (avg >= 90) return 'A';
  if (avg >= 80) return 'B';
  if (avg >= 70) return 'C';
  if (avg >= 60) return 'D';
  return 'F';
}

/**
 * Returns the top N students ranked by average score descending.
 * @param {Array<{name: string, scores: number[]}>} students
 * @param {number} n - Number of top students to return
 * @returns {Array<{name: string, average: number, grade: string}>}
 */
function topStudents(students, n) {
  if (!students || !Array.isArray(students)) return [];

  const processed = students.map((s) => {
    const avg = calculateAverage(s.scores);
    return {
      name: s.name,
      average: avg,
      grade: getGrade(avg),
    };
  });

  processed.sort((a, b) => b.average - a.average);
  return processed.slice(0, n);
}

module.exports = {
  calculateAverage,
  getGrade,
  topStudents,
};
`;

    const indexContent = `const { calculateAverage, getGrade, topStudents } = require('./utils');

console.log('=== QuizForge Grade Calculator Report ===\\n');

const sampleRoster = [
  { name: 'Alice Chen', scores: [92, 95, 88] },
  { name: 'Bob Martinez', scores: [78, 82, 85] },
  { name: 'Charlie Kim', scores: [65, 70, 72] },
  { name: 'Diana Prince', scores: [98, 100, 96] },
  { name: 'Evan Wright', scores: [55, 60, 58] },
];

sampleRoster.forEach((student) => {
  const avg = calculateAverage(student.scores);
  const grade = getGrade(avg);
  console.log(\`Student: \${student.name.padEnd(16)} | Avg: \${avg.toFixed(2).padStart(6)} | Grade: [\${grade}]\`);
});

console.log('\\n--- Top 3 Honor Roll ---');
const honorRoll = topStudents(sampleRoster, 3);
honorRoll.forEach((s, idx) => {
  console.log(\`\${idx + 1}. \${s.name} - \${s.average.toFixed(2)} (\${s.grade})\`);
});
`;

    const testsContent = `const { calculateAverage, getGrade, topStudents } = require('./utils');

const results = [];

function assert(name, condition, errorMsg = '') {
  if (condition) {
    console.log(\`  ✔ \${name}\`);
    results.push({ name, passed: true, error: null, hidden: true });
  } else {
    console.log(\`  ✖ \${name}: \${errorMsg}\`);
    results.push({ name, passed: false, error: errorMsg || 'Assertion failed', hidden: true });
  }
}

console.log('\\nRunning Hidden Test Suite for Student Grade Calculator:\\n');

try {
  // Test 1: calculateAverage with normal scores
  const avg1 = calculateAverage([80, 90, 100]);
  assert('calculateAverage() with standard score array', avg1 === 90, \`Expected 90, got \${avg1}\`);

  // Test 2: calculateAverage edge case: empty array
  const avg2 = calculateAverage([]);
  assert('calculateAverage() with empty array returns 0', avg2 === 0, \`Expected 0, got \${avg2}\`);

  // Test 3: calculateAverage edge case: single score
  const avg3 = calculateAverage([95.5]);
  assert('calculateAverage() with single score', avg3 === 95.5, \`Expected 95.5, got \${avg3}\`);

  // Test 4: getGrade tier boundaries (90, 80, 70, 60)
  const gA = getGrade(90);
  const gB = getGrade(89.9);
  const gC = getGrade(70);
  const gD = getGrade(60);
  assert(
    'getGrade() respects grade boundaries (90->A, 89.9->B, 70->C, 60->D)',
    gA === 'A' && gB === 'B' && gC === 'C' && gD === 'D',
    \`Got A:\${gA}, B:\${gB}, C:\${gC}, D:\${gD}\`
  );

  // Test 5: getGrade failing tier (< 60)
  const gF = getGrade(59.9);
  assert('getGrade() returns F for scores below 60', gF === 'F', \`Expected F, got \${gF}\`);

  // Test 6: topStudents sorting order
  const roster1 = [
    { name: 'Low', scores: [60] },
    { name: 'High', scores: [95] },
    { name: 'Mid', scores: [80] },
  ];
  const top1 = topStudents(roster1, 2);
  assert(
    'topStudents() returns top N sorted by average descending',
    top1.length === 2 && top1[0].name === 'High' && top1[1].name === 'Mid',
    \`Unexpected top order: \${JSON.stringify(top1)}\`
  );

  // Test 7: topStudents edge case: ties
  const rosterTies = [
    { name: 'First', scores: [85] },
    { name: 'Second', scores: [85] },
  ];
  const topTies = topStudents(rosterTies, 2);
  assert(
    'topStudents() handles identical score averages correctly',
    topTies.length === 2 && topTies[0].average === 85 && topTies[1].average === 85,
    \`Ties failed: \${JSON.stringify(topTies)}\`
  );

  // Test 8: topStudents edge case: n greater than students length
  const rosterSmall = [{ name: 'Solo', scores: [90] }];
  const topLargeN = topStudents(rosterSmall, 10);
  assert(
    'topStudents() safely handles n > total students',
    topLargeN.length === 1 && topLargeN[0].name === 'Solo',
    \`Expected 1 item, got \${topLargeN.length}\`
  );
} catch (e) {
  console.log('CRITICAL TEST ERROR:', e.message);
}

const passedCount = results.filter((r) => r.passed).length;
console.log(\`\\n========================================\`);
console.log(\`Results: \${passedCount}/\${results.length} assertions passed (\${Math.round((passedCount / results.length) * 100)}%)\`);
console.log(\`========================================\\n\`);

console.log('__TEST_RESULTS__' + JSON.stringify(results));
`;

    const assRes = insertAssignment.run(
      'Student Grade Calculator',
      'Implement an automated grade calculating and ranking engine. Handle edge cases like empty score sets, letter grade boundary thresholds, and tie resolution.',
      'Medium',
      30,
      testsContent,
      assignedTarget
    );
    const assId = assRes.lastInsertRowid;

    insertAssFile.run(assId, 'README.md', readmeContent);
    insertAssFile.run(assId, 'utils.js', utilsContent);
    insertAssFile.run(assId, 'index.js', indexContent);

    console.log('Seeded demo assignment: Student Grade Calculator with 3 starter files & hidden tests');
    logAudit(1, 'Admin User', 'ASSIGNMENT_CREATED', 'Seeded demo assignment: Student Grade Calculator');
  }

  console.log('Database seeding complete.');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
