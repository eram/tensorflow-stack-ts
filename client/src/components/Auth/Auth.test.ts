import auth from "./Auth";
import "../../__mocks__/LocalStorageMock";
import "../../__mocks__/UrlPolyfill";

describe("Auth tests", () => {

    test("token functionality", () => {
        const d = {
            data: {
                id: {
                    username: "testUser",
                },
            },
            exp: 999999999,
            iat: 0,
        };

        auth.setSession("token", d);
        expect(auth.getToken()).toEqual("token");
        expect(auth.getUsername()).toEqual("testUser");
        expect(auth.isAuthenticated()).toBeTruthy();
    });

    test("login", () => {
        // this probably does nothing...
        // TODO: mock history and and see it gets called
        auth.login();
    });

    test("url.searchParams plyfill is working", () => {

        const url = new URL("https://www/?fr=y&type=orcl#page0");
        url.searchParams.append("page", "1");
        expect(url.toString()).toEqual("https://www/?fr=y&type=orcl&page=1#page0");
    });

    test("handleAuthentication is working", () => {
        auth.handleAuthentication();
    });

});
