import * as React from "react";
import { RouteConfig } from "react-router-config";
import { Route, Switch } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { TodoPage } from "./pages/TodoPage";
import { AboutPage } from "./pages/AboutPage";
import { PageLayout } from "./layouts/PageLayout";

export const routes: RouteConfig[] = [
    {
        path: `${process.env.PUBLIC_URL}/`,
        exact: true,
        component: () => (<Dashboard />),
    },
    {
        path: `${process.env.PUBLIC_URL}/todo`,
        component: () => (<TodoPage title="Todo list"/>),
    },
    {
        path: `${process.env.PUBLIC_URL}/about`,
        component: () => (<AboutPage />),
    },
];

export const route = (
    <Switch>
        <Route path={`${process.env.PUBLIC_URL}/`} component={PageLayout} />
    </Switch>
);
