import * as React from "react";
import { RouteConfig } from "react-router-config";
import { Route, Switch } from "react-router-dom";
import { Dashboard } from "./screens/Dashboard/Dashboard";
import { TodoPage } from "./screens/Todo/TodoPage";
import { About } from "./screens/About/About";
import { PageLayout } from "./screens/PageLayout/PageLayout";
import auth from "./components/Auth/Auth";

export const sidebarRoutes: RouteConfig[] = [
    {
        path: `${process.env.PUBLIC_URL}/`,
        exact: true,
        component: () => (<Dashboard />),
    },
    {
        path: `${process.env.PUBLIC_URL}/todo`,
        component: () => (<TodoPage title="Todo list" />),
    },
    {
        path: `${process.env.PUBLIC_URL}/about`,
        component: () => (<About />),
    },
    {
        path: `${process.env.PUBLIC_URL}/login`,
        component: () => (
            <div>
                {/* child routes won't render without this */}
                {auth.handleAuthentication()}
            </div>
        ),
    },
];

export const route = (
    <Switch>
        <Route path={`${process.env.PUBLIC_URL}/`} component={PageLayout} />
    </Switch>
);
