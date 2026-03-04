# Breathe Map

**Live URL:** https://breathe-map-w.vercel.app/

Breathe Map is a city-scoped air quality analytics and simulation platform.  
It lets users create urban zones, estimate AQI using ML-backed inference (with production-safe fallback), analyze correlations/clusters, and run intervention simulations with full persistence in Supabase.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [System Levels](#system-levels)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [ML Inference Flow](#ml-inference-flow)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Supabase Setup & Migrations](#supabase-setup--migrations)
- [Production Deployment Notes](#production-deployment-notes)
- [Validation Checklist](#validation-checklist)
- [Troubleshooting](#troubleshooting)
- [Project Structure (Key Paths)](#project-structure-key-paths)
- [Roadmap Ideas](#roadmap-ideas)

---

# Project Overview

## Problem
Urban AQI insights are often fragmented and difficult to reason about at zone level. Most dashboards also lack intervention-based simulation.

## Solution
Breathe Map provides:

- Zone-level AQI estimation
- City-scoped zone management
- Correlation and clustering analysis
- Simulation of policy interventions (traffic reduction, green cover, rerouting)
- Persistent backend records for estimates and simulation outcomes

## Purpose
To combine frontend geospatial UX, backend reliability, Supabase data modeling, and ML inference in one production-ready system.

---

# Architecture

## High-level

- **Frontend:** Next.js App Router (React + TypeScript)
- **Backend:** Next.js API routes (server runtime)
- **Database:** Supabase Postgres with RLS + relational constraints
- **Inference:** Python/scikit-learn model invocation + fallback estimator
- **Hosting:** Vercel (web + API)

## Runtime flow

1. User interacts with UI (zones/dashboard/simulation)
2. Frontend calls Next.js API routes (`/api/*`)
3. API routes query/update Supabase
4. For AQI/simulation, backend performs model inference
5. Results are returned to UI and persisted to DB (`aqi_estimates`, `simulation_*`)

---

# System Levels

## Level 1: Presentation

- City context and routing
- Dashboard cards, map overlays, zone lists
- Simulation controls and result rendering

## Level 2: Application/API

- Route handlers for zones, AQI, analysis, simulation, cities
- Request validation and response shaping
- Error handling and fallback behavior

## Level 3: Domain/Data

- Zone lifecycle (create/read/update/delete)
- AQI estimate storage and retrieval
- Simulation scenario/result persistence
- City-scoped querying

## Level 4: ML/Computation

- Primary model path (`python3 + .pkl` inference)
- Fallback formula estimator when primary inference is unavailable
- Safe numeric guards for production stability

## Level 5: Infrastructure

- Supabase project, tables, constraints, policies
- Vercel environment configuration
- Migrations and deployment workflow

---

# Tech Stack

## Frontend

- Next.js (App Router)
- React
- TypeScript
- Leaflet (map rendering)
- Tailwind CSS (UI styling)

## Backend

- Next.js API Routes
- TypeScript server modules
- Supabase JS client

## ML

- Python 3
- scikit-learn
- pandas
- joblib

Serialized artifacts:

- `aqi_model.pkl`
- `cluster_model.pkl`
- `cluster_scaler.pkl`

## Database

- Supabase Postgres
- SQL migrations
- Row Level Security (RLS)

## Deployment

- Vercel (web + serverless API)
- Supabase cloud DB

---

# Core Features

- Multi-city workspace (`cities`)
- Zone CRUD with city scoping
- AQI estimation and category tagging
- Dashboard summary (avg/high/low/distribution)
- Correlation analysis from live estimates
- Clustering based on inferred AQI features
- Scenario simulation with persisted history
- Zone geometry storage for map overlays

---

# Database Schema

## `public.cities`

- `id` (text, PK)
- `name`
- `center_lat`
- `center_lng`
- `zoom`
- `created_at`

## `public.zones`

- `id` (uuid, PK)
- `name`
- `land_use_type` (enum)
- `traffic_density` (0–100)
- `population_density` (0–100)
- `road_length`
- `notes`
- `city_id` (FK -> `cities.id`)
- `geometry` (jsonb, optional)
- `created_by`
- `created_at`
- `updated_at`

## `public.aqi_estimates`

- `id` (bigserial, PK)
- `zone_id` (FK -> `zones.id`)
- `estimated_aqi`
- `category`
- `feature_contributions` (jsonb)
- `assumptions`
- `source` (model/fallback version)
- `created_by`
- `created_at`

## `public.simulation_scenarios`

- `id` (uuid, PK)
- `zone_id` (FK)
- `name`
- `vehicle_reduction_percentage`
- `green_cover_increase`
- `traffic_rerouting_factor`
- `created_by`
- `created_at`

## `public.simulation_results`

- `id` (uuid, PK)
- `scenario_id` (FK, unique)
- `zone_id` (FK)
- `before_aqi`
- `after_aqi`
- `delta`
- `delta_percentage`
- `explanation`
- `recommendation`
- `created_by`
- `created_at`

---

# API Reference

## Cities

### `GET /api/cities`

Returns available cities for selector and map centering.

---

## Zones

### `GET /api/zones?cityId=<city_id>`

Returns zones + estimate map for a city.

### `POST /api/zones`

Creates a zone.

**Body:**

```json
{
  "name": "QA Industrial Max",
  "land_use_type": "industrial",
  "traffic_density": 100,
  "population_density": 95,
  "road_length": 45,
  "notes": "qa-case-high",
  "cityId": "default-city",
  "geometry": null
}
```

### `GET /api/zones/:id?cityId=<city_id>`

Returns zone + latest estimate context.

### `PATCH /api/zones/:id`

Updates a zone.

### `DELETE /api/zones/:id`

Deletes a zone.

---

## AQI

### `POST /api/aqi/estimate`

Creates/stores AQI estimate for a zone.

**Body:**

```json
{
  "zone_id": "<zone_uuid>",
  "cityId": "default-city"
}
```

---

## Dashboard

### `GET /api/dashboard/summary?cityId=<city_id>`

Returns:

- zones
- estimates
- summary metrics (avg/high/low/distribution)

---

## Analysis

### `GET /api/analysis/correlations?cityId=<city_id>`

Returns factor correlations against estimated AQI.

### `GET /api/analysis/clusters?cityId=<city_id>`

Returns inferred clusters and zone lookup map.

---

## Simulation

### `POST /api/simulation/run`

Runs simulation and persists scenario + result.

**Body:**

```json
{
  "zone_id": "<zone_uuid>",
  "cityId": "default-city",
  "scenario_name": "Simulation for QA Industrial Max",
  "vehicle_reduction_percentage": 35,
  "green_cover_increase": 20,
  "traffic_rerouting_factor": 0.2
}
```

**Response example:**

```json
{
  "scenario_id": "<uuid>",
  "zone_id": "<uuid>",
  "before_aqi": 155,
  "after_aqi": 98,
  "delta": 57,
  "delta_percentage": 36.8,
  "explanation": "...",
  "recommendation": "...",
  "timestamp": "..."
}
```

---

# ML Inference Flow

## Primary path

- API calls `predictZoneAQI(...)`
- Invokes Python inference script
- Loads `.pkl` models
- Returns AQI/category/cluster/contributions

## Fallback path

If Python/model invocation fails (common in some serverless production contexts):

- Formula-based estimator computes realistic non-zero AQI
- Source is marked `fallback_formula_v1`
- UI remains stable

## Why both paths exist

- Local dev can use direct Python inference reliably
- Production serverless environments may restrict Python process behavior
- Fallback guarantees continuity and prevents broken user journeys

---

# Environment Variables

Create `.env.local` in `web/`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it on client-side.

---

# Local Development Setup

```bash
cd web
npm install
npm run dev
```

Open:

```
http://localhost:3000
```

Optional ML validation:

```bash
python3 lib/ml/infer.py
```

---

# Supabase Setup & Migrations

Run SQL migrations in order (via Supabase SQL Editor):

```
20260217_init_breathe_map.sql
20260301_add_city_scope.sql
20260302_cities_and_geometry.sql
```

After migration, verify:

- `cities`
- `zones`
- `aqi_estimates`
- `simulation_scenarios`
- `simulation_results`

exist.

Also confirm:

- `zones.city_id` exists
- `zones.geometry` exists
- RLS/policies are present

---

# Production Deployment Notes

- Host app on Vercel
- Add same env vars in Vercel project settings
- Ensure Supabase project is active and reachable
- If primary ML inference is unavailable in production, fallback estimator handles requests safely
- Monitor API logs for simulation/estimate errors and response details

---

# Validation Checklist

## Zone creation

- Create high/mid/low pollution zones
- Confirm rows in `zones`
- Confirm estimates in `aqi_estimates`

## Dashboard

- Metrics reflect city-scoped zones
- Map colors match AQI values
- Zone list and badges align with latest estimates

## Analysis

- Correlations endpoint returns non-empty data when sample size > 1
- Cluster endpoint returns grouped zones

## Simulation

- Run multiple scenarios
- Check inserts:

```
simulation_scenarios +1 per run
simulation_results +1 per run
```

- UI shows before/after/delta without client crashes

---

# Troubleshooting

## 500 on `/api/zones?cityId=...`

- Check Supabase connectivity/env vars
- Validate city exists in `cities`
- Inspect malformed numeric zone values

## AQI shows 0 unexpectedly

- Primary inference may have failed and older fallback path returned 0
- Ensure latest code with realistic fallback estimator is deployed
- Check `aqi_estimates.source`

## Simulation page crashes after run

Usually malformed payload handling in frontend/backend.

Ensure latest defensive checks are deployed for:

- API response validation
- finite-number sanitization

## Migration re-run error (`type ... already exists`)

Indicates migration already applied.

Run only pending migrations or make scripts idempotent.

---

# Project Structure (Key Paths)

```
web/app/*                     – Next.js pages and API routes
web/app/api/*                 – backend route handlers
web/context/CityContext.tsx  – city state management
web/lib/db/*                  – repository and adapter layer
web/lib/ml/*                  – model artifacts, inference, fallback
web/supabase/migrations/*     – SQL schema evolution
```

---

# Roadmap Ideas

- Move primary ML inference to dedicated Python microservice endpoint
- Add auth-based ownership and tenant-level isolation
- Add historical trends charting from stored estimates
- Add scenario versioning and comparison view
- Add integration tests for API routes and DB writes
