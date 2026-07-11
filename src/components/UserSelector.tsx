import React, { useState } from 'react';
import { User, GroupMember } from '../types';
import { Plus, Trash2, Check, X, Users, User as UserIcon, Network, Filter, Settings2, Sparkles, Target, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserSelectorProps {
  users: User[];
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
  onAddUser: (name: string, type: 'grupo' | 'atleta') => void;
  onDeleteUser: (userId: string) => void;
  onUpdateUser?: (userId: string, fields: Partial<User>) => void;
  groupMembers?: GroupMember[];
  onAddGroupMember?: (groupId: string, name: string, athleteId?: string) => void;
  onAcceptGroupMember?: (memberId: string) => void;
  onDeclineGroupMember?: (memberId: string) => void;
  currentUserId?: string;
}

type FilterType = 'todos' | 'grupos' | 'atletas';

export default function UserSelector({
  users,
  selectedUserId,
  onSelectUser,
  onAddUser,
  onDeleteUser,
  onUpdateUser,
  groupMembers = [],
  onAddGroupMember,
  onAcceptGroupMember,
  onDeclineGroupMember,
  currentUserId,
}: UserSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newProfileType, setNewProfileType] = useState<'grupo' | 'atleta'>('grupo');
  const [activeFilter, setActiveFilter] = useState<FilterType | null>(null);
  const [confirmingDeleteUserId, setConfirmingDeleteUserId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedAthleteIdToInvite, setSelectedAthleteIdToInvite] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilterClick = (filter: FilterType) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filter);
    }
  };

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
    if (!editName.trim() || !selectedUser) return;
    if (selectedUser.ownerId !== currentUserId) {
      console.error('Tentativa não autorizada de editar perfil.');
      return;
    }
    if (onUpdateUser) {
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

  // Helper to check if a profile is accessible/relevant to currentUserId
  const isProfileAccessible = (user: User) => {
    if (!currentUserId) return true;
    
    // 1. If user is the owner of the profile
    if (user.ownerId === currentUserId) return true;
    
    // 2. If the user is an athlete and is in a group owned by the current user
    const userGroups = users.filter(u => u.type === 'grupo' && u.ownerId === currentUserId);
    const inMyGroups = groupMembers?.some(m => 
      m.athleteId === user.id && 
      userGroups.some(g => g.id === m.groupId)
    );
    if (inMyGroups) return true;

    // 3. If the user is a group and the current user's owned athletes are members of it
    const myAthletes = users.filter(u => u.type !== 'grupo' && u.ownerId === currentUserId);
    const isMemberOfGroup = groupMembers?.some(m => 
      m.groupId === user.id && 
      myAthletes.some(a => a.id === m.athleteId)
    );
    if (isMemberOfGroup) return true;

    return false;
  };

  // Filter the list of profiles based on selection and search term
  const filteredUsers = users.filter((user) => {
    const isGroup = user.type === 'grupo';
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // If there is no search query, only show profiles that are owned by or connected to the current user
    if (!searchTerm.trim() && !isProfileAccessible(user)) return false;

    if (activeFilter === 'grupos') return isGroup;
    if (activeFilter === 'atletas') return !isGroup;
    return true; // 'todos'
  });

  return (
    <div className="bg-[#0F1113]/90 rounded-none border border-white/10 p-6 sm:p-8 shadow-2xl mb-8 relative" id="user-selector-container">
      {/* Decorative top bar accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-neon via-indigo-500 to-purple-600" />

      {/* GLOBAL PENDING INVITATIONS BANNER (Visible only for the selected athlete profile) */}
      {(() => {
        const allPendingAthleteInvites = groupMembers?.filter(m => {
          const athleteUser = users.find(u => u.id === m.athleteId);
          return athleteUser && athleteUser.type !== 'grupo' && m.status === 'pending' && m.athleteId === selectedUserId && athleteUser.ownerId === currentUserId;
        }) || [];

        if (allPendingAthleteInvites.length === 0) return null;

        return (
          <div className="mb-6 p-4 sm:p-5 bg-amber-500/[0.03] border border-amber-500/20 text-white rounded-none" id="global-pending-invites-banner">
            <div className="flex items-center gap-2 text-amber-400 mb-3">
              <Users size={16} className="animate-bounce shrink-0" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                Novas Solicitações de Aceite de Grupo ({allPendingAthleteInvites.length})
              </span>
            </div>
            <div className="space-y-2.5">
              {allPendingAthleteInvites.map(member => {
                const athleteName = users.find(u => u.id === member.athleteId)?.name || member.name;
                const groupName = users.find(u => u.id === member.groupId)?.name || 'Grupo Desconhecido';
                return (
                  <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-black/40 border border-white/5">
                    <div>
                      <p className="text-xs font-mono text-white/90">
                        O grupo <span className="text-indigo-400 font-bold">{groupName}</span> convidou o atleta <span className="text-brand-neon font-bold">{athleteName}</span> para se juntar à equipe.
                      </p>
                      <p className="text-[10px] font-mono text-white/40 mt-0.5">
                        Como dono do perfil do atleta, você deve decidir se aceita o convite para integrar o grupo.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        id={`global-accept-${member.id}`}
                        onClick={() => onAcceptGroupMember && onAcceptGroupMember(member.id)}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-[9px] uppercase font-black tracking-wider cursor-pointer rounded-none flex items-center gap-1"
                      >
                        <Check size={11} />
                        <span>Aceitar</span>
                      </button>
                      <button
                        type="button"
                        id={`global-decline-${member.id}`}
                        onClick={() => onDeclineGroupMember && onDeclineGroupMember(member.id)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-[9px] uppercase font-black tracking-wider cursor-pointer rounded-none flex items-center gap-1"
                      >
                        <X size={11} />
                        <span>Recusar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

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
            {selectedUser && selectedUser.ownerId !== currentUserId && (
              <span className="text-[9px] font-mono px-2 py-0.5 border border-white/10 bg-white/[0.02] text-white/40 uppercase tracking-[0.2em]">
                👁️ Perfil Público
              </span>
            )}
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
          {selectedUser && !isEditing && selectedUser.ownerId === currentUserId && (
            <button
              id="btn-edit-athlete-trigger"
              onClick={handleStartEdit}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-widest text-white/80 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer border border-white/10"
            >
              <Settings2 size={13} className="text-brand-neon" />
              <span>Editar Perfil</span>
            </button>
          )}
          {selectedUser && selectedUser.ownerId === currentUserId && !isAdding && (
            <button
              id="btn-add-athlete-trigger"
              onClick={() => {
                setIsAdding(true);
                setIsEditing(false);
                setNewProfileType('grupo');
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-mono font-black uppercase tracking-widest text-black bg-brand-neon hover:bg-[#b8e600] active:scale-[0.98] transition-all cursor-pointer rounded-none shadow-lg shadow-brand-neon/5"
            >
              <Plus size={14} className="stroke-[3]" />
              <span>Adicionar Grupo de Corrida</span>
            </button>
          )}
        </div>
      </div>

      {/* GROUP MEMBERS SECTION (ONLY RENDERED WHEN SELECTED USER IS A GROUP) */}
      {selectedUser?.type === 'grupo' && (() => {
        const athleteUsers = users.filter(u => u.type !== 'grupo');
        const eligibleAthletes = athleteUsers.filter(u => 
          selectedUser && !groupMembers.some(m => m.groupId === selectedUser.id && m.athleteId === u.id)
        );

        return (
          <div className="border border-white/10 bg-white/[0.01] p-5 sm:p-6 mb-6 rounded-none shadow-inner" id="group-members-section">
            {/* Section title & stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Users size={16} className="text-indigo-400" />
                  <span>Membros do Grupo de Corrida / Assessoria</span>
                </h3>
                <p className="text-[10px] font-mono text-white/45 uppercase tracking-widest mt-1">
                  {selectedUser.ownerId === currentUserId 
                    ? "Convide atletas cadastrados e gerencie pendências de aceite"
                    : "Atletas integrantes ativos deste grupo"}
                </p>
              </div>

              {/* Form to invite members by choosing from athlete profiles */}
              {selectedUser.ownerId === currentUserId && eligibleAthletes.length > 0 ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!selectedAthleteIdToInvite || !onAddGroupMember) return;
                    const targetAthlete = users.find(u => u.id === selectedAthleteIdToInvite);
                    if (targetAthlete) {
                      onAddGroupMember(selectedUser.id, targetAthlete.name, targetAthlete.id);
                      setSelectedAthleteIdToInvite('');
                    }
                  }}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <select
                    value={selectedAthleteIdToInvite}
                    onChange={(e) => setSelectedAthleteIdToInvite(e.target.value)}
                    className="bg-black/40 border border-white/15 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 w-full sm:w-52 rounded-none cursor-pointer"
                  >
                    <option value="" className="bg-neutral-900 text-white/40">-- Selecione um atleta --</option>
                    {eligibleAthletes.map(athlete => (
                      <option key={athlete.id} value={athlete.id} className="bg-neutral-900 text-white">
                        {athlete.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!selectedAthleteIdToInvite}
                    className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer flex items-center gap-1 shrink-0 rounded-none"
                  >
                    <Plus size={12} />
                    <span>Convidar</span>
                  </button>
                </form>
              ) : selectedUser.ownerId === currentUserId ? (
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest italic bg-white/[0.02] border border-white/5 px-3 py-2">
                  Nenhum atleta elegível para convidar
                </p>
              ) : null}
            </div>

            {/* Members lists grouped by status */}
            <div className={selectedUser.ownerId === currentUserId ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "max-w-xl"}>
              {/* Column 1: Active members */}
              <div className="space-y-3">
                <span className="block text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest border-b border-emerald-950/40 pb-1.5 mb-2.5">
                  ● Membros Ativos ({groupMembers?.filter(m => m.groupId === selectedUser.id && m.status === 'accepted').length || 0})
                </span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {groupMembers?.filter(m => m.groupId === selectedUser.id && m.status === 'accepted').map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 bg-black/20 border border-white/5 hover:border-white/10 transition-all rounded-none"
                    >
                      <span className="text-xs font-mono text-white/90">{member.name}</span>
                      {selectedUser.ownerId === currentUserId && (
                        <button
                          type="button"
                          onClick={() => onDeclineGroupMember && onDeclineGroupMember(member.id)}
                          className="p-1 text-red-400/60 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer border border-transparent hover:border-red-900/30 rounded-none"
                          title="Remover Atleta"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {(groupMembers?.filter(m => m.groupId === selectedUser.id && m.status === 'accepted').length || 0) === 0 && (
                    <p className="text-[10px] font-mono text-white/30 italic uppercase py-3 text-center border border-dashed border-white/5">
                      Nenhum atleta ativo no grupo.
                    </p>
                  )}
                </div>
              </div>

              {/* Column 2: Pending approval members */}
              {selectedUser.ownerId === currentUserId && (
                <div className="space-y-3">
                  <span className="block text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest border-b border-amber-950/40 pb-1.5 mb-2.5">
                    ▲ Aguardando Aceite / Pendentes ({groupMembers?.filter(m => m.groupId === selectedUser.id && m.status === 'pending').length || 0})
                  </span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {groupMembers?.filter(m => m.groupId === selectedUser.id && m.status === 'pending').map(member => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-3 bg-amber-500/[0.02] border border-amber-500/20 rounded-none transition-all"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-white/90 font-bold">{member.name}</span>
                          <span className="text-[8px] font-mono text-amber-400/80 uppercase tracking-widest mt-0.5 animate-pulse">Pendente de aceite</span>
                        </div>
                        {/* Notice that only the athlete profile owner can click Accept, so here we ONLY show Decline / Cancel option */}
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-white/30 italic uppercase mr-1">
                            Aguardando atleta...
                          </span>
                          {selectedUser.ownerId === currentUserId && (
                            <button
                              type="button"
                              onClick={() => onDeclineGroupMember && onDeclineGroupMember(member.id)}
                              className="p-1.5 text-rose-400 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 transition-colors cursor-pointer rounded-none"
                              title="Cancelar Convite"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {(groupMembers?.filter(m => m.groupId === selectedUser.id && m.status === 'pending').length || 0) === 0 && (
                      <p className="text-[10px] font-mono text-white/30 italic uppercase py-3 text-center border border-dashed border-white/5">
                        Nenhuma solicitação pendente.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ATHLETE GROUPS & INVITES SECTION (ONLY RENDERED WHEN SELECTED USER IS AN ATHLETE AND OWNED BY CURRENT USER) */}
      {selectedUser && selectedUser.type !== 'grupo' && selectedUser.ownerId === currentUserId && (
        <div className="space-y-4 mb-6">
          {/* 1. Pending invitations from groups */}
          {groupMembers?.filter(m => m.athleteId === selectedUser.id && m.status === 'pending').length > 0 && (
            <div className="border border-amber-500/20 bg-amber-500/[0.02] p-5 rounded-none" id="athlete-pending-invites">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 mb-3">
                <Users size={16} className="text-amber-400 animate-bounce" />
                <span>Convites de Grupos de Corrida Pendentes</span>
              </h3>
              <div className="space-y-3">
                {groupMembers?.filter(m => m.athleteId === selectedUser.id && m.status === 'pending').map(member => {
                  const groupName = users.find(u => u.id === member.groupId)?.name || 'Grupo Desconhecido';
                  return (
                    <div 
                      key={member.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-black/40 border border-amber-500/10 rounded-none"
                    >
                      <div>
                        <p className="text-xs font-mono text-white/90">
                          O grupo <span className="text-amber-400 font-bold">{groupName}</span> convidou você para se juntar à equipe deles!
                        </p>
                        <p className="text-[10px] font-mono text-white/45 uppercase tracking-widest mt-1">
                          Sua planilha de treinos poderá ser visualizada no grupo após o aceite.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onAcceptGroupMember && onAcceptGroupMember(member.id)}
                          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer rounded-none flex items-center gap-1.5"
                        >
                          <Check size={12} />
                          <span>Aceitar Convite</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeclineGroupMember && onDeclineGroupMember(member.id)}
                          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer rounded-none flex items-center gap-1.5"
                        >
                          <X size={12} />
                          <span>Recusar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Active groups */}
          {groupMembers?.filter(m => m.athleteId === selectedUser.id && m.status === 'accepted').length > 0 && (
            <div className="border border-white/10 bg-white/[0.01] p-4 rounded-none" id="athlete-active-groups">
              <span className="block text-[10px] font-mono font-bold text-white/45 uppercase tracking-widest mb-2.5">
                👥 Seus Grupos de Corrida / Assessorias
              </span>
              <div className="flex flex-wrap gap-2">
                {groupMembers?.filter(m => m.athleteId === selectedUser.id && m.status === 'accepted').map(member => {
                  const groupName = users.find(u => u.id === member.groupId)?.name || 'Grupo de Corrida';
                  return (
                    <div 
                      key={member.id} 
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-none"
                    >
                      <span className="text-xs font-mono text-indigo-300">{groupName}</span>
                      <button
                        type="button"
                        onClick={() => onDeclineGroupMember && onDeclineGroupMember(member.id)}
                        className="text-white/40 hover:text-rose-400 font-mono text-[10px] uppercase font-bold cursor-pointer ml-1 p-0.5 border border-transparent hover:border-rose-900/30 hover:bg-rose-950/20"
                        title="Sair do Grupo"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FILTER TABS & SEARCH UTILITY (ALWAYS VISIBLE) */}
      <div className="flex items-center justify-between border-t border-b border-white/5 py-4 mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-1">
          <button
            type="button"
            onClick={() => handleFilterClick('todos')}
            className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
              activeFilter === 'todos'
                ? 'bg-white/10 text-white font-bold border-b border-brand-neon'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            type="button"
            onClick={() => handleFilterClick('grupos')}
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
            type="button"
            onClick={() => handleFilterClick('atletas')}
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

        <div className="relative flex items-center w-full sm:w-72 mt-2 sm:mt-0">
          <span className="absolute left-3 text-white/40">
            <Search size={12} />
          </span>
          <input
            id="profile-search-input"
            type="text"
            placeholder="BUSCAR ATLETA OU GRUPO..."
            value={searchTerm}
            onChange={(e) => {
              const val = e.target.value;
              setSearchTerm(val);
              // Auto-open active filter to 'todos' if it is closed and user is typing
              if (val.trim() && activeFilter === null) {
                setActiveFilter('todos');
              }
            }}
            className="w-full pl-9 pr-8 py-2 bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-brand-neon placeholder-white/20 rounded-none uppercase tracking-wider"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 p-0.5 text-white/40 hover:text-white cursor-pointer"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* GRID OF PROFILES (OPENED ONLY WHEN FILTER IS ACTIVE OR USER IS SEARCHING) */}
      <AnimatePresence>
        {(activeFilter !== null || searchTerm.trim() !== '') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pb-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredUsers.map((user) => {
                const isSelected = user.id === selectedUserId;
                const isGroup = user.type === 'grupo';
                
                return (
                  <div key={user.id} className="relative group">
                    <button
                      id={`user-btn-${user.id}`}
                      onClick={() => {
                        onSelectUser(user.id);
                        setActiveFilter(null); // Contract list after choosing profile as requested
                        setIsAdding(false);
                        setIsEditing(false);
                      }}
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-xs font-mono uppercase tracking-wider truncate ${
                            isSelected 
                              ? isGroup ? 'text-indigo-400 font-bold' : 'text-brand-neon font-bold' 
                              : 'text-white/80'
                          }`}>
                            {user.name}
                          </p>
                          {!isGroup && groupMembers?.some(m => m.athleteId === user.id && m.status === 'pending') && (
                            <span className="px-1.5 py-0.5 text-[8px] font-mono font-black bg-amber-500 text-black animate-pulse uppercase tracking-wider shrink-0">
                              Convite
                            </span>
                          )}
                        </div>
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
                    {user.ownerId === currentUserId && (
                      confirmingDeleteUserId === user.id ? (
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
                              className="px-3 py-1 text-[8px] font-mono font-black uppercase text-black bg-[#f87171] hover:bg-[#ef4444] cursor-pointer"
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
                      )
                    )}
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="col-span-full border border-dashed border-white/10 py-8 px-4 text-center">
                  <p className="text-xs font-mono text-white/30 uppercase tracking-widest">
                    {searchTerm 
                      ? `Nenhum perfil encontrado para "${searchTerm}"` 
                      : 'Nenhum perfil encontrado nesta categoria.'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  Novo Grupo de Corrida / Assessoria
                </span>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)} 
                  className="text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* NAME INPUT */}
              <div>
                <label htmlFor="new-profile-name" className="block text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2">
                  Nome do Grupo de Corrida / Assessoria
                </label>
                <input
                  id="new-profile-name"
                  type="text"
                  placeholder="Ex: Assessoria USP Performance"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-[#070809] border rounded-none focus:outline-none focus:ring-1 text-white font-mono placeholder-white/20 transition-all border-white/15 focus:border-indigo-500 focus:ring-indigo-500/20"
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
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-3 text-xs font-mono font-black uppercase tracking-widest text-black disabled:opacity-30 disabled:cursor-not-allowed rounded-none transition-all cursor-pointer shadow-md bg-indigo-400 hover:bg-indigo-500"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  <span>Cadastrar Grupo</span>
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
