import React, { useState } from 'react';
import { Training } from '../types';
import { Check, Trash2, Calendar, Edit2, FileText, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

interface TrainingItemProps {
  training: Training;
  onUpdate: (id: string, fieldOrFields: keyof Training | Partial<Training>, value?: any) => void;
  onDelete: (id: string) => void;
  key?: string | number;
  isReadOnly?: boolean;
}

export default function TrainingItem({ training, onUpdate, onDelete, isReadOnly = false }: TrainingItemProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(training.notes || '');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // States for editing workout fields
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [editDescription, setEditDescription] = useState(training.description);
  const [editPlannedKm, setEditPlannedKm] = useState(training.plannedKm);
  const [editCompletedKm, setEditCompletedKm] = useState(training.completedKm);
  const [editDayOfWeek, setEditDayOfWeek] = useState(training.dayOfWeek);
  const [editWeek, setEditWeek] = useState(training.week);

  const startEditing = () => {
    setEditDescription(training.description);
    setEditPlannedKm(training.plannedKm);
    setEditCompletedKm(training.completedKm);
    setEditDayOfWeek(training.dayOfWeek);
    setEditWeek(training.week);
    setIsEditingFields(true);
  };

  const handleSaveFields = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editDescription.trim()) return;

    onUpdate(training.id, {
      description: editDescription.trim(),
      plannedKm: Math.max(0, parseFloat(editPlannedKm as any) || 0),
      completedKm: Math.max(0, parseFloat(editCompletedKm as any) || 0),
      dayOfWeek: editDayOfWeek,
      week: parseInt(editWeek as any) || training.week,
    });
    setIsEditingFields(false);
  };

  const handleToggleDone = () => {
    const nextDone = !training.done;
    onUpdate(training.id, 'done', nextDone);
    // If marking as done and completedKm is 0, auto-fill with plannedKm as a helpful shortcut
    if (nextDone && training.completedKm === 0) {
      onUpdate(training.id, 'completedKm', training.plannedKm);
    } else if (!nextDone) {
      // Keep completedKm or set to 0? Let's keep it but allow editing
    }
  };

  const handleKmChange = (val: string) => {
    const num = parseFloat(val);
    const sanitized = isNaN(num) ? 0 : num;
    onUpdate(training.id, 'completedKm', Math.max(0, sanitized));

    // Auto-mark as done if completedKm > 0, or unmark if 0?
    // Let's mark as done if user enters > 0 km and it wasn't done yet, which is intuitive
    if (sanitized > 0 && !training.done) {
      onUpdate(training.id, 'done', true);
    }
  };

  const adjustKm = (amount: number) => {
    const current = training.completedKm;
    const next = Math.max(0, current + amount);
    onUpdate(training.id, 'completedKm', next);

    if (next > 0 && !training.done) {
      onUpdate(training.id, 'done', true);
    } else if (next === 0 && training.done) {
      onUpdate(training.id, 'done', false);
    }
  };

  const saveNotes = () => {
    onUpdate(training.id, 'notes', notesText.trim());
    setIsEditingNotes(false);
  };

  return (
    <>
      {isEditingFields ? (
        <div
          id={`training-card-edit-${training.id}`}
          className="p-5 rounded-none border border-brand-neon/50 bg-[#16181A] shadow-xl"
        >
          <form onSubmit={handleSaveFields} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-[10px] font-mono font-black text-brand-neon uppercase tracking-widest">
                Editar Detalhes do Treino
              </span>
              <button
                type="button"
                onClick={() => setIsEditingFields(false)}
                className="text-white/40 hover:text-white font-mono text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className="space-y-3">
              {/* Description (Nome) */}
              <div>
                <label htmlFor={`edit-desc-${training.id}`} className="block text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest mb-1">
                  Nome do Treino
                </label>
                <input
                  id={`edit-desc-${training.id}`}
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F1113] border border-white/20 rounded-none focus:outline-none focus:border-brand-neon text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Planned KM */}
                <div>
                  <label htmlFor={`edit-planned-${training.id}`} className="block text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest mb-1">
                    Previsto (km)
                  </label>
                  <input
                    id={`edit-planned-${training.id}`}
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={editPlannedKm}
                    onChange={(e) => setEditPlannedKm(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F1113] border border-white/20 rounded-none focus:outline-none focus:border-brand-neon text-xs text-white font-mono"
                  />
                </div>

                {/* Completed KM (Realizados) */}
                <div>
                  <label htmlFor={`edit-completed-${training.id}`} className="block text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest mb-1">
                    Realizado (km)
                  </label>
                  <input
                    id={`edit-completed-${training.id}`}
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={editCompletedKm}
                    onChange={(e) => setEditCompletedKm(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F1113] border border-white/20 rounded-none focus:outline-none focus:border-brand-neon text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Day of Week */}
                <div>
                  <label htmlFor={`edit-day-${training.id}`} className="block text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest mb-1">
                    Dia da Semana
                  </label>
                  <div className="relative">
                    <select
                      id={`edit-day-${training.id}`}
                      value={editDayOfWeek}
                      onChange={(e) => setEditDayOfWeek(e.target.value)}
                      className="w-full bg-[#0F1113] border border-white/20 text-[11px] font-mono uppercase tracking-wider rounded-none px-3 py-2 appearance-none focus:outline-none focus:border-brand-neon cursor-pointer text-white"
                    >
                      <option value="Segunda-feira">Segunda-feira</option>
                      <option value="Terça-feira">Terça-feira</option>
                      <option value="Quarta-feira">Quarta-feira</option>
                      <option value="Quinta-feira">Quinta-feira</option>
                      <option value="Sexta-feira">Sexta-feira</option>
                      <option value="Sábado">Sábado</option>
                      <option value="Domingo">Domingo</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/40">
                      <ChevronDown size={12} />
                    </div>
                  </div>
                </div>

                {/* Week Number */}
                <div>
                  <label htmlFor={`edit-week-${training.id}`} className="block text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest mb-1">
                    Semana
                  </label>
                  <input
                    id={`edit-week-${training.id}`}
                    type="number"
                    min="1"
                    required
                    value={editWeek}
                    onChange={(e) => setEditWeek(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F1113] border border-white/20 rounded-none focus:outline-none focus:border-brand-neon text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-white/5">
              <button
                id={`edit-cancel-${training.id}`}
                type="button"
                onClick={() => setIsEditingFields(false)}
                className="px-3.5 py-2 text-xs font-mono font-semibold text-white/60 bg-white/5 border border-white/10 rounded-none hover:bg-white/10 cursor-pointer uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                id={`edit-save-${training.id}`}
                type="submit"
                className="px-4 py-2 text-xs font-mono font-black text-black bg-brand-neon rounded-none hover:bg-[#b8e600] cursor-pointer uppercase tracking-widest shadow-md"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div
          id={`training-card-${training.id}`}
          className={`p-5 rounded-none border transition-all duration-200 ${
            training.done
              ? 'bg-white/[0.03] border-brand-neon/30 shadow-lg shadow-brand-neon/[0.01]'
              : 'bg-white/[0.01] border-white/10 hover:bg-white/[0.04] shadow-sm'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left Side: Checkbox and Workout Title */}
            <div className="flex items-start gap-4 flex-1">
              <button
                id={`toggle-done-${training.id}`}
                onClick={isReadOnly ? undefined : handleToggleDone}
                disabled={isReadOnly}
                className={`mt-1 flex-shrink-0 w-6 h-6 rounded-none flex items-center justify-center border-2 transition-all duration-150 ${
                  isReadOnly ? 'cursor-not-allowed opacity-65' : 'cursor-pointer hover:border-brand-neon hover:scale-105'
                } ${
                  training.done
                    ? 'bg-brand-neon border-brand-neon text-black font-black'
                    : 'border-white/30'
                }`}
                title={isReadOnly ? (training.done ? "Feito" : "Não feito") : (training.done ? "Marcar como não feito" : "Marcar como feito")}
              >
                {training.done && <Check size={14} strokeWidth={3} />}
              </button>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className={`font-extrabold uppercase tracking-tight text-lg transition-all duration-150 ${
                    training.done ? 'text-white/40 line-through decoration-brand-neon' : 'text-white'
                  }`}>
                    {training.description}
                  </h4>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-white/60 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-none">
                    <Calendar size={10} className="text-brand-neon" />
                    {training.dayOfWeek}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2.5 text-[10px] font-mono uppercase tracking-widest text-white/50">
                  <span>
                    Previsto: <strong className="text-white font-bold">{training.plannedKm} km</strong>
                  </span>
                  <span className="w-1.5 h-1.5 bg-white/20" />
                  <span>
                    Realizado:{' '}
                    <strong className={training.done ? 'text-brand-neon font-black' : 'text-white/85'}>
                      {training.completedKm} km
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Kilometers Completed Selector & Controls */}
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
              {!isReadOnly && (
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">
                    Kms Feitos
                  </span>
                  <div className="flex items-center border border-white/20 rounded-none bg-[#0F1113] overflow-hidden shadow-md h-10">
                    <button
                      id={`km-dec-${training.id}`}
                      onClick={() => adjustKm(-0.5)}
                      className="w-9 h-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors border-r border-white/10 cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <input
                      id={`km-input-${training.id}`}
                      type="number"
                      step="0.1"
                      min="0"
                      value={training.completedKm || ''}
                      onChange={(e) => handleKmChange(e.target.value)}
                      placeholder="0"
                      className="w-12 h-full text-center text-sm font-bold text-white focus:outline-none bg-transparent font-mono"
                    />
                    <button
                      id={`km-inc-${training.id}`}
                      onClick={() => adjustKm(0.5)}
                      className="w-9 h-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors border-l border-white/10 cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons (Show Notes / Delete) */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {isConfirmingDelete ? (
                  <div className="flex items-center gap-1 bg-red-950/20 border border-red-900/30 p-1">
                    <span className="text-[9px] font-mono font-bold text-red-400 uppercase px-1.5 tracking-wider">
                      Excluir?
                    </span>
                    <button
                      id={`confirm-delete-${training.id}`}
                      onClick={() => onDelete(training.id)}
                      className="px-2 py-1 text-[9px] font-mono font-black uppercase text-black bg-red-400 hover:bg-red-500 cursor-pointer"
                    >
                      Sim
                    </button>
                    <button
                      id={`cancel-delete-${training.id}`}
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-2 py-1 text-[9px] font-mono font-bold uppercase text-white/60 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <>
                    {!isReadOnly && (
                      <button
                        id={`edit-fields-btn-${training.id}`}
                        onClick={startEditing}
                        className="p-2.5 text-white/40 hover:text-brand-neon hover:bg-brand-neon/5 rounded-none border border-transparent hover:border-brand-neon/30 transition-all cursor-pointer"
                        title="Editar treino completo"
                      >
                        <Edit2 size={15} />
                      </button>
                    )}

                    <button
                      id={`toggle-notes-${training.id}`}
                      onClick={() => {
                        setShowNotes(!showNotes);
                        if (!showNotes) {
                          setNotesText(training.notes || '');
                        }
                      }}
                      className={`p-2.5 rounded-none border transition-all cursor-pointer ${
                        showNotes || training.notes
                          ? 'bg-brand-neon/10 text-brand-neon border-brand-neon/30 hover:bg-brand-neon/20'
                          : 'text-white/40 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                      title="Observações"
                    >
                      <FileText size={15} />
                    </button>

                    {!isReadOnly && (
                      <button
                        id={`delete-training-${training.id}`}
                        onClick={() => setIsConfirmingDelete(true)}
                        className="p-2.5 text-white/40 hover:text-red-400 hover:bg-red-950/30 rounded-none border border-transparent hover:border-red-900/30 transition-all cursor-pointer"
                        title="Excluir treino"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Expandable Notes Panel */}
          {showNotes && (
            <div className="mt-5 pt-4 border-t border-white/5 bg-[#0F1113]/50 p-4 rounded-none">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-mono font-bold text-white/45 uppercase tracking-widest">
                  Anotações do Treino
                </span>
                {!isEditingNotes && !isReadOnly && (
                  <button
                    id={`edit-notes-btn-${training.id}`}
                    onClick={() => setIsEditingNotes(true)}
                    className="text-[10px] font-mono uppercase tracking-wider text-brand-neon hover:text-[#b8e600] font-bold cursor-pointer"
                  >
                    Editar
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    id={`notes-textarea-${training.id}`}
                    rows={2}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Adicione observações, ex: pace médio, sensação de esforço, dores, clima..."
                    className="w-full p-3 text-sm bg-[#0F1113] border border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 placeholder-white/20 text-white font-sans"
                  />
                  <div className="flex justify-end gap-2.5">
                    <button
                      id={`cancel-notes-btn-${training.id}`}
                      type="button"
                      onClick={() => setIsEditingNotes(false)}
                      className="px-3.5 py-1.5 text-xs font-mono font-semibold text-white/60 bg-white/5 border border-white/10 rounded-none hover:bg-white/10 cursor-pointer uppercase tracking-wider"
                    >
                      Cancelar
                    </button>
                    <button
                      id={`save-notes-btn-${training.id}`}
                      type="button"
                      onClick={saveNotes}
                      className="px-4 py-2 text-xs font-mono font-black text-black bg-brand-neon rounded-none hover:bg-[#b8e600] cursor-pointer uppercase tracking-widest shadow-md"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/70 italic font-sans">
                  {training.notes ? training.notes : 'Nenhuma anotação registrada.'}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
