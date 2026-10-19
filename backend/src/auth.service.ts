import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, pbkdf2, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { DatabaseService } from './database.service.js';
import type {
  AccountType,
  RegisterCompanyDto,
  RegisterInstitutionDto,
  RegisterStudentDto,
  LoginDto,
} from './auth.dto.js';

const deriveKey = promisify(pbkdf2);
const PASSWORD_ITERATIONS = 310_000;
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 64;
const TOKEN_LIFETIME_SECONDS = 3600;
const DUMMY_PASSWORD_HASH = randomBytes(PASSWORD_SALT_BYTES + PASSWORD_KEY_BYTES);

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async registerStudent(dto: RegisterStudentDto) {
    const passwordHash = await this.hashPassword(dto.senha);
    try {
      return await this.database.transaction(async (connection) => {
        await this.requireRow(connection, 'SELECT id FROM cursos WHERE id = ?', [dto.cursoId], 'Curso não encontrado.');
        await this.requireRow(
          connection,
          'SELECT id FROM instituicoes WHERE id = ?',
          [dto.instituicaoId],
          'Instituição não encontrada.',
        );
        const userId = await this.insertUser(connection, dto, passwordHash);
        const [profile] = await connection.execute<ResultSetHeader>(
          'INSERT INTO alunos (ra, periodo, usuario, curso, instituicao) VALUES (?, ?, ?, ?, ?)',
          [dto.ra, dto.periodo, userId, dto.cursoId, dto.instituicaoId],
        );
        return this.registeredAccount(userId, profile.insertId, dto, 'aluno');
      });
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async registerCompany(dto: RegisterCompanyDto) {
    return this.registerOrganization(dto, 'empresa');
  }

  async registerInstitution(dto: RegisterInstitutionDto) {
    return this.registerOrganization(dto, 'instituicao');
  }

  async login(tipo: AccountType, dto: LoginDto) {
    const account = await this.findLoginAccount(tipo, dto.email);
    const storedHash = account ? Buffer.from(account.senha as Buffer) : DUMMY_PASSWORD_HASH;
    const validPassword = await this.verifyPassword(dto.senha, storedHash);
    if (!account || !validPassword) {
      throw new UnauthorizedException('Email ou senha inválidos.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: String(account.id),
      tipo,
    });
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: TOKEN_LIFETIME_SECONDS,
      usuario: { id: account.id, nome: account.nome, tipo },
    };
  }

  private async registerOrganization(
    dto: RegisterCompanyDto | RegisterInstitutionDto,
    tipo: 'empresa' | 'instituicao',
  ) {
    const passwordHash = await this.hashPassword(dto.senha);
    const table = tipo === 'empresa' ? 'empresas' : 'instituicoes';
    try {
      return await this.database.transaction(async (connection) => {
        const userId = await this.insertUser(connection, dto, passwordHash);
        const [profile] = await connection.execute<ResultSetHeader>(
          `INSERT INTO ${table} (cnpj, usuario) VALUES (?, ?)`,
          [dto.cnpj, userId],
        );
        return this.registeredAccount(userId, profile.insertId, dto, tipo);
      });
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  private async insertUser(
    connection: import('mysql2/promise').PoolConnection,
    dto: RegisterStudentDto | RegisterCompanyDto | RegisterInstitutionDto,
    passwordHash: Buffer,
  ) {
    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO usuarios (nome, email, senha, endereco, descricao, contato) VALUES (?, ?, ?, ?, ?, ?)',
      [dto.nome, dto.email, passwordHash, dto.endereco, dto.descricao ?? null, dto.contato ?? null],
    );
    return result.insertId;
  }

  private async requireRow(
    connection: import('mysql2/promise').PoolConnection,
    sql: string,
    params: number[],
    message: string,
  ) {
    const [rows] = await connection.query<RowDataPacket[]>(sql, params);
    if (rows.length === 0) throw new NotFoundException(message);
  }

  private async findLoginAccount(tipo: AccountType, email: string) {
    const profileTable = tipo === 'aluno' ? 'alunos' : tipo === 'empresa' ? 'empresas' : 'instituicoes';
    const rows = await this.database.query<RowDataPacket[]>(
      `SELECT u.id, u.nome, u.senha
       FROM usuarios u JOIN ${profileTable} p ON p.usuario = u.id
       WHERE u.email = ? LIMIT 1`,
      [email],
    );
    return rows[0] as (RowDataPacket & { id: number; nome: string; senha: Buffer }) | undefined;
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(PASSWORD_SALT_BYTES);
    const key = await deriveKey(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_BYTES, 'sha512');
    return Buffer.concat([salt, key]);
  }

  private async verifyPassword(password: string, stored: Buffer) {
    if (stored.length !== PASSWORD_SALT_BYTES + PASSWORD_KEY_BYTES) return false;
    const salt = stored.subarray(0, PASSWORD_SALT_BYTES);
    const expected = stored.subarray(PASSWORD_SALT_BYTES);
    const actual = await deriveKey(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_BYTES, 'sha512');
    return timingSafeEqual(expected, actual);
  }

  private registeredAccount(
    userId: number,
    profileId: number,
    dto: RegisterStudentDto | RegisterCompanyDto | RegisterInstitutionDto,
    tipo: AccountType,
  ) {
    return {
      id: userId,
      nome: dto.nome,
      email: dto.email,
      tipo,
      perfilId: profileId,
    };
  }

  private rethrowDuplicate(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      throw new ConflictException('Email, CNPJ ou RA já cadastrado.');
    }
    throw error;
  }
}