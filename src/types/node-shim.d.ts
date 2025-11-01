declare module 'node:path' {
  const anyPath: any;
  export = anyPath;
}

declare module 'node:url' {
  export const fileURLToPath: (u: string | URL) => string;
}


