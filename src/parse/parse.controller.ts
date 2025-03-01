import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ParseService } from './parse.service';
import { ParseLogService } from 'src/log/parse-log.service';
import { StartParseDto } from 'src/dto/start-parse.dto';

@Controller('parse')
export class ParseController {
  constructor(
    private readonly parseService: ParseService,
    private readonly parseLogService: ParseLogService,
  ) {}

  @Get('status')
  async getParseStatus(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!startDate || !endDate) {
      return {
        message: 'startDate와 endDate를 YYYY-MM-DD 형식으로 입력하세요.',
      };
    }

    return await this.parseLogService.getParseStatusByDateRange(
      startDate,
      endDate,
    );
  }

  @Get('logs')
  async getLogs(@Query('date') date: string) {
    if (!date) {
      return { message: '날짜를 YYYY-MM-DD 형식으로 입력하세요.' };
    }

    return await this.parseLogService.getLogsByDate(date);
  }

  @Get('')
  async getParsedData(@Query('date') date: string) {
    if (!date) {
      return { message: '날짜를 YYYY-MM-DD 형식으로 입력하세요.' };
    }

    return await this.parseService.getParsedDataByDate(date);
  }

  @Get('remove/:id')
  async removeJob(@Param('id') jobId: string) {
    return await this.parseService.removeJob(jobId);
  }

  @Post('')
  async startParsing(@Body() startParseDto: StartParseDto) {
    await this.parseService.startParsing(startParseDto);
    return { message: 'Stock parsing started' };
  }
}
