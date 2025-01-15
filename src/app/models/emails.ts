import { model, models, Schema } from "mongoose";

export type Email = {
    _id: string;
    from: string;
    to: string;
    subject: string;
    plainText: string;
    html: string;
}
const EmailSchema = new Schema({
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    plainText: {
        type: String
    },
    html: {
        type: String
    }
}, {
    timestamps: true
});

export const EmailModel = models?.Email || model('Email', EmailSchema);