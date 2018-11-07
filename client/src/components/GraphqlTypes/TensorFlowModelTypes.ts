/* Types for GraphQL queries */
export const endpoint = process.env.REACT_APP_ENDPOINT || "http://localhost:8080/stack/api/graphql";


export const getNameStateQuery = `{ getName getState }`;
export interface IGetNameStateResp {
    getName: string;
    getState: string;
}

export const predictQuery = `
query predict($tfInput: String!) {
    predict(inStr: $tfInput)
  }`;
export interface IPredictVars {
    tfInput: string;
}
export interface IPredictResp {
    predict: string;
}
