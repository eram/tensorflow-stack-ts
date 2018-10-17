// Jest snapshot test
import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { AboutPage } from "./AboutPage";

describe("AboutPage testing", () => {

    test("page is loading correctly", () => {
        const component = TestRenderer.create(
            <AboutPage />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});
