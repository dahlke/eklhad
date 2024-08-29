/* eslint-disable react/jsx-filename-extension */

import React from "react";
import ReactDOM from "react-dom/client";

import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
// import { createLogger } from "redux-logger";
import { fetchLocations } from "./actions/locations";
import { fetchGravatar } from "./actions/gravatar";
// import { fetchLinks } from "./actions/links";
// import { fetchBlogs } from "./actions/blogs";
import rootReducer from "./reducers/index";
import PopulatedApp from "./container/PopulatedApp";

import "./index.css";

import * as serviceWorker from "./serviceWorker";

// const loggerMiddleware = createLogger();
const store = createStore(
	rootReducer,
	applyMiddleware(
		thunkMiddleware // lets us dispatch() functions
		// TODO: do I need this?
		// loggerMiddleware // neat middleware that logs actions
	)
);

const root = ReactDOM.createRoot(document.getElementById('root'));

// store.dispatch(fetchLocations()).then(() => console.log(store.getState()))
// store.dispatch(fetchLinks()).then(() => console.log(store.getState()))

store.dispatch(fetchLocations());
store.dispatch(fetchGravatar());

// store.dispatch(fetchLinks());
// store.dispatch(fetchBlogs());

root.render(
	<React.StrictMode>
		<Provider store={store}>
			<PopulatedApp />
		</Provider>
	</React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
