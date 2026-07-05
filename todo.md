# RaktaSetu AI — Project TODO

## Database Schema
- [x] Donors table (id, name, bloodGroup, area, phone, lastDonationDate, isFirstTime, createdAt, updatedAt)
- [x] Blood banks table (id, name, area, phone, isOpen24x7, createdAt, updatedAt)
- [x] Blood camps table (id, name, organizer, location, date, registeredCount, capacity, createdAt, updatedAt)
- [x] Run drizzle-kit generate and apply SQL migrations

## Backend / Server
- [x] AI chat proxy procedure (invokeLLM with structured JSON output, multilingual)
- [x] Document vision extraction procedure (invokeLLM with image_url input)
- [x] Demand forecast procedure (invokeLLM for 30-day blood demand prediction)
- [x] Donors CRUD router (list, create, filter by blood group, search)
- [x] Blood banks router (list with status)
- [x] Blood camps router (list, create, get stats)
- [x] Donor matching algorithm (compatibility-based, server-side)
- [x] Document upload endpoint (base64 handling via storagePut)
- [x] Vitest tests for backend procedures (12 tests pass)

## Frontend — Design & Theme
- [x] Custom CSS theme with red/mint/white color system (CSS variables in index.css)
- [x] Google Fonts integration (Segoe UI or similar)
- [x] Sticky top navigation with 6 tabs (Home, AI Assistant, Donors, Blood Banks, Camps, Doc Scan)
- [x] Emergency Request button in nav

## Frontend — Home Page
- [x] Hero section with badge, heading, description, action buttons, stats
- [x] Feature grid (5 cards: Multilingual Assistant, Medical Vision, Donor Matching, Emergency Agent, Camp Organizer)
- [x] How-it-works 3-step section
- [x] CTA band
- [x] Footer with columns

## Frontend — AI Assistant
- [x] Language toggle (English, Hindi, Bengali)
- [x] Chat box with bot/user/system messages
- [x] Quick chip prompts
- [x] Typing indicator
- [x] Inline donor match cards
- [x] Chat input with send button

## Frontend — Donors
- [x] Blood group filter chips
- [x] Search input (name/area)
- [x] Donor grid cards with info
- [x] Register as donor modal
- [x] Live stats sync

## Frontend — Blood Banks
- [x] Bank grid cards with name, area, phone, 24x7 status
- [x] Live stats sync

## Frontend — Camps
- [x] Camp listing cards
- [x] Organize camp modal
- [x] Demand forecast bar chart (30-day)
- [x] Refresh forecast with AI button

## Frontend — Doc Scan
- [x] Image upload box (JPEG/PNG/WEBP)
- [x] File preview after upload
- [x] Extract with AI button
- [x] Results panel (blood group, units, hospital, urgency, patient name)
- [x] Error handling

## Polish & Testing
- [x] Responsive layout (mobile breakpoints)
- [x] Loading states everywhere
- [x] Error states and user feedback
- [x] Navigation between tabs
- [x] Seed data for donors, blood banks, camps
- [x] End-to-end testing of AI features
- [x] Save checkpoint (version 812d0847)
