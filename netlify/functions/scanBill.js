exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const imageBase64 = body.imageBase64;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing API Key in Netlify environment variables' }) };
    }
    if (!imageBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image data received' }) };
    }

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    // Using native fetch - ZERO dependencies needed!
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          { text: "Analyze this Philippine electricity bill. Extract the following values: 1) Present meter reading 2) Previous meter reading 3) Total actual consumption (kWh) 4) Total Amount Due (PHP). Return ONLY a valid JSON object using these exact lowercase keys: \"present\", \"previous\", \"kwh\", \"amount\". Strip all commas from numbers. If missing, return null." },
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]
      }]
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // If Google rejects it, send the exact reason to your screen
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.error?.message || "Google API Error" })
      };
    }

    const textResult = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textResult })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(error) })
    };
  }
