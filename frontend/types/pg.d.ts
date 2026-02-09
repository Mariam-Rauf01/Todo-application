declare module 'pg' {
  export class Pool {
    query(sql: string, params?: any[]): Promise<{ rows: any[] }>;
    end(): Promise<void>;
  }
}
