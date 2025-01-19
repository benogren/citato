import { IncomingMail } from 'cloudmailin';
import { saveEmail } from '../../actions/saveEmail';

export async function POST(req: Request) {
  try {
    // Parse the JSON payload from the request body
    const rawBody = await req.text();
    const mail = JSON.parse(rawBody) as IncomingMail;

    // Log the required fields
    // console.log('To:', mail.envelope.to);
    // console.log('From:', mail.envelope.from);
    // console.log('Subject:', mail.headers.subject);
    // console.log('Plain Body:', mail.plain);
    //console.log('set?:', mail.headers.message_id);

    // Example of saving the email data
    await saveEmail(mail);

    return Response.json(true);
  } catch (error) {
    console.error('Error processing the email payload:', error);
    return Response.json(false, { status: 500 });
  }
}