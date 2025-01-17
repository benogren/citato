import { model, models, Schema } from 'mongoose';

export type userDoc = {
    _id: string;
    workosId: string;
    emailSlug: string;
}

const userSchema = new Schema({
    workosId: {
        type: String,
        required: true
    },
    emailSlug: {
        type: String
    }
}, {
    timestamps: true
});

export const UserModel = models.userDoc || model('userDoc', userSchema);