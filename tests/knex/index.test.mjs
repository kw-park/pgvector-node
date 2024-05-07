import Knex from 'knex';
import pgvector from 'pgvector/knex';
import { SparseVector } from 'pgvector';

test('example', async () => {
  const knex = Knex({
    client: 'pg',
    connection: {database: 'pgvector_node_test'}
  });

  await knex.schema.enableExtension('vector');
  await knex.schema.dropTableIfExists('knex_items');
  await knex.schema.createTable('knex_items', (table) => {
    table.increments('id');
    table.vector('embedding', {dimensions: 3});
    table.halfvec('half_embedding', {dimensions: 3});
    table.bit('binary_embedding', {length: 3});
    table.sparsevec('sparse_embedding', {dimensions: 3});
  });

  const newItems = [
    {embedding: pgvector.toSql([1, 1, 1]), half_embedding: pgvector.toSql([1, 1, 1]), binary_embedding: '000', sparse_embedding: SparseVector.fromDense([1, 1, 1]).toSql()},
    {embedding: pgvector.toSql([2, 2, 2]), half_embedding: pgvector.toSql([2, 2, 2]), binary_embedding: '101', sparse_embedding: SparseVector.fromDense([2, 2, 2]).toSql()},
    {embedding: pgvector.toSql([1, 1, 2]), half_embedding: pgvector.toSql([1, 1, 2]), binary_embedding: '111', sparse_embedding: SparseVector.fromDense([1, 1, 2]).toSql()},
    {embedding: null}
  ];
  await knex('knex_items').insert(newItems);

  // L2 distance
  let items = await knex('knex_items')
    .orderBy(knex.l2Distance('embedding', [1, 1, 1]))
    .limit(5);
  expect(items.map(v => v.id)).toStrictEqual([1, 3, 2, 4]);
  expect(pgvector.fromSql(items[0].embedding)).toStrictEqual([1, 1, 1]);
  expect(pgvector.fromSql(items[1].embedding)).toStrictEqual([1, 1, 2]);
  expect(pgvector.fromSql(items[2].embedding)).toStrictEqual([2, 2, 2]);

  // L2 distance - halfvec
  items = await knex('knex_items')
    .orderBy(knex.l2Distance('half_embedding', [1, 1, 1]))
    .limit(5);
  expect(items.map(v => v.id)).toStrictEqual([1, 3, 2, 4]);

  // L2 distance - sparsevec
  items = await knex('knex_items')
    .orderBy(knex.l2Distance('sparse_embedding', SparseVector.fromDense([1, 1, 1]).toSql()))
    .limit(5);
  expect(items.map(v => v.id)).toStrictEqual([1, 3, 2, 4]);

  // max inner product
  items = await knex('knex_items')
    .orderBy(knex.maxInnerProduct('embedding', [1, 1, 1]))
    .limit(5);
  expect(items.map(v => v.id)).toStrictEqual([2, 3, 1, 4]);

  // cosine distance
  items = await knex('knex_items')
    .orderBy(knex.cosineDistance('embedding', [1, 1, 1]))
    .limit(5);
  expect(items.map(v => v.id).slice(2)).toStrictEqual([3, 4]);

  // L1 distance
  items = await knex('knex_items')
    .orderBy(knex.l1Distance('embedding', [1, 1, 1]))
    .limit(5);
  expect(items.map(v => v.id)).toStrictEqual([1, 3, 2, 4]);

  // Hamming distance
  items = await knex('knex_items')
    .orderBy(knex.hammingDistance('binary_embedding', '101'))
    .limit(5);
  expect(items.map(v => v.id)).toStrictEqual([2, 3, 1, 4]);

  // Jaccard distance
  items = await knex('knex_items')
    .orderBy(knex.jaccardDistance('binary_embedding', '101'))
    .limit(5);
  expect(items.map(v => v.id)).toStrictEqual([2, 3, 1, 4]);

  await knex.schema.alterTable('knex_items', function(table) {
    table.index(knex.raw('embedding vector_l2_ops'), 'knex_items_embedding_idx', 'hnsw');
  });

  await knex.destroy();
});
