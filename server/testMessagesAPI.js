const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testMessagesAPI() {
  try {
    console.log('Testing Messages API...');

    // First, login as service provider
    console.log('Logging in as service provider...');
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const loginResponse = await makeRequest(loginOptions, {
      email: 'murenzi@lagalleria.com',
      password: 'murenzi123!'
    });

    if (loginResponse.statusCode !== 200) {
      console.error('Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    console.log('Login successful, token received');

    // Now fetch messages
    console.log('Fetching messages...');
    const messagesOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/messages',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const messagesResponse = await makeRequest(messagesOptions);

    if (messagesResponse.statusCode !== 200) {
      console.error('Messages fetch failed:', messagesResponse.data);
      return;
    }

    console.log('Messages response:', messagesResponse.data);
    console.log(`Found ${messagesResponse.data.messages.length} messages`);

  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testMessagesAPI();
