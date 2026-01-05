
export interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface AquacultureData {
  area: number;
  type: string;
  count: number;
  temp: number;
  weather: string;
  time: string;
  location: string;
}

export type DeviceType = 'feeder' | 'aerator' | 'camera';
export type DeviceStatus = 'online' | 'offline';
export type ExecutionPermission = 'manual_only' | 'manual_ai' | 'ai_only';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  pond: string;
  executionPermission: ExecutionPermission;
  lastActive: string;
  metadata: {
    battery?: number;
    signal?: 'strong' | 'medium' | 'weak';
    firmware: string;
  };
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  pond: string;
}

export type SidebarTab = 'data' | 'settings' | 'history' | 'voice' | 'sources';
