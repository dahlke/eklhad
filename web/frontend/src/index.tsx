/* eslint-disable react/jsx-filename-extension */

import React from "react";
import ReactDOM from "react-dom/client";

import { AppProviders } from "./contexts";
import App from "./App";

import "./index.css";

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <React.StrictMode>
        <AppProviders>
            <App />
        </AppProviders>
    </React.StrictMode>,
);
