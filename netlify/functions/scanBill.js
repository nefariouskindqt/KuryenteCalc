const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const imageBase64 = body.imageBase64;
    
    // Your hardcoded key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!imageBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image data received' }) };
    }

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-pro-vision which has guaranteed support for image parsing on the v1 API
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

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
