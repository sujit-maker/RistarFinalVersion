import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EmptyRepoJobService } from './empty-repo-job.service';
import { CreateEmptyRepoJobDto } from './dto/create-emptyRepoJob.dto';
import { UpdateEmptyRepoJobDto } from './dto/update-emptyRepoJob.dto';


@Controller('empty-repo-job')
export class EmptyRepoJobController {
  constructor(private readonly service: EmptyRepoJobService) {}

  @Post()
  create(@Body() dto: CreateEmptyRepoJobDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  // controller
@Get('job/next')
async getNextJobNumber() {
  return this.service.getNextJobNumber();
}


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmptyRepoJobDto) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
