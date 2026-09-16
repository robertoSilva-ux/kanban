import { describe, expect, it, test } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../src/server.js';
import { buildTestRepositories } from '../../helpers/fixtures.js';
import { Card } from '../../../src/cards/Card.js';
import { Board } from '../../../src/boards/Board.js';
import { Column } from '../../../src/boards/Column.js';
import { InMemoryBoardRepository } from '../../../src/boards/BoardRepository.js';
import { InMemoryCardRepository } from '../../../src/cards/CardRepository.js';

/**
 * Estas rotas ainda não fazem nada além de responder 501 — é o
 * comportamento CORRETO do estado inicial do template. Conforme vocês
 * implementam cada atividade, substituam o teste "responde 501" pelos
 * `test.todo` correspondentes (já escritos abaixo como checklist).
 */
describe('Rotas de cartões — pendentes de estica', () => {
  it('GET /cards/:id responde 501 (Atividade 8, estica)', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).get('/cards/qualquer-id');
    expect(response.status).toBe(501);
  });

  it('GET /cards/search responde 501 (Atividade 9, estica)', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).get('/cards/search').query({ query: 'termo' });
    expect(response.status).toBe(501);
  });
});

describe('Atividade 1 & 6: POST /cards', () => {
  it('cria um cartão válido e redireciona para /', async () => {
    const repos = buildTestRepositories();
    const app = createServer(repos);

    const response = await request(app)
      .post('/cards')
      .send({ title: 'Novo cartão', columnId: 'col-1', priority: 'alta', description: 'desc' });

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/');
    expect(repos.cardRepository.findAll()).toHaveLength(1);
    expect(repos.cardRepository.findAll()[0].title).toBe('Novo cartão');
  });

  it('rejeita título com menos de 3 caracteres com 400', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards').send({ title: 'ab', columnId: 'col-1' });

    expect(response.status).toBe(400);
  });

  it('rejeita columnId de uma coluna que não existe com 404', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards').send({ title: 'Novo cartão', columnId: 'col-inexistente' });

    expect(response.status).toBe(404);
  });

  it('impede título duplicado na mesma coluna com 409 (Atividade 6)', async () => {
    const repos = buildTestRepositories();
    const app = createServer(repos);

    await request(app).post('/cards').send({ title: 'Cartão Duplicado', columnId: 'col-1' });
    const response = await request(app).post('/cards').send({ title: 'Cartão Duplicado', columnId: 'col-1' });

    expect(response.status).toBe(409);
  });

  it('rejeita criação se limite de WIP da coluna for atingido com 409 (Atividade 5)', async () => {
    const board = Board.create('board-wip', 'Quadro WIP', [
      Column.create('col-wip', 'Coluna WIP', 1, 1),
    ]);
    const repos = {
      boardRepository: new InMemoryBoardRepository(board),
      cardRepository: new InMemoryCardRepository(),
    };
    const app = createServer(repos);

    await request(app).post('/cards').send({ title: 'Primeiro cartão', columnId: 'col-wip' });
    const response = await request(app).post('/cards').send({ title: 'Segundo cartão', columnId: 'col-wip' });

    expect(response.status).toBe(409);
  });
});

describe('Atividade 2 & 5: POST /cards/:id/move', () => {
  it('move o cartão para a coluna informada e redireciona para /', async () => {
    const repos = buildTestRepositories();
    const card = Card.create('Mover me', 'col-1');
    repos.cardRepository.save(card);
    const app = createServer(repos);

    const response = await request(app).post(`/cards/${card.id}/move`).send({ columnId: 'col-2' });

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/');
    expect(repos.cardRepository.findById(card.id)?.columnId).toBe('col-2');
  });

  it('responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards/nao-existe/move').send({ columnId: 'col-1' });

    expect(response.status).toBe(404);
  });

  it('responde 404 se a coluna destino não existe', async () => {
    const repos = buildTestRepositories();
    const card = Card.create('Cartão', 'col-1');
    repos.cardRepository.save(card);
    const app = createServer(repos);

    const response = await request(app).post(`/cards/${card.id}/move`).send({ columnId: 'col-fantasma' });

    expect(response.status).toBe(404);
  });

  it('responde 409 se a coluna destino já atingiu o limite de WIP (Atividade 5)', async () => {
    const board = Board.create('board-wip', 'Quadro WIP', [
      Column.create('col-origem', 'Origem', 1),
      Column.create('col-wip', 'Destino WIP', 2, 1),
    ]);
    const repos = {
      boardRepository: new InMemoryBoardRepository(board),
      cardRepository: new InMemoryCardRepository(),
    };
    const card1 = Card.create('Ocupante', 'col-wip');
    const card2 = Card.create('Tentando entrar', 'col-origem');
    repos.cardRepository.save(card1);
    repos.cardRepository.save(card2);
    const app = createServer(repos);

    const response = await request(app).post(`/cards/${card2.id}/move`).send({ columnId: 'col-wip' });

    expect(response.status).toBe(409);
  });

  it('responde 409 se já existe cartão com mesmo título na coluna destino (Atividade 6)', async () => {
    const repos = buildTestRepositories();
    const card1 = Card.create('Mesmo Nome', 'col-1');
    const card2 = Card.create('Mesmo Nome', 'col-2');
    repos.cardRepository.save(card1);
    repos.cardRepository.save(card2);
    const app = createServer(repos);

    const response = await request(app).post(`/cards/${card1.id}/move`).send({ columnId: 'col-2' });

    expect(response.status).toBe(409);
  });

  it('permanece na mesma coluna e redireciona se movido para a mesma coluna', async () => {
    const repos = buildTestRepositories();
    const card = Card.create('Ficar na mesma', 'col-1');
    repos.cardRepository.save(card);
    const app = createServer(repos);

    const response = await request(app).post(`/cards/${card.id}/move`).send({ columnId: 'col-1' });

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/');
  });
});

describe('Atividade 3: POST /cards/:id/update', () => {
  it('edita título/descrição/prioridade e redireciona para /', async () => {
    const repos = buildTestRepositories();
    const card = Card.create('Antes', 'col-1', 'baixa', 'desc');
    repos.cardRepository.save(card);
    const app = createServer(repos);

    const response = await request(app)
      .post(`/cards/${card.id}/update`)
      .send({ title: 'Depois', description: 'nova desc', priority: 'alta' });

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/');
    const updated = repos.cardRepository.findById(card.id);
    expect(updated?.title).toBe('Depois');
    expect(updated?.description).toBe('nova desc');
    expect(updated?.priority).toBe('alta');
  });

  it('responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards/inexistente/update').send({ title: 'Novo' });

    expect(response.status).toBe(404);
  });

  it('responde 400 se o novo título for inválido', async () => {
    const repos = buildTestRepositories();
    const card = Card.create('Título Válido', 'col-1');
    repos.cardRepository.save(card);
    const app = createServer(repos);

    const response = await request(app).post(`/cards/${card.id}/update`).send({ title: 'ab' });

    expect(response.status).toBe(400);
  });

  it('responde 409 se o novo título já existir na mesma coluna (Atividade 6)', async () => {
    const repos = buildTestRepositories();
    const card1 = Card.create('Cartão 1', 'col-1');
    const card2 = Card.create('Cartão 2', 'col-1');
    repos.cardRepository.save(card1);
    repos.cardRepository.save(card2);
    const app = createServer(repos);

    const response = await request(app).post(`/cards/${card2.id}/update`).send({ title: 'Cartão 1' });

    expect(response.status).toBe(409);
  });

  it('atualiza apenas a descrição quando título não é enviado', async () => {
    const repos = buildTestRepositories();
    const card = Card.create('Mesmo Título', 'col-1', 'baixa', 'desc antiga');
    repos.cardRepository.save(card);
    const app = createServer(repos);

    const response = await request(app).post(`/cards/${card.id}/update`).send({ description: 'desc nova' });

    expect(response.status).toBe(302);
    const updated = repos.cardRepository.findById(card.id);
    expect(updated?.title).toBe('Mesmo Título');
    expect(updated?.description).toBe('desc nova');
  });

  it('atualiza apenas o título quando descrição e prioridade não são enviadas', async () => {
    const repos = buildTestRepositories();
    const card = Card.create('Título Antigo', 'col-1', 'baixa', 'desc original');
    repos.cardRepository.save(card);
    const app = createServer(repos);

    const response = await request(app).post(`/cards/${card.id}/update`).send({ title: 'Título Novo' });

    expect(response.status).toBe(302);
    const updated = repos.cardRepository.findById(card.id);
    expect(updated?.title).toBe('Título Novo');
    expect(updated?.description).toBe('desc original');
    expect(updated?.priority).toBe('baixa');
  });

  it('atualiza apenas a prioridade quando título e descrição não são enviadas', async () => {
    const repos = buildTestRepositories();
    const card = Card.create('Título', 'col-1', 'baixa', 'desc');
    repos.cardRepository.save(card);
    const app = createServer(repos);

    const response = await request(app).post(`/cards/${card.id}/update`).send({ priority: 'alta' });

    expect(response.status).toBe(302);
    const updated = repos.cardRepository.findById(card.id);
    expect(updated?.title).toBe('Título');
    expect(updated?.priority).toBe('alta');
  });
});


describe('Atividade 4: POST /cards/:id/delete', () => {
  it('remove o cartão e redireciona para /', async () => {
    const repos = buildTestRepositories();
    const card = Card.create('Para Deletar', 'col-1');
    repos.cardRepository.save(card);
    const app = createServer(repos);

    const response = await request(app).post(`/cards/${card.id}/delete`);

    expect(response.status).toBe(302);
    expect(response.header.location).toBe('/');
    expect(repos.cardRepository.findById(card.id)).toBeUndefined();
  });

  it('responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards/inexistente/delete');

    expect(response.status).toBe(404);
  });
});

describe('Checklist de estica', () => {
  test.todo('GET /cards/:id renderiza a página de detalhe do cartão (Atividade 8)');
  test.todo('GET /cards/search?query=termo retorna só os cartões cujo título combina (Atividade 9)');
});

