import React, { useState } from 'react';
import { User } from '../types';
import { Plus, Trash2, Check, X, Users, User as UserIcon, Network, Filter, Settings2, Sparkles, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserSelectorProps {
  users: User[];
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
  onAddUser: (name: string, type: 'grupo' | 'atleta') => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUser?: (userId: string, fields: Partial<User>) => void;
}

type FilterType = 'todos' | 'grupos' | 'atletas';

export default function UserSelector({
  users,
  selectedUserId,
  onSelectUser,
  onAddUser,
  onDeleteUser,
  onUpdateUser,
}: UserSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newProfileType, setNewProfileType] = useState<'grupo' | 'atleta'>('grupo');
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
  const [confirmingDeleteUserId, setConfirmingDeleteUserId] = useState<string | null>(null);

  // Editing state variables
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editVolume, setEditVolume] = useState<string>('');

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    onAddUser(newUserName.trim(), newProfileType);
    setNewUserName('');
    setIsAdding(false);
  };

  const handleStartEdit = () => {
    if (!selectedUser) return;
    setEditName(selectedUser.name);
    setEditGoal(selectedUser.targetGoal || '');
    setEditVolume(selectedUser.weeklyVolumeTarget ? selectedUser.weeklyVolumeTarget.toString() : '');
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    if (onUpdateUser && selectedUser) {
      onUpdateUser(selectedUser.id, {
        name: editName.trim(),
        targetGoal: editGoal.trim() || undefined,
        weeklyVolumeTarget: editVolume.trim() ? parseFloat(editVolume) : undefined,
      });
    }
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Filter the list of profiles based on selection
  const filteredUsers = users.filter((user) => {
    const isGroup = user.type === 'grupo';
    if (activeFilter === 'grupos') return isGroup;
    if (activeFilter === 'atletas') return !isGroup;
    return true; // 'todos'
  });

  return (
    <div className="bg-[#0F1113]/90 rounded-none border border-white/10 p-6 sm:p-8 shadow-2xl mb-8 relative" id="user-selector-container">
      {/* Decorative top bar accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-neon via-indigo-500 to-purple-600" />

      {/* Header section with brand info & actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Network size={14} className="text-brand-neon" />
            <span className="text-[10px] font-mono text-brand-neon uppercase tracking-[0.25em]">Sua Rede de Corrida</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-white flex flex-wrap items-center gap-3 mt-1.5 uppercase">
            <span>{selectedUser?.name || 'Selecione um Perfil'}</span>
            <span className={`text-[9px] font-mono px-2 py-0.5 border uppercase tracking-[0.2em] ${
              selectedUser?.type === 'grupo'
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'bg-brand-neon/10 border-brand-neon/30 text-brand-neon'
            }`}>
              {selectedUser?.type === 'grupo' ? '👥 Grupo de Corrida' : '🏃 Atleta da Rede'}
            </span>
          </h2>
          {/* Display Goal and Weekly Volume Target below name if present */}
          {(selectedUser?.targetGoal || selectedUser?.weeklyVolumeTarget) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2.5">
              {selectedUser.targetGoal && (
                <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 px-2.5 py-1">
                  <Target size={11} className="text-brand-neon" />
                  <span className="text-[9px] font-mono text-white/40 uppercase">Foco:</span>
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">{selectedUser.targetGoal}</span>
                </div>
              )}
              {selectedUser.weeklyVolumeTarget && (
                <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 px-2.5 py-1">
                  <Sparkles size={11} className="text-brand-neon" />
                  <span className="text-[9px] font-mono text-white/40 uppercase">Volume Alvo:</span>
                  <span className="text-xs font-mono font-bold text-brand-neon">{selectedUser.weeklyVolumeTarget} km / sem</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons to trigger Add/Edit User Form */}
        <div className="flex flex-wrap gap-2.5 self-start md:self-center">
          {selectedUser && !isEditing && (
            <button
              id="btn-edit-athlete-trigger"
              onClick={handleStartEdit}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-widest text-white/80 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer border border-white/10"
            >
              <Settings2 size={13} className="text-brand-neon" />
              <span>Editar Perfil</span>
            </button>
          )}
          {!isAdding && (
            <button
              id="btn-add-athlete-trigger"
              onClick={() => {
                setIsAdding(true);
                setIsEditing(false);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-mono font-black uppercase tracking-widest text-black bg-brand-neon hover:bg-[#b8e600] active:scale-[0.98] transition-all cursor-pointer rounded-none shadow-lg shadow-brand-neon/5"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Adicionar Grupo / Atleta</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER TABS & SEARCH UTILITY */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-1">
          <button
            onClick={() => setActiveFilter('todos')}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              activeFilter === 'todos'
                ? 'bg-white/10 text-white font-bold'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setActiveFilter('grupos')}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'grupos'
                ? 'bg-indigo-500/20 text-indigo-300 font-bold border-b border-indigo-500'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Users size={11} />
            Grupos ({users.filter(u => u.type === 'grupo').length})
          </button>
          <button
            onClick={() => setActiveFilter('atletas')}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'atletas'
                ? 'bg-brand-neon/20 text-brand-neon font-bold border-b border-brand-neon'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <UserIcon size={11} />
            Atletas ({users.filter(u => u.type !== 'grupo').length})
          </button>
        </div>

        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest hidden sm:block">
          Selecione abaixo para gerenciar a planilha ativa
        </p>
      </div>

      {/* Grid of Profiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredUsers.map((user) => {
          const isSelected = user.id === selectedUserId;
          const isGroup = user.type === 'grupo';
          
          return (
            <div key={user.id} className="relative group">
              <button
                id={`user-btn-${user.id}`}
                onClick={() => onSelectUser(user.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-none text-left border transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? isGroup 
                      ? 'border-indigo-500 bg-indigo-500/[0.06] text-indigo-400'
                      : 'border-brand-neon bg-brand-neon/5 text-brand-neon'
                    : 'border-white/5 hover:border-white/20 bg-[#070809]/40 hover:bg-[#070809]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-none flex items-center justify-center text-white font-bold text-xs bg-gradient-to-br ${user.avatarColor} shadow-md relative`}
                >
                  {getInitials(user.name)}
                  {/* Miniature category icon on corner of avatar */}
                  <span className={`absolute -bottom-1 -right-1 p-0.5 text-black border border-[#0F1113] rounded-full text-[8px] ${
                    isGroup ? 'bg-indigo-400' : 'bg-brand-neon'
                  }`}>
                    {isGroup ? <Users size={8} /> : <UserIcon size={8} />}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0 pr-4">
                  <p className={`text-xs font-mono uppercase tracking-wider truncate ${
                    isSelected 
                      ? isGroup ? 'text-indigo-400 font-bold' : 'text-brand-neon font-bold' 
                      : 'text-white/80'
                  }`}>
                    {user.name}
                  </p>
                  <span className="text-[8px] font-mono text-white/35 block uppercase tracking-widest mt-0.5">
                    {isGroup ? 'Assessoria/Grupo' : 'Atleta Individual'}
                  </span>
                </div>

                {isSelected && (
                  <span className={`w-2.5 h-2.5 rounded-full shadow-sm animate-pulse flex-shrink-0 ${
                    isGroup ? 'bg-indigo-400' : 'bg-brand-neon'
                  }`} />
                )}
              </button>

              {/* Delete Button with Safety Check */}
              {confirmingDeleteUserId === user.id ? (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 bg-[#070809] border border-red-500/50 flex flex-col items-center justify-center p-2 z-20"
                >
                  <p className="text-[8px] font-mono font-bold text-red-400 uppercase tracking-wider mb-1.5 text-center px-2 leading-tight">
                    Remover {isGroup ? 'grupo' : 'atleta'} e seus treinos?
                  </p>
                  <div className="flex gap-2">
                    <button
                      id={`confirm-delete-user-${user.id}`}
                      onClick={() => {
                        onDeleteUser(user.id);
                        setConfirmingDeleteUserId(null);
                      }}
                      className="px-3 py-1 text-[8px] font-mono font-black uppercase text-black bg-red-400 hover:bg-red-500 cursor-pointer"
                    >
                      Remover
                    </button>
                    <button
                      id={`cancel-delete-user-${user.id}`}
                      onClick={() => setConfirmingDeleteUserId(null)}
                      className="px-3 py-1 text-[8px] font-mono font-bold uppercase text-white/60 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
                    >
                      Manter
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
                  className="absolute top-2.5 right-2.5 p-1 rounded-none bg-black text-red-400/60 hover:text-red-400 hover:bg-red-950/40 border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                  title={`Remover ${isGroup ? 'Grupo' : 'Atleta'}`}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="col-span-full border border-dashed border-white/10 py-8 px-4 text-center">
            <p className="text-xs font-mono text-white/30 uppercase tracking-widest">
              Nenhum perfil encontrado nesta categoria.
            </p>
          </div>
        )}
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
            <form onSubmit={handleSubmit} className="bg-white/[0.01] border border-white/5 p-5 sm:p-6 rounded-none space-y-5">
              
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[10px] font-mono text-brand-neon uppercase tracking-widest font-bold">
                  Novo Cadastro de Performance
                </span>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)} 
                  className="text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* PROFILE TYPE CARDS SELECTOR */}
              <div>
                <label className="block text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2.5">
                  Selecione o Tipo de Perfil
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Option 1: Running Group */}
                  <div
                    onClick={() => setNewProfileType('grupo')}
                    className={`p-4 border cursor-pointer transition-all ${
                      newProfileType === 'grupo'
                        ? 'border-indigo-500 bg-indigo-500/[0.04]'
                        : 'border-white/5 bg-[#070809]/30 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-full ${newProfileType === 'grupo' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-white/40'}`}>
                        <Users size={16} />
                      </div>
                      <span className={`text-xs font-mono uppercase tracking-wider font-bold ${newProfileType === 'grupo' ? 'text-indigo-400' : 'text-white/80'}`}>
                        Grupo de Corrida
                      </span>
                      {newProfileType === 'grupo' && <Check size={12} className="text-indigo-400 ml-auto" />}
                    </div>
                    <p className="text-[10px] text-white/55 leading-relaxed font-mono pl-0.5">
                      Ideal para assessorias, equipes de corrida ou treinos coletivos com planilha única.
                    </p>
                  </div>

                  {/* Option 2: Athlete Profile */}
                  <div
                    onClick={() => setNewProfileType('atleta')}
                    className={`p-4 border cursor-pointer transition-all ${
                      newProfileType === 'atleta'
                        ? 'border-brand-neon bg-brand-neon/5'
                        : 'border-white/5 bg-[#070809]/30 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`p-1.5 rounded-full ${newProfileType === 'atleta' ? 'bg-brand-neon/10 text-brand-neon' : 'bg-white/5 text-white/40'}`}>
                        <UserIcon size={16} />
                      </div>
                      <span className={`text-xs font-mono uppercase tracking-wider font-bold ${newProfileType === 'atleta' ? 'text-brand-neon' : 'text-white/80'}`}>
                        Atleta da Rede
                      </span>
                      {newProfileType === 'atleta' && <Check size={12} className="text-brand-neon ml-auto" />}
                    </div>
                    <p className="text-[10px] text-white/55 leading-relaxed font-mono pl-0.5">
                      Ideal para planilhas individuais, alunos de personal ou treinos individuais de amigos.
                    </p>
                  </div>

                </div>
              </div>

              {/* NAME INPUT */}
              <div>
                <label htmlFor="new-profile-name" className="block text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2">
                  {newProfileType === 'grupo' ? 'Nome do Grupo de Corrida / Assessoria' : 'Nome Completo do Atleta da Rede'}
                </label>
                <input
                  id="new-profile-name"
                  type="text"
                  placeholder={newProfileType === 'grupo' ? 'Ex: Assessoria USP Performance' : 'Ex: Déborah Braga'}
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className={`w-full px-4 py-3 text-sm bg-[#070809] border rounded-none focus:outline-none focus:ring-1 text-white font-mono placeholder-white/20 transition-all ${
                    newProfileType === 'grupo'
                      ? 'border-white/15 focus:border-indigo-500 focus:ring-indigo-500/20'
                      : 'border-white/15 focus:border-brand-neon focus:ring-brand-neon/30'
                  }`}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  id="cancel-add-user"
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewUserName('');
                  }}
                  className="px-4 py-3 text-xs font-mono font-semibold text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 rounded-none transition-all cursor-pointer uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  id="submit-add-user"
                  type="submit"
                  disabled={!newUserName.trim()}
                  className={`inline-flex items-center justify-center gap-1.5 px-5 py-3 text-xs font-mono font-black uppercase tracking-widest text-black disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all cursor-pointer shadow-md ${
                    newProfileType === 'grupo'
                      ? 'bg-indigo-400 hover:bg-indigo-500'
                      : 'bg-brand-neon hover:bg-[#b8e600]'
                  }`}
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  <span>Cadastrar {newProfileType === 'grupo' ? 'Grupo' : 'Atleta'}</span>
                </button>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide down / Animate User editing form */}
      <AnimatePresence>
        {isEditing && selectedUser && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-6 pt-6 border-t border-white/10"
          >
            <form onSubmit={handleSaveEdit} className="bg-white/[0.01] border border-white/5 p-5 sm:p-6 rounded-none space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[10px] font-mono text-brand-neon uppercase tracking-widest font-bold flex items-center gap-2">
                  <Settings2 size={12} />
                  Editar Perfil: {selectedUser.name}
                </span>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NAME INPUT */}
                <div className="col-span-1">
                  <label htmlFor="edit-profile-name" className="block text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2">
                    Nome do {selectedUser.type === 'grupo' ? 'Grupo / Assessoria' : 'Atleta'}
                  </label>
                  <input
                    id="edit-profile-name"
                    type="text"
                    placeholder="Ex: Assessoria USP Performance"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-[#070809] border border-white/15 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-white font-mono rounded-none focus:outline-none"
                    required
                  />
                </div>

                {/* TARGET GOAL INPUT */}
                <div className="col-span-1">
                  <label htmlFor="edit-profile-goal" className="block text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2">
                    Meta / Foco Principal (Opcional)
                  </label>
                  <input
                    id="edit-profile-goal"
                    type="text"
                    placeholder="Ex: Maratona do Rio ou Emagrecimento"
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-[#070809] border border-white/15 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-white font-mono rounded-none focus:outline-none"
                  />
                </div>

                {/* WEEKLY VOLUME TARGET */}
                <div className="col-span-1">
                  <label htmlFor="edit-profile-volume" className="block text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2">
                    Volume Alvo Semanal (km, Opcional)
                  </label>
                  <input
                    id="edit-profile-volume"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ex: 50"
                    value={editVolume}
                    onChange={(e) => setEditVolume(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-[#070809] border border-white/15 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-white font-mono rounded-none focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  id="cancel-edit-user"
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-3 text-xs font-mono font-semibold text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 rounded-none transition-all cursor-pointer uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  id="submit-edit-user"
                  type="submit"
                  disabled={!editName.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3 text-xs font-mono font-black uppercase tracking-widest text-black bg-brand-neon hover:bg-[#b8e600] disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all cursor-pointer shadow-md"
                >
                  <Check size={14} className="stroke-[2.5]" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
