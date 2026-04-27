# amenity-reservations-api

TypeScript + Express API for amenity reservations with CSV-backed reservation data and PostgreSQL-backed authentication.
The project includes: Task 1 (amenity reservations by day), Task 2 (user reservations grouped by day), Task 3 (CSV parse endpoint), plus JWT auth and Dockerized local/prod-like setup.

## Features

- Public endpoint: get amenity reservations by day
- Public endpoint: get user reservations grouped by day
- Protected endpoint: parse uploaded CSV into JSON
- Auth endpoints: register/login with PostgreSQL persistence
- Bcrypt password hashing + JWT access tokens
- Zod request/env validation with clear 400 responses
- Unit + integration tests (Jest + Supertest)
- Docker + Docker Compose support

## Tech Stack

- Node.js, TypeScript, Express
- PostgreSQL (`pg`)
- Zod, bcrypt, jsonwebtoken
- Jest, ts-jest, Supertest
- Docker, Docker Compose

## Project Structure

```text
.
├── data/                      # CSV fixtures/data source
├── src/
│   ├── config/                # env, db pool, db init
│   ├── modules/
│   │   ├── amenities/         # GET /amenities/:id/reservations
│   │   ├── reservations/      # GET /users/:id/reservations
│   │   ├── auth/              # register/login + auth middleware
│   │   └── csv/               # POST /csv/parse
│   ├── test-utils/            # DB helpers for tests
│   └── utils/                 # shared utils (csv reader, time)
├── test/                      # Jest setup files
├── Dockerfile
└── docker-compose.yml
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (for local non-Docker run)
- Docker + Docker Compose (optional path)

## Environment Variables

`.env` is local-only and ignored by git.  
`.env.example` contains placeholders/template values.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | API port |
| `NODE_ENV` | No | `development` | Runtime environment |
| `DATABASE_URL` | Yes | - | PostgreSQL connection URL |
| `JWT_ACCESS_SECRET` | Yes | - | JWT signing secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token TTL |
| `BCRYPT_SALT_ROUNDS` | No | `12` | Bcrypt salt rounds |
| `DATABASE_URL_TEST` | No* | - | Test DB URL for auth DB integration tests |
| `POSTGRES_DB` | Docker compose | - | DB name for postgres service |
| `POSTGRES_USER` | Docker compose | - | DB user for postgres service |
| `POSTGRES_PASSWORD` | Docker compose | - | DB password for postgres service |
| `POSTGRES_PORT` | Docker compose | - | Host port mapped to postgres container |

\* If `DATABASE_URL_TEST` is not set, auth DB integration suite is skipped by design.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example` and fill real values.
3. Ensure PostgreSQL is running and reachable via `DATABASE_URL`.
4. Start API:
   ```bash
   npm run dev
   ```
5. Health check:
   ```bash
   curl http://localhost:3000/health
   ```

Notes:
- DB schema init is automatic on server startup (`users` table is ensured).
- App fails fast on invalid/missing critical env vars.

## Docker Setup

1. Create `.env` (or export shell vars) with all values referenced in `docker-compose.yml`.
2. Start services:
   ```bash
   docker compose up --build
   ```
3. Stop services:
   ```bash
   docker compose down
   ```

Helper scripts:

```bash
npm run docker:up
npm run docker:down
```

Security note:
- Compose uses variable substitution (`${VAR}` / `${VAR:?error}`), no hardcoded secrets.
- Missing required secrets fail fast before containers start.

## Scripts

- `npm run dev` - run app with nodemon + ts-node
- `npm run build` - compile TypeScript to `dist`
- `npm run start` - run compiled app
- `npm run lint` - ESLint
- `npm run test` - run all tests
- `npm run test:watch` - watch mode tests
- `npm run test:coverage` - test coverage
- `npm run docker:up` - compose up with build
- `npm run docker:down` - compose down

## API Endpoints

Base URL (local): `http://localhost:3000`

### A) GET `/amenities/:id/reservations?date=<timestamp>`

- Auth: **Public**
- Params:
  - `id` (positive integer)
  - `date` (day-start timestamp in ms)

Example:

```bash
curl "http://localhost:3000/amenities/1/reservations?date=1593648000000"
```

200 example:

```json
[
  {
    "reservationId": 1,
    "userId": 2,
    "startTime": "05:00",
    "duration": 180,
    "amenityName": "Massage room"
  }
]
```

Typical errors:
- `400`:
  ```json
  { "message": "Validation failed", "issues": ["..."] }
  ```
- `404`:
  ```json
  { "message": "Amenity not found." }
  ```

### B) GET `/users/:id/reservations`

- Auth: **Public**
- Params:
  - `id` (positive integer)

Example:

```bash
curl "http://localhost:3000/users/2/reservations"
```

200 example:

```json
[
  {
    "date": 1593648000000,
    "reservations": [
      {
        "reservationId": 1,
        "amenityId": 1,
        "amenityName": "Massage room",
        "startTime": "05:00",
        "duration": 180
      }
    ]
  }
]
```

Typical errors:
- `400`:
  ```json
  { "message": "Validation failed", "issues": ["..."] }
  ```

### C) POST `/auth/register`

- Auth: **Public**
- Body:
  - `username` (3..32 chars)
  - `email` (valid email)
  - `password` (min 8, at least one letter + one digit)

Example:

```bash
curl -X POST "http://localhost:3000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johnsmith",
    "email": "john@example.com",
    "password": "Password123"
  }'
```

201 example:

```json
{
  "user": {
    "id": "uuid-value",
    "email": "john@example.com",
    "username": "johnsmith"
  },
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": "15m"
}
```

Typical errors:
- `400`:
  ```json
  { "message": "Validation failed", "issues": ["..."] }
  ```
- `409`:
  ```json
  { "message": "Email or username already exists" }
  ```

### D) POST `/auth/login`

- Auth: **Public**
- Body:
  - `identifier` (email or username)
  - `password`

Example:

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "johnsmith",
    "password": "Password123"
  }'
```

200 example:

```json
{
  "user": {
    "id": "uuid-value",
    "email": "john@example.com",
    "username": "johnsmith"
  },
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": "15m"
}
```

Typical errors:
- `400`:
  ```json
  { "message": "Validation failed", "issues": ["..."] }
  ```
- `401`:
  ```json
  { "message": "Invalid credentials" }
  ```

Extract bearer token:

```bash
TOKEN=$(curl -s -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"johnsmith","password":"Password123"}' | jq -r '.accessToken')
```

### E) POST `/csv/parse`

- Auth: **Bearer token required**
- Content-Type: `multipart/form-data`
- File field name: `file`

Example:

```bash
curl -X POST "http://localhost:3000/csv/parse" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./data/amenity.csv;type=text/csv"
```

200 example:

```json
[
  { "Id": "1", "Name": "Massage room" },
  { "Id": "2", "Name": "Gym" }
]
```

Typical errors:
- `401`:
  ```json
  { "message": "Unauthorized" }
  ```
- `400` missing file:
  ```json
  { "message": "File is required. Use multipart/form-data with field name \"file\"." }
  ```
- `400` invalid type:
  ```json
  { "message": "Invalid file type. Only CSV files are allowed." }
  ```

## Testing

Run full suite:

```bash
npm run test
```

Additional:

```bash
npm run test:watch
npm run test:coverage
```

Notes on isolation:
- Most tests are file/mocked-service based and deterministic.
- Auth DB integration tests require `DATABASE_URL_TEST`; without it, that suite is skipped intentionally.

## Security Notes

- Passwords are hashed with bcrypt (`BCRYPT_SALT_ROUNDS`).
- JWT access tokens are signed with secret + expiration.
- Login errors use generic `"Invalid credentials"` (no user enumeration leakage).
- `/csv/parse` is protected by Bearer auth.
- No hardcoded secrets policy in Docker Compose/env handling.

## Known Limitations / Next Improvements

- No refresh tokens yet.
- No rate limiting/brute-force protection yet.
- DB migrations are minimal (startup init), can be upgraded to full migration tooling.
- Pagination/filter expansion for list endpoints can be added later.

## Submission Note

Commit history is intentionally incremental by task/feature area for easier review.

## Commit Convention

The project follows a lightweight Conventional Commits style:

- `feat:` new user-facing functionality
- `fix:` bug fixes
- `test:` tests only
- `docs:` documentation only
- `chore:` tooling/config/devops housekeeping
- `refactor:` code improvements without behavior changes
