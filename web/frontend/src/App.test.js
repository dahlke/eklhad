import React from "react";
import { Provider } from "react-redux";
import ReactDOM from "react-dom";
import App from "./App";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import rootReducer from "./reducers/index.js";

const loggerMiddleware = createLogger();
const store = createStore(
	rootReducer,
	applyMiddleware(
		thunkMiddleware, // lets us dispatch() functions
		loggerMiddleware // neat middleware that logs actions
	)
);

it("renders without crashing", () => {
	const div = document.createElement("div");
	ReactDOM.render(
		<Provider store={store}>
			<App />
		</Provider>,
		div
	);
	ReactDOM.unmountComponentAtNode(div);
});
