import * as actions from './actions';
import {

} from './reducer';
import {
    actionChannel, all, call, put, select, takeLatest, takeEvery, take, race
} from 'redux-saga/effects';
import {delay} from 'redux-saga';

import {State} from './reducer';

interface CreateSaga<C,O,Q,RS,I> {
  crud: C;
  getId: (entity:O) => string;
  getState: (rs:RS) => State<O,I,Q>;
  actions: actions.Actions<C,O,Q,I>;
  entitiesQuery: (ids:string[]) => Q;
  api: {
    insert: (entity:I) => Promise<O>;
    update: (entityId:string, entity:O) => Promise<O>;
    select: (query:Q) => Promise<O[]>;
  }
}

export function create<C,O,Q,RS,I>({crud, actions, entitiesQuery, getId, getState, api}:CreateSaga<C,O,Q,RS,I>) {
  function* fetchResults(action:actions.FetchResults<C,Q>) {
    const {queryName, query} = action.payload;
    const state = yield select(getState);
    yield put(actions.setResults(queryName, {
      results: [],
      ...state.results[queryName],
      loading: true
    }));
    yield put(actions.setQuery(queryName, query));
    try {
      const r:O[] = yield call(api.select, query);
      const entities:{[entityId:string]:O} = {};
      r.forEach(e => entities[getId(e)] = e);
      yield put(actions.setEntities(entities));
      yield put(actions.setResults(queryName, {
        results: r.map(e => getId(e)),
        loading: false
      }));
    } catch (e) {
      yield put(actions.setResults(queryName, {
        results: [],
        ...state.results[queryName],
        loading: false,
        error: e.message,
        status: e.status
      }));
    }
  }
  function* fetchResultsLater(action:actions.FetchResultsLater<C,Q>) {
    yield put(actions.setQuery(action.payload.queryName, action.payload.query));
    yield delay(action.payload.delay);
    yield put(actions.fetchResults(action.payload.queryName, action.payload.query));
  }
  function* putEntity(action:actions.Put<C,O>) {
    const {entityId, entity, localUpdate} = action.payload;
    if (localUpdate) {
      yield put(actions.setEntities({[entityId]:entity}));
    }

    yield put(actions.setStatus(entityId, {busy:true}));
    try {
      yield call(api.update, entityId, entity);
      yield put(actions.setStatus(entityId, {
        busy:false, 
        modified: undefined,
        error: undefined,
        status: undefined
      }));
    } catch (e) {
      yield put(actions.setStatus(entityId, {
        busy:false, 
        error: e.message,
        status: e.status
      }));
    } 
  }
  function* postEntity(action:actions.Post<C,I>) {
    const {entity, editorId, retry} = action.payload;
    const state = yield select(getState);
    const queryNames = Object.keys(state.queries).sort();
    try {
      yield put(actions.setPostStatus({
        busy:true
      }, editorId));
      for (let i = 0; i < queryNames.length; i++) {
        const qn = queryNames[i];
        if (state.queries[qn]) {
          yield put(actions.setResults(qn, {
            results: [],
            ...state.results[qn],
            loading:true
          }));
        }
      }

      const r = yield call(api.insert, entity);
      yield put(actions.setEntities({[getId(r)]:r}));
      yield put(actions.setPostStatus({
        busy:false,
        entity:r
      }, editorId));
    } catch (e) {
      yield put(actions.setPostStatus({
        busy:false,
        error:e.message,
        status: e.status,
        retryTime: retry ? new Date().getTime() + 15000 : undefined,
        entityIn: entity
      }, editorId));
      if (retry) {
        yield put(actions.startSyncTimer());
      }
    } finally {
      for (let i = 0; i < queryNames.length; i++) {
        const qn = queryNames[i];
        yield put(actions.fetchResults(qn, state.queries[qn]));
      }
    }
  }
  function* putEntityLater(action:actions.PutEntityLater<C,O>) {
    const {entityId, entity} = action.payload;
    yield put(actions.setEntities({[entityId]:entity}));
    yield put(actions.setStatus(entityId, {
      modified: true
    }));
    yield put(actions.startSyncTimer());

  }
	function* loadMissing(action:actions.LoadMissing<C>) {
		const state = yield select(getState);
		const ids:string[] = [];
		action.payload.ids.forEach(entityId => {
			if (state.entities[entityId] === undefined) {
				ids.push(entityId);
			}
		});
		if (ids.length > 0) {
			yield put(actions.fetchResults('', entitiesQuery(ids)));
		}
	}

  function match(type:actions.Action<C,O,Q,I>['type']) {
    return (action:any) => (
      action.type === type
      && action.payload.crud === crud
    );
  }
  function* watchFetchResults() {
    yield takeEvery(match('CRUD_FETCH_RESULTS'), fetchResults);
  }
  function* watchFetchResultsLater() {
    yield takeLatest(match('CRUD_FETCH_RESULTS_LATER'), fetchResultsLater);
  }
  function* watchPutEntity() {
    yield takeEvery(match('CRUD_PUT'), putEntity);
  }
  function* watchPostEntity() {
    yield takeEvery(match('CRUD_POST'), postEntity);
  }
  function* watchPutEntityLater() {
    yield takeEvery(match('CRUD_SET_ENTITY'), putEntityLater);
  }
  function* watchLoadMissing() {
    yield takeEvery(match('CRUD_LOAD_MISSING'), loadMissing);
  }
  function* runSyncTimer() {
    const channel = yield actionChannel(match('CRUD_START_SYNC_TIMER'));
    while (yield take(channel)) {
      while (true) {
        const winner = yield race({
          startTimer: take(channel),
          delay: delay(500)
        });
        if (winner.delay) {
          break;
        }
      }
      const state = yield select(getState);
      const entityIds = Object.keys(state.entityStatus);
      for (let i = 0; i < entityIds.length; i++) {
        const entityId = entityIds[i];
        const s = state.entityStatus[entityId];
        const entity = state.entities[entityId];
        if (s && s.modified && entity) {
          yield put(actions.putEntity(entityId, entity, false));
        }
      }
      const editorIds = Object.keys(state.postStatus);
      const now = new Date().getTime();
      let syncLater = false;
      for (let i = 0; i < editorIds.length; i++) {
        const editorId = editorIds[i]
        const ps = state.postStatus[editorId];

        if (ps && ps.retryTime && ps.entityIn) {

          if (now >= ps.retryTime && !ps.busy) {
            yield put(actions.postEntity(ps.entityIn, editorId, true));
          } else {
            syncLater = true;
          }
        }
      }
      if (syncLater) {
        yield put(actions.startSyncTimer());
      }

    }
  }
  function* root() {
    yield all([
      watchFetchResults(),
      watchFetchResultsLater(),
      watchPutEntity(),
      watchPostEntity(),
      watchPutEntityLater(),
      watchLoadMissing(),
      runSyncTimer()
    ]);
  }
  return {
    root,
    fetchResults,
    fetchResultsLater,
    postEntity,
    putEntity,
    putEntityLater,
    loadMissing
  };
}


