// Jest snapshot test
import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { TodoCard } from "./";

test("jest works", () => {
    expect(1).toBeTruthy();
});

describe("StatusCard testing", () => {

    test("StatusCard snapshot is ok", () => {
        const component = TestRenderer.create(
            <TodoCard title="test status card" />,
        );
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});

