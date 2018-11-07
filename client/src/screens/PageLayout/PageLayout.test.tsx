// Jest snapshot test
import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { StaticRouter } from "react-router";
import { PageLayout } from "./PageLayout";
import "../../__mocks__/LocalStorageMock";

describe("PageLayout testing", () => {

    test("Layout match to snapshot", () => {
        const component = TestRenderer.create(
            <StaticRouter location="someLocation" context={{}}>
                <PageLayout />
            </StaticRouter>);
        const tree = component.toJSON();
        expect(tree).toMatchSnapshot();
    });
});
