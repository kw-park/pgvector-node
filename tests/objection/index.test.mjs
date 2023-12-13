import Knex from 'knex';
import { Model } from 'objection';
import pgvector from 'pgvector/knex';

test('example', async () => {
  const knex = Knex({
    client: 'pg',
    connection: {database: 'pgvector_node_test'}
  });

  Model.knex(knex);

  class Item extends Model {
    static get tableName() {
      return 'objection_items';
    }
  }

  await knex.schema.enableExtension('vector');
  await knex.schema.dropTableIfExists('objection_items');
  await knex.schema.createTable('objection_items', (table) => {
    table.increments('id');
    table.vector('embedding', {dimensions: 3});
  });

  const newItems = [
    {embedding: pgvector.toSql([1, 1, 1])},
    {embedding: pgvector.toSql([2, 2, 2])},
    {embedding: pgvector.toSql([1, 1, 2])}
  ];
  await Item.query().insert(newItems);

  // L2 distance
  let items = await Item.query()
    .orderBy(knex.l2Distance('embedding', [1, 1, 1]))
    .limit(5);
  expect(items.map(v => v.id)).toStrictEqual([1, 3, 2]);
  expect(pgvector.fromSql(items[0].embedding)).toStrictEqual([1, 1, 1]);
  expect(pgvector.fromSql(items[1].embedding)).toStrictEqual([1, 1, 2]);
  expect(pgvector.fromSql(items[2].embedding)).toStrictEqual([2, 2, 2]);

  // max inner product
  items = await Item.query()
    .orderBy(knex.maxInnerProduct('embedding', [1, 1, 1]))
    .limit(5);
  expect(items.map(v => v.id)).toStrictEqual([2, 3, 1]);

  // cosine distance
  items = await Item.query()
    .orderBy(knex.cosineDistance('embedding', [1, 1, 1]))
    .limit(5);
  expect(items[2].id).toEqual(3);

  await knex.schema.alterTable('objection_items', function(table) {
    table.index(knex.raw('embedding vector_l2_ops'), 'objection_items_embedding_idx', 'hnsw');
  });

  await knex.destroy();
});