export interface NotificationUser {
  _id: string;
  name: string;
  photo: string;
}

export interface NotificationEntity {
  _id: string;
  body?: string;
  commentsCount?: number;
  likesCount?: number;
}

export interface NotificationType {
  _id: string;
  recipient: NotificationUser;
  actor: NotificationUser;
  type: string; 
  entityType: string; 
  entityId: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  entity?: NotificationEntity | null;
}
