import axios from 'axios';

export default async function handler(req, res) {
  // CORS wrappers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Handle body parsing if needed (Vercel parses implicitly, but local server might not)
  let body = req.body;

  // If running in a raw Node http server (like server.js), we need to parse the body manually 
  // if it hasn't been parsed yet. However, server.js currently passes (req, res).
  // To keep it simple for both Vercel and local server.js:
  // We'll rely on the fact that server.js might need to parse body before calling this 
  // OR we implement a small body parser here if req.body is undefined.

  if (!body && req.on) {
    try {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(JSON.parse(data)));
        req.on('error', reject);
      });
    } catch (e) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
  }

  const { code, inputs } = body || {};

  if (!code || typeof code !== 'string') {
    res.statusCode = 400; // Use property assignment for raw Node response compatibility
    const response = JSON.stringify({ error: 'Missing code' });
    res.end ? res.end(response) : res.send(response);
    return;
  }

  try {
    const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
      language: 'java',
      version: '15.0.2',
      files: [
        {
          name: 'Main.java',
          content: code,
        },
      ],
      stdin: Array.isArray(inputs) ? inputs.join('\n') : inputs || '',
    });

    const { run, compile } = response.data;

    let output = '';
    let error = '';

    // If compilation fails
    if (compile && compile.code !== 0) {
      error = compile.stderr || compile.output;
    } else {
      // Runtime output/error
      output = run.stdout;
      error = run.stderr;
    }

    // Create response payload
    const payload = JSON.stringify({ output, error });

    // Send response (compatible with both Express/Vercel-like objects and raw Node objects)
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end ? res.end(payload) : res.send(payload);

  } catch (error) {
    console.error('Piston API Error:', error.message);
    const payload = JSON.stringify({ error: 'Failed to execute code via Piston API' });
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end ? res.end(payload) : res.send(payload);
  }
}

// Named export for local server.js compatibility if it imports { runJavaHandler }
export { handler as runJavaHandler };
