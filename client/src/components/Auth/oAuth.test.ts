import * as jwt from "jsonwebtoken";
import auth from "./oAuth";
import "../../__mocks__/LocalStorageMock";
import "../../__mocks__/UrlPolyfill";
import { WritableLocation } from "../../__mocks__/LocationMock";

describe("Auth tests", () => {

    const location = new WritableLocation(window);

    beforeAll(() => {
        process.env.REACT_APP_OAUTH = process.env.REACT_APP_OAUTH || "http://www.local";
        process.env.PUBLIC_URL = process.env.PUBLIC_URL || "http://app.local";
        process.env.REACT_APP_REFRESH_MIN = process.env.REACT_APP_REFRESH_MIN || "100" ;
    });

    afterEach(() => {
        location.clear();
    });

    test("global.jsdom is setup ok", () => {
        // the WaritableLocation class constructor has a check to make
        // sure global.jsdom is setup correctly. It throws if not ok.
        expect(location).toBeInstanceOf(WritableLocation);
        expect( () => {
            window.location.replace(window.location.href);
        }).not.toThrow();
    });

    test("url.searchParams plyfill is working", () => {

        const url = new URL("https://www/?fr=y&type=orcl#page0");
        url.searchParams.append("page", "1");
        expect(url.toString()).toEqual("https://www/?fr=y&type=orcl&page=1#page0");
    });

    const tokenData = {
        data: {
            id: {
                username: "testUser",
            },
        },
        exp: 9999999999,
        iat: 0,
    };

    test("token functionality", () => {
        auth.setSession("token", tokenData.data.id.username, tokenData.exp);
        expect(auth.getToken()).toEqual("token");
        expect(auth.getUsername()).toEqual("testUser");
        expect(auth.isAuthenticated()).toBeTruthy();
    });

    test("login", () => {

        auth.login();
        expect(location.replace).toHaveBeenCalled();
    });

    test("logout", () => {

        auth.setSession("token", tokenData.data.id.username, tokenData.exp);
        auth.logout();
        expect(auth.getToken()).toEqual("");
        expect(auth.getUsername()).toEqual("");
        expect(auth.isAuthenticated()).not.toBeTruthy();
    });

    test("handleAuthentication with invalid token", () => {
        // tslint:disable-next-line:max-line-length
        const href = "https://www/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        auth.logout();
        window.location.replace(href);
        auth.handleAuthentication();
        expect(location.replace).toHaveBeenCalled();
        expect(auth.isAuthenticated()).not.toBeTruthy();
    });

    test("handleAuthentication valid token", () => {
        const token = jwt.sign(tokenData, "dontCare");
        const href = "https://www/?token=" + token;
        auth.logout();
        window.location.replace(href);
        auth.handleAuthentication();
        expect(location.replace).toHaveBeenCalled();
        expect(auth.isAuthenticated()).toBeTruthy();
        expect(auth.getUsername()).toEqual(tokenData.data.id.username);
    });

});
