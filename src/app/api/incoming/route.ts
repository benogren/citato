import { IncomingMail } from 'cloudmailin';
import { saveEmail } from '../../actions/saveEmail';

export async function POST(req: Request) {

  const mail = await req.json() as IncomingMail;

  try {
    await saveEmail(JSON.parse(JSON.stringify(mail)));
    return Response.json(true);
  } catch (error) {
      console.error(error);
      return Response.json(false);
  }
}