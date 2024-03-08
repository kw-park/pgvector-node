import pg from 'pg';
import pgvector from 'pgvector/pg';
import { from as copyFrom } from 'pg-copy-streams';
import { stdout } from 'process';

// generate random data
const rows = 100000;
const dimensions = 128;
const embeddings = Array.from({length: rows}, () => Array.from({length: dimensions}, () => Math.random()));

// connect
const client = new pg.Client({database: 'pgvector_example'});
await client.connect();

// enable extension
await client.query('CREATE EXTENSION IF NOT EXISTS vector');
await pgvector.registerType(client);

// create table
await client.query('DROP TABLE IF EXISTS items');
await client.query(`CREATE TABLE items (id bigserial, embedding vector(${dimensions}))`);

// load data
console.log(`Loading ${embeddings.length} rows`);
const stream = client.query(copyFrom('COPY items (embedding) FROM STDIN'));
for (const [i, embedding] of embeddings.entries()) {
  // show progress
  if (i % 10000 == 0) {
    stdout.write('.');
  }

  const line = `${pgvector.toSql(embedding)}\n`;
  stream.flushChunk(line);
}

stream.on('finish', async function () {
  console.log('\nSuccess!');

  // create any indexes *after* loading initial data (skipping for this example)
  // console.log('Creating index');
  // await client.query("SET maintenance_work_mem = '8GB'");
  // await client.query('SET max_parallel_maintenance_workers = 7');
  // await client.query('CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops)');

  // update planner statistics for good measure
  await client.query('ANALYZE items');

  client.end();
});
stream.end();
