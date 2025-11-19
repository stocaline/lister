export interface Task {
  id: string;
  content: string;
  completed: boolean;
}

export interface Column {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
}
