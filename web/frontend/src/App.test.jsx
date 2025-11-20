/* eslint-disable no-undef */ // not sure where it() comes from.
import React from "react";
import { render, screen } from '@testing-library/react';
import { AppProviders } from "./contexts";
import App from "./App";

test('renders the App component', () => {
	const div = document.createElement("div");
	render(
		<AppProviders>
			<App />
		</AppProviders>,
		div,
	);
  const linkElement = screen.getByText(/Software Sales Engineer/i);
  expect(linkElement).toBeInTheDocument();
});
