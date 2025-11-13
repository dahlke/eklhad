/* eslint-disable react/jsx-filename-extension */

import React from "react";
import ReactDOM from "react-dom/client";

import { AppProviders } from "./contexts";
import App from "./App";

import "./index.css";

import * as serviceWorker from "./serviceWorker";

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <React.StrictMode>
        <AppProviders>
            <App />
        </AppProviders>
    </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();