import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async send(to: string, subject: string, text: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      text,
    });
  }
}
