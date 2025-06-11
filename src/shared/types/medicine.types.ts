import { Medicine } from '@prisma/client'

export interface CreateMedicineData {
  name: string
  description?: string
  unit: string
  dose: string
  price: number
}

export interface UpdateMedicineData {
  name?: string
  description?: string
  unit?: string
  dose?: string
  price?: number
}

export interface MedicineFilters {
  name?: string
  unit?: string
  priceMin?: number
  priceMax?: number
}

export interface MedicineUsageStats {
  medicine: {
    id: number
    name: string
    description: string | null
    unit: string
    dose: string
    price: number
  }
  usageCount: number
  usedInProtocols: {
    protocolId: number
    protocolName: string
    targetDisease: string
    dosage: string
    duration: string
  }[]
}

export interface MedicineBulkUpdate {
  id: number
  price: number
}

export interface MostUsedMedicine extends Medicine {
  usage_count: number
}

export interface MedicineWhereInput {
  price?: {
    gte?: number
    lte?: number
  }
  unit?: {
    contains?: string
    mode?: 'insensitive'
  }
  name?: {
    contains?: string
    mode?: 'insensitive'
  }
}
