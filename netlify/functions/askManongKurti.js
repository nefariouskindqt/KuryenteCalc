const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { prompt, history, systemPrompt } = JSON.parse(event.body);

    // Fetch API Key from Netlify Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured on Netlify server environment.' })
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt
    });

    // Start chat session with formatted history
    const chat = model.startChat({
      history: history.map(item => ({
        role: item.role === 'bot' ? 'model' : 'user',
        parts: [{ text: item.text }]
      }))
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answer: text })
    };
  } catch (error) {
    console.error('Error in askManongKurti function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal Server Error' })
    };
  }
};