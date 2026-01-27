import React, { useState } from 'react';
import type { Board } from '../types';

interface SidebarProps {
    boards: Board[];
    activeBoardId: string;
    onSelectBoard: (boardId: string) => void;
    onCreateBoard: () => void;
    onDeleteBoard: (boardId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ boards, activeBoardId, onSelectBoard, onCreateBoard, onDeleteBoard }) => {
    const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

    const handleDeleteClick = (e: React.MouseEvent, boardId: string) => {
        e.stopPropagation();
        setBoardToDelete(boardId);
    };

    const confirmDelete = () => {
        if (boardToDelete) {
            onDeleteBoard(boardToDelete);
            setBoardToDelete(null);
        }
    };

    const cancelDelete = () => {
        setBoardToDelete(null);
    };

    return (
        <div className="w-64 bg-gray-900 text-white h-screen flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold">Meus Quadros</h2>
            </div>

            <div className="grow overflow-y-auto p-2 space-y-2">
                {boards.map((board) => (
                    <div
                        key={board.id}
                        onClick={() => onSelectBoard(board.id)}
                        className={`group flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${activeBoardId === board.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'hover:bg-gray-800 text-gray-300'
                            }`}
                    >
                        <div className="overflow-hidden">
                            <div className="font-medium truncate">{board.title}</div>
                            <div className="text-xs opacity-70 mt-1">
                                {Object.keys(board.columns).length} colunas
                            </div>
                        </div>
                        <button
                            onClick={(e) => handleDeleteClick(e, board.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all"
                            title="Excluir quadro"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {boardToDelete && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white text-gray-800 rounded-lg p-6 shadow-xl w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-2">Excluir Quadro?</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Tem certeza que deseja excluir este quadro? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-medium"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={onCreateBoard}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                >
                    <span>+</span> Novo Quadro
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
