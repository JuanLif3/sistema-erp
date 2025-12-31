import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // 👇 Solo el ADMIN puede crear
  @UseGuards(AuthGuard('jwt')) // + RolesGuard si lo tienes implementado
  @Post()
  create(@Body('name') name: string) {
    return this.categoriesService.create(name);
  }

  // 👇 Solo el ADMIN puede borrar
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}