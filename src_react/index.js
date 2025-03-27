import React, { StrictMode } from 'react';
import { createRoot } from "react-dom/client";
import { Settings } from 'luxon';
/* Setting up Luxon default TZ before App is imported. */
Settings.defaultZone = 'America/New_York';
import App from "./App";
import { BrowserRouter } from "react-router-dom";
//import 'bootstrap/dist/css/bootstrap.min.css';
//import 'bootstrap-icons/font/bootstrap-icons.css';
//import 'react-bootstrap-typeahead/css/Typeahead.css';
//import 'react-bootstrap-typeahead/css/Typeahead.bs5.css';
import store from "./components/util/StoreLoad";
import { Provider } from "react-redux";
//allows the RPA data to be accessed by any component
import { ApiDataProvider } from "./components/util/ApiDataProvider";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import { DirtyProvider } from './components/util/DirtyProvider';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const app = document.getElementById("app")
const root = createRoot(app)
root.render(
    <StrictMode>
        <BrowserRouter>
            <DirtyProvider>
                <DndProvider backend={HTML5Backend}>
                    <Provider store={store}>
                        <ApiDataProvider>
                            <App />
                        </ApiDataProvider>
                    </Provider>
                </DndProvider>
            </DirtyProvider>
        </BrowserRouter>
    </StrictMode>

)