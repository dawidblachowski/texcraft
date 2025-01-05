export interface UserAfterRegisterDto {
    id: string;
    email: string | null;
    role: string;
}

export interface UserTokensDto {
    accessToken: string;
}