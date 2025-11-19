import React, { useState, useEffect } from 'react';
import { DndContext, type DragEndEvent, type DragOverEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import type { Board, Column, Task } from '../types';
import ColumnComponent from './Column';

const initialBoard: Board = {
  id: 'board-1',
  title: 'Meu Board',
  columns: [
    {
      id: 'col-1',
      title: 'To Do',
      description: 'Tarefas a serem feitas',
      tasks: [
        { id: 'task-1', content: 'Estudar dnd-kit', completed: false },
        { id: 'task-2', content: 'Criar componentes', completed: false },
      ],
    },
    {
      id: 'col-2',
      title: 'In Progress',
      description: 'Tarefas em andamento',
      tasks: [
        { id: 'task-3', content: 'Desenvolver o layout', completed: false },
      ],
    },
    {
      id: 'col-3',
      title: 'Done',
      description: 'Tarefas concluídas',
      tasks: [],
    },
  ],
};

const BoardComponent: React.FC = () => {
  const [board, setBoard] = useState<Board>(() => {
    const savedBoard = localStorage.getItem('board');
    return savedBoard ? JSON.parse(savedBoard) : initialBoard;
  });

  const [_activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [_activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    localStorage.setItem('board', JSON.stringify(board));
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Column') {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === 'Column';

    if (isActiveAColumn) {
      setBoard(board => {
        const activeColumnIndex = board.columns.findIndex(col => col.id === activeId);
        const overColumnIndex = board.columns.findIndex(col => col.id === overId);
        return {
          ...board,
          columns: arrayMove(board.columns, activeColumnIndex, overColumnIndex),
        };
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    if (!isActiveATask) return;

    setBoard(board => {
      const findColumn = (id: string | number) => board.columns.find(col => col.id === id || col.tasks.some(task => task.id === id));
      
      const activeColumn = findColumn(activeId);
      const overColumn = findColumn(overId);

      if (!activeColumn || !overColumn) return board;

      const activeTask = activeColumn.tasks.find(task => task.id === activeId);
      if (!activeTask) return board;

      // Handle moving within the same column
      if (activeColumn.id === overColumn.id) {
        const activeIndex = activeColumn.tasks.findIndex(t => t.id === activeId);
        const overIndex = overColumn.tasks.findIndex(t => t.id === overId);

        if (activeIndex !== -1 && overIndex !== -1) {
          const newTasks = arrayMove(activeColumn.tasks, activeIndex, overIndex);
          const newColumns = board.columns.map(col => {
            if (col.id === activeColumn.id) {
              return { ...col, tasks: newTasks };
            }
            return col;
          });
          return { ...board, columns: newColumns };
        }
      } else { // Handle moving to a different column
        const newActiveTasks = activeColumn.tasks.filter(t => t.id !== activeId);
        let newOverTasks = [...overColumn.tasks];

        const isOverTask = over.data.current?.type === 'Task';
        if (isOverTask) {
          const overIndex = overColumn.tasks.findIndex(t => t.id === overId);
          if (overIndex !== -1) {
            newOverTasks.splice(overIndex, 0, activeTask);
          } else {
            newOverTasks.push(activeTask);
          }
        } else {
          newOverTasks.push(activeTask);
        }

        const newColumns = board.columns.map(col => {
          if (col.id === activeColumn.id) {
            return { ...col, tasks: newActiveTasks };
          }
          if (col.id === overColumn.id) {
            return { ...col, tasks: newOverTasks };
          }
          return col;
        });

        return { ...board, columns: newColumns };
      }
      return board;
    });
  };

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(board, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "board.json";
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = e => {
        if (e.target && e.target.result) {
          setBoard(JSON.parse(e.target.result as string));
        }
      };
    }
  };

  const deleteColumn = (id: string) => {
    setBoard(board => ({
      ...board,
      columns: board.columns.filter(col => col.id !== id),
    }));
  };

  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState(board.title);

  useEffect(() => {
    setBoardTitle(board.title);
  }, [board.title]);

  const handleBoardTitleChange = (newTitle: string) => {
    setBoard(b => ({ ...b, title: newTitle }));
  };

  const handleBoardTitleBlur = () => {
    setIsEditingBoardTitle(false);
    handleBoardTitleChange(boardTitle);
  };

  const handleBoardTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBoardTitleBlur();
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="p-10 min-h-screen bg-[#f5f5f5] text-gray-800">
        <div className="flex justify-between items-center mb-8">
          {isEditingBoardTitle ? (
            <input
              type="text"
              value={boardTitle}
              autoFocus
              onChange={(e) => setBoardTitle(e.target.value)}
              onBlur={handleBoardTitleBlur}
              onKeyDown={handleBoardTitleKeyDown}
              className="text-4xl font-bold bg-transparent border-b-2 border-gray-400 focus:outline-none"
            />
          ) : (
            <h1 onDoubleClick={() => setIsEditingBoardTitle(true)} className="text-4xl font-bold cursor-pointer">
              {board.title}
            </h1>
          )}
          <div className="flex space-x-2">
            <input type="file" id="import-file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            <button
              onClick={() => document.getElementById('import-file')?.click()}
              className="bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded border border-gray-300"
            >
              Importar JSON
            </button>
            <button
              onClick={handleExport}
              className="bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded border border-gray-300"
            >
              Exportar JSON
            </button>
          </div>
        </div>
        <div className="flex items-start space-x-4 overflow-x-auto pb-4">
          <SortableContext items={board.columns.map(col => col.id)}>
            {board.columns.map(col => (
              <ColumnComponent key={col.id} column={col} setBoard={setBoard} deleteColumn={deleteColumn} />
            ))}
          </SortableContext>
          <button
            onClick={() => {
              const newColumn: Column = {
                id: `col-${Date.now()}`,
                title: 'Nova Coluna',
                tasks: [],
              };
              setBoard(board => ({
                ...board,
                columns: [...board.columns, newColumn],
              }));
            }}
            className="bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded border border-gray-300 h-fit flex-shrink-0"
          >
            + Adicionar Coluna
          </button>
        </div>
      </div>
    </DndContext>
  );
};

export default BoardComponent;
