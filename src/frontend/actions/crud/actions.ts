import {createAction} from 'typesafe-actions';
import {
  PostStatus,
  EntityStatus,
  Results
} from './reducer';
export const defaultEditorId = '';

export interface FetchResults<C,Q> {
  type: 'CRUD_FETCH_RESULTS';
  payload: {
    crud: C;
    queryName: string;
    query: Q;
  };
}

export interface FetchResultsLater<C,Q> {
  type: 'CRUD_FETCH_RESULTS_LATER';
  payload: {
    crud: C;
    delay: number;
    queryName: string;
    query: Q;
  };
}
export interface Put<C,O> {
  type: 'CRUD_PUT';
  payload: {
    crud: C;
    entityId: string;
    entity: O;
    localUpdate: boolean;
  };
}
export interface Post<C,I> {
  type: 'CRUD_POST';
  payload: {
    crud: C;
    editorId: string;
    entity: I;
    retry?: boolean;
  };
}

export interface SetQuery<C, Q> {
  type: 'CRUD_SET_QUERY';
  payload: {
    crud: C;
    queryName: string;
    query: Q;
  };
}
export interface SetResults<C> {
  type: 'CRUD_SET_RESULTS';
  payload: {
    crud: C;
    queryName: string;
    results: Results
  };
}

export interface SetEntities<C,O> {
  type: 'CRUD_SET_ENTITIES';
  payload: {
    crud: C;
    entities: {[entityId:string]:O}
  };
}

export interface SetEntityStatus<C> {
  type: 'CRUD_SET_ENTITY_STATUS';
  payload: {
    crud: C;
    entityId: string;
    entityStatus: Partial<EntityStatus>;

  };
}
export interface SetSelected<C> {
  type: 'CRUD_SET_SELECTED';
  payload: {
    crud: C;
    queryName: string;
    entityId: string;
    selected: boolean;
  };
}
export interface ClearSelected<C> {
  type: 'CRUD_CLEAR_SELECTED';
  payload: {
    crud: C;
    queryName: string;
  };
}

export interface SetPostStatus<C,O,I> {
  type: 'CRUD_SET_POST_STATUS';
  payload: {
    crud: C;
    editorId: string;
    postStatus: PostStatus<O,I>;
  };
}

export interface SetEntityIn<C,I> {
  type: 'CRUD_SET_ENTITY_IN';
  payload: {
    crud: C;
    editorId: string;
    entityIn: I;
  };
}
export interface PutEntityLater<C,O> {
  type: 'CRUD_SET_ENTITY';
  payload: {
    crud: C;
    entityId: string;
    entity: O;
  };
}
export interface StartSyncTimer<C> {
  type: 'CRUD_START_SYNC_TIMER';
  payload: {
    crud: C;
  };
}
export interface LoadMissing<C> {
  type: 'CRUD_LOAD_MISSING';
  payload: {
    crud: C;
    ids: string[];
  };
}
export type Action<C,O,Q,I> = 
  FetchResults<C,Q>
  | FetchResultsLater<C,Q>
  | Put<C,O>
  | Post<C,I>
  | SetQuery<C,Q> 
  | SetResults<C> 
  | SetEntities<C,O>
  | SetEntityStatus<C>
  | ClearSelected<C>
  | SetSelected<C>
  | SetPostStatus<C,O,I>
  | SetEntityIn<C,I>
  | PutEntityLater<C,O>
  | StartSyncTimer<C>
  | LoadMissing<C>;

export interface Actions<C,O,Q,I> {
  fetchResults: (queryName:string, query:Q) => FetchResults<C,Q>;
  fetchResultsLater: (queryName:string, query:Q, delay:number) => FetchResultsLater<C,Q>;
  putEntity: (entityId:string, entity:O, localUpdate?:boolean) => Put<C,O>;
  postEntity: (entity:I, editorId?:string, retry?:boolean) => Post<C,I>;
  setQuery: (queryName:string, query:Q) => SetQuery<C,Q>;
  setResults: (queryName:string, results:Results) => SetResults<C>;
  setEntities: (entities:{[entityId:string]:O}) => SetEntities<C,O>;
  setStatus: (entityId:string, entityStatus:Partial<EntityStatus>) => SetEntityStatus<C>;
  setSelected: (queryName: string, entityId: string, selected:boolean) => SetSelected<C>;
  clearSelected: (queryName: string) => ClearSelected<C>;
  setPostStatus: (postStatus:PostStatus<O,I>, editorId?:string) => SetPostStatus<C,O,I>;
  setEntityIn: (entityIn:I, editorId?: string) => SetEntityIn<C,I>;
  putEntityLater: (entityId:string, entity:O) => PutEntityLater<C,O>;
  startSyncTimer: () => StartSyncTimer<C>;
  loadMissing: (ids:(string | null)[]) => LoadMissing<C>;
}
export function create<C,O,Q,I>(crud:C):Actions<C,O,Q,I> {
  return {
    fetchResults: createAction('CRUD_FETCH_RESULTS', resolve => (queryName: string, query:Q) => resolve({
      crud,
      queryName,
      query
    })),
    fetchResultsLater: createAction('CRUD_FETCH_RESULTS_LATER', resolve => (queryName: string, query:Q, delay:number) => resolve({
      crud, 
      queryName,
      query,
      delay
    })),
    putEntity: createAction('CRUD_PUT', resolve => (entityId:string, entity:O, localUpdate?:boolean) =>resolve({
      crud,
      entityId,
      entity,
      localUpdate: localUpdate !== undefined ? localUpdate : true
    })),
    postEntity: createAction('CRUD_POST', resolve => (entity:I, editorId?:string, retry?:boolean) => resolve({
      crud,
      entity,
      editorId: editorId || defaultEditorId,
      retry
    })),
    setQuery: createAction('CRUD_SET_QUERY', resolve => (queryName: string, query:Q) => resolve({
      crud,
      queryName,
      query
    })),
    setResults: createAction('CRUD_SET_RESULTS', resolve => (queryName: string, results:Results) => resolve({
      crud,
      queryName,
      results
    })),
    setEntities: createAction('CRUD_SET_ENTITIES', resolve => (entities: {[entityId:string]:O}) => resolve({
      crud,
      entities
    })),
    setStatus: createAction('CRUD_SET_ENTITY_STATUS', resolve => (entityId: string, entityStatus:Partial<EntityStatus>) => resolve({
      crud,
      entityId,
      entityStatus
    })),
    setSelected: createAction('CRUD_SET_SELECTED', resolve => (queryName:string, entityId:string, selected:boolean) => resolve({
      crud,
      queryName,
      entityId,
      selected
    })),
    clearSelected: createAction('CRUD_CLEAR_SELECTED', resolve => (queryName:string) => resolve({
      crud,
      queryName
    })),
    setPostStatus: createAction('CRUD_SET_POST_STATUS', resolve => (postStatus:PostStatus<O,I>, editorId?:string) => resolve({
      crud,
      editorId: editorId || defaultEditorId,
      postStatus
    })),
    setEntityIn: createAction('CRUD_SET_ENTITY_IN', resolve => (entityIn:I, editorId?: string) => resolve({
      crud,
      editorId: editorId || defaultEditorId,
      entityIn
    })),
    putEntityLater: createAction('CRUD_SET_ENTITY', resolve => (entityId:string, entity:O) => resolve({
      crud,
      entityId,
      entity
    })),
    startSyncTimer: createAction('CRUD_START_SYNC_TIMER', resolve => () => resolve({crud})),
    loadMissing: createAction('CRUD_LOAD_MISSING', resolve => (ids:(string | null)[]) => {
      const r:string[] = [];
      const rm:{[id:string]: boolean|undefined} = {};
      ids.forEach(id => {
        if (id !== null && !rm[id]) {
          r.push(id);
          rm[id] = true;
        }
      });
      return resolve({
        crud,
        ids: r
      });
    })
  };
}

