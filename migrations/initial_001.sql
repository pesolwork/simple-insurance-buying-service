CREATE TYPE "user_role" AS ENUM (
  'super_admin',
  'admin',
  'user',
  'customer'
);

CREATE TYPE "policy_status" AS ENUM (
  'pending_payment',
  'active',
  'expired'
);

CREATE TYPE "transaction_status" AS ENUM (
  'pending',
  'paid',
  'failed'
);

CREATE TABLE "running_numbers" (
  "id" serial PRIMARY KEY,
  "type" varchar NOT NULL,
  "prefix" varchar NOT NULL,
  "current_number" int NOT NULL DEFAULT 0,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "otps" (
  "id" serial PRIMARY KEY,
  "email" varchar NOT NULL,
  "otp" varchar NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
  "email" varchar UNIQUE NOT NULL,
  "password" varchar NOT NULL,
  "role" user_role NOT NULL DEFAULT 'user',
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "plans" (
  "id" serial PRIMARY KEY,
  "name" varchar NOT NULL,
  "coverage_details" text,
  "min_age" int NOT NULL,
  "max_age" int NOT NULL,
  "sum_insured" numeric(10,2) NOT NULL,
  "premium_amount" numeric(10,2) NOT NULL,
  "is_active" bool DEFAULT true,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "customers" (
  "id" serial PRIMARY KEY,
  "user_id" int,
  "first_name" varchar NOT NULL,
  "last_name" varchar NOT NULL,
  "id_card_number" varchar(13) NOT NULL,
  "date_of_birth" date NOT NULL,
  "phone" varchar NOT NULL,
  "email" varchar UNIQUE NOT NULL,
  "address" text NOT NULL,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "policies" (
  "id" serial PRIMARY KEY,
  "plan_id" int,
  "customer_id" int,
  "no" varchar UNIQUE,
  "name" varchar NOT NULL,
  "coverage_details" text,
  "sum_insured" numeric(10,2) NOT NULL,
  "premium_amount" numeric(10,2) NOT NULL,
  "start_date" date,
  "end_date" date,
  "status" policy_status DEFAULT 'pending_payment',
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "health_infos" (
  "id" serial PRIMARY KEY,
  "policy_id" int,
  "smoking" bool NOT NULL,
  "drinking" bool NOT NULL,
  "detail" text,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "beneficiaries" (
  "id" serial PRIMARY KEY,
  "policy_id" int,
  "first_name" varchar NOT NULL,
  "last_name" varchar NOT NULL,
  "relationship" varchar NOT NULL,
  "percentage" int NOT NULL,
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE TABLE "transactions" (
  "id" serial PRIMARY KEY,
  "policy_id" int,
  "transaction_ref" varchar,
  "expected_amount" numeric(10,2) NOT NULL,
  "paid_amount" numeric(10,2),
  "payment_method" varchar,
  "paid_at" timestamptz,
  "status" transaction_status DEFAULT 'pending',
  "created_at" timestamptz DEFAULT (now()),
  "updated_at" timestamptz DEFAULT (now())
);

CREATE UNIQUE INDEX ON "running_numbers" ("type", "prefix");

COMMENT ON COLUMN "running_numbers"."type" IS 'ประเภทเลข เช่น policy';

COMMENT ON COLUMN "running_numbers"."prefix" IS 'prefix เช่น POL-2025';

ALTER TABLE "customers" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "policies" ADD FOREIGN KEY ("plan_id") REFERENCES "plans" ("id");

ALTER TABLE "policies" ADD FOREIGN KEY ("customer_id") REFERENCES "customers" ("id");

ALTER TABLE "health_infos" ADD FOREIGN KEY ("policy_id") REFERENCES "policies" ("id");

ALTER TABLE "beneficiaries" ADD FOREIGN KEY ("policy_id") REFERENCES "policies" ("id");

ALTER TABLE "transactions" ADD FOREIGN KEY ("policy_id") REFERENCES "policies" ("id");
