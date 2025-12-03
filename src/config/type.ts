export interface IDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema: string;
}

export interface IJwtConfig {
  secret: string;
  refreshSecret: string;
}

export interface ISmsConfig {
  host: string;
  apiKey: string;
  sender: string;
}

export interface IPaymentConfig {
  publicKey: string;
  secretKey: string;
}

export interface IMailerConfig {
  host: string;
  user: string;
  password: string;
}

export interface IConfig {
  port: number;
  database: IDatabaseConfig;
  jwt: IJwtConfig;
  sms: ISmsConfig;
  payment: IPaymentConfig;
  mailer: IMailerConfig;
}
