// import { URL } from "url";
import jwtDecode from "jwt-decode";

// import { Location } from "history";
const history = (!!document && document.location) ? document.location : window.location;
const loginUrl = `${process.env.REACT_APP_OAUTH}/login`;
const homeUrl = `${process.env.PUBLIC_URL}/`;

interface IJwtDto {
    data: {
        id: {
            username: string;
        };
    };
    exp: number;
    iat: number;
}

class Auth {

    login() {
        history.href = loginUrl;
    }

    handleAuthentication() {

        const url = new URL(history.href);
        let err = url.searchParams.get("error") ;
        const token = url.searchParams.get("token") || url.searchParams.get("access_token") || "";
        let decoded = {} as IJwtDto;
        try {
            decoded = jwtDecode<IJwtDto>(token);
            if (!decoded.data || !decoded.data.id || !Number.isInteger(decoded.exp)) {
                console.error("Token missing data");
                err = "Invalid token";
            }
        } catch (error) {
            console.error(error.message);
            err = "Invalid token";
        }
        const logout = url.pathname.indexOf("/logout") > 0 || !!url.searchParams.get("logout");

        if (logout) {
            this.logout();
        } else if (!!err) {
            console.error(err);
            history.replace(homeUrl);
        } else if (decoded.exp) {
            this.setSession(token, decoded);
            history.replace(homeUrl);
        } else {
            this.login();
        }
    }

    setSession(token: string, decoded: IJwtDto) {
        // Set the time that the Access Token will expire at
        const expiresAt = JSON.stringify((decoded.exp * 1000) + new Date().getTime());
        localStorage.setItem("access_token", token);
        localStorage.setItem("id_username", decoded.data.id.username);
        localStorage.setItem("expires_at", expiresAt);
    }

    logout() {
        // Clear Access Token and ID Token from local storage
        localStorage.removeItem("access_token");
        localStorage.removeItem("id_token");
        localStorage.removeItem("expires_at");

        // TODO: call server to revoke token

        // navigate to the home route
        history.replace(homeUrl);
    }

    isAuthenticated() {
        // Check whether the current time is past the
        // Access Token's expiry time
        const expiresAt = JSON.parse(localStorage.getItem("expires_at") || "0");
        return new Date().getTime() < expiresAt;
    }

    getToken() {
        return localStorage.getItem("access_token") || "";
    }

    getUsername() {
        return localStorage.getItem("id_username") || "";
    }
}

const auth = new Auth();
export default auth;
