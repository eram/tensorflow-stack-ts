import * as React from "react";
import { Card, Rate } from "antd";
import logo from "./logo.svg";
import "./AboutPage.less";

export class AboutPage extends React.Component<{}, {}> {
  public render(): JSX.Element {
    return (<Card bordered title="About TensorFlow Stack TS - Kickstart Your AI Project">
      <div className="about">
        <div className="about-header">
          <img src={logo} className="about-logo" alt="logo" />
        </div>
        <p className="about-intro">
          App version: {process.env.REACT_APP_VERSION}<br />
          Endpoint: <a href={process.env.REACT_APP_ENDPOINT}>{process.env.REACT_APP_ENDPOINT}</a><br />

          To get started, edit <code>src/App.tsx</code> and save to reload.
        </p>
        <Rate character="6" />
      </div>
    </Card>
    );
  }
}
