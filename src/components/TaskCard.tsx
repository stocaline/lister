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
    setBoard(board => ({
      ...board,
      tasks: {
        ...board.tasks,
        [task.id]: {
          ...board.tasks[task.id],
          content: newContent,
        },
      },
    }));
  };

  const handleToggleCompleted = () => {
    setBoard(board => {
      const isCompleted = !board.tasks[task.id].completed;
      return {
        ...board,
        tasks: {
          ...board.tasks,
          [task.id]: {
            ...board.tasks[task.id],
            completed: isCompleted,
            completedAt: isCompleted ? Date.now() : null,
          }
        }
      }
    });
  };

  const handleDelete = () => {
    setBoard(board => {
      const { [task.id]: deletedTask, ...remainingTasks } = board.tasks;

      const column = Object.values(board.columns).find(c => c.taskIds.includes(task.id));

      if (!column) return board;

      return {
        ...board,
        tasks: remainingTasks,
        columns: {
          ...board.columns,
          [column.id]: {
            ...column,
            taskIds: column.taskIds.filter(id => id !== task.id),
          },
        },
      };
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
      <div ref={setNodeRef} style={style} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200/50 ring-2 ring-blue-500/20">
        <textarea
          value={content}
          autoFocus
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent border-none text-gray-900 resize-none text-sm leading-relaxed focus:ring-0 p-0"
          rows={Math.max(2, content.split('\n').length)}
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
      className={`group bg-white p-4 rounded-xl shadow-sm border border-gray-200/50 hover:shadow-md hover:border-blue-300/50 transition-all flex items-start space-x-3 cursor-grab active:cursor-grabbing ${task.completed ? 'opacity-60 bg-gray-50' : ''}`}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={handleToggleCompleted}
        className="mt-0.5 form-checkbox h-4 w-4 text-blue-600 bg-gray-50 border-gray-300 rounded focus:ring-blue-500 cursor-pointer transition-colors"
      />
      <div className="grow min-w-0" onDoubleClick={() => setIsEditing(true)}>
        <p className={`text-sm leading-relaxed whitespace-pre-wrap wrap-break-word ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
          {task.content}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {task.createdAt && (
            <span className="text-[10px] text-gray-400 font-medium">
              {new Date(task.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={handleDelete}
        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        title="Excluir tarefa"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default TaskCard;