async function testModel(modelName: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No GEMINI_API_KEY env variable set!");
    return;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  console.log(`\nTesting model: ${modelName}`);
  try {
    const payload = {
      contents: [
        { role: 'user', parts: [{ text: 'Hello, are you online? Respond in one word.' }] }
      ]
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (res.ok) {
      console.log(`Response:`, data?.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      console.error(`Error:`, data.error?.message || JSON.stringify(data));
    }
  } catch (err) {
    console.error(`Error:`, err);
  }
}

async function run() {
  await testModel('gemma-4-31b-it');
  await testModel('gemma-4-26b-a4b-it');
  await testModel('gemini-2.5-flash-lite');
  await testModel('gemini-2.0-flash-lite');
  await testModel('gemini-2.5-flash');
}

run();
