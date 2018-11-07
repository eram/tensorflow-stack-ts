import * as React from "react";
import { Layout, Row, Col, Menu, Icon, Button } from "antd";
import { Link } from "react-router-dom";
import "./Header.less";
import auth from "../../components/Auth/Auth";

export const Header = () => {
    return (
        <Layout.Header>
            <Row type="flex" justify="end" align="middle">
                <Col span={3}>
                    {auth.isAuthenticated() && (
                        <Menu mode="horizontal">
                            <Menu.SubMenu title={<span><Icon type="user" />{auth.getUsername()}</span>} >
                                <Menu.Item key="logOut" className="user-logout">
                                    <Link onClick={() => { auth.logout(); return false; }} to="#" >Logout</Link>
                                </Menu.Item>
                            </Menu.SubMenu>
                        </Menu>
                    )}
                    {!auth.isAuthenticated() && (
                        <Button type="primary" icon="user"
                            className="user-login"
                            onClick={() => { auth.login(); }}>
                            Log In
                          </Button>
                    )}
                </Col>
            </Row>
        </Layout.Header>
    );
};
