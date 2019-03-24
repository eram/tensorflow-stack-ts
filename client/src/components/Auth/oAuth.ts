import jwtDecode from "jwt-decode";
import { ClientWrapper } from "../../utils";

interface IJwtData {
    data: {
        id: {
            username: string;
        };
    };
    exp: number;
    iat: number;
}

interface IRefeshData {
    data: {
        token: string;
    };
    error: string;
}

class OAuth {

    private refreshMinTime = Number.parseInt(`${process.env.REACT_APP_REFRESH_MIN}`, 10) || 5000;
    private loginUrl = `${process.env.REACT_APP_OAUTH}/login`;
    private homeUrl = `${process.env.PUBLIC_URL}/`;
    private refreshUrl = `${process.env.REACT_APP_OAUTH}/refresh`;
    private refreshCtx = 0;

    login() {
        const location = window.location || document.location;
        localStorage.setItem("back_url", location.href);
        location.replace(this.loginUrl);
    }

    handleAuthentication() {

        const backUrl = localStorage.getItem("back_url") || `${process.env.PUBLIC_URL}`;
        const location = window.location || document.location;

        const url = new URL(location.href);
        let err = url.searchParams.get("error");
        const token = url.searchParams.get("token") || url.searchParams.get("access_token") || "";
        let decoded = {} as IJwtData;
        try {
            decoded = jwtDecode<IJwtData>(token);
            if (!decoded.data || !decoded.data.id || !Number.isInteger(decoded.exp)) {
                throw new Error("Invalid token recieved");
            }
        } catch (error) {
            err = "Invalid token recieved";
        }
        const logout = url.pathname.indexOf("/logout") > 0 || !!url.searchParams.get("logout");

        if (logout) {
            this.logout();
        } else if (!!err) {
            console.warn(err);
            this.setError(err);
            location.replace(backUrl);
        } else if (decoded.exp) {
            this.setSession(token, decoded.data.id.username, decoded.exp * 1000);
            location.replace(backUrl);
        } else {
            this.login();
        }
    }

    setSession(token: string, username: string, exp: number) {
        this.clear();
        localStorage.setItem("access_token", token);
        localStorage.setItem("id_username", username);
        localStorage.setItem("expires_at", exp.toString());
    }

    clear() {
        // Clear Access Token and ID Token from local storage
        localStorage.removeItem("access_token");
        localStorage.removeItem("id_username");
        localStorage.removeItem("expires_at");
        localStorage.removeItem("back_url");
        localStorage.removeItem("error");
        this.refreshCtx = 0;
    }

    logout() {

        this.clear();

        // TODO: call server to revoke token

        // navigate to the home route
        const location = window.location || document.location;
        location.replace(this.homeUrl);
    }

    isAuthenticated() {
        return this.getExpiresAt() > new Date().getTime();
    }

    getExpiresAt() {
        return Number.parseInt(JSON.parse(localStorage.getItem("expires_at") || "0"), 10);
    }

    getToken() {
        const rc = localStorage.getItem("access_token") || "";

        // first time we use a token we setup the token refreshal mechanism
        if (rc.length && !this.refreshCtx) {
            this.refreshSetup();
        }

        return rc;
    }

    getUsername() {
        return localStorage.getItem("id_username") || "";
    }

    popError() {
        const err = localStorage.getItem("error");
        localStorage.removeItem("error");
        return err;
    }

    setError(err: string) {
        localStorage.setItem("error", err);
    }

    private refreshSetup() {
        const expiresAt = this.getExpiresAt();
        const timeout = (expiresAt - new Date().getTime()) / 2;
        // dont try to refresh if the expiration time is very short (prevent from overloading the server)
        // if it's more than 30 days ahead just forget about it (used for testing).
        if (timeout > this.refreshMinTime && timeout < 2592000000 ) {
            this.refreshCtx = expiresAt;
            setTimeout((ctx) => {
                if (ctx === this.refreshCtx) {
                    this.refreshToken();
                }
            }, timeout, this.refreshCtx);
        }
    }

    private async refreshToken() {

        let token = "";
        let err = "";
        let decoded = {} as IJwtData;

        try {
            const client = new ClientWrapper(this.refreshUrl, this.getToken);
            const rc = await client.request<{}, IRefeshData>("");
            if (!rc || rc.error || !rc.data || !rc.data.token) {
                // retry again in half expiraiton time.
                // no error to client
                this.refreshSetup();
                throw new Error("token refresh failed");
            }

            token = rc.data.token;
            decoded = jwtDecode<IJwtData>(token);
            if (!decoded.data || !decoded.data.id || !Number.isInteger(decoded.exp)) {
                throw new Error("Invalid token recieved");
            }
        } catch (error) {
            err = error.message;
        }

        if (!!err) {
            console.warn(err);
        } else {
            console.log("token refreshed");
            this.setSession(token, decoded.data.id.username, decoded.exp * 1000);
        }
    }
}

const auth = new OAuth();
export default auth;
