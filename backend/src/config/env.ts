import dotenv from 'dotenv';
dotenv.config();

export const {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    PORT, 
    NODE_ENV,
    ACCESS_TOKEN_EXPIRES_IN, 
    REFRESH_TOKEN_EXPIRES_IN
} = process.env;