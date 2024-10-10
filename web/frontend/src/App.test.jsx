/* eslint-disable no-undef */ // not sure where it() comes from.
import React from "react";
import { render, screen } from '@testing-library/react';
import { Provider } from "react-redux";
import thunkMiddleware from "redux-thunk";
import { createStore, applyMiddleware } from "redux";
import rootReducer from "./reducers/index";
import App from "./App";


// TODO: remove deprecated things, do we need the logger?
const store = createStore(
	rootReducer,
	applyMiddleware(
		thunkMiddleware, // lets us dispatch() functions
	),
);

test('renders the App component', () => {
	const div = document.createElement("div");
	render(
		<Provider store={store}>
			<App />
		</Provider>,
		div,
	);
  const linkElement = screen.getByText(/Software Solutions Engineer/i);
  expect(linkElement).toBeInTheDocument();
});
