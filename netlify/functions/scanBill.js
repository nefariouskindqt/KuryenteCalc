const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const imageBase64 = body.imageBase64;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing GEMINI_API_KEY in Netlify environment variables.' }) };
    }
    if (!imageBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image data received.' }) };
    }

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: "Analyze this Philippine electricity bill. Extract the following values: 1) Present meter reading 2) Previous meter reading 3) Total actual consumption (kWh) 4) Total Amount Due (PHP). Return ONLY a valid JSON object using these exact lowercase keys: \"present\", \"previous\", \"kwh\", \"amount\". Strip all commas from numbers. If missing, return null." },
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]
      }]
    };

    // Native Node.js request - completely immune to SDK version conflicts!
    const result = await new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, data: data }));
        });
        
        req.on('error', e => reject(e));
        req.write(JSON.stringify(payload));
        req.end();
    });

    const googleData = JSON.parse(result.data);

    if (result.statusCode !== 200) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: googleData.error?.message || "Google API blocked the request." })
        };
    }

    const textResult = googleData.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textResult })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Backend crash: ${error.message}` })
    };
  }
};
