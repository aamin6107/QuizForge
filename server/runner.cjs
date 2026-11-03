/**
 * runner.cjs — isolated child process code runner
 * Receives JSON on stdin: { language, code, testCases, functionName }
 * Outputs JSON on stdout: { results, consoleLogs, error }
 * Killed by parent after 5 second timeout
 */
'use strict';
const vm = require('vm');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  let payload;
  try { payload = JSON.parse(input); } catch (e) {
    process.stdout.write(JSON.stringify({ error: 'Invalid JSON payload', results: [], consoleLogs: [] }));
    process.exit(0);
  }

  const { language, code, testCases = [], functionName } = payload;
  const consoleLogs = [];
  const results = [];

  if (!code || !code.trim()) {
    process.stdout.write(JSON.stringify({
      error: 'Code cannot be empty.',
      results: [],
      consoleLogs: [],
    }));
    process.exit(0);
  }

  // For Python we return an informative not-supported message
  if (language === 'python') {
    process.stdout.write(JSON.stringify({
      error: 'Python execution is not yet available in the server sandbox. Use JavaScript.',
      results: [],
      consoleLogs: [],
    }));
    process.exit(0);
  }

  // Build a sandboxed console that captures logs
  const sandboxConsole = {
    log: (...args) => { consoleLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); },
    warn: (...args) => { consoleLogs.push('[warn] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); },
    error: (...args) => { consoleLogs.push('[error] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); },
    info: (...args) => { consoleLogs.push('[info] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); },
  };

  // Detect the function name from code if not provided
  let fnName = functionName;
  if (!fnName) {
    const match = code.match(/function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/) ||
                  code.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\(.*\)\s*=>)/);
    fnName = match ? match[1] : null;
  }

  if (testCases.length === 0) {
    // Just run the code without test cases
    try {
      const sandbox = { console: sandboxConsole };
      vm.createContext(sandbox);
      vm.runInContext(code, sandbox, { timeout: 4000 });
      results.push({ input: '', expected: '', actual: 'Executed successfully', passed: true, runtime: 0, error: null });
    } catch (err) {
      results.push({ input: '', expected: '', actual: '', passed: false, runtime: 0, error: err.message });
    }
  } else {
    for (const tc of testCases) {
      const start = Date.now();
      let passed = false;
      let actualOutput = '';
      let error = null;

      try {
        if (!fnName) {
          throw new Error('Could not detect function name. Make sure you define a named function.');
        }

        const sandbox = { console: sandboxConsole };
        vm.createContext(sandbox);

        // First pass: define the function in sandbox
        vm.runInContext(code, sandbox, { timeout: 4000 });

        // Second pass: call it with the test input
        const callScript = `(function(){
          try {
            var __result = ${fnName}(${tc.input});
            return JSON.stringify(__result);
          } catch(e) {
            throw e;
          }
        })()`;
        const result = vm.runInContext(callScript, sandbox, { timeout: 4000 });
        actualOutput = result !== undefined ? String(result) : 'undefined';

        // Compare, normalizing whitespace
        const clean = (s) => String(s).replace(/\s+/g, '').toLowerCase();
        passed = clean(actualOutput) === clean(tc.expected);
      } catch (err) {
        error = err.message;
        actualOutput = `Error: ${err.message}`;
        passed = false;
      }

      const runtime = Date.now() - start;
      results.push({
        input: tc.input,
        expected: tc.expected,
        actual: actualOutput,
        passed,
        runtime,
        error,
      });
    }
  }

  // Truncate console logs
  const truncated = consoleLogs.slice(0, 50).map(l => l.slice(0, 500));

  process.stdout.write(JSON.stringify({ results, consoleLogs: truncated, error: null }));
  process.exit(0);
});
