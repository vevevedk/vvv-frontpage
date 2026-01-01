declare module 'pg' {
  export interface PoolConfig {
    user?: string;
    host?: string;
    database?: string;
    password?: string;
    port?: number;
    ssl?: boolean | object;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<Client>;
    query(text: string, params?: any[]): Promise<QueryResult>;
    end(): Promise<void>;
    on(event: 'error', listener: (err: Error) => void): this;
  }

  export class Client {
    query(text: string, params?: any[]): Promise<QueryResult>;
    release(): void;
  }

  export interface QueryResult {
    rows: any[];
    rowCount: number;
    command: string;
  }
}
