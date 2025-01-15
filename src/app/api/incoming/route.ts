import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingMail } from 'cloudmailin';
import { saveEmail } from '../../actions/saveEmail';

export async function POST(req: Request, res: NextApiResponse) {

  const mail = await req.json() as IncomingMail;

  try {
    // console.log(JSON.stringify(mail));
    await saveEmail(mail);
    return Response.json(true);
  } catch (error) {
      // console.log(JSON.stringify(mail));
      console.error(error);
      return Response.json(false);
  }
}