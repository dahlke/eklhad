import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import { fetchLocations } from "./actions/locations";
import { fetchInstagrams } from "./actions/instagrams";
import { fetchLinks } from "./actions/links";
import { fetchGitHubActivity } from "./actions/github";
import { fetchGravatar } from "./actions/gravatar";
import rootReducer from "./reducers/index";
import App from "./App";
import PopulatedApp from "./container/PopulatedApp";

import "./index.scss";

import * as serviceWorker from "./serviceWorker";

const loggerMiddleware = createLogger();
const store = createStore(
	rootReducer,
	applyMiddleware(
		thunkMiddleware, // lets us dispatch() functions
		// loggerMiddleware // neat middleware that logs actions
	)
);

// store.dispatch(fetchLocations()).then(() => console.log(store.getState()))
// store.dispatch(fetchInstagrams()).then(() => console.log(store.getState()))
// store.dispatch(fetchLinks()).then(() => console.log(store.getState()))

store.dispatch(fetchLocations());
store.dispatch(fetchInstagrams());
store.dispatch(fetchLinks());
store.dispatch(fetchGravatar());
store.dispatch(fetchGitHubActivity());

ReactDOM.render(
	<Provider store={store}>
		<PopulatedApp />
	</Provider>,
	document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
