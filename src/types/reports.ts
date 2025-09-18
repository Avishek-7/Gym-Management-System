export interface Report {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  category: 'health' | 'performance' | 'attendance' | 'other';
  priority: 'low' | 'medium' | 'high';
  isPublished: boolean;
  publishedAt?: string;
  relatedMemberId?: string;
  relatedClassId?: string;
  relatedMembershipId?: string;
  tags?: string[];
  attachments?: string[];
  summary?: string;
  comments?: { id: string; userId: string; comment: string; date: string }[];
  isArchived: boolean;
  archivedAt?: string;
  version: number;
}

export interface CreateReportRequest {
  title: string;
  content: string;
  authorId: string;
  category?: 'health' | 'performance' | 'attendance' | 'other';
  priority?: 'low' | 'medium' | 'high';
  relatedMemberId?: string;
  relatedClassId?: string;
  relatedMembershipId?: string;
  tags?: string[];
  attachments?: string[];
  summary?: string;
  isPublished?: boolean;
}

export interface UpdateReportRequest extends Partial<CreateReportRequest> {
  isArchived?: boolean;
  version?: number;
}
