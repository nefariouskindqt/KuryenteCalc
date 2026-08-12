const https = require('https');

exports.handler = async function(event) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }

    try {
        const { prompt, history, systemPrompt } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey.trim() === '') {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing GEMINI_API_KEY in Netlify environment variables." }) };
        }

        let combinedInput = systemPrompt + "\n\nConversation History:\n";
        (history || []).forEach(msg => {
             combinedInput += `${msg.role === 'user' ? 'User' : 'Kurti'}: ${msg.text}\n`;
        });
        combinedInput += `\nUser: ${prompt}`;

        const payload = {
            contents: [{ role: "user", parts: [{ text: combinedInput }] }]
        };

        const result = await new Promise((resolve, reject) => {
            const req = https.request({
                hostname: 'generativelanguage.googleapis.com',
                port: 443,
                path: `/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, data: data }));
            });
            
            req.on('error', e => reject(e));
            req.write(JSON.stringify(payload));
            req.end();
        });

        const googleData = JSON.parse(result.data);

        if (result.statusCode !== 200) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: googleData.error?.message || "Google API blocked the request." })
            };
        }

        const answer = googleData.candidates[0].content.parts[0].text;

        return { 
            statusCode: 200, 
            body: JSON.stringify({ answer: answer }) 
        };

    } catch (error) {
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: `Backend crash: ${error.message}` }) 
        };
    }
};
