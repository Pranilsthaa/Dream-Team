export type PublicUser = {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  username: string;
};

export type RefreshInput = {
  refreshToken: string;
};

export type AuthTokensResponse = {
  user: PublicUser;
  tokenType: 'Bearer';
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresAt: string;
};

export type ProfileResponse = {
  user: PublicUser;
};
