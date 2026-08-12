const { GoogleGenAI } = require('@google/genai');

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { prompt, history, systemPrompt } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error("Missing API Key in Netlify Settings!");
            return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error." }) };
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });

        let combinedInput = systemPrompt + "\n\nConversation History:\n";
        history.forEach(msg => {
             combinedInput += `${msg.role === 'user' ? 'User' : 'Kurti'}: ${msg.text}\n`;
        });
        combinedInput += `\nUser: ${prompt}`;

        // Use the current stable 2026 model
        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: combinedInput
        });
        
        return { 
            statusCode: 200, 
            body: JSON.stringify({ answer: response.text }) 
        };

    } catch (error) {
        console.error("AI Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message || "Failed to contact Manong Kurti." }) };
    }
