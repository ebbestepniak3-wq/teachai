// types/index.ts – App-level types (extends @teachai/types)
export * from '@teachai/types'

export interface NavItem {
  href: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string
  adminOnly?: boolean
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export type GradingStatus = 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED'
export type UploadStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
