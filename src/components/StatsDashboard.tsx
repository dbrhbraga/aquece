import React, { useState, useMemo } from 'react';
import { Training } from '../types';
import { TrendingUp, Flame, Award, Calendar, BarChart2 } from 'lucide-react';

interface StatsDashboardProps {
  trainings: Training[];
  userId: string;
}

export default function StatsDashboard({ trainings, userId }: StatsDashboardProps) {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Filter trainings belonging to active user
  const userTrainings = useMemo(() => {
    return trainings.filter((t) => t.userId === userId);
  }, [trainings, userId]);

  // Aggregate stats by week
  const weeklyData = useMemo(() => {
    // Group training items by week
    const weeksMap: { [weekNum: number]: { planned: number; completed: number; workoutsCount: number; doneCount: number } } = {};
    
    userTrainings.forEach((t) => {
      if (!weeksMap[t.week]) {
        weeksMap[t.week] = { planned: 0, completed: 0, workoutsCount: 0, doneCount: 0 };
      }
      weeksMap[t.week].planned += t.plannedKm;
      weeksMap[t.week].completed += t.completedKm;
      weeksMap[t.week].workoutsCount += 1;
      if (t.done) {
        weeksMap[t.week].doneCount += 1;
      }
    });

    // Convert map to sorted array
    return Object.keys(weeksMap)
      .map(Number)
      .sort((a, b) => a - b)
      .map((weekNum) => ({
        week: weekNum,
        label: `Semana ${weekNum}`,
        planned: parseFloat(weeksMap[weekNum].planned.toFixed(1)),
        completed: parseFloat(weeksMap[weekNum].completed.toFixed(1)),
        workoutsCount: weeksMap[weekNum].workoutsCount,
        doneCount: weeksMap[weekNum].doneCount,
      }));
  }, [userTrainings]);

  // Total sums
  const totalStats = useMemo(() => {
    const planned = userTrainings.reduce((sum, t) => sum + t.plannedKm, 0);
    const completed = userTrainings.reduce((sum, t) => sum + t.completedKm, 0);
    const totalCount = userTrainings.length;
    const completedCount = userTrainings.filter((t) => t.done).length;
    const rate = planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0;
    
    return {
      planned: parseFloat(planned.toFixed(1)),
      completed: parseFloat(completed.toFixed(1)),
      workoutsCount: totalCount,
      completedCount,
      rate,
    };
  }, [userTrainings]);

  // SVG Chart Calculations
  const chartHeight = 220;
  const paddingBottom = 30;
  const paddingTop = 20;
  const paddingLeft = 40;
  const paddingRight = 20;
  
  // Find maximum value to scale the Y axis
  const maxVal = useMemo(() => {
    if (weeklyData.length === 0) return 10;
    const maxValFromWeeks = Math.max(...weeklyData.flatMap((d) => [d.planned, d.completed]));
    return maxValFromWeeks > 0 ? Math.ceil(maxValFromWeeks * 1.15) : 10;
  }, [weeklyData]);

  // Y-axis grid tick values
  const yTicks = useMemo(() => {
    const steps = 4;
    const ticks = [];
    for (let i = 0; i <= steps; i++) {
      ticks.push(parseFloat(((maxVal / steps) * i).toFixed(1)));
    }
    return ticks;
  }, [maxVal]);

  return (
    <div className="space-y-6" id="stats-dashboard-root">
      
      {/* Top Cards Grid - Editorial Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Kilometres Run */}
        <div className="bg-[#16181A] border border-white/10 rounded-none p-5 shadow-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-none bg-brand-neon/10 text-brand-neon flex items-center justify-center flex-shrink-0 border border-brand-neon/20">
            <Flame size={18} />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block">Kms Feitos</span>
            <strong className="text-2xl font-black italic text-white tracking-tighter">{totalStats.completed}k</strong>
            <span className="text-[10px] font-mono text-white/50 block mt-0.5">de {totalStats.planned}k previstos</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-[#16181A] border border-white/10 rounded-none p-5 shadow-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-none bg-brand-neon/10 text-brand-neon flex items-center justify-center flex-shrink-0 border border-brand-neon/20">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block">Aproveitamento</span>
            <strong className="text-2xl font-black italic text-brand-neon tracking-tighter">{totalStats.rate}%</strong>
            <span className="text-[10px] font-mono text-white/50 block mt-0.5">distância cumprida</span>
          </div>
        </div>

        {/* Total Workouts Completed */}
        <div className="bg-[#16181A] border border-white/10 rounded-none p-5 shadow-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-none bg-brand-neon/10 text-brand-neon flex items-center justify-center flex-shrink-0 border border-brand-neon/20">
            <Award size={18} />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block">Treinos Feitos</span>
            <strong className="text-2xl font-black italic text-white tracking-tighter">
              {totalStats.completedCount}/{totalStats.workoutsCount}
            </strong>
            <span className="text-[10px] font-mono text-white/50 block mt-0.5">planilhas concluídas</span>
          </div>
        </div>

        {/* Total Registered Weeks */}
        <div className="bg-[#16181A] border border-white/10 rounded-none p-5 shadow-xl flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-none bg-brand-neon/10 text-brand-neon flex items-center justify-center flex-shrink-0 border border-brand-neon/20">
            <Calendar size={18} />
          </div>
          <div>
            <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest block">Total Semanas</span>
            <strong className="text-2xl font-black italic text-white tracking-tighter">
              {weeklyData.length}
            </strong>
            <span className="text-[10px] font-mono text-white/50 block mt-0.5">semanas com registro</span>
          </div>
        </div>
      </div>

      {/* Main Bar Chart Card - Editorial Style */}
      <div className="bg-[#16181A] border border-white/10 rounded-none p-6 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2 uppercase tracking-wide italic">
              <BarChart2 size={18} className="text-brand-neon" />
              Volume de Kms (Previsto vs Feito)
            </h3>
            <p className="text-xs font-mono uppercase tracking-wider text-white/40 mt-1">
              Análise semanal de cumprimento de meta de volume de treinos.
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-none bg-white/20" />
              <span className="text-white/60">Previsto</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-none bg-brand-neon" />
              <span className="text-white/60">Realizado</span>
            </div>
          </div>
        </div>

        {weeklyData.length === 0 ? (
          <div className="text-center py-20 bg-white/[0.01] border border-white/10 rounded-none" id="no-chart-data">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Adicione treinos em sua planilha para ver o gráfico comparativo.</p>
          </div>
        ) : (
          <div className="relative w-full h-[260px]" id="svg-chart-container">
            {/* Custom SVG responsive chart */}
            <svg className="w-full h-full" viewBox={`0 0 540 ${chartHeight}`} preserveAspectRatio="none">
              {/* Horizontal grid lines */}
              {yTicks.map((tick, index) => {
                const yPos = chartHeight - paddingBottom - ((tick / maxVal) * (chartHeight - paddingTop - paddingBottom));
                return (
                  <g key={tick}>
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={540 - paddingRight}
                      y2={yPos}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={1}
                    />
                    <text
                      x={paddingLeft - 10}
                      y={yPos + 3}
                      textAnchor="end"
                      fill="rgba(255,255,255,0.4)"
                      className="text-[9px] font-mono font-medium"
                    >
                      {tick}k
                    </text>
                  </g>
                );
              })}

              {/* Grouped Bars */}
              {(() => {
                const availableWidth = 540 - paddingLeft - paddingRight;
                const columnCount = weeklyData.length;
                const colWidth = availableWidth / columnCount;
                const barSpacing = 4;
                const groupWidth = Math.min(36, colWidth * 0.7); // strict max bar width
                const singleBarWidth = (groupWidth - barSpacing) / 2;

                return weeklyData.map((data, index) => {
                  const colCenter = paddingLeft + (index * colWidth) + (colWidth / 2);
                  const startX = colCenter - (groupWidth / 2);

                  // Calculate Heights
                  const plannedH = ((data.planned / maxVal) * (chartHeight - paddingTop - paddingBottom));
                  const completedH = ((data.completed / maxVal) * (chartHeight - paddingTop - paddingBottom));

                  // Y coordinates (top of bars)
                  const plannedY = chartHeight - paddingBottom - plannedH;
                  const completedY = chartHeight - paddingBottom - completedH;

                  const isHovered = hoveredBarIndex === index;

                  return (
                    <g
                      key={data.week}
                      onMouseEnter={() => setHoveredBarIndex(index)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      className="cursor-pointer"
                    >
                      {/* Transparent Hover Area for easy clicking/touching */}
                      <rect
                        x={paddingLeft + (index * colWidth)}
                        y={paddingTop}
                        width={colWidth}
                        height={chartHeight - paddingTop - paddingBottom}
                        fill="transparent"
                      />

                      {/* Bar 1: Planned (White/20) */}
                      <rect
                        x={startX}
                        y={plannedY}
                        width={singleBarWidth}
                        height={Math.max(2, plannedH)}
                        rx={0}
                        className={`transition-all duration-150 ${
                          isHovered ? 'fill-white/40' : 'fill-white/20'
                        }`}
                      />

                      {/* Bar 2: Completed (Neon) */}
                      <rect
                        x={startX + singleBarWidth + barSpacing}
                        y={completedY}
                        width={singleBarWidth}
                        height={Math.max(2, completedH)}
                        rx={0}
                        className={`transition-all duration-150 ${
                          isHovered ? 'fill-[#b8e600]' : 'fill-brand-neon'
                        }`}
                      />

                      {/* X Axis Labels */}
                      <text
                        x={colCenter}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        fill={isHovered ? '#CCFF00' : 'rgba(255,255,255,0.4)'}
                        className={`text-[9px] font-mono font-medium transition-all ${isHovered ? 'scale-105' : ''}`}
                      >
                        Sem {data.week}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredBarIndex !== null && weeklyData[hoveredBarIndex] && (
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#0F1113] text-white text-[11px] font-mono px-3.5 py-2.5 rounded-none shadow-2xl border border-brand-neon/40 flex items-center gap-5 z-10 pointer-events-none transition-all duration-150"
                id="chart-tooltip"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] text-brand-neon font-black uppercase tracking-wider">
                    {weeklyData[hoveredBarIndex].label}
                  </span>
                  <span className="text-white/60 mt-0.5">
                    Treinos:{' '}
                    <strong className="text-white">
                      {weeklyData[hoveredBarIndex].doneCount}/{weeklyData[hoveredBarIndex].workoutsCount}
                    </strong>
                  </span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-white/80">
                    Previsto: <strong className="text-white font-bold">{weeklyData[hoveredBarIndex].planned}k</strong>
                  </span>
                  <span className="text-brand-neon">
                    Realizado: <strong className="text-brand-neon font-black">{weeklyData[hoveredBarIndex].completed}k</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Week Breakdown List Table - Editorial Style */}
      <div className="bg-[#16181A] border border-white/10 rounded-none p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-extrabold text-white uppercase tracking-wider italic flex items-center gap-2 mb-6">Detalhamento Semanal</h3>
        {weeklyData.length === 0 ? (
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Nenhum dado consolidado disponível.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/45 font-mono uppercase tracking-[0.18em] text-[10px]">
                  <th className="pb-3 font-semibold">Semana</th>
                  <th className="pb-3 font-semibold">Previsto (km)</th>
                  <th className="pb-3 font-semibold">Realizado (km)</th>
                  <th className="pb-3 font-semibold">Desvio / Saldo</th>
                  <th className="pb-3 font-semibold">Treinos Feitos</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {weeklyData.map((data) => {
                  const diff = data.completed - data.planned;
                  const complianceRate = data.planned > 0 ? (data.completed / data.planned) * 100 : 0;
                  
                  let statusTag = (
                    <span className="inline-flex px-2.5 py-1 rounded-none text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-widest">
                      Parcial
                    </span>
                  );
                  if (complianceRate >= 100) {
                    statusTag = (
                      <span className="inline-flex px-2.5 py-1 rounded-none text-[9px] font-mono font-black bg-brand-neon/10 border border-brand-neon/40 text-brand-neon uppercase tracking-widest">
                        Meta Batida!
                      </span>
                    );
                  } else if (complianceRate < 50) {
                    statusTag = (
                      <span className="inline-flex px-2.5 py-1 rounded-none text-[9px] font-mono font-bold bg-red-500/10 border border-red-500/30 text-red-400 uppercase tracking-widest">
                        Incomplete
                      </span>
                    );
                  }

                  return (
                    <tr key={data.week} className="hover:bg-white/[0.015] transition-colors">
                      <td className="py-4 text-white font-black uppercase tracking-tight text-sm">{data.label}</td>
                      <td className="py-4 text-white/60 font-mono text-xs">{data.planned.toFixed(1)} km</td>
                      <td className="py-4 text-white font-extrabold font-mono text-xs">{data.completed.toFixed(1)} km</td>
                      <td className={`py-4 text-xs font-mono font-bold ${diff >= 0 ? 'text-brand-neon' : 'text-red-400'}`}>
                        {diff >= 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`} km
                      </td>
                      <td className="py-4 text-white/50 font-mono text-xs">
                        {data.doneCount}/{data.workoutsCount} ({Math.round((data.doneCount / data.workoutsCount) * 100)}%)
                      </td>
                      <td className="py-4 text-right">{statusTag}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
