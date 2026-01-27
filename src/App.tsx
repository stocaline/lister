import { useState, useEffect } from 'react';
import BoardComponent from './components/Board';
import Sidebar from './components/Sidebar';
import type { Board } from './types';

const blankBoardTemplate: Board = {
  id: 'board-1',
  title: 'Meu Novo Board',
  tasks: {},
  columns: {
    'col-1': {
      id: 'col-1',
      title: 'To Do',
      description: '',
      taskIds: [],
    },
  },
  columnOrder: ['col-1'],
  createdAt: 0, // Fallback for template, will be overwritten
};

const App: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);

  // Migration and Initialization
  useEffect(() => {
    const savedBoards = localStorage.getItem('boards');

    // 1. If boards exist, load them
    if (savedBoards) {
      const parsedBoards = JSON.parse(savedBoards);
      if (parsedBoards.length > 0) {
        setBoards(parsedBoards);
        setActiveBoardId(parsedBoards[0].id);
        return;
      }
    }

    // 2. If no boards, check for legacy single board
    const savedLegacyBoard = localStorage.getItem('board');
    if (savedLegacyBoard) {
      const legacyBoard = JSON.parse(savedLegacyBoard);
      // Basic validation
      if (legacyBoard.columnOrder && legacyBoard.columnOrder.length >= 0) {
        const migratedBoards = [legacyBoard];
        setBoards(migratedBoards);
        setActiveBoardId(legacyBoard.id);
        // Persist immediately to new format
        localStorage.setItem('boards', JSON.stringify(migratedBoards));
        // Optional: Remove legacy key? Maybe keep for safety for now.
        return;
      }
    }

    // 3. Fallback: Create new blank board
    const newBoard = { ...blankBoardTemplate, id: `board-${Date.now()}`, createdAt: Date.now() };
    setBoards([newBoard]);
    setActiveBoardId(newBoard.id);
  }, []);

  // Persistence
  useEffect(() => {
    if (boards.length > 0) {
      localStorage.setItem('boards', JSON.stringify(boards));
    }
  }, [boards]);

  const activeBoard = boards.find(b => b.id === activeBoardId);

  const handleUpdateBoard = (updatedBoard: Board) => {
    setBoards(prev => prev.map(b => b.id === updatedBoard.id ? updatedBoard : b));
  };

  const handleCreateBoard = () => {

    const newBoard = {
      ...blankBoardTemplate,
      id: `board-${Date.now()}`,
      title: `Novo Quadro ${boards.length + 1}`,
      createdAt: Date.now(),
    };
    setBoards(prev => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
  };

  const handleDeleteBoard = (boardId: string) => {
    const newBoards = boards.filter(b => b.id !== boardId);

    // If we deleted the last board, create a new one
    if (newBoards.length === 0) {
      const newBoard = { ...blankBoardTemplate, id: `board-${Date.now()}`, createdAt: Date.now() };
      setBoards([newBoard]);
      setActiveBoardId(newBoard.id);
      return;
    }

    setBoards(newBoards);

    // If we deleted the active board, switch to the first available
    if (activeBoardId === boardId) {
      setActiveBoardId(newBoards[0].id);
    }
  };

  const handleImportBoard = (importedBoard: Board) => {
    if (!activeBoardId) return;

    setBoards(prev => prev.map(b => b.id === activeBoardId ? importedBoard : b));
    setActiveBoardId(importedBoard.id);
  };

  if (!activeBoard) return <div className="h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        boards={[...boards].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))}
        activeBoardId={activeBoardId || ''}
        onSelectBoard={setActiveBoardId}
        onCreateBoard={handleCreateBoard}
        onDeleteBoard={handleDeleteBoard}
      />
      <div className="grow h-full overflow-hidden bg-[#f5f5f5]">
        <BoardComponent
          key={activeBoard.id} // Re-mount when switching boards to reset internal non-persisted state if any
          board={activeBoard}
          onBoardUpdate={handleUpdateBoard}
          onImportBoard={handleImportBoard}
        />
      </div>
    </div>
  );
};

export default App;