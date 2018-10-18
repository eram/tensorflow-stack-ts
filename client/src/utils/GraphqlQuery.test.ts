import { ClientWrapper } from "./";

test("jest is alive", () => {
    expect(true).toBeTruthy();
});

interface IGetMovieVars {
    title: string;
}

interface IGetMovieResp {
    Movie: {
        releaseDate: string,
        actors: Array<{ name: string }>;
    };
}

const getMovieQuery = `
   query getMovie($title: String!) {
      Movie(title: $title) {
        releaseDate
        actors {
          name
        }
      }
    }`;

const graphCool = "https://api.graph.cool/simple/v1/cixos23120m0n0173veiiwrjr";

class TestQuery extends ClientWrapper {
    constructor(endpoint = graphCool) {
        super(endpoint);
    }

    async getMovie(title: string): Promise<IGetMovieResp> {

        const vars: IGetMovieVars = { title };
        return await this.request<IGetMovieVars, IGetMovieResp>(getMovieQuery, vars);
    }
}

describe("test GraphQL ClientWrapper", () => {
    test("getMovies succeeds", async () => {

        const tq = new TestQuery();
        const resp = await tq.getMovie("Inception");

        expect(JSON.stringify(resp)).toEqual(JSON.stringify({
            Movie: {
                releaseDate: "2010-08-28T20:00:00.000Z",
                actors: [
                    { name: "Leonardo DiCaprio" },
                    { name: "Ellen Page" },
                    { name: "Tom Hardy" },
                    { name: "Joseph Gordon-Levitt" },
                    { name: "Marion Cotillard" },
                ],
            },
        }));
    });

    test("getMovies error empty resone query", async () => {

        const tq = new TestQuery();
        const resp = await tq.getMovie("Inception0909090");

        expect(JSON.stringify(resp)).toEqual(JSON.stringify({ Movie: null }));
        expect(tq.getErr()).toEqual("");
    });

    test("getMovies error endpoint: wrong project", async () => {

        const tq = new TestQuery("https://api.graph.cool/simple/v1/12345");
        const resp = await tq.getMovie("Inception");

        expect(resp).toBeUndefined();
        expect(tq.getErr()).toContain("\"error\":\"Project not found: '12345'\"");
    });

    test("getMovies error endpoint: no server", async () => {

        const tq = new TestQuery("http://localhost:0");
        const resp = await tq.getMovie("Inception");

        expect(resp).toBeUndefined();
        expect(tq.getErr()).toContain("failed");
    });

    test("mergeVars", () => {

        const format = `{ predict(inStr: "$tfInput") }`;
        interface IVars {
            tfInput: string;
        }

        const vars: IVars = { tfInput: "home" };
        const s = ClientWrapper.mergeVars(format, vars);
        expect(s).toEqual(`{ predict(inStr: "home") }`);
    });

});
