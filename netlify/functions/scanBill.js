const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { imageBase64 } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing API Key' }) };
    }

    // Strip the "data:image/jpeg;base64," prefix from the string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = "Analyze this utility bill. Please extract the following: 1. Present Reading 2. Previous Reading 3. Total kWh Consumed 4. Total Amount Due. Ensure the math matches up. Respond concisely.";

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg" 
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: response.text() })
    };
  } catch (error) {
    console.error('Error scanning bill:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};