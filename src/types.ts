export interface Subtask {
  id: string;
  content: string;
  done: boolean;
}

export interface Task {
  id: string;
  content: string;
  description?: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number | null;
  dueDate?: number | null;
  tags?: string[];
  subtasks?: Subtask[];
}

export interface Board {
  id: string;
  title: string;
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

export interface Column {
  id: string;
  title: string;
  description?: string;
  taskIds: string[];
}
