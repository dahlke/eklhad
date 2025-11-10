/* eslint-disable no-undef */ // not sure where it() comes from.
import React from "react";
import { render, screen } from '@testing-library/react';
import { Provider } from "react-redux";
import { store } from "./store";
import App from "./App";

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
