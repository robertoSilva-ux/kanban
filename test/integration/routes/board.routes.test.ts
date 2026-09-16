import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../src/server.js';
import { buildTestRepositories } from '../../helpers/fixtures.js';

describe('GET /', () => {
  it('renderiza o quadro com suas colunas', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toContain('Quadro de Teste');
    expect(response.text).toContain('Coluna 1');
    expect(response.text).toContain('Coluna 2');
  });
});

describe('POST /columns (Atividade 7)', () => {
  it('cria uma nova coluna e redireciona para /', async () => {
    const repos = buildTestRepositories();
    const app = createServer(repos);

    const response = await request(app).post('/columns').send({ name: 'Nova Coluna' });

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/');
    expect(repos.boardRepository.getDefault().columns).toHaveLength(3);
  });

  it('cria uma nova coluna com wipLimit', async () => {
    const repos = buildTestRepositories();
    const app = createServer(repos);

    const response = await request(app).post('/columns').send({ name: 'Coluna WIP', wipLimit: '4' });

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/');
    const added = repos.boardRepository.getDefault().columns.find((c) => c.name === 'Coluna WIP');
    expect(added?.wipLimit).toBe(4);
  });

  it('responde 400 se o nome da coluna for inválido', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/columns').send({ name: 'a' });

    expect(response.status).toBe(400);
  });
});
