declare module "*.json" {
    const value: { [key: string]: any; };
    export default value;
}
/*
interface AsyncIterator<T> {
    next(value?: any): Promise<IteratorResult<T>>;
    return?(value?: any): Promise<IteratorResult<T>>;
    throw?(e?: any): Promise<IteratorResult<T>>;
  }

  AsyncIterable
  */