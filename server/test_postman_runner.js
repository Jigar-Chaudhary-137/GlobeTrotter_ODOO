const fs = require('fs');
const path = require('path');
const http = require('http');

const collectionPath = path.join(__dirname, 'GlobeTrotter.postman_collection.json');
const collectionData = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));

// Collection variables state
const variables = {};
collectionData.variable.forEach((v) => {
  variables[v.key] = v.value;
});

// Helper to resolve {{var}} in strings
const resolveVariables = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    return variables[key] !== undefined ? variables[key] : `{{${key}}}`;
  });
};

const executePostmanRequest = (item) => {
  return new Promise((resolve) => {
    const reqDef = item.request;
    const urlStr = resolveVariables(reqDef.url.raw);
    const url = new URL(urlStr);

    const headers = {};
    if (reqDef.header) {
      reqDef.header.forEach((h) => {
        headers[h.key] = resolveVariables(h.value);
      });
    }

    let postData = null;
    if (reqDef.body && reqDef.body.raw) {
      // Replace dynamic postman variables like {{$randomInt}}
      let rawBody = reqDef.body.raw.replace(/\{\{\$randomInt\}\}/g, Math.floor(Math.random() * 10000));
      postData = resolveVariables(rawBody);
    }

    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method: reqDef.method,
      headers: headers,
    };

    const req = http.request(options, (res) => {
      let bodyData = '';
      res.on('data', (chunk) => (bodyData += chunk));
      res.on('end', () => {
        let jsonResponse = null;
        try {
          jsonResponse = JSON.parse(bodyData);
        } catch (_) {}

        // Mock Postman 'pm' object for running tests
        const testResults = [];
        const mockPm = {
          response: {
            code: res.statusCode,
            to: {
              have: {
                status: (expectedCode) => {
                  const pass = res.statusCode === expectedCode;
                  testResults.push({ name: `Status code is ${expectedCode}`, pass });
                },
              },
            },
            json: () => jsonResponse,
          },
          test: (testName, testFn) => {
            try {
              testFn();
              testResults.push({ name: testName, pass: true });
            } catch (err) {
              testResults.push({ name: testName, pass: false, error: err.message });
            }
          },
          expect: (val) => ({
            to: {
              eql: (exp) => {
                if (val !== exp) throw new Error(`Expected ${val} to equal ${exp}`);
              },
              be: {
                oneOf: (arr) => {
                  if (!arr.includes(val)) throw new Error(`Expected ${val} to be one of ${arr}`);
                },
                an: (type) => {
                  if (type === 'array' && !Array.isArray(val)) throw new Error(`Expected array`);
                },
              },
              have: {
                property: (prop) => {
                  if (!val || !(prop in val)) throw new Error(`Expected property ${prop}`);
                },
              },
              include: (sub) => {
                if (typeof val === 'string' && !val.includes(sub)) throw new Error(`Expected string to include ${sub}`);
              },
            },
          }),
          collectionVariables: {
            set: (key, val) => {
              variables[key] = val;
            },
            get: (key) => variables[key],
          },
        };

        // Run postman test scripts
        if (item.event) {
          const testEvent = item.event.find((e) => e.listen === 'test');
          if (testEvent && testEvent.script && testEvent.script.exec) {
            const scriptStr = testEvent.script.exec.join('\n');
            try {
              const runScript = new Function('pm', scriptStr);
              runScript(mockPm);
            } catch (e) {
              testResults.push({ name: 'Script Execution', pass: false, error: e.message });
            }
          }
        }

        resolve({
          name: item.name,
          status: res.statusCode,
          results: testResults,
        });
      });
    });

    req.on('error', (err) => {
      resolve({ name: item.name, status: 'ERROR', error: err.message, results: [] });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

async function runCollection() {
  console.log('==================================================');
  console.log('Executing Postman Collection Test Suite...');
  console.log('==================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  for (const folder of collectionData.item) {
    console.log(`📁 Folder: ${folder.name}`);
    for (const item of folder.item) {
      const res = await executePostmanRequest(item);
      const allPassed = res.results.every((r) => r.pass) && res.status !== 'ERROR';

      if (allPassed) {
        passedCount++;
        console.log(`  [PASS] (${res.status}) ${item.name}`);
      } else {
        failedCount++;
        console.log(`  [FAIL] (${res.status}) ${item.name}`);
        res.results.forEach((r) => {
          if (!r.pass) console.log(`         -> ${r.name}: ${r.error || 'Failed'}`);
        });
      }
    }
    console.log('');
  }

  console.log('==================================================');
  console.log(`POSTMAN RUN SUMMARY: Total: ${passedCount + failedCount} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('==================================================');
}

runCollection().catch(console.error);
