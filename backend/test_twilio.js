import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function test() {
    try {
        const msg = await client.messages.create({
            body: 'Test SMS from Twilio script',
            from: process.env.TWILIO_PHONE_NUMBER,
            to: '+919876543210' // Mock number just to see if it reaches the Twilio API rejection phase
        });
        console.log('Success!', msg.sid);
    } catch (e) {
        console.error('Twilio Error:', e.message);
    }
}

test();
