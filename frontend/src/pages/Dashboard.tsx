import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { achievements, tasks } from '../services/api';
import { useAuthStore } from '../hooks/useAuthStore';
import { Avatar } from '../components/character/Avatar';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowUp, Calendar, CheckCircle, Clock, Target, TrendingUp, Trophy, Zap } from 'lucide-react';

const chartTheme = {
  axis: '#9aa6b2',
  grid: '#314154',
  tooltipBg: '#11161d',
  tooltipBorder: '#3f536b',
  text: '#e6e1d3',
};

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasks.getAll(),
  });

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievements.getAll(),
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await tasks.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const taskList = tasksData?.data || [];
  const pendingTasks = taskList.filter((t: any) => t.status === 'pending');
  const completedTasks = taskList.filter((t: any) => t.status === 'completed');
  const inProgressTasks = taskList.filter((t: any) => t.status === 'in_progress');

  const achievementsList = achievementsData?.data || [];
  const achievedCount = achievementsList.filter((a: any) => a.achieved).length;

  const priorityData = stats
    ? [
        { name: 'Simples', value: stats.byPriority?.simple || 0 },
        { name: 'Media', value: stats.byPriority?.medium || 0 },
        { name: 'Critica', value: stats.byPriority?.critical || 0 },
      ]
    : [];

  const statusData = [
    { name: 'Pendentes', value: pendingTasks.length, color: '#d98c3f' },
    { name: 'Em andamento', value: inProgressTasks.length, color: '#6fa8dc' },
    { name: 'Concluidas', value: completedTasks.length, color: '#6ecb63' },
  ];

  const weeklyData = [
    { day: 'Seg', xp: 45 },
    { day: 'Ter', xp: 80 },
    { day: 'Qua', xp: 65 },
    { day: 'Qui', xp: 90 },
    { day: 'Sex', xp: 70 },
    { day: 'Sab', xp: 30 },
    { day: 'Dom', xp: 20 },
  ];

  const xpProgress = user ? (((user.xp % (user.level * 100)) / (user.level * 100)) * 100) : 0;

  const renderTooltip = (value: any, name: any) => [value, name];

  return (
    <div className="space-y-6">
      <section className="tf-panel p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <div className="tf-frame flex h-24 w-24 items-center justify-center overflow-hidden">
              <div className="tf-panel-inset flex h-full w-full items-center justify-center">
                {user && <Avatar data={user.avatar} size="md" />}
              </div>
            </div>
            <div>
              <p className="tf-title text-sm uppercase tracking-[0.18em] text-[color:var(--tf-primary)]">Guild overview</p>
              <h1 className="tf-title mt-2 text-3xl text-[color:var(--tf-text-main)]">Bem-vindo, {user?.name}</h1>
              <p className="mt-2 text-[color:var(--tf-text-muted)]">Continue sua jornada e empilhe conquistas para subir de nivel.</p>
            </div>
          </div>

          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <div className="tf-panel-inset p-4">
              <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-text-dim)]">XP total</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[color:var(--tf-primary)]">
                <Zap className="h-5 w-5" />
                {user?.xp || 0}
              </p>
            </div>
            <div className="tf-panel-inset p-4">
              <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-text-dim)]">Nivel</p>
              <p className="mt-2 text-2xl font-bold text-[color:var(--tf-text-main)]">{user?.level || 1}</p>
            </div>
            <div className="tf-panel-inset p-4">
              <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-text-dim)]">Conquistas</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-[color:var(--tf-success)]">
                <Trophy className="h-5 w-5" />
                {achievedCount}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-[color:var(--tf-text-muted)]">Progresso para o proximo nivel</span>
            <span className="font-semibold text-[color:var(--tf-primary)]">{Math.round(xpProgress)}%</span>
          </div>
          <div className="tf-progress h-4 w-full">
            <div className="tf-progress-bar transition-all duration-500" style={{ width: `${xpProgress}%` }} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Target, label: 'Total', value: taskList.length, color: 'text-[color:var(--tf-primary)]' },
          { icon: Clock, label: 'Pendentes', value: pendingTasks.length, color: 'text-[color:var(--tf-warning)]' },
          { icon: CheckCircle, label: 'Concluidas', value: completedTasks.length, color: 'text-[color:var(--tf-success)]' },
          { icon: TrendingUp, label: 'Esta semana', value: stats?.recentCompleted || 0, color: 'text-[color:var(--tf-info)]' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="tf-panel p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="tf-title text-xs uppercase tracking-[0.16em] text-[color:var(--tf-text-dim)]">{label}</p>
                <p className="mt-3 text-3xl font-bold text-[color:var(--tf-text-main)]">{value}</p>
              </div>
              <div className="tf-panel-inset flex h-12 w-12 items-center justify-center">
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="tf-panel p-5">
          <h3 className="tf-title flex items-center gap-2 text-xl text-[color:var(--tf-text-main)]">
            <Calendar className="h-5 w-5 text-[color:var(--tf-primary)]" />
            Progresso semanal
          </h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d9a441" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#d9a441" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="day" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} />
                <Tooltip
                  formatter={renderTooltip}
                  contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `2px solid ${chartTheme.tooltipBorder}`, borderRadius: '4px', color: chartTheme.text }}
                  labelStyle={{ color: chartTheme.text }}
                />
                <Area type="monotone" dataKey="xp" stroke="#d9a441" fillOpacity={1} fill="url(#colorXp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="tf-panel p-5">
          <h3 className="tf-title flex items-center gap-2 text-xl text-[color:var(--tf-text-main)]">
            <CheckCircle className="h-5 w-5 text-[color:var(--tf-success)]" />
            Distribuicao de tarefas
          </h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={renderTooltip}
                  contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `2px solid ${chartTheme.tooltipBorder}`, borderRadius: '4px', color: chartTheme.text }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {statusData.map((entry) => (
              <div key={entry.name} className="tf-panel-inset flex items-center gap-2 px-3 py-2 text-sm text-[color:var(--tf-text-muted)]">
                <span className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </div>
            ))}
          </div>
        </section>

        <section className="tf-panel p-5">
          <h3 className="tf-title flex items-center gap-2 text-xl text-[color:var(--tf-text-main)]">
            <Target className="h-5 w-5 text-[color:var(--tf-danger)]" />
            Tarefas por prioridade
          </h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="name" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} />
                <Tooltip
                  formatter={renderTooltip}
                  contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `2px solid ${chartTheme.tooltipBorder}`, borderRadius: '4px', color: chartTheme.text }}
                />
                <Bar dataKey="value" fill="#d98c3f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="tf-panel p-5">
          <h3 className="tf-title flex items-center gap-2 text-xl text-[color:var(--tf-text-main)]">
            <ArrowUp className="h-5 w-5 text-[color:var(--tf-info)]" />
            Evolucao de XP
          </h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="day" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} />
                <Tooltip
                  formatter={renderTooltip}
                  contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `2px solid ${chartTheme.tooltipBorder}`, borderRadius: '4px', color: chartTheme.text }}
                />
                <Line type="monotone" dataKey="xp" stroke="#6fa8dc" strokeWidth={2} dot={{ fill: '#6fa8dc' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="tf-panel p-5">
        <h3 className="tf-title text-xl text-[color:var(--tf-text-main)]">Tarefas recentes</h3>
        <div className="mt-4 space-y-3">
          {taskList.slice(0, 5).map((task: any) => (
            <div key={task.id} className="tf-panel-inset flex flex-col gap-3 p-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-[2px]"
                  style={{
                    backgroundColor:
                      task.status === 'completed' ? '#6ecb63' : task.status === 'in_progress' ? '#6fa8dc' : '#d98c3f',
                  }}
                />
                <span className="font-medium text-[color:var(--tf-text-main)]">{task.title}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="tf-badge border border-[color:var(--tf-border-soft)] bg-[rgba(17,22,29,0.65)] text-[color:var(--tf-text-muted)]">
                  {task.priority}
                </span>
                <span className="text-sm font-semibold text-[color:var(--tf-primary)]">+{task.xpReward} XP</span>
              </div>
            </div>
          ))}
          {taskList.length === 0 && <p className="py-4 text-center text-[color:var(--tf-text-muted)]">Nenhuma tarefa ainda. Crie sua primeira!</p>}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
