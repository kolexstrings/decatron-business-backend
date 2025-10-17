import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const EmailUtils = {
  async sendOtp(email: string, otp: string, purpose: 'registration' | 'invite'): Promise<void> {
    const subject = purpose === 'registration' ? 'Verify Your Email' : 'Invitation to Join';
    const text = `Your OTP for ${purpose} is: ${otp}. It expires in 10 minutes.`;
    const html = `<p>Your OTP for ${purpose} is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
      html,
    });
  },

  async sendInvite(email: string, inviteLink: string, organizationName: string): Promise<void> {
    const subject = `Invitation to Join ${organizationName}`;
    const text = `You have been invited to join ${organizationName}. Click the link to register: ${inviteLink}`;
    const html = `<p>You have been invited to join <strong>${organizationName}</strong>. Click the link to register: <a href="${inviteLink}">${inviteLink}</a></p>`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text,
      html,
    });
  },
};
