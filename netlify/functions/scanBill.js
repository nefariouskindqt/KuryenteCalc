const { GoogleGenAI } = require('@google/genai');

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

    // Use the new streamlined Interactions API provided by @google/genai
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = "Analyze this Philippine electricity bill. Extract the following values: 1) Present meter reading 2) Previous meter reading 3) Total actual consumption (kWh) 4) Total Amount Due (PHP). Return ONLY a valid JSON object using these exact lowercase keys: \"present\", \"previous\", \"kwh\", \"amount\". Strip all commas from numbers. If missing, return null.";

    // We use the modern gemini-3.6-flash model and pass the image data as input
    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",
      input: [
        { text: prompt },
        { 
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        }
      ]
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: interaction.output_text })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
