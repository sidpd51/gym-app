export type LeadStatus = 'NEW' | 'CONTACTED' | 'INTERESTED' | 'FOLLOW_UP' | 'CONVERTED' | 'LOST'

export type LeadSource =
  | 'WALK_IN'
  | 'PHONE'
  | 'WEBSITE'
  | 'REFERRAL'
  | 'SOCIAL_MEDIA'
  | 'OTHER'

export interface Lead {
  id: string
  leadCode: string
  name: string
  phone: string
  email?: string
  source?: LeadSource
  interestedPlanId?: string
  status: LeadStatus
  notes?: string
  lastFollowUpDate?: string
  nextFollowUpDate?: string
  createdAt: string
  convertedMemberId?: string
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  FOLLOW_UP: 'Follow-up',
  CONVERTED: 'Converted',
  LOST: 'Lost',
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WALK_IN: 'Walk-in',
  PHONE: 'Phone',
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  SOCIAL_MEDIA: 'Social Media',
  OTHER: 'Other',
}
