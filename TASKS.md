# Identity Service - Tasks

## Acceptance Criteria

### 1. User Registration
- [ ] Validate email format and uniqueness
- [ ] Enforce password complexity rules (minimum 8 chars, uppercase, lowercase, numbers, special chars)
- [ ] Hash password using Argon2id (m=64MB, t=1, p=4)
- [ ] Store user in PostgreSQL via Prisma
- [ ] Publish UserRegistered domain event
- [ ] Emit audit log event

### 2. User Authentication
- [ ] Implement EmailPasswordStrategy pattern (extensible for OAuth/OIDC/SSO)
- [ ] Verify email/password credentials
- [ ] Issue JWT access tokens (RS256, 15-minute TTL)
- [ ] Issue long-lived refresh tokens
- [ ] Implement account lockout after failed attempts
- [ ] Emit audit log event for login

### 3. Token Management
- [ ] Implement refresh token rotation (sliding expiry)
- [ ] Use atomic Redis operations to prevent replay attacks
- [ ] Invalidate refresh tokens on logout
- [ ] Emit audit log event for token refresh

### 4. Password Reset
- [ ] Generate cryptographically secure, one-time-use reset tokens
- [ ] Store tokens in Redis with 15-30 minute TTL
- [ ] Validate reset tokens
- [ ] Orchestrate password update with transparent re-hashing
- [ ] Publish PasswordResetRequested domain event
- [ ] Emit audit log event

### 5. Profile Management
- [ ] Expose GET /profile endpoint (authenticated)
- [ ] Expose PATCH /profile endpoint (authenticated)
- [ ] Emit audit log event for profile update

### 6. Security & Infrastructure
- [ ] Retrieve JWT signing keys from Secrets Manager at startup
- [ ] Retrieve database credentials from Secrets Manager at startup
- [ ] Implement Repository Pattern (IUserRepository, ITokenRepository)
- [ ] Implement OpenTelemetry distributed tracing
- [ ] Publish domain events to message broker (RabbitMQ/SQS)
- [ ] Input validation using Zod
- [ ] Containerize with Docker
- [ ] Deploy via Kubernetes/AWS ECS

## Implementation Stack
- Node.js (Fastify)
- TypeScript
- JWT RS256 (jsonwebtoken)
- Argon2id (argon2)
- Prisma ORM (PostgreSQL)
- ioredis (Redis)
- amqplib / AWS SDK SQS
- OpenTelemetry
- Zod
- Docker & Kubernetes/AWS ECS
