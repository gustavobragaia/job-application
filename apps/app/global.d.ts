declare module '*.css';

declare interface NodeRequire {
  context: (path: string, recursive?: boolean, pattern?: RegExp) => any;
}
