export interface Resource {
    items: {
        properties: {
            type: string;
            name: string;
        };
    };
}
export declare class CostCenterUsers {
    costCenterId?: string;
    users: string[];
    constructor(costCenterId?: string);
}
export interface CostCenter {
    items: {
        properties: {
            name: string;
            id: string;
        };
        resources: Resource[];
    };
}
export interface CostCentersResponse {
    costCenters: CostCenter[];
}
export interface TeamMember {
    login: string;
}
