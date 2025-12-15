export const appEnv = () => ({
  port: Number(process.env.PORT) || 3001,
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/althea',
  mongoUri:
    process.env.MONGODB_URI ||
    'mongodb://mongo:mongo@localhost:27017/althea?authSource=admin',
});
