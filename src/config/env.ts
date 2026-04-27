import dotenv from 'dotenv';

dotenv.config();

type NodeEnvironment = 'development' | 'test' | 'production';

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: (process.env.NODE_ENV as NodeEnvironment) || 'development',
};
