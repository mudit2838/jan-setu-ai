import twilio from 'twilio';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Twilio Client only if real credentials are provided
const isTwilioConfigured = process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('mock');
const client = isTwilioConfigured ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

export const sendNotification = async (mobile, email, message) => {
    try {
        console.log(`\n================================`);
        console.log(`🔔 [NOTIFICATION DISPATCHED]`);
        if (mobile) console.log(`📱 TO MOBILE: ${mobile}`);
        if (email) console.log(`✉️ TO EMAIL: ${email}`);
        console.log(`💬 MESSAGE: ${message}`);
        console.log(`================================\n`);

        // Send Real SMS
        if (mobile && isTwilioConfigured) {
            // Ensure number has country code for Twilio
            const formattedMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;

            await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: formattedMobile
            });
            console.log(`✅ Real SMS Sent to ${formattedMobile} via Twilio!`);
        } else if (mobile) {
            console.log(`⚠️ TWILIO SKIPPED: Missing real credentials in .env. Mock SMS generated.`);
        }

        return true;
    } catch (error) {
        console.error('Failed to send notification:', error);
        return false;
    }
};
