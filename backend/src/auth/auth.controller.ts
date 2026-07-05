import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
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

  /** POST /auth/register — buat akun User + Tenant + Theme + Subscription 1:1 (Paket A). */
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  /** POST /auth/login — autentikasi, kembalikan JWT. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
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
   * Saat ini stub yang selalu mengembalikan { verified: true }.
   * TODO F08: verifikasi OTP WA nyata (integrasi WhatsApp Business API).
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(
    @Body() _dto: VerifyOtpDto,
  ): { verified: boolean } {
    // TODO F08: verifikasi OTP WA nyata
    return { verified: true };
  }
}
