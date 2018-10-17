import * as React from "react";
import { BrowserRouter } from "react-router-dom";
import { LocaleProvider } from "antd";
import enUS from "antd/lib/locale-provider/en_US";
import { route } from "./routes";
import "./App.less";

export class App extends React.Component {
    public render(): JSX.Element {
        return (
            <LocaleProvider locale={enUS}>
                <BrowserRouter children={route} />
            </LocaleProvider>
        );
    }
}

