import React, { useState } from 'react';
import { User } from '../types';
import { Plus, Trash2, UserPlus, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserSelectorProps {
  users: User[];
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
  onAddUser: (name: string) => void;
  onDeleteUser: (userId: string) => void;
}

export default function UserSelector({
  users,
  selectedUserId,
  onSelectUser,
  onAddUser,
  onDeleteUser,
}: UserSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [confirmingDeleteUserId, setConfirmingDeleteUserId] = useState<string | null>(null);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    onAddUser(newUserName.trim());
    setNewUserName('');
    setIsAdding(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="bg-brand-card rounded-none border border-white/10 p-8 shadow-2xl mb-8" id="user-selector-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <span className="text-[10px] font-mono text-brand-neon uppercase tracking-[0.25em]">Atleta Ativo</span>
          <h2 className="text-3xl font-black italic tracking-tighter text-white flex items-center gap-3 mt-1 uppercase">
            <span>{selectedUser?.name}</span>
            <span className="text-[9px] font-mono px-2 py-0.5 bg-white/5 border border-white/10 text-white/50 uppercase tracking-[0.2em]">
              Runner
            </span>
          </h2>
        </div>

        {/* Action Button to trigger Add User Form */}
        {!isAdding && (
          <button
            id="btn-add-athlete-trigger"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-5 py-3 text-xs font-mono font-black uppercase tracking-widest text-black bg-brand-neon hover:bg-[#b8e600] active:scale-[0.98] transition-all cursor-pointer rounded-none shadow-md"
          >
            <UserPlus size={14} />
            <span>Adicionar Atleta</span>
          </button>
        )}
      </div>

      {/* User Avatar Horizontal List */}
      <div className="flex flex-wrap items-center gap-4">
        {users.map((user) => {
          const isSelected = user.id === selectedUserId;
          return (
            <div key={user.id} className="relative group">
              <button
                id={`user-btn-${user.id}`}
                onClick={() => onSelectUser(user.id)}
                className={`flex items-center gap-3 p-3 pr-5 rounded-none text-left border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'border-brand-neon bg-brand-neon/5 text-brand-neon'
                    : 'border-white/10 hover:border-white/30 bg-[#0F1113]/50 hover:bg-[#0F1113]'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-none flex items-center justify-center text-white font-bold text-xs bg-gradient-to-br ${user.avatarColor} shadow-md`}
                >
                  {getInitials(user.name)}
                </div>
                <div className="max-w-[130px] truncate">
                  <p className={`text-xs font-mono uppercase tracking-wider truncate ${isSelected ? 'text-brand-neon font-bold' : 'text-white/80'}`}>
                    {user.name}
                  </p>
                </div>
                {isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-neon shadow-sm animate-pulse" />
                )}
              </button>

              {/* Delete Button */}
              {confirmingDeleteUserId === user.id ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 bg-black/95 border border-red-500/50 flex flex-col items-center justify-center p-2 z-20"
                >
                  <p className="text-[8px] font-mono font-bold text-red-400 uppercase tracking-wider mb-1.5 text-center">
                    Excluir atleta?
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      id={`confirm-delete-user-${user.id}`}
                      onClick={() => {
                        onDeleteUser(user.id);
                        setConfirmingDeleteUserId(null);
                      }}
                      className="px-2 py-0.5 text-[8px] font-mono font-black uppercase text-black bg-red-400 hover:bg-red-500 cursor-pointer"
                    >
                      Sim
                    </button>
                    <button
                      id={`cancel-delete-user-${user.id}`}
                      onClick={() => setConfirmingDeleteUserId(null)}
                      className="px-2 py-0.5 text-[8px] font-mono font-bold uppercase text-white/60 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
                    >
                      Não
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  id={`delete-user-${user.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingDeleteUserId(user.id);
                  }}
                  className="absolute -top-1.5 -right-1.5 p-1 rounded-none bg-black text-red-400 hover:bg-red-950 hover:text-red-300 border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                  title="Remover atleta"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Slide down / Animate User addition form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-6 pt-6 border-t border-white/10"
          >
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-end gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-none">
              <div className="w-full flex-1">
                <label htmlFor="new-athlete-name" className="block text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest mb-2">
                  Nome Completo do Atleta
                </label>
                <input
                  id="new-athlete-name"
                  type="text"
                  placeholder="Ex: Pedro Alvares"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-[#0F1113] border border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 placeholder-white/20 text-white font-mono"
                  autoFocus
                />
              </div>
              <div className="flex gap-2.5 w-full md:w-auto">
                <button
                  id="cancel-add-user"
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewUserName('');
                  }}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-mono font-semibold text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 rounded-none transition-all cursor-pointer uppercase tracking-wider"
                >
                  <X size={14} />
                  <span>Cancelar</span>
                </button>
                <button
                  id="submit-add-user"
                  type="submit"
                  disabled={!newUserName.trim()}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-3 text-xs font-mono font-black uppercase tracking-widest text-black bg-brand-neon hover:bg-[#b8e600] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all cursor-pointer shadow-md"
                >
                  <Plus size={14} />
                  <span>Criar Atleta</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
