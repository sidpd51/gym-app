export type TrainerStatus = 'ACTIVE' | 'INACTIVE'

export interface Trainer {
  id: string
  trainerCode: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  specialization?: string
  joiningDate: string
  status: TrainerStatus
}
