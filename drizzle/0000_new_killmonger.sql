CREATE TABLE "registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"mobile" varchar(10) NOT NULL,
	"district" text NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attended_at" timestamp with time zone,
	CONSTRAINT "registrations_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "registrations_mobile_idx" ON "registrations" USING btree ("mobile");