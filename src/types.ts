export interface Resource {
  items: {
    properties: {
      type: string
      name: string
    }
  }
}
export class CostCenterUsers {
  costCenterId?: string
  users: string[]

  constructor(costCenterId?: string) {
    if (costCenterId) {
      this.costCenterId = costCenterId
    }
    this.users = []
  }
}
export interface CostCenter {
  items: {
    properties: {
      name: string
      id: string
    }
    resources: Resource[]
  }
}

export interface CostCentersResponse {
  costCenters: CostCenter[]
}

export interface TeamMember {
  login: string
}
