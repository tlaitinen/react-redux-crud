import {getType} from 'typesafe-actions';
import {HydrateAction, hydrate} from '../hydrate-action';

import {Action, defaultEditorId} from './actions';

export interface Results {
  results: string[];
  loading: boolean;
  error?: string;
  status?: number;
}

export interface EntityStatus {
  busy: boolean;
  modified?: boolean;
  error?: string;
  status?: number;
}

export interface PostStatus<O,I> {
  busy: boolean;
  entity?: O;
  error?: string;
  status?: number;
  retryTime?: number;
  entityIn?: I;
}
export interface State<O,I,Q> {
  queries: {[queryName:string]: Q | undefined};
  results: {[queryName:string]: Results | undefined};
  entities: {[entityId:string]: O | undefined};
  entityStatus: {[entityId:string]: EntityStatus | undefined};
  selected: {
    [queryName:string]: {
      [entityId:string]: boolean | undefined
    } | undefined
  };
  entitiesIn: {[editorId:string] : I | undefined};
  postStatus: {[editorId:string]: PostStatus<O,I> | undefined};
}

export function createDefState<O,I,Q>():State<O,I,Q> {
  return {
    queries: {},
    results: {},
    entities: {},
    entityStatus: {},
    selected: {},
    entitiesIn: {},
    postStatus: {}
  };
}

export type EntityWithStatus<O> = {entity: O} & EntityStatus;

export interface QueryResults<O,Q> {
  query: Q;
  loading: boolean;
  error?: string;
  status?: number;
  results: EntityWithStatus<O>[];
  selected: {
    [entityId:string]: boolean | undefined;
  };
}

export interface Selectors<O,I,Q,RS> {
  query: (s:RS, queryName:string) => Q | undefined;
  allResults: (s:RS) => {[queryName:string]: Results | undefined};
  results: (s:RS, queryName:string) => Results | undefined;
  entities: (s:RS) => {[entityId:string]: O | undefined};
  entity: (s:RS, entityId:string) => O | undefined;
  entityStatus: (s:RS, entityId?:string) => EntityStatus;
  allEntityStatus: (s:RS) => {[entityId:string]: EntityStatus | undefined};
  selected: (s:RS, queryName:string) => {[entityId:string]:boolean | undefined} | undefined;
  selectedList: (s:RS, queryName:string) => string[];
  entityIn: (s:RS, editorId?:string) => I | undefined;
  postStatus: (s:RS, editorId?:string) => PostStatus<O,I> | undefined;
  allPostStatus: (s:RS) => {[editorId:string]:PostStatus<O,I> | undefined};
  queryResults: (s:RS, queryName:string) => QueryResults<O,Q> | undefined;
  entityId: (entity:O) => string;
};

export function createSelectors<O,I,Q,RS>(getState:(rs:RS) => State<O,I,Q>, getId:(entity:O) => string):Selectors<O,I,Q,RS> {
  return {
    query: (s:RS, queryName:string) => getState(s).queries[queryName],
    allResults: (s:RS) => getState(s).results,
    results: (s:RS, queryName:string) => getState(s).results[queryName],
    entities: (s:RS) => getState(s).entities,
    entity: (s:RS, entityId:string) => getState(s).entities[entityId],
    entityStatus: (s:RS, entityId?:string) => entityId ? getState(s).entityStatus[entityId] || {busy:false} : {busy:false},
    allEntityStatus: (s:RS) => getState(s).entityStatus,
    selected: (s:RS, queryName:string) => getState(s).selected[queryName],
    selectedList: (s:RS, queryName:string) => {
      const sel = getState(s).selected[queryName];
      if (!sel) {
        return [];
      }
      return Object.keys(sel).filter(entityId => sel[entityId]);
    },
    entityIn: (s:RS, editorId?:string) => getState(s).entitiesIn[editorId || defaultEditorId],
    postStatus: (s:RS, editorId?:string) => getState(s).postStatus[editorId || defaultEditorId],
    allPostStatus: (s:RS) => getState(s).postStatus,
    queryResults: (s:RS, queryName:string) => {
      const st = getState(s);
      const query = st.queries[queryName];
      const r = st.results[queryName];
      if (!query || !r) {
        return;
      }
      const results:EntityWithStatus<O>[] = [];
      r.results.forEach((entityId:string) => {
        const entity:O | undefined = st.entities[entityId];
        const entityStatus = st.entityStatus[entityId] || {busy:false};
        if (entity) {
          results.push({
            ...entityStatus,
            entity
          });
        }
      });
      return {
        query,
        loading: r.loading,
        error: r.error,
        status: r.status,
        results,
        selected: st.selected[queryName] || {}
      };
    },
    entityId: getId
  };
}

export function createReducer<C,O,Q,RS,I>(crud:C, getState:(rs:RS) => State<O,I,Q>) {
  const defState = createDefState<O,I,Q>();
  return function(state:State<O,I,Q> = defState, action:Action<C,O,Q,I> | HydrateAction) {
    if (!action.payload || (action.type !== getType(hydrate) && action.payload.crud !== crud)) {
      return state;
    }
    switch(action.type) {
      case 'CRUD_SET_QUERY':
        return {
          ...state,
          queries: {
            ...state.queries,
            [action.payload.queryName]: action.payload.query
          }
        };
      case 'CRUD_SET_RESULTS':
        return {
          ...state,
          results: {
            ...state.results,
            [action.payload.queryName]: action.payload.results
          }
        };
      case 'CRUD_SET_ENTITIES':
        return {
          ...state,
          entities: {
            ...state.entities,
            ...action.payload.entities
          }
        };
      case 'CRUD_SET_ENTITY_STATUS':
        return {
          ...state,
          entityStatus: {
            ...state.entityStatus,
            [action.payload.entityId]: {
              ...state.entityStatus[action.payload.entityId],
              ...action.payload.entityStatus
            }
          }
        };
      case 'CRUD_CLEAR_SELECTED':
        return {
          ...state,
          selected: {
            ...state.selected,
            [action.payload.queryName]: {}
          }
        };
      case 'CRUD_SET_SELECTED':
        return {
          ...state,
          selected: {
            ...state.selected,
            [action.payload.queryName]: {
              ...state.selected[action.payload.queryName],
              [action.payload.entityId]: action.payload.selected
            }
          }
        };
      case 'CRUD_SET_POST_STATUS':
        return {
          ...state,
          postStatus: {
            ...state.postStatus,
            [action.payload.editorId]: action.payload.postStatus
          }
        };
      case 'CRUD_SET_ENTITY_IN':
        return {
          ...state,
          entitiesIn: {
            ...state.entitiesIn,
            [action.payload.editorId]: action.payload.entityIn
          }
        };
      case getType(hydrate):
        return getState(action.payload as any as RS);
      default: 
        return state;
    }
  }
}


