import mongoose, { Schema, Document, Model } from 'mongoose';

interface emailDoc extends Document {
    from: string;
    to: string[];
    recipients: string[];
    helo_domain: string;
    subject: string;
    plainText: string;
    reply_plain: string;
    message_id: string;
    received: string;
    htmlContent: string;
    receivedDate: Date;
    rawPayload: unknown;
    spf_result: string;
    spf_domain: string;
}
const emailSchema = new Schema<emailDoc>({
    from: { type: String, required: true },
    to: { type: [String], required: true },
    recipients: { type: [String] },
    helo_domain: { type: String },
    subject: { type: String },
    plainText: { type: String },
    reply_plain: { type: String },
    message_id: { type: String },
    received: { type: String },
    htmlContent: { type: String },
    receivedDate: { type: Date },
    rawPayload: { type: Schema.Types.Mixed }, // Store the full payload
    spf_result: { type: String }, 
    spf_domain: { type: String }, 
}, {
    timestamps: true
});

const EmailModel: Model<emailDoc> =
    mongoose.models.Email || mongoose.model<emailDoc>('Email', emailSchema);

export default EmailModel;