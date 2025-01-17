import mongoose from 'mongoose';
import EmailModel from "@/app/models/emails";
import z from 'zod';

const MailSchema = z.object({
    envelope: z.object({
        from: z.string(),
        to: z.union([z.string(), z.array(z.string())]),
    }),
    headers: z.object({
        subject: z.string(),
        date: z.string(),
    }),
    plain: z.string(),
    html: z.string(),
});

//type Mail = z.infer<typeof MailSchema>;

export async function saveEmail(mail: unknown): Promise<void> {
    const parsedMail = MailSchema.parse(mail);

    const emailData = {
        from: parsedMail.envelope.from,
        to: Array.isArray(parsedMail.envelope.to) ? parsedMail.envelope.to : [parsedMail.envelope.to],
        subject: parsedMail.headers.subject,
        plainText: parsedMail.plain,
        htmlContent: parsedMail.html,
        receivedDate: new Date(parsedMail.headers.date),
        rawPayload: parsedMail,
    };
  
    try {
    await mongoose.connect(process.env.MONGODB_URI as string);
      console.log(parsedMail);
      const email = new EmailModel(emailData);
      await email.save();
      console.log('Email saved successfully');
    } catch (error) {
      console.log(parsedMail);
      console.error('Error saving email:', error, parsedMail);
      throw error;
    }
  }