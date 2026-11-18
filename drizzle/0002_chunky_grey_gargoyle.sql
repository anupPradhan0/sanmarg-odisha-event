CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'staff' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "attended_by" integer;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_attended_by_staff_id_fk" FOREIGN KEY ("attended_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;