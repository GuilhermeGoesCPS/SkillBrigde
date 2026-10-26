import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export type AccountType = 'aluno' | 'empresa' | 'instituicao';

export class RegisterBaseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nome!: string;

  @IsEmail()
  @MaxLength(100)
  email!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  senha!: string;

  @IsString()
  @MinLength(1)
  endereco!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  contato?: string;
}

export class RegisterStudentDto extends RegisterBaseDto {
  @IsString()
  @Matches(/^\d{13}$/)
  ra!: string;

  @IsString()
  @Matches(/^[mtn]$/)
  periodo!: string;

  @IsInt()
  @Min(1)
  cursoId!: number;

  @IsInt()
  @Min(1)
  instituicaoId!: number;
}

export class RegisterCompanyDto extends RegisterBaseDto {
  @IsString()
  @Matches(/^\d{14}$/)
  cnpj!: string;
}

export class RegisterInstitutionDto extends RegisterBaseDto {
  @IsString()
  @Matches(/^\d{14}$/)
  cnpj!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  senha!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nome?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  endereco?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  contato?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{13}$/)
  ra?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[mtn]$/)
  periodo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  cursoId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  instituicaoId?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/)
  cnpj?: string;
}

export class CreateVacancyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  tipo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999.99)
  salario!: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/)
  horarioInicio!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/)
  horarioTermino!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  numeroDeVagas?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  tags?: number[];
}