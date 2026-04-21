
import 'dotenv/config';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'orders@mail.shanfaglobal.it';
const TEST_RECIPIENT = 'shanfaglobal.it@gmail.com';

console.log('Testing Resend API with Key:', RESEND_API_KEY ? 'Present' : 'Missing');

async function testResend() {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is missing in .env');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TEST_RECIPIENT,
        subject: 'Test Email from SHANFA STORE',
        html: '<p>Resend integration is working! 🚀</p>',
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', data.id);
    } else {
      console.error('❌ Failed to send email:');
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error during fetch:', error);
  }
}

testResend();
