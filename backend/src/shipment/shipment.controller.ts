import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('shipment')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

     @UseGuards(AuthGuard('jwt'))  
  @Post()
  create(@Body() createShipmentDto: CreateShipmentDto) {
    return this.shipmentService.create(createShipmentDto);
  }

  @Get('next-job-number')
  async getNextJobNumber() {
    const jobNumber = await this.shipmentService.getNextJobNumber();
    return { jobNumber };
  }
  
  @Get()
  findAll() {
    return this.shipmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipmentService.findOne(+id);
  }

  @UseGuards(AuthGuard('jwt'))           // 👈 add at controller level (or per method)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShipmentDto: UpdateShipmentDto) {
    return this.shipmentService.update(+id, updateShipmentDto);
  }

   @UseGuards(AuthGuard('jwt'))  
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shipmentService.remove(+id);
  }

  @Get('quotation/:refNumber')
  getQuotation(@Param('refNumber') refNumber: string) {
    return this.shipmentService.getQuotationDataByRef(refNumber);
  }

     @UseGuards(AuthGuard('jwt'))  
  @Post('mark-cro-generated/:id')
  markCroGenerated(@Param('id', ParseIntPipe) id: number) {
    return this.shipmentService.markCroGenerated(id);
  }
}
