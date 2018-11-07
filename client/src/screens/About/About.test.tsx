// Jest snapshot test
import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { About } from "./About";

describe("About testing", () => {

    test("page is loading correctly", () => {
        const component = TestRenderer.create(
            <About />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});
