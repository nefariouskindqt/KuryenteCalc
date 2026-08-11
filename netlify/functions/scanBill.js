const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const imageBase64 = body.imageBase64;
    
    // Safely retrieve your environment variable
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing API Key in Netlify environment variables' }) };
    }

    if (!imageBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image data received' }) };
    }

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    // Explicitly target the v1beta API version which supports gemini-1.5-flash for images
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: 'gemini-2.5-flash' },
      { apiVersion: 'v1beta' }
    );

    const prompt = "Analyze this Philippine electricity bill. Extract the following values: 1) Present meter reading 2) Previous meter reading 3) Total actual consumption (kWh) 4) Total Amount Due (PHP). Return ONLY a valid JSON object using these exact lowercase keys: \"present\", \"previous\", \"kwh\", \"amount\". Strip all commas from numbers. If missing, return null.";

    const imageParts = [{
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      }
    }];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: response.text() })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
