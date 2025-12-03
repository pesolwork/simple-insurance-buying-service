export default () => ({
  port: parseInt(process.env.PORT, 10) || 5001,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    schema: process.env.DATABASE_SCHEMA,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  sms: {
    host: process.env.SMS_HOST,
    apiKey: process.env.SMS_API_KEY,
    sender: process.env.SMS_SENDER,
  },
  payment: {
    publicKey: process.env.PAYMENT_PUBLIC_KEY,
    secretKey: process.env.PAYMENT_SECRET_KEY,
  },
  mailer: {
    host: process.env.MAILER_HOST,
    user: process.env.MAILER_USER,
    password: process.env.MAILER_PASSWORD,
  },
  queue: {
    host: process.env.QUEUE_HOST,
    port: parseInt(process.env.QUEUE_PORT, 10) || 6379,
  }
});
