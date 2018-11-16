import * as t from 'io-ts';

type RequireKeys<T> =
  T extends object
    ? { [P in keyof T]-?: T[P] | null }
    : T;

export interface CrudTypes<C extends string,I,IO,O,OO,Q,QO> {
  crud: t.LiteralType<C>;
  entityIn?: t.Type<I,IO>;
  emptyEntityIn?: I;
  entity: t.Type<O,OO>;
  emptyQuery: RequireKeys<Q>;
  entitiesQuery: (ids:string[]) => Q;
  query: t.Type<Q,QO>;
  getId: (entity:O) => string;
}

export function crudTypes<C extends string,I,IO,O,OO,Q,QO>(
  types:CrudTypes<C,I,IO,O,OO,Q,QO>
):CrudTypes<C,I,IO,O,OO,Q,QO> {
  return types;
}
export default crudTypes;
