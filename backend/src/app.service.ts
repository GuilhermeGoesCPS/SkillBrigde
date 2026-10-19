import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import type { AuthenticatedUser } from './auth.decorator.js';
import type { AccountType, CreateVacancyDto, UpdateUserDto } from './auth.dto.js';
import { DatabaseService } from './database.service.js';

@Injectable()
export class AppService {
  constructor(private readonly database: DatabaseService) {}

  getInfo() {
    return {
      nome: 'SkillBridge API',
      versao: '1.0.0',
      descricao: 'API pública da plataforma SkillBridge.',
      endpoints: [
        'GET /api', 'GET /api/vagas', 'GET /api/vagas/:id', 'GET /api/vagas?tags=1,2,3',
        'GET /api/tags', 'GET /api/tags?categorias=1,2,3', 'GET /api/categorias', 'GET /api/cursos',
        'GET /api/empresas', 'GET /api/empresas/:id', 'GET /api/instituicoes',
        'GET /api/instituicoes/:id', 'GET /api/alunos?tags=1,2,3',
        'POST /api/cadastro/aluno', 'POST /api/cadastro/empresa', 'POST /api/cadastro/instituicao',
        'POST /api/login/aluno', 'POST /api/login/empresa', 'POST /api/login/instituicao',
        'GET /api/usuario', 'PATCH /api/usuario', 'POST /api/vagas',
        'POST /api/candidatar/:id', 'GET /api/candidaturas/:id',
      ],
    };
  }

  async getVagas(tags?: string) {
    const tagIds = this.parseIdList(tags, 'tags');
    const filter = tagIds ? 'WHERE EXISTS (SELECT 1 FROM tags_x_vagas tv WHERE tv.vaga = v.id AND tv.tag IN (?))' : '';
    return this.rows(
      `SELECT v.id, v.tipo, v.descricao, v.salario,
              v.horario_inicio AS horarioInicio, v.horario_termino AS horarioTermino,
              v.numero_de_vagas AS numeroDeVagas,
              JSON_OBJECT('id', e.id, 'cnpj', e.cnpj, 'nome', u.nome) AS empresa,
              COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'nome', t.nome))
                        FROM tags_x_vagas tv JOIN tags t ON t.id = tv.tag
                        WHERE tv.vaga = v.id), JSON_ARRAY()) AS tags
       FROM vagas v JOIN empresas e ON e.id = v.empresa JOIN usuarios u ON u.id = e.usuario
       ${filter} ORDER BY v.id`,
      tagIds ? [tagIds] : [],
    );
  }

  async getVaga(id: number) {
    const [vaga] = await this.rows(
      `SELECT v.id, v.tipo, v.descricao, v.salario,
              v.horario_inicio AS horarioInicio, v.horario_termino AS horarioTermino,
              v.numero_de_vagas AS numeroDeVagas,
              JSON_OBJECT('id', e.id, 'cnpj', e.cnpj, 'nome', u.nome) AS empresa,
              COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'nome', t.nome))
                        FROM tags_x_vagas tv JOIN tags t ON t.id = tv.tag
                        WHERE tv.vaga = v.id), JSON_ARRAY()) AS tags
       FROM vagas v JOIN empresas e ON e.id = v.empresa JOIN usuarios u ON u.id = e.usuario
       WHERE v.id = ?`,
      [id],
    );
    if (!vaga) throw new NotFoundException('Vaga não encontrada.');
    return vaga;
  }

  async getTags(categorias?: string) {
    const categoryIds = this.parseIdList(categorias, 'categorias');
    const filter = categoryIds
      ? 'WHERE EXISTS (SELECT 1 FROM tags_x_categorias txc WHERE txc.tag = t.id AND txc.categoria IN (?))'
      : '';
    return this.rows(
      `SELECT t.id, t.nome,
              COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('id', c.id, 'nome', c.nome))
                        FROM tags_x_categorias txc JOIN categorias c ON c.id = txc.categoria
                        WHERE txc.tag = t.id), JSON_ARRAY()) AS categorias
       FROM tags t ${filter} ORDER BY t.id`,
      categoryIds ? [categoryIds] : [],
    );
  }

  getCursos() {
    return this.rows('SELECT id, nome FROM cursos ORDER BY nome');
  }

  getCategorias() {
    return this.rows('SELECT id, nome FROM categorias ORDER BY id');
  }

  getEmpresas() {
    return this.rows(this.companyQuery(''), []);
  }

  async getEmpresa(id: number) {
    return this.findEntity(this.companyQuery('WHERE e.id = ?'), [id], 'Empresa não encontrada.');
  }

  getInstituicoes() {
    return this.rows(this.institutionQuery(''), []);
  }

  async getInstituicao(id: number) {
    return this.findEntity(this.institutionQuery('WHERE i.id = ?'), [id], 'Instituição não encontrada.');
  }

  async getAlunos(tags?: string) {
    const tagIds = this.parseIdList(tags, 'tags', true)!;
    return this.rows(
            `SELECT a.id, a.periodo,
              JSON_OBJECT('id', u.id, 'nome', u.nome, 'descricao', u.descricao) AS usuario,
              JSON_OBJECT('id', c.id, 'nome', c.nome) AS curso,
              JSON_OBJECT('id', i.id, 'cnpj', i.cnpj, 'nome', iu.nome) AS instituicao,
              COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('id', t.id, 'nome', t.nome))
                        FROM tags_x_alunos ta JOIN tags t ON t.id = ta.tag
                        WHERE ta.aluno = a.id), JSON_ARRAY()) AS tags
       FROM alunos a JOIN usuarios u ON u.id = a.usuario
       JOIN cursos c ON c.id = a.curso
       JOIN instituicoes i ON i.id = a.instituicao
       JOIN usuarios iu ON iu.id = i.usuario
       WHERE EXISTS (SELECT 1 FROM tags_x_alunos ta WHERE ta.aluno = a.id AND ta.tag IN (?))
       ORDER BY a.id`,
      [tagIds],
    );
  }

  async getCurrentUser(user: AuthenticatedUser) {
    const queries: Record<AccountType, string> = {
      aluno: `SELECT u.id, u.nome, u.email, u.descricao, u.endereco, u.contato, 'aluno' AS tipo,
                     JSON_OBJECT('id', a.id, 'ra', a.ra, 'periodo', a.periodo) AS perfil,
                     JSON_OBJECT('id', c.id, 'nome', c.nome) AS curso,
                     JSON_OBJECT('id', i.id, 'cnpj', i.cnpj, 'nome', iu.nome) AS instituicao
              FROM usuarios u JOIN alunos a ON a.usuario = u.id
              JOIN cursos c ON c.id = a.curso
              JOIN instituicoes i ON i.id = a.instituicao
              JOIN usuarios iu ON iu.id = i.usuario WHERE u.id = ?`,
      empresa: `SELECT u.id, u.nome, u.email, u.descricao, u.endereco, u.contato, 'empresa' AS tipo,
                       JSON_OBJECT('id', e.id, 'cnpj', e.cnpj) AS perfil
                FROM usuarios u JOIN empresas e ON e.usuario = u.id WHERE u.id = ?`,
      instituicao: `SELECT u.id, u.nome, u.email, u.descricao, u.endereco, u.contato, 'instituicao' AS tipo,
                           JSON_OBJECT('id', i.id, 'cnpj', i.cnpj) AS perfil
                    FROM usuarios u JOIN instituicoes i ON i.usuario = u.id WHERE u.id = ?`,
    };
    return this.findEntity(queries[user.tipo], [user.userId], 'Usuário não encontrado.');
  }

  async updateCurrentUser(user: AuthenticatedUser, dto: UpdateUserDto) {
    const userFields = ['nome', 'email', 'endereco', 'descricao', 'contato'] as const;
    const profileFields: Record<AccountType, Record<string, string>> = {
      aluno: { ra: 'ra', periodo: 'periodo', cursoId: 'curso', instituicaoId: 'instituicao' },
      empresa: { cnpj: 'cnpj' },
      instituicao: { cnpj: 'cnpj' },
    };
    const allowedProfileFields = profileFields[user.tipo];
    const suppliedProfileFields = ['ra', 'periodo', 'cursoId', 'instituicaoId', 'cnpj']
      .filter((field) => dto[field as keyof UpdateUserDto] !== undefined);
    if (suppliedProfileFields.some((field) => !Object.hasOwn(allowedProfileFields, field))) {
      throw new BadRequestException('O corpo contém campos incompatíveis com o tipo de perfil.');
    }

    const userUpdates = userFields
      .filter((field) => dto[field] !== undefined)
      .map((field) => [field, dto[field]] as const);
    const profileUpdates = Object.entries(allowedProfileFields)
      .filter(([field]) => dto[field as keyof UpdateUserDto] !== undefined)
      .map(([field, column]) => [column, dto[field as keyof UpdateUserDto]] as const);
    if (userUpdates.length === 0 && profileUpdates.length === 0) {
      throw new BadRequestException('Informe pelo menos um campo para atualizar.');
    }

    try {
      await this.database.transaction(async (connection) => {
        if (userUpdates.length > 0) {
          const assignments = userUpdates.map(([field]) => `\`${field}\` = ?`).join(', ');
          await connection.query<ResultSetHeader>(
            `UPDATE usuarios SET ${assignments} WHERE id = ?`,
            [...userUpdates.map(([, value]) => value), user.userId],
          );
        }
        if (profileUpdates.length > 0) {
          await this.validateProfileReferences(connection, user.tipo, dto);
          const table = user.tipo === 'aluno' ? 'alunos' : user.tipo === 'empresa' ? 'empresas' : 'instituicoes';
          const assignments = profileUpdates.map(([column]) => `\`${column}\` = ?`).join(', ');
          await connection.query<ResultSetHeader>(
            `UPDATE ${table} SET ${assignments} WHERE usuario = ?`,
            [...profileUpdates.map(([, value]) => value), user.userId],
          );
        }
      });
    } catch (error) {
      this.throwDuplicateConflict(error);
    }
    return this.getCurrentUser(user);
  }

  async createVacancy(user: AuthenticatedUser, dto: CreateVacancyDto) {
    if (dto.horarioTermino <= dto.horarioInicio) {
      throw new BadRequestException('O horário de término deve ser posterior ao horário de início.');
    }
    const vacancyId = await this.database.transaction(async (connection) => {
      const companyId = await this.transactionProfileId(connection, 'empresas', user.userId);
      if (!companyId) throw new NotFoundException('Perfil da empresa não encontrado.');
      if (dto.tags?.length) await this.assertTagsExist(connection, dto.tags);

      const [insert] = await connection.execute<ResultSetHeader>(
        `INSERT INTO vagas
           (tipo, descricao, salario, horario_inicio, horario_termino, numero_de_vagas, empresa)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          dto.tipo,
          dto.descricao ?? null,
          dto.salario,
          dto.horarioInicio,
          dto.horarioTermino,
          dto.numeroDeVagas ?? null,
          companyId,
        ],
      );
      for (const tagId of dto.tags ?? []) {
        await connection.execute('INSERT INTO tags_x_vagas (tag, vaga) VALUES (?, ?)', [tagId, insert.insertId]);
      }
      return insert.insertId;
    });
    return this.getVaga(vacancyId);
  }

  async applyToVacancy(user: AuthenticatedUser, vacancyId: number) {
    try {
      return await this.database.transaction(async (connection) => {
        const studentId = await this.transactionProfileId(connection, 'alunos', user.userId);
        if (!studentId) throw new NotFoundException('Perfil do aluno não encontrado.');
        const [vacancies] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM vagas WHERE id = ? FOR UPDATE',
          [vacancyId],
        );
        if (vacancies.length === 0) throw new NotFoundException('Vaga não encontrada.');
        const [existing] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM candidaturas WHERE aluno = ? AND vaga = ? FOR UPDATE',
          [studentId, vacancyId],
        );
        if (existing.length > 0) throw new ConflictException('O aluno já se candidatou a esta vaga.');
        const [result] = await connection.execute<ResultSetHeader>(
          'INSERT INTO candidaturas (aluno, vaga, aceito) VALUES (?, ?, NULL)',
          [studentId, vacancyId],
        );
        return { id: result.insertId, alunoId: studentId, vagaId: vacancyId };
      });
    } catch (error) {
      this.throwDuplicateConflict(error);
    }
  }

  async getApplications(user: AuthenticatedUser, vacancyId: number) {
    const companyId = await this.profileId(this.database, 'empresas', user.userId);
    if (!companyId) throw new NotFoundException('Perfil da empresa não encontrado.');
    const vacancies = await this.database.query<RowDataPacket[]>(
      'SELECT id, empresa FROM vagas WHERE id = ?',
      [vacancyId],
    );
    if (vacancies.length === 0) throw new NotFoundException('Vaga não encontrada.');
    if (Number(vacancies[0].empresa) !== companyId) {
      throw new ForbiddenException('A vaga não pertence à empresa autenticada.');
    }
    const rows = await this.database.query<RowDataPacket[]>(
      `SELECT a.id AS alunoId FROM candidaturas c
       JOIN alunos a ON a.id = c.aluno WHERE c.vaga = ? ORDER BY a.id`,
      [vacancyId],
    );
    return { vagaId: vacancyId, alunosIds: rows.map((row: RowDataPacket) => Number(row.alunoId)) };
  }

  private async validateProfileReferences(
    connection: PoolConnection,
    tipo: AccountType,
    dto: UpdateUserDto,
  ) {
    if (tipo !== 'aluno') return;
    if (dto.cursoId !== undefined) {
      await this.requireReference(connection, 'cursos', dto.cursoId, 'Curso não encontrado.');
    }
    if (dto.instituicaoId !== undefined) {
      await this.requireReference(connection, 'instituicoes', dto.instituicaoId, 'Instituição não encontrada.');
    }
  }

  private async requireReference(
    connection: PoolConnection,
    table: 'cursos' | 'instituicoes',
    id: number,
    message: string,
  ) {
    const [rows] = await connection.query<RowDataPacket[]>(`SELECT id FROM ${table} WHERE id = ?`, [id]);
    if (rows.length === 0) throw new NotFoundException(message);
  }

  private async profileId(
    database: DatabaseService,
    table: 'alunos' | 'empresas',
    userId: number,
  ): Promise<number | null> {
    const sql = `SELECT id FROM ${table} WHERE usuario = ?`;
    const rows = await database.query<RowDataPacket[]>(sql, [userId]);
    return rows.length > 0 ? Number(rows[0].id) : null;
  }

  private async transactionProfileId(
    connection: PoolConnection,
    table: 'alunos' | 'empresas',
    userId: number,
  ): Promise<number | null> {
    const [rows] = await connection.query<RowDataPacket[]>(`SELECT id FROM ${table} WHERE usuario = ?`, [userId]);
    return rows.length > 0 ? Number(rows[0].id) : null;
  }

  private async assertTagsExist(connection: PoolConnection, tagIds: number[]) {
    const [rows] = await connection.query<RowDataPacket[]>('SELECT id FROM tags WHERE id IN (?)', [tagIds]);
    if (rows.length !== tagIds.length) throw new NotFoundException('Uma ou mais tags não foram encontradas.');
  }

  private throwDuplicateConflict(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      throw new ConflictException('Email, CNPJ ou RA já cadastrado.');
    }
    throw error;
  }

  private companyQuery(filter: string) {
    return `SELECT e.id, e.cnpj,
                   JSON_OBJECT('id', u.id, 'nome', u.nome, 'descricao', u.descricao,
                               'contato', u.contato) AS usuario
            FROM empresas e JOIN usuarios u ON u.id = e.usuario ${filter} ORDER BY e.id`;
  }

  private institutionQuery(filter: string) {
    return `SELECT i.id, i.cnpj,
                   JSON_OBJECT('id', u.id, 'nome', u.nome, 'descricao', u.descricao,
                               'contato', u.contato) AS usuario
            FROM instituicoes i JOIN usuarios u ON u.id = i.usuario ${filter} ORDER BY i.id`;
  }

  private async findEntity(sql: string, params: unknown[], message: string) {
    const [entity] = await this.rows(sql, params);
    if (!entity) throw new NotFoundException(message);
    return entity;
  }

  private parseIdList(value: string | undefined, name: string, required = false): number[] | null {
    if (value === undefined) {
      if (required) throw new BadRequestException(`O parâmetro "${name}" é obrigatório.`);
      return null;
    }
    const parts = value.split(',');
    const ids = parts.map((part) => Number(part.trim()));
    if (parts.some((part) => !/^\d+$/.test(part.trim())) || ids.some((id) => !Number.isSafeInteger(id) || id < 1)) {
      throw new BadRequestException(`O parâmetro "${name}" deve conter IDs inteiros positivos separados por vírgula.`);
    }
    return [...new Set(ids)];
  }

  private rows(sql: string, params: unknown[] = []): Promise<RowDataPacket[]> {
    return this.database.query<RowDataPacket[]>(sql, params);
  }
}
