const { Request } = require('undici');

async function test() {
  const req = new Request('http://localhost/api/agent/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad json',
  });

  try {
    const body = await req.json();
    console.log('Parsed body:', body);
  } catch (e) {
    console.log('Caught error:', e.message);
  }
}

test();
