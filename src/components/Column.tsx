import React, { useState, useEffect } from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Board, Column, Task } from '../types';
import TaskCard from './TaskCard';

interface ColumnProps {
  column: Column;
  setBoard: React.Dispatch<React.SetStateAction<Board>>;
  deleteColumn: (id: string) => void;
}

const ColumnComponent: React.FC<ColumnProps> = ({ column, setBoard, deleteColumn }) => {
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
    const newTask: Task = {
      id: `task-${Date.now()}`,
      content: 'Nova Tarefa',
      completed: false,
      createdAt: Date.now(),
    };
    setBoard(board => {
      const newColumns = board.columns.map(col => {
        if (col.id === column.id) {
          return { ...col, tasks: [...col.tasks, newTask] };
        }
        return col;
      });
      return { ...board, columns: newColumns };
    });
  };

  const handleTitleChange = (newTitle: string) => {
    setBoard(board => {
      const newColumns = board.columns.map(col => 
        col.id === column.id ? { ...col, title: newTitle } : col
      );
      return { ...board, columns: newColumns };
    });
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
    setBoard(board => {
        const newColumns = board.columns.map(col =>
            col.id === column.id ? { ...col, description: newDescription } : col
        );
        return { ...board, columns: newColumns };
    });
  };

  const handleDescriptionBlur = () => {
      setIsEditingDescription(false);
      handleDescriptionChange(description);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-200 rounded-lg p-4 w-80 flex-shrink-0 flex flex-col"
    >
      <div {...attributes} {...listeners} className="cursor-grab mb-2 flex justify-between items-center" onDoubleClick={() => setIsEditingTitle(true)}>
        {isEditingTitle ? (
          <input
            type="text"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="w-full bg-transparent border-b border-gray-400 text-black font-bold text-lg"
          />
        ) : (
          <h2 className="font-bold text-lg">{column.title}</h2>
        )}
        <button onClick={() => deleteColumn(column.id)} className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0">
          X
        </button>
      </div>

      <div className="mb-4 min-h-[20px] cursor-pointer" onDoubleClick={() => setIsEditingDescription(true)}>
        {isEditingDescription ? (
            <textarea
                value={description}
                autoFocus
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                className="w-full text-sm text-gray-600 bg-white rounded border border-gray-400 p-1"
            />
        ) : (
            <p className="text-sm text-gray-600">{description || <span className="text-gray-400">Adicionar descrição...</span>}</p>
        )}
      </div>

      <div className="flex-grow">
        <SortableContext items={column.tasks.map(task => task.id)}>
          <div className="space-y-4">
            {column.tasks.map(task => (
              <TaskCard key={task.id} task={task} setBoard={setBoard} />
            ))}
          </div>
        </SortableContext>
      </div>
      <button
        onClick={handleAddTask}
        className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
      >
        + Adicionar Tarefa
      </button>
    </div>
  );
};

export default ColumnComponent;