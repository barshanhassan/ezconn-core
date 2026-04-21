import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.APP_KEY || 'defaultSecretForDevelopmentOnly',
  signOptions: {
    expiresIn: process.env.SESSION_LIFETIME
      ? `${process.env.SESSION_LIFETIME}m`
      : '120m',
  },
}));
