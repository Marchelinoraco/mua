# GlowBook Backend

NestJS + PostgreSQL (Prisma) — Fase 0 Fondasi.

## Prasyarat

- Node.js >= 20
- Docker & Docker Compose (untuk PostgreSQL lokal)
- npm >= 10

## Setup

```bash
# 1. Salin env dan sesuaikan nilainya
cp .env.example .env

# 2. Install dependensi
npm install

# 3. Jalankan PostgreSQL lokal
docker compose up -d

# 4. Buat dan jalankan migrasi database
npx prisma migrate dev --name init

# 5. Generate Prisma Client
npx prisma generate

# 6. Jalankan server development
npm run start:dev
```

API tersedia di `http://localhost:3000/api`.

## Endpoint Fase 0

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Daftar akun + buat tenant 1:1 |
| POST | `/api/auth/login` | Login, kembalikan JWT |
| GET | `/api/tenant/me` | Ambil profil tenant (auth) |
| PATCH | `/api/tenant/me` | Perbarui tenant (auth) |

## Pola Tenant-Scoping (WAJIB di semua modul domain)

GlowBook menggunakan **shared database** dengan isolasi per `tenant_id`.
Paket A: 1 User memiliki tepat 1 Tenant (relasi 1:1 via `ownerUserId`).

### Alur isolasi per request

```
Request -> JwtAuthGuard (verifikasi JWT)
        -> request.user = { sub, email, tenantId }
        -> @CurrentTenant() -> tenantId string
        -> Service.method(tenantId, ...)
        -> Prisma query dengan filter { where: { tenantId } }
```

### Contoh penerapan di modul domain baru

```typescript
// controller
@Get()
@UseGuards(JwtAuthGuard)
findAll(@CurrentTenant() tenantId: string) {
  return this.serviceModule.findAll(tenantId);
}

// service — WAJIB selalu filter tenantId
async findAll(tenantId: string) {
  return this.prisma.someEntity.findMany({
    where: { tenantId },   // <-- WAJIB, jangan hilangkan
    select: { ... },
  });
}
```

### Aturan keras

1. Setiap query Prisma pada tabel tenant-scoped WAJIB menyertakan `{ where: { tenantId } }`.
2. Jangan pernah mengekspos `passwordHash`, `ownerUserId`, atau kolom internal di response — gunakan `select` eksplisit.
3. Endpoint lintas-tenant hanya boleh ada di modul Admin dan harus di-audit (`AuditLog`).
4. `tenantId` selalu berasal dari JWT (sisi server) — jangan terima dari request body/query.

## Struktur Direktori

```
src/
  auth/           # Register, Login, JWT Strategy
    dto/
    strategies/
  tenant/         # GET/PATCH profil tenant
    dto/
  prisma/         # PrismaService (global)
  health/         # GET /health
  common/
    decorators/   # @CurrentTenant(), @CurrentUser()
    guards/       # JwtAuthGuard
prisma/
  schema.prisma   # Skema awal: User, Tenant, TenantStatus
```

## Verifikasi

```bash
npm run build          # Kompilasi TypeScript
npx prisma validate    # Validasi schema.prisma
npx prisma generate    # Generate Prisma Client
```
