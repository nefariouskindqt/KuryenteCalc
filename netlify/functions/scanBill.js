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

    // Strip the data URL prefix from the string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    // Force the model to output strict JSON
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    // The strict prompt requiring JSON output and number parsing
    const prompt = `You are an expert utility bill parser. Analyze this Philippine electricity bill. Extract the following values exactly as they appear: 
    1) Present meter reading
    2) Previous meter reading
    3) Total actual consumption (kWh)
    4) Total Amount Due (PHP). 
    
    Return ONLY a valid JSON object using these exact lowercase keys: "present", "previous", "kwh", "amount". 
    Important: Strip out all commas from the numbers (e.g., 47,843 should be 47843). If a value is missing, return null.`;

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
