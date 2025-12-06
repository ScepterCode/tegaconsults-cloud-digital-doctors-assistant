CREATE TABLE "appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"doctor_id" varchar NOT NULL,
	"appointment_date" timestamp NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"payment_amount" integer DEFAULT 1000,
	"payment_status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_admin_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"head_staff_id" varchar,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lab_results" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar NOT NULL,
	"test_name" text NOT NULL,
	"test_category" text NOT NULL,
	"file_data" text,
	"file_name" text NOT NULL,
	"file_type" text,
	"test_values" text,
	"normal_range" text,
	"status" text NOT NULL,
	"automated_analysis" text,
	"doctor_notes" text,
	"recommendations" text,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now(),
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" varchar NOT NULL,
	"patient_id" varchar NOT NULL,
	"appointment_id" varchar,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"requested_by" varchar NOT NULL,
	"status" text DEFAULT 'unread' NOT NULL,
	"action_data" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mrn" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"age" integer NOT NULL,
	"gender" text NOT NULL,
	"phone_number" text NOT NULL,
	"email" text,
	"address" text,
	"nin" text NOT NULL,
	"blood_group" text NOT NULL,
	"genotype" text NOT NULL,
	"allergies" text,
	"symptoms" text,
	"bp_systolic" integer,
	"bp_diastolic" integer,
	"temperature" text,
	"heart_rate" integer,
	"weight" text,
	"facial_recognition_data" text,
	"fingerprint_data" text,
	"registered_by" text NOT NULL,
	"last_updated_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "patients_mrn_unique" UNIQUE("mrn")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" varchar NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"trial_start_date" timestamp DEFAULT now(),
	"trial_end_date" timestamp,
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"billing_cycle" text,
	"status" text DEFAULT 'trial' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_admin_user_id_unique" UNIQUE("admin_user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text NOT NULL,
	"full_name" text NOT NULL,
	"hospital_admin_id" varchar,
	"department_id" varchar,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
