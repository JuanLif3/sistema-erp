import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../modules/auth/roles.guard'; // Ajusta la ruta si es necesario
import { Roles } from '../../modules/auth/roles.decorator'; // Ajusta la ruta

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Roles('super-admin')
  @Get('companies')
  getAll() {
    return this.companiesService.findAllForSuperAdmin();
  }

  @Roles('super-admin')
  @Post('companies')
  create(@Body() body: any) {
    return this.companiesService.createCompanyWithAdmin(body);
  }

  @Roles('super-admin')
  @Patch('companies/:id/toggle')
  toggle(@Param('id') id: string) {
    return this.companiesService.toggleStatus(id);
  }
}