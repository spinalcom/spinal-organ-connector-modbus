export interface SpinalConfig {
    protocol: string;
    host: string;
    port?: string | number;
    userID: string | number;
    userPassword: string;
}
export default class SpinalIO {
    private static instance;
    config: SpinalConfig;
    conn: spinal.FileSystem;
    mapLoad: Map<string, Promise<any>>;
    mapLoadPtr: Map<number, Promise<any>>;
    private constructor();
    static getInstance(config?: SpinalConfig): SpinalIO;
    store<T extends spinal.Model>(path: string, model: T): Promise<void>;
    load<T extends spinal.Model>(path: string): Promise<T>;
    loadModelPtr<T extends spinal.Model>(model: spinal.Ptr<T> | spinal.File<T>): Promise<T>;
}
