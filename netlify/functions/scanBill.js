const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const imageBase64 = body.imageBase64;
    
    // Using process.env is correct and safe for Netlify
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server error: Missing API Key' }) };
    }

    if (!imageBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image data received' }) };
    }

    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    // Use v1beta and the updated gemini-3-flash model
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: 'gemini-3-flash' }, 
      { apiVersion: 'v1beta' }
    );

    const prompt = "You are an expert utility bill parser. Analyze this Philippine electricity bill. Extract the following values exactly as they appear:\n1) Present meter reading\n2) Previous meter reading\n3) Total actual consumption (kWh)\n4) Total Amount Due (PHP).\n\nReturn ONLY a valid JSON object using these exact lowercase keys: \"present\", \"previous\", \"kwh\", \"amount\". Important: Strip out all commas from the numbers. If a value is missing, return null.";

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
      body: JSON.stringify({ error: error.message || 'Unknown Server Error' })
    };
  }
};
