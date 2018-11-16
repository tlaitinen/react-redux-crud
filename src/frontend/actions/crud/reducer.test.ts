import * as reducer from './reducer';
import {Action, create as createActions} from './actions';

interface DummyIn {
  name: string;
}
interface Dummy extends DummyIn {
  id: string;
}

interface Query {
  ids?:string[];
  offset?: number;
}
type DummyState = reducer.State<Dummy, DummyIn, Query>;
type DummyAction = Action<'dummy', Dummy, Query, DummyIn>;

interface RootState {
  dummy: DummyState;
}

const getId = (d:Dummy) => d.id;
const getState = (state:RootState) => state.dummy;


const actions = createActions<'dummy', Dummy, Query, DummyIn>('dummy');

const defRootState:RootState = {
  dummy: reducer.createDefState<Dummy, DummyIn, Query>()
};

describe('frontend:crud:reducer', () => {
  const r = reducer.createReducer<'dummy', Dummy, Query, RootState, DummyIn>('dummy', getState);
  const defState = defRootState.dummy;
  it('should return the initial state', () => {
    expect(r(undefined, <DummyAction> {})).toEqual({
      queries: {},
      results: {},
      entities: {},
      entityStatus: {},
      selected: {},
      entitiesIn: {},
      postStatus: {}
    });
  });
  it('should handle CRUD_SET_QUERY', () => {
    expect(r(defState, actions.setQuery('query1', {offset: 3}))).toEqual({
      ...defState,
      queries: {
        query1: {
          offset: 3
        }
      }
    });
  });

  it('should handle CRUD_SET_RESULTS', () => {
    expect(r(defState, actions.setResults('query1', {
      results: ['1', '2'],
      loading: false
    }))).toEqual({
      ...defState,
      results: {
        query1: {
          results: ['1', '2'],
          loading: false
        }
      }
    });
  });
  it('should handle CRUD_SET_ENTITIES', () => {
    expect(r(
      {
        ...defState,
        entities: {
          '1': {
            id: '1',
            name: 'old dummy1'
          },
          '3': {
            id: '3',
            name: 'dummy3'
          }
        }
      }, actions.setEntities({
        '1': {
          id: '1',
          name: 'dummy1'
        },
        '2': {
          id: '2',
          name: 'dummy2'
        }
      })
    )).toEqual({
      ...defState,
      entities: {
        '1': {
          id: '1',
          name: 'dummy1'
        },
        '2': {
          id: '2',
          name: 'dummy2'
        },
        '3': {
          id: '3',
          name: 'dummy3'
        }
      }
    });
  });
  it('should handle CRUD_SET_STATUS', () => {
    expect(r(
      {
        ...defState,
        entityStatus: {
          '1': {busy:true},
          '3': {busy:false}
        }
      }, actions.setStatus('3', {busy:true})
    )).toEqual({
      ...defState,
      entityStatus: {
        '1': {busy:true},
        '3': {busy:true}
      }
    });
  });
});

describe('frontend:crud:selectors', () => {
  const selectors = reducer.createSelectors<Dummy, DummyIn, Query, RootState>(
    getState,
    getId
  );
  const testState:RootState = {
    dummy: {
      queries: {
        query1: {
          offset: 3
        }
      },
      results: {
        query1: {
          results: ['1', '2'],
          loading: false
        }
      },
      entities: {
        '1': {
          id: '1',
          name: 'dummy1'
        },
        '2': {
          id: '2',
          name: 'dummy2'
        }
      },
      entityStatus: {
        '1': {busy:true},
        '2': {busy:false}
      },
      selected: {},
      entitiesIn: {},
      postStatus: {
        query1: {
          busy: false
        }
      }
    }
  };

  it('should select query', () => {
    expect(selectors.query(testState, 'query1')).toEqual({
      offset: 3
    });
  });
  it('should select results', () => {
    expect(selectors.results(testState, 'query1')).toEqual({
      results: ['1', '2'],
      loading: false
    });
  });
  it('should select entity status', () => {
    expect(selectors.entityStatus(testState, '1')).toEqual(
     {busy:true}
    );
  });
});
