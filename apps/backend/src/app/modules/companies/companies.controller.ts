import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompaniesService } from './companies.service';

@UseGuards(AuthGuard('jwt'))
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() data: any) {
    // Aquí podrías agregar un check de roles para que solo TU (Super Admin) puedas usarlo
    return this.companiesService.createCompanyWithAdmin(data);
  }

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }
}