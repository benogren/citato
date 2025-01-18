import z from 'zod';
import { createClient } from '@supabase/supabase-js'

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
    html: z.string().nullable(),
});

//type Mail = z.infer<typeof MailSchema>;

export async function saveEmail(mail: unknown): Promise<void> {
    const parsedMail = MailSchema.parse(mail);

    const emailData = {
        from: parsedMail.envelope.from,
        to: Array.isArray(parsedMail.envelope.to) ? parsedMail.envelope.to : [parsedMail.envelope.to],
        subject: parsedMail.headers.subject,
        plainText: parsedMail.plain,
        htmlContent: parsedMail.html ?? "",
        receivedDate: new Date(parsedMail.headers.date),
        rawPayload: parsedMail,
    };
  
    try {
      //Save to Supabase
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string, 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      );

      const {data, error } = await supabase
      .from('emails')
      .insert(emailData);
      console.log('Email saved successfully', data);
      if (error) {
        throw error;
      }
 
    } catch (error) {
      //console.log(parsedMail);
      console.error('Error saving email:', error);
      throw error;
    }
  }