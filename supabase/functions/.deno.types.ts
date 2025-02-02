declare global {
    // deno-lint-ignore no-var
    var Deno: {
      env: {
        get(key: string): string | undefined;
      };
    };
  }