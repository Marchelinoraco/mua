import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type JwtPayload,
} from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register — buat akun User + Tenant + Theme + Subscription 1:1 (Paket A).
   * H-1: throttle ketat (5/menit per IP) — endpoint publik rawan abuse/spam akun.
   */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login — autentikasi, kembalikan JWT.
   * H-1: throttle ketat (5/menit per IP) — mitigasi brute-force password.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  /**
   * GET /auth/me — kembalikan profil user + tenant + subscription.
   * Terproteksi JwtAuthGuard; tidak menyertakan passwordHash / ownerUserId.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() jwtPayload: JwtPayload): Promise<MeResponseDto> {
    return this.authService.getMe(jwtPayload.sub, jwtPayload.tenantId);
  }

  /**
   * POST /auth/verify-otp — verifikasi OTP WhatsApp.
   *
   * H-2: endpoint ini SEBELUMNYA stub yang selalu membalas { verified: true }
   * tanpa verifikasi apa pun — berbahaya bila FE (atau siapa pun) menganggap
   * ini otorisasi nyata. Belum ada integrasi WhatsApp Business API nyata
   * (direncanakan F08), dan tidak ada pemakaian aktif di FE saat ini
   * (dicek: tidak ada referensi verify-otp/verifyOtp di frontend/src),
   * sehingga endpoint diubah membalas 501 Not Implemented — TIDAK PERNAH
   * mengklaim verifikasi berhasil sebelum implementasi nyata ada.
   * TODO F08: verifikasi OTP WA nyata (integrasi WhatsApp Business API).
   */
  @Post('verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  verifyOtp(@Body() _dto: VerifyOtpDto): never {
    throw new NotImplementedException(
      'Verifikasi OTP WhatsApp belum tersedia.',
    );
  }
}
