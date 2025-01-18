export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
    public: {
        Tables: {
            emails: {
                Row: {
                    id: number
                    userID: number
                    from: string
                    to: string[]
                    subject: string
                    plainText: string
                    htmlContent: string
                    receivedDate: Date
                    rawPayload: unknown
                }
                Insert: {
                    id?: never
                    userID: number
                    from: string
                    to: string[]
                    subject?: string
                    plainText?: string
                    htmlContent?: string
                    receivedDate?: Date
                    rawPayload?: unknown
                }
                Update: {
                    id?: never
                    userID: number
                    from: string
                    to: string[]
                    subject?: string | null
                    plainText?: string | null
                    htmlContent?: string | null
                    receivedDate?: Date
                    rawPayload?: unknown | null
                }
            }
        }
    }
}