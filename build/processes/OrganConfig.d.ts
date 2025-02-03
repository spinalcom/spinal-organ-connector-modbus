import OrganConfigModel from '../model/OrganConfigModel';
export default class OrganConfig {
    private static instance;
    constructor();
    static getInstance(): OrganConfig;
    getConfig(): Promise<OrganConfigModel>;
}
