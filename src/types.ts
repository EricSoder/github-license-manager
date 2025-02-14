export interface Resource {
  type: string
  name: string
}

export interface CostCenter {
  id: string
  name: string
  resources: Resource[]
}

export interface CostCentersResponse {
  costCenters: CostCenter[]
}

export interface TeamMember {
  login: string
}
