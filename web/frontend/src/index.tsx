/* eslint-disable react/jsx-filename-extension */

import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import { fetchLocations } from "./actions/locations";
import { fetchGravatar } from "./actions/gravatar";
import rootReducer from "./reducers/index";
import PopulatedApp from "./container/PopulatedApp";

import "./index.css";

import * as serviceWorker from "./serviceWorker";

const loggerMiddleware = createLogger();
const store = createStore(
    rootReducer,
    applyMiddleware(
        thunkMiddleware, // lets us dispatch() functions
        loggerMiddleware // neat middleware that logs actions
    ),
);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

store.dispatch(fetchLocations());
store.dispatch(fetchGravatar());

root.render(
    <React.StrictMode>
        <Provider store={store}>
            <PopulatedApp />
        </Provider>
    </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();