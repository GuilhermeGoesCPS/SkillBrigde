import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service.js';
import { AuthService } from './auth.service.js';
import { CurrentUser, Public, Roles, type AuthenticatedUser } from './auth.decorator.js';
import {
  CreateVacancyDto,
  LoginDto,
  RegisterCompanyDto,
  RegisterInstitutionDto,
  RegisterStudentDto,
  UpdateUserDto,
} from './auth.dto.js';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @Public()
  getInfo() {
    return this.appService.getInfo();
  }

  @Get('vagas')
  @Public()
  getVagas(@Query('tags') tags?: string) {
    return this.appService.getVagas(tags);
  }

  @Get('vagas/:id')
  @Public()
  getVaga(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getVaga(id);
  }

  @Get('tags')
  @Public()
  getTags(@Query('categorias') categorias?: string) {
    return this.appService.getTags(categorias);
  }

  @Get('cursos')
  @Public()
  getCursos() {
    return this.appService.getCursos();
  }

  @Get('categorias')
  @Public()
  getCategorias() {
    return this.appService.getCategorias();
  }

  @Get('empresas')
  @Public()
  getEmpresas() {
    return this.appService.getEmpresas();
  }

  @Get('empresas/:id')
  @Public()
  getEmpresa(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getEmpresa(id);
  }

  @Get('instituicoes')
  @Public()
  getInstituicoes() {
    return this.appService.getInstituicoes();
  }

  @Get('instituicoes/:id')
  @Public()
  getInstituicao(@Param('id', ParseIntPipe) id: number) {
    return this.appService.getInstituicao(id);
  }

  @Get('alunos')
  @Public()
  getAlunos(@Query('tags') tags?: string) {
    return this.appService.getAlunos(tags);
  }

  @Post('cadastro/aluno')
  @Public()
  registerStudent(@Body() body: RegisterStudentDto) {
    return this.authService.registerStudent(body);
  }

  @Post('cadastro/empresa')
  @Public()
  registerCompany(@Body() body: RegisterCompanyDto) {
    return this.authService.registerCompany(body);
  }

  @Post('cadastro/instituicao')
  @Public()
  registerInstitution(@Body() body: RegisterInstitutionDto) {
    return this.authService.registerInstitution(body);
  }

  @Post('login/aluno')
  @Public()
  @HttpCode(HttpStatus.OK)
  loginStudent(@Body() body: LoginDto) {
    return this.authService.login('aluno', body);
  }

  @Post('login/empresa')
  @Public()
  @HttpCode(HttpStatus.OK)
  loginCompany(@Body() body: LoginDto) {
    return this.authService.login('empresa', body);
  }

  @Post('login/instituicao')
  @Public()
  @HttpCode(HttpStatus.OK)
  loginInstitution(@Body() body: LoginDto) {
    return this.authService.login('instituicao', body);
  }

  @Get('usuario')
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.appService.getCurrentUser(user);
  }

  @Patch('usuario')
  updateCurrentUser(@CurrentUser() user: AuthenticatedUser, @Body() body: UpdateUserDto) {
    return this.appService.updateCurrentUser(user, body);
  }

  @Post('vagas')
  @Roles('empresa')
  createVacancy(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateVacancyDto) {
    return this.appService.createVacancy(user, body);
  }

  @Post('candidatar/:id')
  @Roles('aluno')
  applyToVacancy(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.appService.applyToVacancy(user, id);
  }

  @Get('candidaturas/:id')
  @Roles('empresa')
  getApplications(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseIntPipe) id: number) {
    return this.appService.getApplications(user, id);
  }
}
