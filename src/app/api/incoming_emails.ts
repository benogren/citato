import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingMail } from 'cloudmailin';
import { saveEmail } from '../actions/saveEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const mail: IncomingMail = req.body;

  try {
    await saveEmail(mail);

    res.status(201).json({ message: `Email from ${mail.envelope.from} saved successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}