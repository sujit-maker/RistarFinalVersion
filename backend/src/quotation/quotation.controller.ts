import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('quotations')
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() createQuotationDto: CreateQuotationDto) {
    
    return this.quotationService.create(createQuotationDto);
  }

  
  @Get('next-ref')
  async getNextRef() {
    const ref = await this.quotationService.getNextQuotationRefNumber();
    return { quotationRefNumber: ref };
  }

  @Get()
  findAll() {
    return this.quotationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.quotationService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuotationDto: UpdateQuotationDto,
  ) {
    return this.quotationService.update(id, updateQuotationDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.quotationService.remove(id);
  }
}