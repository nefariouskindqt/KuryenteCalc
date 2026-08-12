exports.handler = async function(event) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const { prompt, history, systemPrompt } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "Missing API Key" }) };
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

        let combinedInput = systemPrompt + "\n\nConversation History:\n";
        (history || []).forEach(msg => {
             combinedInput += `${msg.role === 'user' ? 'User' : 'Kurti'}: ${msg.text}\n`;
        });
        combinedInput += `\nUser: ${prompt}`;

        const payload = {
            contents: [{ role: "user", parts: [{ text: combinedInput }] }]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.error?.message || "Google API Error" })
            };
        }

        const answer = data.candidates[0].content.parts[0].text;

        return { 
            statusCode: 200, 
            body: JSON.stringify({ answer: answer }) 
        };

    } catch (error) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: String(error) }) 
        };
    }
