import Koa from "koa";
import koaJwt from "koa-jwt";
import * as jwt from "jsonwebtoken";
import { IndexSig } from "src/utils";

const jwtSecrets = Array<Buffer>();
let jwtValidity = "0";

export function getAuthMiddleware(excluded: string[] = []): Koa.Middleware {

    const unless = [/^\/favicon\.ico/];
    excluded.forEach((path) => { unless.push(new RegExp(`^\\${path}`)); });

    // setup globals
    if (!process.env.JWT_SECRET) {
        throw new Error("Invalid config: missing process.env.JWT_SECRET");
    }
    jwtSecrets.push(Buffer.from(process.env.JWT_SECRET, "base64"));
    jwtValidity = process.env.OAUTH_GITHUB_TOKEN_VALIDITY || "1d";

    if (process.env.JWT_SECRET_PREV) {
        jwtSecrets.push(Buffer.from(process.env.JWT_SECRET_PREV, "base64"));
    }

    return koaJwt({ secret: jwtSecrets }).unless({ path: unless });
}

export function generateJwt(id: IndexSig = { username: "" }): string {
    const token = jwt.sign({ data: { id } }, jwtSecrets[0], { expiresIn: jwtValidity });
    console.log(`username: ${id.username} token: ${token.substring(0, 30)}...`);
    return token;
}

export function verifyJwt(token: string): boolean {
    try {
        jwt.verify(token, jwtSecrets[0]);
        return true;
    } catch (err) {
        // TODO: check with old token
        console.warn(`token verify failed: ${err.message} token: ${token.substring(0, 30)}...`);
    }
    return false;
}

export function invalidateJwt(token: string): void {
    // TODO
    (token); // tslint:disable-line:no-unused-expression
}
