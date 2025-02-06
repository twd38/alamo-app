export interface Machine {
    name: string
    scheduledTime?: string
    status: "active" | "idle"
  }
  
  export interface Job {
    id: string
    jobNumber: string
    partName: string
    operation: string
    status: "Paused" | "Todo" | "In Progress" | "Completed" | "Scrapped"
    timeEstimate: string
    dueDate: string
    serialNumber: string
    customer: string
    imageUrl: string
  }
  
  export interface Column {
    machine: Machine
    jobs: Job[]
  }
  
  