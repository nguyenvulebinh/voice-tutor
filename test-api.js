async function testCorrectionsAPI() {
  try {
    const response = await fetch('https://voice-tutor-api.vercel.app/api/corrections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: "Ich bin mude und hungrig",
        accessCode: "yeulila",
        assistantId: "asst_j3C1nTEVWalxXCuIXEECu4lK"
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testCorrectionsAPI(); 