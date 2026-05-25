-- Ensure countries catalog table exists for location sync.
-- Safe to run multiple times on Supabase/Postgres.

BEGIN;

CREATE TABLE IF NOT EXISTS public.countries (
    id BIGSERIAL PRIMARY KEY,
    country_code VARCHAR(2) NOT NULL,
    country_name VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_countries_country_code UNIQUE (country_code)
);

ALTER TABLE public.countries
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);

ALTER TABLE public.countries
    ADD COLUMN IF NOT EXISTS country_name VARCHAR(120);

CREATE UNIQUE INDEX IF NOT EXISTS ix_countries_country_code
    ON public.countries(country_code);

COMMIT;
