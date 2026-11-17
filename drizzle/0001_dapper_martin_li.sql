ALTER TABLE "registrations" ADD COLUMN "gender" text NOT NULL DEFAULT 'Not given';--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "age_group" text NOT NULL DEFAULT 'Not given';--> statement-breakpoint
ALTER TABLE "registrations" ALTER COLUMN "gender" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "registrations" ALTER COLUMN "age_group" DROP DEFAULT;
