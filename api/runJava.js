async function run() {
  setBusy(true);
  setOutput('');
  setError('');

  try {
    const API_BASE = 'https://juno-web-yw3y.onrender.com';
    const response = await fetch(`${API_BASE}/runJava`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, inputs: toLines(inputs) }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();  // <-- Must await here inside try

    if (data.output) setOutput(data.output);
    if (data.error) setError(data.error);

  } catch (e) {
    setError(`Error: ${e.message}`);
  } finally {
    setBusy(false);
  }
}
