# Auth testing
- Login: POST /api/auth/login {email,password} -> {token,user}. Use header Authorization: Bearer <token>.
- GET /api/auth/me returns user. Roles: client, professional, admin.
- Credentials in /app/memory/test_credentials.md
