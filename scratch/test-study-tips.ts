async function testStudyTips(topic: string) {
  console.log(`\nTesting study tips for topic: "${topic}"`);
  try {
    const response = await fetch('http://localhost:3000/api/study-tips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function main() {
  await testStudyTips('');
  await testStudyTips('UPSC civil services exam preparation');
}

main();
