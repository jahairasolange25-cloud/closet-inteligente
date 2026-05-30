import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CalendarService } from './calendar.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { QueryCalendarDto } from './dto/query-calendar.dto';
import { QueryCalendarRangeDto } from './dto/query-calendar-range.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateCalendarDto) {
    return this.calendarService.create(userId, dto);
  }

  @Get('range')
  @HttpCode(HttpStatus.OK)
  async getRange(@CurrentUser('id') userId: string, @Query() query: QueryCalendarRangeDto) {
    return this.calendarService.getRange(userId, query);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser('id') userId: string, @Query() query: QueryCalendarDto) {
    return this.calendarService.findAll(userId, query);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCalendarDto,
  ) {
    return this.calendarService.update(userId, id, dto);
  }
}
