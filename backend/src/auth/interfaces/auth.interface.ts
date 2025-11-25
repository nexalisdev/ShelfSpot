export interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  admin?: boolean;
  notificationToken?: string;
  iat?: number;
  exp?: number;
}

export interface UserPayload {
  id: string;
  email?: string;
  name?: string;
  admin?: boolean;
  notificationToken?: string;
}

export interface AuthResult {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserPayload;
}
