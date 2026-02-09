declare module 'next/server' {
  export class NextRequest {
    json(): Promise<any>;
    cookies: {
      get(name: string): { value: string } | undefined;
    };
  }
  
  interface NextResponseOptions {
    status?: number;
  }
  
  export function NextResponse(json: any, options?: NextResponseOptions): {
    status: number;
    json(): Promise<any>;
  };
  
  export namespace NextResponse {
    function json(body: any, options?: NextResponseOptions): {
      status: number;
      json(): Promise<any>;
    };
  }
}
