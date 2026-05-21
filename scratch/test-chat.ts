async function testChat(message: string) {
  console.log(`\nTesting message: "${message}"`);
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        sessionId: 'test-session-' + Date.now(),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Error response: ${response.status} - ${text}`);
      return;
    }

    const data = await response.json();
    console.log('Chatbot Response:\n', data.response);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function main() {
  // Let's test both queries
  await testChat('What is the fee for the CCC course?');
  await testChat('Is study cabin no. 1 on the 3rd floor available?');
}

main();
