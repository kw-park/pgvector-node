import { SparseVector } from 'pgvector/utils';

test('fromSql', () => {
  expect(SparseVector.fromSql('{1:1,3:2,5:3}/6').toArray()).toStrictEqual([1, 0, 2, 0, 3, 0]);
});

test('fromDense', () => {
  expect(SparseVector.fromDense([1, 0, 2, 0, 3, 0]).toSql()).toStrictEqual('{1:1,3:2,5:3}/6');
});
