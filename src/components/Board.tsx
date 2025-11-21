import React, { useState, useEffect } from 'react';
import { DndContext, type DragEndEvent, type DragOverEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import type { Board, Column, Task } from '../types';
import ColumnComponent from './Column';

const initialBoard: Board = {
  id: 'board-1',
  title: 'Meu Board',
  tasks: {
    'task-1': { id: 'task-1', content: 'Estudar dnd-kit', completed: false, createdAt: 1700000000000 },
    'task-2': { id: 'task-2', content: 'Criar componentes', completed: false, createdAt: 1700000000000 },
    'task-3': { id: 'task-3', content: 'Desenvolver o layout', completed: false, createdAt: 1700000000000 },
  },
  columns: {
    'col-1': {
      id: 'col-1',
      title: 'To Do',
      description: 'Tarefas a serem feitas',
      taskIds: ['task-1', 'task-2'],
    },
    'col-2': {
      id: 'col-2',
      title: 'In Progress',
      description: 'Tarefas em andamento',
      taskIds: ['task-3'],
    },
    'col-3': {
      id: 'col-3',
      title: 'Done',
      description: 'Tarefas concluídas',
      taskIds: [],
    },
  },
  columnOrder: ['col-1', 'col-2', 'col-3'],
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
        const activeColumnIndex = board.columnOrder.indexOf(activeId as string);
        const overColumnIndex = board.columnOrder.indexOf(overId as string);
        return {
          ...board,
          columnOrder: arrayMove(board.columnOrder, activeColumnIndex, overColumnIndex),
        };
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    if (!isActiveATask) return;

    setBoard(board => {
      const findColumnByTaskId = (taskId: string) => {
        return Object.values(board.columns).find(col => col.taskIds.includes(taskId));
      };

      const activeColumn = findColumnByTaskId(activeId);
      let overColumn = board.columns[overId] || findColumnByTaskId(overId);

      if (!activeColumn || !overColumn) return board;
      
      if (activeColumn.id === overColumn.id) {
        // Move task within the same column
        const activeIndex = activeColumn.taskIds.indexOf(activeId);
        const overIndex = overColumn.taskIds.indexOf(overId);
        
        if (activeIndex !== -1 && overIndex !== -1) {
          const newTaskIds = arrayMove(activeColumn.taskIds, activeIndex, overIndex);
          const newColumns = {
            ...board.columns,
            [activeColumn.id]: {
              ...activeColumn,
              taskIds: newTaskIds,
            },
          };
          return { ...board, columns: newColumns };
        }
      } else {
        // Move task to a different column
        const newActiveTaskIds = activeColumn.taskIds.filter(id => id !== activeId);
        const newActiveColumn = {
          ...activeColumn,
          taskIds: newActiveTaskIds,
        };

        const isOverTask = over.data.current?.type === 'Task';
        let newOverTaskIds = [...overColumn.taskIds];

        if (isOverTask) {
          const overIndex = overColumn.taskIds.indexOf(overId);
          if (overIndex !== -1) {
            newOverTaskIds.splice(overIndex, 0, activeId);
          } else {
            newOverTaskIds.push(activeId);
          }
        } else {
           // It's a column
           overColumn = board.columns[overId];
           if(overColumn) {
             newOverTaskIds.push(activeId);
           }
        }
        
        const newOverColumn = {
          ...overColumn,
          taskIds: newOverTaskIds,
        };

        const newColumns = {
          ...board.columns,
          [activeColumn.id]: newActiveColumn,
          [overColumn.id]: newOverColumn,
        };

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
    setBoard(board => {
      const columnToDelete = board.columns[id];
      if (!columnToDelete) return board;

      const tasksToDelete = new Set(columnToDelete.taskIds);
      const newTasks = Object.keys(board.tasks)
        .filter(taskId => !tasksToDelete.has(taskId))
        .reduce((acc, taskId) => {
          acc[taskId] = board.tasks[taskId];
          return acc;
        }, {} as Record<string, Task>);

      const { [id]: deletedColumn, ...remainingColumns } = board.columns;

      const newColumnOrder = board.columnOrder.filter(colId => colId !== id);

      return {
        ...board,
        tasks: newTasks,
        columns: remainingColumns,
        columnOrder: newColumnOrder,
      };
    });
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
          <SortableContext items={board.columnOrder}>
            {board.columnOrder.map(colId => {
              const col = board.columns[colId];
              const tasks = col.taskIds.map(taskId => board.tasks[taskId]);
              return <ColumnComponent key={col.id} column={col} tasks={tasks} setBoard={setBoard} deleteColumn={deleteColumn} />
            })}
          </SortableContext>
          <button
            onClick={() => {
              const newColumnId = `col-${Date.now()}`;
              const newColumn: Column = {
                id: newColumnId,
                title: 'Nova Coluna',
                taskIds: [],
              };
              setBoard(board => ({
                ...board,
                columns: {
                  ...board.columns,
                  [newColumnId]: newColumn,
                },
                columnOrder: [...board.columnOrder, newColumnId],
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