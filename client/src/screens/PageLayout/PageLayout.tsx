import * as React from "react";
import { renderRoutes } from "react-router-config";
import { Layout } from "antd";
import { Sidebar } from "../Sidear/Sidebar";
import { Header } from "../Header/Header";
import { sidebarRoutes } from "../../routes";
import "./PageLayout.less";

export const PageLayout = () => {
    return (
        <Layout className="ant-layout-has-sider">
            <Sidebar />
            <Layout>
                <Layout.Content>
                    <Header />
                    {/* <Redirect to="/" /> */}
                    {renderRoutes(sidebarRoutes)}
                </Layout.Content>
            </Layout>
        </Layout>
    );
};
