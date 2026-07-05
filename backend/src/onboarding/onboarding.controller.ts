import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { OnboardingService, ChecklistResponseDto } from './onboarding.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  /**
   * GET /onboarding/checklist — status checklist minimum storefront.
   * Mengembalikan hasService, hasPaymentProfile, isReady.
   * Terproteksi JWT; scoped ke tenant user yang login.
   */
  @Get('checklist')
  getChecklist(
    @CurrentTenant() tenantId: string,
  ): Promise<ChecklistResponseDto> {
    return this.onboardingService.getChecklist(tenantId);
  }
}
