// Email service without SendGrid dependency
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  // Just log the email for now
  console.log('Email would have been sent:', {
    to,
    subject,
    timestamp: new Date().toISOString()
  });
  return { success: true };
};