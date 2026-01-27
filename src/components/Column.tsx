import React, { useState, useEffect } from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Board, Column, Task } from '../types';
import TaskCard from './TaskCard';

interface ColumnProps {
  column: Column;
  tasks: Task[];
  setBoard: React.Dispatch<React.SetStateAction<Board>>;
  deleteColumn: (id: string) => void;
}

const ColumnComponent: React.FC<ColumnProps> = ({ column, tasks, setBoard, deleteColumn }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(column.description || '');

  useEffect(() => {
    setTitle(column.title);
    setDescription(column.description || '');
  }, [column.title, column.description]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
  } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    }
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleAddTask = () => {
    const newTaskId = `task-${Date.now()}-${Math.random()}`;
    const newTask: Task = {
      id: newTaskId,
      content: 'Nova Tarefa',
      completed: false,
      createdAt: Date.now(),
    };
    setBoard(board => ({
      ...board,
      tasks: {
        ...board.tasks,
        [newTaskId]: newTask,
      },
      columns: {
        ...board.columns,
        [column.id]: {
          ...board.columns[column.id],
          taskIds: [...board.columns[column.id].taskIds, newTaskId],
        },
      },
    }));
  };

  const handleTitleChange = (newTitle: string) => {
    setBoard(board => ({
      ...board,
      columns: {
        ...board.columns,
        [column.id]: {
          ...board.columns[column.id],
          title: newTitle,
        }
      }
    }));
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    handleTitleChange(title);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
      handleTitleChange(title);
    }
  };

  const handleDescriptionChange = (newDescription: string) => {
    setBoard(board => ({
      ...board,
      columns: {
        ...board.columns,
        [column.id]: {
          ...board.columns[column.id],
          description: newDescription,
        }
      }
    }));
  };

  const handleDescriptionBlur = () => {
    setIsEditingDescription(false);
    handleDescriptionChange(description);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-100/80 backdrop-blur-sm rounded-2xl p-4 w-80 shrink-0 flex flex-col max-h-full border border-gray-200/50 shadow-sm"
    >
      <div {...attributes} {...listeners} className="cursor-grab mb-4 flex justify-between items-start group" onDoubleClick={() => setIsEditingTitle(true)}>
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="w-full bg-transparent border-b-2 border-blue-500 text-gray-900 font-semibold text-base py-1 px-1"
          />
        ) : (
          <div className="flex flex-col">
            <h2 className="font-semibold text-gray-900 text-base px-1">{column.title}</h2>
            <span className="text-xs text-gray-500 font-medium px-1 mt-0.5">{tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}</span>
          </div>
        )}
        <button
          onClick={() => deleteColumn(column.id)}
          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
      </div>

      <div className="mb-4 min-h-[20px] px-1 cursor-pointer group" onDoubleClick={() => setIsEditingDescription(true)}>
        {isEditingDescription ? (
          <textarea
            value={description}
            autoFocus
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            className="w-full text-sm text-gray-700 bg-white rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-2 shadow-sm"
            rows={2}
          />
        ) : (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors">
            {description || <span className="text-gray-400 italic text-xs">Sem descrição</span>}
          </p>
        )}
      </div>

      <div className="grow overflow-y-auto px-1 -mx-1 custom-scrollbar">
        <SortableContext items={tasks.map(task => task.id)}>
          <div className="space-y-3 pb-2">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} setBoard={setBoard} />
            ))}
          </div>
        </SortableContext>
      </div>

      <button
        onClick={handleAddTask}
        className="mt-3 text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 font-medium py-2 px-3 rounded-lg flex items-center gap-2 transition-colors w-full text-sm"
      >
        <span className="text-lg leading-none">+</span> Adicionar Tarefa
      </button>
    </div>
  );
};

export default ColumnComponent;