/* eslint-disable no-undef */ // not sure where it() comes from.
import React from "react";
import { render, screen } from '@testing-library/react';
import { Provider } from "react-redux";
import App from "./App";
import thunkMiddleware from "redux-thunk";
import { createStore, applyMiddleware } from "redux";
import rootReducer from "./reducers/index";
import { createLogger } from "redux-logger";
const loggerMiddleware = createLogger();

// TODO: remove deprecated things, do we need the logger?
const store = createStore(
	rootReducer,
	applyMiddleware(
		thunkMiddleware, // lets us dispatch() functions
		loggerMiddleware, // neat middleware that logs actions
	),
);

test('renders the App component', () => {
	const div = document.createElement("div");
	render(
	<Provider store={store}>
		<App />
	</Provider>,
	div
);
  const linkElement = screen.getByText(/Software Solutions Engineer/i);
  expect(linkElement).toBeInTheDocument();
});