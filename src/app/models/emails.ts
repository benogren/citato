import mongoose, { Schema, Document, Model } from 'mongoose';

interface emailDoc extends Document {
    from: string;
    to: string[];
    subject: string;
    plainText: string;
    htmlContent: string;
    receivedDate: Date;
    rawPayload: unknown;
}
const emailSchema = new Schema<emailDoc>({
    from: { type: String, required: true },
    to: { type: [String], required: true },
    subject: { type: String },
    plainText: { type: String },
    htmlContent: { type: String },
    receivedDate: { type: Date },
    rawPayload: { type: Schema.Types.Mixed }, // Store the full payload
}, {
    timestamps: true
});

const EmailModel: Model<emailDoc> =
    mongoose.models.Email || mongoose.model<emailDoc>('Email', emailSchema);

export default EmailModel;