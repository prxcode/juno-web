const API_BASE = process.env.REACT_APP_API_BASE || 'https://juno-web-yw3y.onrender.com';

async function run() {
  setBusy(true);
  setOutput('');
  setError('');
  try {
    const response = await fetch(`${API_BASE}/runJava`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, inputs: toLines(inputs) }),
    });

    const data = await response.json();

    if (data.output) setOutput(data.output);
    if (data.error) setError(data.error);
  } catch (e) {
    setError(`Error: ${e.message}`);
  } finally {
    setBusy(false);
  }
}
