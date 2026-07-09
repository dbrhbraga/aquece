import React, { useState } from 'react';
import { Training } from '../types';
import TrainingItem from './TrainingItem';
import { Plus, Filter, Calendar, Award, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TrainingListProps {
  trainings: Training[];
  userId: string;
  onUpdateTraining: (id: string, field: keyof Training, value: any) => void;
  onDeleteTraining: (id: string) => void;
  onAddTraining: (training: Omit<Training, 'id' | 'userId'>) => void;
}

const PRESETS = [
  { name: 'Rodagem Leve', km: 8, desc: 'Treino de corrida ritmada confortável.' },
  { name: 'Longão de Fim de Semana', km: 16, desc: 'Treino longo com ritmo de resistência.' },
  { name: 'Tiros de 400m', km: 6, desc: 'Intervalado de alta intensidade com descanso ativo.' },
  { name: 'Tempo Run', km: 8, desc: 'Corrida em ritmo de limiar anaeróbico.' },
  { name: 'Regenerativo', km: 5, desc: 'Trote bem leve para recuperação muscular.' },
];

export default function TrainingList({
  trainings,
  userId,
  onUpdateTraining,
  onDeleteTraining,
  onAddTraining,
}: TrainingListProps) {
  // Filter states
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('all');
  
  // Add Training Form state
  const [isAdding, setIsAdding] = useState(false);
  const [week, setWeek] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [plannedKm, setPlannedKm] = useState<number>(8);
  const [dayOfWeek, setDayOfWeek] = useState('Terça-feira');
  const [notes, setNotes] = useState('');

  // Filter trainings belonging to active user
  const userTrainings = trainings.filter((t) => t.userId === userId);

  // Group unique weeks
  const availableWeeks = Array.from(new Set(userTrainings.map((t) => t.week))).sort((a, b) => a - b);

  // Apply week filter
  const filteredTrainings = selectedWeekFilter === 'all'
    ? userTrainings
    : userTrainings.filter((t) => t.week === parseInt(selectedWeekFilter));

  // Group filtered workouts by week
  const trainingsByWeek: { [weekNum: number]: Training[] } = {};
  filteredTrainings.forEach((t) => {
    if (!trainingsByWeek[t.week]) {
      trainingsByWeek[t.week] = [];
    }
    trainingsByWeek[t.week].push(t);
  });

  // Calculate aggregates for a week
  const getWeekStats = (weekNum: number) => {
    const weekWorkouts = userTrainings.filter((t) => t.week === weekNum);
    const planned = weekWorkouts.reduce((sum, t) => sum + t.plannedKm, 0);
    const completed = weekWorkouts.reduce((sum, t) => sum + t.completedKm, 0);
    const completedPercent = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0;
    const totalDone = weekWorkouts.filter((t) => t.done).length;
    const totalCount = weekWorkouts.length;
    return { planned, completed, percent: completedPercent, totalDone, totalCount };
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setDescription(preset.name);
    setPlannedKm(preset.km);
    setNotes(preset.desc);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || plannedKm <= 0 || week <= 0) return;

    onAddTraining({
      week,
      description: description.trim(),
      plannedKm,
      completedKm: 0,
      done: false,
      dayOfWeek,
      notes: notes.trim() || undefined,
    });

    // Reset Form
    setDescription('');
    setNotes('');
    setIsAdding(false);
  };

  // Determine standard week suggestion
  const suggestedWeek = availableWeeks.length > 0 ? Math.max(...availableWeeks) : 1;

  const handleOpenAddForm = () => {
    setWeek(suggestedWeek);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6" id="training-list-root">
      
      {/* Control Bar: Filters & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/[0.02] p-5 border border-white/10 rounded-none shadow-xl">
        {/* Week Filter */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest flex items-center gap-1.5">
            <Filter size={14} className="text-brand-neon" />
            Filtrar:
          </span>
          <div className="relative inline-block w-48">
            <select
              id="week-filter-dropdown"
              value={selectedWeekFilter}
              onChange={(e) => setSelectedWeekFilter(e.target.value)}
              className="w-full bg-[#0F1113] border border-white/20 text-white text-xs font-mono uppercase tracking-widest px-3.5 py-2.5 pr-8 appearance-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 cursor-pointer rounded-none"
            >
              <option value="all">Todas as Semanas</option>
              {availableWeeks.map((w) => (
                <option key={w} value={w} className="bg-[#16181A] text-white">
                  Semana {w}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-white/40">
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        {/* Add Training Trigger Button */}
        {!isAdding && (
          <button
            id="btn-add-training-trigger"
            onClick={handleOpenAddForm}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-mono font-black uppercase tracking-widest text-black bg-brand-neon hover:bg-[#b8e600] active:scale-[0.98] transition-all cursor-pointer rounded-none shadow-md duration-150"
          >
            <Plus size={16} />
            <span>Adicionar Novo Treino</span>
          </button>
        )}
      </div>

      {/* Add Training Form Panel */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-brand-card rounded-none border border-brand-neon/30 p-6 md:p-8 shadow-2xl"
            id="add-training-form-panel"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 uppercase tracking-wide italic">
                <Sparkles size={16} className="text-brand-neon" />
                Criar Novo Treino de Corrida
              </h3>
              <button
                id="close-add-training-form"
                onClick={() => setIsAdding(false)}
                className="text-white/40 hover:text-white font-mono text-xs uppercase tracking-wider cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {/* Presets */}
            <div className="mb-4">
              <span className="block text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2.5">
                Atalhos de Treino Comuns
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-3 py-1.5 text-[10px] font-mono font-bold text-white bg-white/5 border border-white/10 hover:border-brand-neon hover:bg-brand-neon/5 rounded-none transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    {preset.name} ({preset.km}k)
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Week */}
                <div>
                  <label htmlFor="form-week" className="block text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest mb-2">
                    Número da Semana
                  </label>
                  <input
                    id="form-week"
                    type="number"
                    min="1"
                    required
                    value={week}
                    onChange={(e) => setWeek(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-3 bg-[#0F1113] border border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-sm text-white font-mono"
                  />
                </div>

                {/* Day of Week */}
                <div>
                  <label htmlFor="form-day-of-week" className="block text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest mb-2">
                    Dia da Semana
                  </label>
                  <div className="relative">
                    <select
                      id="form-day-of-week"
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(e.target.value)}
                      className="w-full bg-[#0F1113] border border-white/20 text-white text-xs font-mono uppercase tracking-widest rounded-none px-3.5 py-3 appearance-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 cursor-pointer"
                    >
                      <option value="Segunda-feira" className="bg-[#16181A]">Segunda-feira</option>
                      <option value="Terça-feira" className="bg-[#16181A]">Terça-feira</option>
                      <option value="Quarta-feira" className="bg-[#16181A]">Quarta-feira</option>
                      <option value="Quinta-feira" className="bg-[#16181A]">Quinta-feira</option>
                      <option value="Sexta-feira" className="bg-[#16181A]">Sexta-feira</option>
                      <option value="Sábado" className="bg-[#16181A]">Sábado</option>
                      <option value="Domingo" className="bg-[#16181A]">Domingo</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-white/40">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                {/* Planned KM */}
                <div>
                  <label htmlFor="form-planned-km" className="block text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest mb-2">
                    Distância Prevista (km)
                  </label>
                  <input
                    id="form-planned-km"
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={plannedKm}
                    onChange={(e) => setPlannedKm(parseFloat(e.target.value) || 1)}
                    className="w-full px-3.5 py-3 bg-[#0F1113] border border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="form-description" className="block text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest mb-2">
                  Descrição do Treino
                </label>
                <input
                  id="form-description"
                  type="text"
                  required
                  placeholder="Ex: Treino de Tiros Voadores, Longão Rítmico..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#0F1113] border border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-sm text-white font-mono placeholder-white/20"
                />
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="form-notes" className="block text-[9px] font-mono font-bold text-white/50 uppercase tracking-widest mb-2">
                  Observações / Dicas
                </label>
                <input
                  id="form-notes"
                  type="text"
                  placeholder="Ex: Focar na postura, pace alvo de 5:00/km..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-3 bg-[#0F1113] border border-white/20 rounded-none focus:outline-none focus:border-brand-neon focus:ring-1 focus:ring-brand-neon/30 text-sm text-white font-mono placeholder-white/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  id="btn-cancel-new-training"
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-3 text-xs font-mono font-semibold text-white/60 bg-white/5 border border-white/10 rounded-none hover:bg-white/10 transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-new-training"
                  type="submit"
                  className="px-5 py-3 text-xs font-mono font-black text-black bg-brand-neon rounded-none hover:bg-[#b8e600] transition-colors cursor-pointer uppercase tracking-widest shadow-md"
                >
                  Criar Treino
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grouped Workouts List */}
      <div className="space-y-8" id="workouts-weeks-container">
        {userTrainings.length === 0 ? (
          <div className="text-center py-20 bg-brand-card border border-dashed border-white/10 rounded-none" id="no-trainings-slate">
            <Calendar size={36} className="mx-auto text-brand-neon mb-4 animate-pulse" />
            <p className="text-white font-extrabold text-lg uppercase tracking-tight">Sem Planilhas Criadas</p>
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest max-w-sm mx-auto mt-2 leading-relaxed">
              Adicione o seu primeiro treino de corrida clicando no botão acima para começar a preencher sua semana.
            </p>
          </div>
        ) : Object.keys(trainingsByWeek).length === 0 ? (
          <div className="text-center py-12 bg-white/[0.01] border border-white/10 rounded-none" id="no-filtered-workouts">
            <p className="text-white/60 font-mono text-xs uppercase tracking-widest">Nenhum treino encontrado nesta semana selecionada.</p>
          </div>
        ) : (
          Object.keys(trainingsByWeek)
            .map(Number)
            .sort((a, b) => a - b)
            .map((weekNum) => {
              const weekWorkouts = trainingsByWeek[weekNum];
              const stats = getWeekStats(weekNum);

              return (
                <div key={weekNum} className="space-y-4" id={`week-group-${weekNum}`}>
                  {/* Week Header Banner */}
                  <div className="bg-[#16181A] text-white border border-white/10 rounded-none p-6 shadow-xl animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                          <Award size={22} className="text-brand-neon" />
                          <span>Semana {weekNum}</span>
                        </h3>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mt-1">
                          Consolidado semanal de volume de corrida
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black italic tracking-tighter text-brand-neon">
                            {stats.completed.toFixed(1)}k
                          </span>
                          <span className="text-white/60 font-mono text-xs uppercase tracking-widest">
                            de {stats.planned.toFixed(1)}k planejados
                          </span>
                        </div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-white/45">
                          {stats.totalDone} de {stats.totalCount} treinos feitos ({stats.percent}%)
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-5 w-full bg-[#0F1113] border border-white/5 h-2 rounded-none overflow-hidden">
                      <div
                        className="bg-brand-neon h-full rounded-none transition-all duration-500"
                        style={{ width: `${stats.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* List of training workouts for this week */}
                  <div className="space-y-3 pl-0 md:pl-3">
                    {weekWorkouts.map((workout) => (
                      <TrainingItem
                        key={workout.id}
                        training={workout}
                        onUpdate={onUpdateTraining}
                        onDelete={onDeleteTraining}
                      />
                    ))}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
