import * as React from "react";
// import { Redirect } from "react-router-dom";
import { renderRoutes } from "react-router-config";
import { Layout } from "antd";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { routes } from "../routes";
import "./PageLayout.less";

export const PageLayout: React.StatelessComponent<{}> = () => {
    return (
        <Layout className="ant-layout-has-sider">
            <Sidebar />
            <Layout>
                <Layout.Content>
                    <Header />
                    {/* <Redirect to="/" /> */}
                    {renderRoutes(routes)}
                </Layout.Content>
            </Layout>
        </Layout>
    );
};
