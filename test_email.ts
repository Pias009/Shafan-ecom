import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('API KEY:', process.env.RESEND_API_KEY);

async function run() {
  const { sendEmail } = await import('./src/lib/email');
  const { emailService } = await import('./src/lib/email/service');

  console.log('Testing email service directly...');
  try {
    const res = await emailService.sendEmail({
      to: { email: 'pvs178380@gmail.com' },
      subject: 'Test Email from Script',
      html: '<p>This is a test</p>'
    });
    console.log('emailService result:', res);
  } catch (e) {
    console.error('emailService error:', e);
  }

  console.log('\nTesting sendEmail wrapper...');
  try {
    const res2 = await sendEmail({
      to: 'pvs178380@gmail.com',
      subject: 'Test Email 2 from Script',
      html: '<p>This is test 2</p>'
    });
    console.log('sendEmail result:', res2);
  } catch (e) {
    console.error('sendEmail error:', e);
  }
}

run();
