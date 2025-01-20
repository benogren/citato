import z from 'zod';
import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import EmailModel from '../models/emails';

const MailSchema = z.object({
    envelope: z.object({
        from: z.string(),
        to: z.union([z.string(), z.array(z.string())]),
        recipients: z.union([z.string(), z.array(z.string())]).nullable(),
        helo_domain: z.string().nullable(),
        spf: z.object({
            result: z.string().nullable(),
            domain: z.string().nullable(),
        }),
    }),
    headers: z.object({
        subject: z.string(),
        date: z.string(),
        message_id: z.string().nullable(),
        received: z.union([z.string(), z.array(z.string())]).nullable(),
        from: z.string().nullable(),
        to: z.string().nullable(),
    }),
    plain: z.string().nullable(),
    reply_plain: z.string().nullable(),
    html: z.string().nullable(),
});

export async function saveEmail(mail: unknown): Promise<void> {
    const parsedMail = MailSchema.parse(mail);

    const emailData = {
        from: parsedMail.envelope.from,
        headerFrom: parsedMail.headers.from,
        to: Array.isArray(parsedMail.envelope.to) ? parsedMail.envelope.to : [parsedMail.envelope.to],
        headerTo: parsedMail.headers.to,
        recipients: Array.isArray(parsedMail.envelope.recipients) ? parsedMail.envelope.recipients : [parsedMail.envelope.recipients],
        helo_domain: parsedMail.envelope.helo_domain,
        subject: parsedMail.headers.subject,
        plainText: parsedMail.plain,
        htmlContent: parsedMail.html ?? "",
        receivedDate: new Date(parsedMail.headers.date),
        reply_plain: parsedMail.reply_plain,
        message_id: parsedMail.headers.message_id,
        received: Array.isArray(parsedMail.headers.received) 
            ? parsedMail.headers.received.join(', ') 
            : parsedMail.headers.received,
        rawPayload: parsedMail,
        spf_result: parsedMail.envelope.spf.result,
        spf_domain: parsedMail.envelope.spf.domain,
    };
  
    try {
        // Save to Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL as string, 
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
        );

        const { data, error } = await supabase
            .from('emails')
            .insert(emailData);

        console.log('Email saved to supabase', data);

        await mongoose.connect(process.env.MONGODB_URI as string);
        const mongo_email = new EmailModel(emailData);
        await mongo_email.save();
        console.log('Email saved to mongo');

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error saving email:', error);
        throw error;
    }
}