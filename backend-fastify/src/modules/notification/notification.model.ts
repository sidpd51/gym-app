export interface NotificationRow {
  id: string;
  member_id: string;
  membership_id: string;
  type: string;
  channel: string;
  status: string;
  message: string;
  created_at: Date;
  sent_at: Date | null;
}

/** Joined membership + member row used by the expiring/expired lists. */
export interface ExpiringRow {
  membership_id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  end_date: string;
}

export interface NotificationResponse {
  id: string;
  memberId: string;
  membershipId: string;
  type: string;
  channel: string;
  status: string;
  message: string;
  createdAt: Date;
  sentAt: Date | null;
}

export interface ExpiringItem {
  membershipId: string;
  memberId: string;
  firstName: string;
  lastName: string;
  phone: string;
  endDate: string;
}

export const toNotificationResponse = (n: NotificationRow): NotificationResponse => ({
  id: n.id,
  memberId: n.member_id,
  membershipId: n.membership_id,
  type: n.type,
  channel: n.channel,
  status: n.status,
  message: n.message,
  createdAt: n.created_at,
  sentAt: n.sent_at,
});

export const toExpiringItem = (r: ExpiringRow): ExpiringItem => ({
  membershipId: r.membership_id,
  memberId: r.member_id,
  firstName: r.first_name,
  lastName: r.last_name,
  phone: r.phone,
  endDate: r.end_date,
});
