import mongoose from 'mongoose';
import { EmailModel } from "@/app/models/emails";

export async function saveEmail(email: JSON) {
    await mongoose.connect(process.env.MONGO_URI as string);
    await EmailModel.create(email);
}