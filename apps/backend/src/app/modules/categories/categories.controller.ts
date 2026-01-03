import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('categories')
@UseGuards(AuthGuard('jwt')) // 🔒 Seguridad Base: Nadie entra sin token
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Request() req) {
    // 👇 Pasamos el usuario para filtrar solo SUS categorías
    return this.categoriesService.findAll(req.user);
  }

  // 👇 Solo el ADMIN puede crear
  @Post()
  @Roles('admin') // 👈 RolesGuard debe estar activo globalmente o aquí
  create(@Body() createCategoryDto: any, @Request() req) {
    // 👇 Pasamos usuario para asignar la categoría a SU empresa
    return this.categoriesService.create(createCategoryDto, req.user);
  }

  // 👇 Solo el ADMIN puede borrar
  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string, @Request() req) {
    // 👇 Pasamos usuario para asegurar que borra UNA DE LAS SUYAS
    return this.categoriesService.remove(id, req.user);
  }
}