import * as actions from './actions';
import * as reducer from './reducer';
import * as saga from './saga';
import * as dbRoutes from '../../client/database-routes';
import {CrudTypes} from '../../../types/crud';
export type Selectors<O,I,Q,RS> = reducer.Selectors<O,I,Q,RS>;
export type EntityWithStatus<O> = reducer.EntityWithStatus<O>;
export type EntityStatus = reducer.EntityStatus;
export type Actions<C,O,Q,I> = actions.Actions<C,O,Q,I>;
export type QueryResults<O,Q> = reducer.QueryResults<O,Q>;
export type PostStatus<O,I> = reducer.PostStatus<O,I>;

export type SetEntitiesAction<CT> = CT extends CrudTypes<
  infer B, infer _I, infer _IO, infer O, infer _OO, infer _Q, infer _QO
  > ? actions.SetEntities<B,O> : never;

export type SetResultsAction<CT> = CT extends CrudTypes<
    infer B, infer _I, infer _IO, infer _O, infer _OO, infer _Q, infer _QO
  > ? actions.SetResults<B> : never;

export type SetEntityStatusAction<CT> = CT extends CrudTypes<
  infer B, infer _I, infer _IO, infer _O, infer _OO, infer _Q, infer _QO
  > ? actions.SetEntityStatus<B> : never;

export type SetPostStatusAction<CT> = CT extends CrudTypes<
  infer B, infer I, infer _IO, infer O, infer _OO, infer _Q, infer _QO
  > ? actions.SetPostStatus<B,O,I> : never;


export type Action<CT> = CT extends CrudTypes<
    infer B, infer I, infer _IO, infer O, infer _OO, infer Q, infer _QO
  > ? actions.Action<B,O,Q,I> : never;
export type State<CT> = CT extends CrudTypes< 
    infer _B, infer I, infer _IO, infer O, infer _OO, infer Q, infer _QO 
  > ? reducer.State<O,I,Q> : never;   


export function create<C extends string,I,IO,O,OO,Q,QO, RS>(types:CrudTypes<C,I,IO,O,OO,Q,QO>, getState:(rs:RS) => reducer.State<O,I,Q>) {
  const crud = types.crud.value;
  const selectors = reducer.createSelectors<O,I,Q,RS>(getState, types.getId);
  const actions_ = actions.create<C,O,Q,I>(crud);
  const rootSaga = saga.create<C,O,Q,RS,I>({
    crud, 
    getId: types.getId, 
    getState, 
    entitiesQuery: types.entitiesQuery,
    api: dbRoutes.create(types), 
    actions: actions_
  }).root;
  return {
    selectors,
    actions: actions_,
    reducer: reducer.createReducer<C, O, Q,RS,I>(crud, getState),
    rootSaga
  };
}
