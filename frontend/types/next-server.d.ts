declare module 'next/server' {
  export class NextRequest extends Request {
    json(): Promise<any>;
    cookies: {
      get(name: string): { value: string } | undefined;
    };
    nextUrl: {
      searchParams: {
        get(name: string): string | null;
      };
    };
  }

  interface NextResponseOptions {
    status?: number;
    headers?: Record<string, string>;
  }

  export function json(body: any, options?: NextResponseOptions): Response;

  export class NextResponse {
    static json(body: any, options?: NextResponseOptions): Response;
  }
}
