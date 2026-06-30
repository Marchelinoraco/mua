import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard — guard standar untuk semua endpoint yang membutuhkan autentikasi.
 *
 * Cara pakai di controller:
 *   @UseGuards(JwtAuthGuard)
 *
 * Guard ini memverifikasi Bearer token JWT dan mengisi request.user
 * dengan JwtPayload { sub, email, tenantId }.
 * Setelah guard ini lulus, @CurrentTenant() dan @CurrentUser() dapat digunakan.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
