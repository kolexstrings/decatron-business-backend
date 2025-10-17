import otpGenerator from 'otp-generator';
import { Otp } from '../models/Otp';

export const OtpUtils = {
  async generateOtp(email: string, purpose: 'registration' | 'invite'): Promise<string> {
    const otp = otpGenerator.generate(6, {
      digits: true,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.findOneAndUpdate({ email, purpose }, { otp, expiresAt }, { upsert: true, new: true });

    return otp;
  },

  async verifyOtp(
    email: string,
    otp: string,
    purpose: 'registration' | 'invite'
  ): Promise<boolean> {
    const record = await Otp.findOne({ email, otp, purpose });

    if (!record || record.expiresAt < new Date()) {
      return false;
    }

    await Otp.deleteOne({ _id: record._id });
    return true;
  },
};
