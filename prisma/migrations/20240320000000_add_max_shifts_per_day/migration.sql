-- Add maxShiftsPerDay column to Doctor table
ALTER TABLE "Doctor" ADD COLUMN "maxShiftsPerDay" INTEGER NOT NULL DEFAULT 2; 