import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Board, Task } from '../types';

interface TaskCardProps {
  task: Task;
  setBoard: React.Dispatch<React.SetStateAction<Board>>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, setBoard }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(task.content);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleContentChange = (newContent: string) => {
    setBoard(board => {
      const newColumns = board.columns.map(col => ({
        ...col,
        tasks: col.tasks.map(t => t.id === task.id ? { ...t, content: newContent } : t)
      }));
      return { ...board, columns: newColumns };
    });
  };

  const handleToggleCompleted = () => {
    setBoard(board => {
      const newColumns = board.columns.map(col => ({
        ...col,
        tasks: col.tasks.map(t => {
          if (t.id === task.id) {
            const isCompleted = !t.completed;
            return {
              ...t,
              completed: isCompleted,
              completedAt: isCompleted ? Date.now() : null,
            };
          }
          return t;
        })
      }));
      return { ...board, columns: newColumns };
    });
  };

  const handleDelete = () => {
    setBoard(board => {
      const newColumns = board.columns.map(col => {
        const newTasks = col.tasks.filter(t => t.id !== task.id);
        return { ...col, tasks: newTasks };
      });
      return { ...board, columns: newColumns };
    });
  };

  const handleBlur = () => {
    setIsEditing(false);
    handleContentChange(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      setIsEditing(false);
      handleContentChange(content);
    }
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="bg-white p-3 rounded-md shadow-sm">
        <textarea
          value={content}
          autoFocus
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none text-black resize-none"
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded-md shadow-sm flex items-center space-x-2"
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggleCompleted}
        className="form-checkbox h-5 w-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
      />
      <p onDoubleClick={() => setIsEditing(true)} className={`flex-grow ${task.completed ? 'line-through text-gray-500' : ''}`}>
        {task.content}
      </p>
      <button onClick={handleDelete} className="text-gray-400 hover:text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default TaskCard;
