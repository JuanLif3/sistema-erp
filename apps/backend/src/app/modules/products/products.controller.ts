import { 
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, 
  UseInterceptors, UploadedFile, BadRequestException, Query, Request 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // 👈 Importante para proteger las rutas
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// 👇 1. PROTECCIÓN GLOBAL: Nadie entra aquí sin token válido
@UseGuards(AuthGuard('jwt')) 
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) throw new BadRequestException('No se subió ningún archivo');
    
    // 👇 MEJORA: Usamos la URL dinámica del servidor en lugar de hardcodear localhost
    const protocol = req.protocol;
    const host = req.get('host');
    const fullUrl = `${protocol}://${host}/uploads/${file.filename}`;
    
    return { url: fullUrl };
  }
  
  @Post()
  create(@Body() createProductDto: CreateProductDto, @Request() req) {
    // 👇 2. Pasamos el usuario completo para que el servicio extraiga el companyId
    return this.productsService.create(createProductDto, req.user);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('active') active?: string,
    @Query('lowStock') lowStock?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
  ) {
    return this.productsService.findAll(
      active === 'true',
      lowStock === 'true',
      sortBy,
      order as 'ASC' | 'DESC',
      req.user // Pasamos el usuario (que contiene companyId)
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    // 👇 4. Seguridad: Buscamos ID + CompanyId (para que no vean productos ajenos)
    return this.productsService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto,
    @Request() req
  ) {
    return this.productsService.update(id, updateProductDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user);
  }
}