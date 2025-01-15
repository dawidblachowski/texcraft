import request from 'supertest';
import server from '../index';

function generateRandomEmail() {
    return `test${Math.floor(Math.random() * 10000)}@example.com`;
}

describe('AuthController', () => {
    describe('register', () => {
        it('should register a new user', async () => {
            const email = generateRandomEmail();
            const response = await request(await server)
                .post('/api/auth/register')
                .send({ email, password: '!Password123' });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('email', email);
        });

        it('should return 400 if email or password is missing', async () => {
            const response = await request(await server)
                .post('/api/auth/register')
                .send({ email: generateRandomEmail() });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Email and password are required');
        });
    });

    describe('localLogin', () => {
        it('should login a user with valid credentials', async () => {
            const email = generateRandomEmail();
            // Mock user registration first
            await request(await server)
                .post('/api/auth/register')
                .send({ email, password: '!Password123' });

            const response = await request(await server)
                .post('/api/auth/login')
                .send({ email, password: '!Password123' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(await server)
                .post('/api/auth/login')
                .send({ email: generateRandomEmail(), password: 'wrongpassword' });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('message', 'Invalid email or password');
        });
    });

    describe('refreshTokens', () => {
        it('should refresh tokens with a valid refresh token', async () => {
            const email = generateRandomEmail();
            // Mock user registration and login first
            await request(await server)
                .post('/api/auth/register')
                .send({ email, password: '!Password123' });

            const loginResponse = await request(await server)
                .post('/api/auth/login')
                .send({ email, password: '!Password123' });

            const refreshToken = loginResponse.headers['set-cookie'][0].split(';')[0].split('=')[1];

            const response = await request(await server)
                .post('/api/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`]);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should return 400 if refresh token is missing', async () => {
            const response = await request(await server)
                .post('/api/auth/refresh');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Refresh token is required');
        });
    });

});
