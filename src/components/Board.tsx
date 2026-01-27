import React, { useState, useEffect } from 'react';
import { DndContext, type DragEndEvent, type DragOverEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import type { Board, Column, Task } from '../types';
import ColumnComponent from './Column';




interface BoardComponentProps {
  board: Board;
  onBoardUpdate: (newBoard: Board) => void;
  onImportBoard: (importedBoard: Board) => void;
}

const BoardComponent: React.FC<BoardComponentProps> = ({ board, onBoardUpdate, onImportBoard }) => {
  // Removed local state initialization


  const [_activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [_activeTask, setActiveTask] = useState<Task | null>(null);



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
      if (isActiveAColumn) {
        const activeColumnIndex = board.columnOrder.indexOf(activeId as string);
        const overColumnIndex = board.columnOrder.indexOf(overId as string);
        onBoardUpdate({
          ...board,
          columnOrder: arrayMove(board.columnOrder, activeColumnIndex, overColumnIndex),
        });
      }
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

    const findColumnByTaskId = (taskId: string) => {
      return Object.values(board.columns).find(col => col.taskIds.includes(taskId));
    };

    const activeColumn = findColumnByTaskId(activeId);
    let overColumn = board.columns[overId] || findColumnByTaskId(overId);

    if (!activeColumn || !overColumn) return;

    if (activeColumn.id === overColumn.id) {
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
        onBoardUpdate({ ...board, columns: newColumns });
      }
    } else {
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
        overColumn = board.columns[overId];
        if (overColumn) {
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

      onBoardUpdate({ ...board, columns: newColumns });
    }
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
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedBoard = JSON.parse(content) as Board;
          // Basic validation
          if (importedBoard.id && importedBoard.title && importedBoard.columns) {
            onImportBoard(importedBoard);
          } else {
            alert('Arquivo inválido: Estrutura do board incorreta.');
          }
        } catch (error) {
          console.error('Erro ao importar:', error);
          alert('Erro ao importar o arquivo.');
        }
      };
      reader.readAsText(file);
    }
  };

  const deleteColumn = (id: string) => {
    const columnToDelete = board.columns[id];
    if (!columnToDelete) return;

    const tasksToDelete = new Set(columnToDelete.taskIds);
    const newTasks = Object.keys(board.tasks)
      .filter(taskId => !tasksToDelete.has(taskId))
      .reduce((acc, taskId) => {
        acc[taskId] = board.tasks[taskId];
        return acc;
      }, {} as Record<string, Task>);

    const { [id]: deletedColumn, ...remainingColumns } = board.columns;

    const newColumnOrder = board.columnOrder.filter(colId => colId !== id);

    onBoardUpdate({
      ...board,
      tasks: newTasks,
      columns: remainingColumns,
      columnOrder: newColumnOrder,
    });
  };

  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(board.title);

  useEffect(() => {
    setTempTitle(board.title);
  }, [board.title]);

  const handleBoardTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempTitle(e.target.value);
  };

  const handleBoardTitleBlur = () => {
    setIsEditingBoardTitle(false);
    if (tempTitle.trim() !== board.title) {
      onBoardUpdate({ ...board, title: tempTitle });
    }
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
      <div className="h-screen flex flex-col bg-linear-to-br from-gray-50 to-gray-100 text-gray-800 w-full overflow-hidden">
        <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-200/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          {isEditingBoardTitle ? (
            <input
              type="text"
              value={tempTitle}
              autoFocus
              onChange={handleBoardTitleChange}
              onBlur={handleBoardTitleBlur}
              onKeyDown={handleBoardTitleKeyDown}
              className="text-3xl font-bold bg-transparent border-b-2 border-primary-500 focus:outline-none text-gray-900"
            />
          ) : (
            <h1 onDoubleClick={() => setIsEditingBoardTitle(true)} className="text-3xl font-bold cursor-pointer hover:bg-gray-100/50 rounded px-2 -ml-2 transition-colors text-gray-900">
              {board.title}
            </h1>
          )}
          <div className="flex space-x-3">
            <input type="file" id="import-file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            <button
              onClick={() => document.getElementById('import-file')?.click()}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow-md text-sm"
            >
              Importar
            </button>
            <button
              onClick={handleExport}
              className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all hover:shadow-md text-sm"
            >
              Exportar
            </button>
          </div>
        </div>

        <div className="grow overflow-x-auto overflow-y-hidden">
          <div className="flex items-start h-full p-6 md:p-8 space-x-6">
            <SortableContext items={board.columnOrder}>
              {board.columnOrder.map(colId => {
                const col = board.columns[colId];
                const tasks = col.taskIds.map(taskId => board.tasks[taskId]).filter(Boolean);
                return <ColumnComponent key={col.id} column={col} tasks={tasks} setBoard={(updateFn) => {
                  const updatedBoard = typeof updateFn === 'function' ? updateFn(board) : updateFn;
                  onBoardUpdate(updatedBoard);
                }} deleteColumn={deleteColumn} />
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
                onBoardUpdate({
                  ...board,
                  columns: {
                    ...board.columns,
                    [newColumnId]: newColumn,
                  },
                  columnOrder: [...board.columnOrder, newColumnId],
                });
              }}
              className="bg-white/50 hover:bg-white text-gray-600 hover:text-gray-900 font-medium py-3 px-6 rounded-xl border border-dashed border-gray-300 hover:border-gray-400 h-fit shrink-0 w-80 transition-all flex items-center justify-center gap-2"
            >
              <span>+</span> Adicionar Coluna
            </button>
          </div>
        </div>
      </div>
    </DndContext>
  );
};

export default BoardComponent;
