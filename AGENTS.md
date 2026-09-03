# AGENTS.md

## Stack

- **Service:** Identity Service
- **Type:** business
- **Technologies:**
- Node.js (Fastify) — recommended for high-throughput, low-latency auth flows
- TypeScript
- JWT RS256 (jsonwebtoken library)
- Argon2id (argon2 npm library)
- Prisma ORM (PostgreSQL data access)
- ioredis (Redis client)
- amqplib / AWS SDK SQS (event publishing)
- OpenTelemetry (distributed tracing)
- Zod (input validation and sanitization)
- Docker + Kubernetes / AWS ECS (containerization and orchestration)
- **Responsibilities:**
- Validate and process new user registration requests, enforcing email uniqueness and password complexity rules
- Hash passwords securely using Argon2id (m=64MB, t=1, p=4) before persisting to the user store
- Authenticate users by verifying email/password credentials using the Strategy Pattern (EmailPasswordStrategy), extensible to OAuth/OIDC/SSO strategies
- Issue short-lived JWT access tokens (RS256, 15-minute TTL) and long-lived refresh tokens on successful authentication
- Rotate refresh tokens on each use (sliding expiry) with atomic Redis operations to prevent replay attacks
- Invalidate refresh tokens on logout
- Generate cryptographically secure, one-time-use password-reset tokens with short TTL (15–30 minutes) stored in Redis
- Validate password-reset tokens and orchestrate password updates with transparent re-hashing support
- Expose authenticated profile read (GET /profile) and update (PATCH /profile) endpoints
- Enforce account lockout and progressive delay after repeated failed login attempts
- Publish UserRegistered and PasswordResetRequested domain events to the message broker
- Emit structured audit log events for all significant authentication actions (login, logout, registration, password reset, token refresh, profile update)
- Retrieve JWT signing keys and database credentials from Secrets Manager at startup
- Implement Repository Pattern (IUserRepository, ITokenRepository) for testable, persistence-agnostic domain logic

## General Rules

- Always read files in /specs before implementing
- Never implement without acceptance criteria
- Code should be simple and readable
- Avoid overengineering
- The project follows a hexagonal architecture

## Required Workflow

1. Read the specs in the /specs directory
2. Generate tasks.md if it does not exist
3. Implement based on the tasks
4. Create automated tests
5. Validate acceptance criteria

## Testing

- Cover all acceptance criteria
- Tests should be clear and straightforward
- Generated code must reach **90% unit test coverage**

## Constraints

- Do not invent requirements that are not described
- Do not change behavior without updating the spec
