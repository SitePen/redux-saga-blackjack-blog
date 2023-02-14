import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { rootSaga } from './saga';
import reducer from './slice';

// create the saga middleware
const sagaMiddleware = createSagaMiddleware();

// configure the store using `@reduxjs/toolkit`
export const store = configureStore({
	devTools: true,
	reducer,
	// Add the sagaMiddleware to the middleware
	middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sagaMiddleware)
});

// run the root saga
sagaMiddleware.run(rootSaga);
