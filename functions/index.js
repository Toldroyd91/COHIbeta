const functions = require('firebase-functions');
const axios = require('axios');

exports.rewriteNotes = functions.https.onCall(async (data, context) => {
    // Security block
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Engine access denied. You must be logged in.');
    }

    const rawText = data.rawText;
    
    // Pull the key securely from the hidden environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    try {
        // The Google Gemini API Request
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            contents: [{
                parts: [{
                    text: `You are a professional architectural copywriter. Rewrite these raw, messy construction survey notes into a polite, enthusiastic, and highly professional summary to be presented to a homeowner on a facts sheet. Keep it concise, remove internal jargon, and focus on the exciting aspects of their new living space.\n\nRaw Notes: ${rawText}`
                }]
            }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        // Extract the text from Google's response
        const polishedText = response.data.candidates[0].content.parts[0].text;
        
        return { polishedText: polishedText };
        
    } catch (error) {
        console.error("AI API Error:", error.response ? error.response.data : error.message);
        throw new functions.https.HttpsError('internal', 'The AI engine failed to process the request.');
    }
});
