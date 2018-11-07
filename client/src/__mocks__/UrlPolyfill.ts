// polyfill needed because we're using older JEST that is missing some
// URL functionality like url.searchParams

if (new URL("http://a/b").searchParams === undefined) {
    // tslint:disable-next-line:no-var-requires
    require("url-polyfill-light");
}
