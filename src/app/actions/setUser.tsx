'use server';
import mongoose from 'mongoose';
import { UserModel } from '../models/users';

interface UserDocs {
    workosId: string;
    emailSlug: string;
}

export async function setUser({ userDocs }: { userDocs: UserDocs }): Promise<void> {
    const userData = {
        workosId: userDocs.workosId,
        emailSlug: userDocs.emailSlug,
    };
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
    
        // Check if a user with this workosId already exists
        const existingUser = await UserModel.findOne({ workosId: userData.workosId });
        
        if (!existingUser) {
            //No user exists
            let i = 1;
            let newSlug = userData.emailSlug;
            while (await UserModel.findOne({ emailSlug: newSlug })) {
                newSlug = `${userData.emailSlug}${i}`;
                i++;
            }
            userData.emailSlug = newSlug;
            
            // Create a new user with the resolved slug
            await UserModel.create(userData);
            console.log('Created new user with slug:', newSlug);
        }
    }  catch (error) {
        console.error('Error in setUser function:', error);
        throw error;
    } 
}