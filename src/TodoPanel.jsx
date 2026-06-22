import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Flame, Calendar, Tag, FilterX, ListTodo, CheckCircle,
  ChevronLeft, ChevronRight, Sparkles, CheckCircle2, Circle,
  Trash2, Edit2, X, ChevronDown, AlertCircle,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const TAG_COLORS = {
  blue:    { bg: 'bg-info-soft',    text: 'text-info',    border: 'border-info/30',    dot: 'bg-info',    label: 'Blue' },
  rose:    { bg: 'bg-danger-soft',    text: 'text-danger',    border: 'border-danger/30',    dot: 'bg-danger',    label: 'Rose' },
  amber:   { bg: 'bg-warning-soft',   text: 'text-warning',   border: 'border-warning/30',   dot: 'bg-warning',   label: 'Amber' },
  emerald: { bg: 'bg-success-soft', text: 'text-success', border: 'border-success/30', dot: 'bg-success', label: 'Emerald' },
  purple:  { bg: 'bg-special-soft',  text: 'text-special',  border: 'border-special/30',  dot: 'bg-special',  label: 'Purple' },
  orange:  { bg: 'bg-warning-soft',  text: 'text-warning',  border: 'border-warning/30',  dot: 'bg-warning',  label: 'Orange' },
  pink:    { bg: 'bg-special-soft',    text: 'text-special',    border: 'border-special/30',    dot: 'bg-special',    label: 'Pink' },
  slate:   { bg: 'bg-bg-subtle/10',   text: 'text-text-muted',   border: 'border-border-strong/30',   dot: 'bg-bg-subtle',   label: 'Slate' },
};

const INITIAL_TAG_CONFIGS = [
  { id: 'work',     name: 'Work',     color: 'blue' },
  { id: 'health',   name: 'Health',   color: 'emerald' },
  { id: 'code',     name: 'Code',     color: 'blue' },
  { id: 'personal', name: 'Personal', color: 'pink' },
  { id: 'home',     name: 'Home',     color: 'slate' },
  { id: 'urgent',   name: 'Urgent',   color: 'rose' },
  { id: 'finance',  name: 'Finance',  color: 'amber' },
  { id: 'bids',     name: 'Bids',     color: 'purple' },
];

const DEFAULT_BUCKETS = [
  { id: 'high',      name: 'High Priority',   color: 'rose' },
  { id: 'medium',    name: 'Medium Priority', color: 'amber' },
  { id: 'low',       name: 'Low Priority',    color: 'sky' },
  { id: 'completed', name: 'Completed',       color: 'emerald' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['S','M','T','W','T','F','S'];

// ── Utility helpers ──────────────────────────────────────────────────────────

function formatDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getRelativeDateString(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatDateString(d);
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth()    === d2.getMonth()    &&
         d1.getDate()     === d2.getDate();
}

function getCalendarDays(year, month) {
  const days = [];
  const firstDay = new Date(year, month, 1);
  const firstDow = firstDay.getDay();
  const prevLast = new Date(year, month, 0);

  for (let i = firstDow - 1; i >= 0; i--) {
    const dv = prevLast.getDate() - i;
    const obj = new Date(prevLast.getFullYear(), prevLast.getMonth(), dv);
    days.push({ dateString: formatDateString(obj), dayOfMonth: dv, isCurrentMonth: false, isToday: isSameDay(obj, new Date()) });
  }
  const lastDay = new Date(year, month + 1, 0);
  for (let dv = 1; dv <= lastDay.getDate(); dv++) {
    const obj = new Date(year, month, dv);
    days.push({ dateString: formatDateString(obj), dayOfMonth: dv, isCurrentMonth: true, isToday: isSameDay(obj, new Date()) });
  }
  const remaining = 42 - days.length;
  for (let dv = 1; dv <= remaining; dv++) {
    const obj = new Date(year, month + 1, dv);
    days.push({ dateString: formatDateString(obj), dayOfMonth: dv, isCurrentMonth: false, isToday: isSameDay(obj, new Date()) });
  }
  return days;
}

function getTagConfig(tagName, tagConfigs) {
  const norm = tagName.toLowerCase().trim();
  const found = tagConfigs.find(tc => tc.id === norm || tc.name.toLowerCase().trim() === norm);
  return found || { id: norm, name: tagName, color: 'slate' };
}

function getInitialTasks() {
  const today = getRelativeDateString(0);
  const tomorrow = getRelativeDateString(1);
  return [
    { id: 'todo-1', title: 'Review active bids', description: 'Check SAM.gov for any updates on submitted solicitations.', bucketId: 'high', dueDate: today, order: 0, completed: false, tags: ['Bids', 'Urgent'], createdAt: new Date().toISOString() },
    { id: 'todo-2', title: 'Update bid tracker spreadsheet', description: 'Log new solicitations from this week\'s Friday run.', bucketId: 'medium', dueDate: tomorrow, order: 0, completed: false, tags: ['Work', 'Bids'], createdAt: new Date().toISOString() },
  ];
}

function loadTasks() {
  try {
    const d = localStorage.getItem('todo_calendar_tasks');
    if (d) return JSON.parse(d);
  } catch {}
  return getInitialTasks();
}
function saveTasks(tasks) {
  try { localStorage.setItem('todo_calendar_tasks', JSON.stringify(tasks)); } catch {}
}
function loadTagConfigs() {
  try {
    const d = localStorage.getItem('todo_calendar_tag_configs');
    if (d) return JSON.parse(d);
  } catch {}
  return INITIAL_TAG_CONFIGS;
}
function saveTagConfigs(configs) {
  try { localStorage.setItem('todo_calendar_tag_configs', JSON.stringify(configs)); } catch {}
}

// ── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ task, buckets, tagConfigs, onToggleComplete, onEdit, onDelete, onDragStart, onDragEnd, onDragOverTask }) {
  let borderColor = 'border-border/45';
  if (task.bucketId === 'high')      borderColor = 'border-danger';
  else if (task.bucketId === 'medium') borderColor = 'border-warning';
  else if (task.bucketId === 'low')    borderColor = 'border-accent';
  else if (task.bucketId === 'completed') borderColor = 'border-success/80';

  const bucket = buckets.find(b => b.id === task.bucketId);
  const isOverdue = useMemo(() => {
    if (!task.dueDate || task.completed) return false;
    return task.dueDate < formatDateString(new Date());
  }, [task.dueDate, task.completed]);

  return (
    <div
      id={`task-card-${task.id}`}
      draggable
      onDragStart={e => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onDragOver={e => onDragOverTask(e, task.id)}
      className={`group relative flex flex-col p-3 rounded-md border border-border bg-surface-raised hover:border-accent transition-all duration-150 cursor-grab active:cursor-grabbing border-l-[4px] ${borderColor} ${task.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button onClick={() => onToggleComplete(task.id)} className="mt-0.5 text-text-muted hover:text-accent transition-colors shrink-0 cursor-pointer">
            {task.completed
              ? <CheckCircle2 className="w-4 h-4 text-success" />
              : <Circle className="w-4 h-4" />}
          </button>
          <h4 className={`font-semibold text-text text-[12px] leading-snug break-words flex-1 ${task.completed ? 'line-through' : ''}`}>
            {task.title}
          </h4>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(task)} className="p-1 rounded text-text-muted hover:text-accent hover:bg-bg-app transition-colors cursor-pointer">
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 rounded text-text-muted hover:text-danger hover:bg-bg-app transition-colors cursor-pointer">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mt-1 text-[11px] text-text-muted leading-relaxed line-clamp-2">{task.description}</p>
      )}

      <div className="mt-2 pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-1">
        <div className="flex flex-wrap items-center gap-1">
          {task.tags && task.tags.length > 0
            ? task.tags.map(tag => {
                const cfg = getTagConfig(tag, tagConfigs);
                const ci = TAG_COLORS[cfg.color] || TAG_COLORS.slate;
                return (
                  <span key={tag} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] ${ci.bg} ${ci.text} ${ci.border}`}>
                    <Tag className="w-2.5 h-2.5 opacity-65" />{cfg.name}
                  </span>
                );
              })
            : <span className="text-[9px] text-text-muted uppercase font-mono tracking-wider">{bucket?.name || 'task'}</span>
          }
        </div>
        {task.dueDate && (
          <div className={`flex items-center gap-1 font-mono text-[9px] ${isOverdue ? 'text-danger font-bold' : 'text-text-muted'}`}>
            <Calendar className="w-3 h-3 opacity-80" />
            {task.dueDate}
          </div>
        )}
      </div>
    </div>
  );
}

// ── CalendarView ─────────────────────────────────────────────────────────────

function CalendarView({ tasks, selectedDate, onSelectDate, onMoveTaskToDate, onQuickAddTask }) {
  const [viewMode, setViewMode] = useState('month');
  const [anchorDate, setAnchorDate] = useState(() => {
    if (selectedDate) {
      const p = new Date(selectedDate + 'T00:00:00');
      if (!isNaN(p.getTime())) return p;
    }
    return new Date();
  });
  const [draggedOverDate, setDraggedOverDate] = useState(null);

  useEffect(() => {
    if (selectedDate) {
      const p = new Date(selectedDate + 'T00:00:00');
      if (!isNaN(p.getTime())) setAnchorDate(p);
    }
  }, [selectedDate]);

  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();

  const days = useMemo(() => {
    if (viewMode === 'month') return getCalendarDays(year, month);
    const sun = new Date(anchorDate);
    sun.setDate(sun.getDate() - sun.getDay());
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sun);
      d.setDate(sun.getDate() + i);
      const s = formatDateString(d);
      return { dateString: s, dayOfMonth: d.getDate(), isCurrentMonth: d.getMonth() === month, isToday: isSameDay(d, today) };
    });
  }, [viewMode, anchorDate, year, month]);

  const weekHeaderStr = useMemo(() => {
    const sun = new Date(anchorDate);
    sun.setDate(sun.getDate() - sun.getDay());
    const sat = new Date(sun); sat.setDate(sat.getDate() + 6);
    const sm = MONTH_NAMES[sun.getMonth()].slice(0, 3);
    const em = MONTH_NAMES[sat.getMonth()].slice(0, 3);
    return sun.getMonth() === sat.getMonth()
      ? `${sm} ${sun.getDate()} - ${sat.getDate()}, ${sat.getFullYear()}`
      : `${sm} ${sun.getDate()} - ${em} ${sat.getDate()}, ${sat.getFullYear()}`;
  }, [anchorDate]);

  const nav = dir => {
    const n = new Date(anchorDate);
    viewMode === 'month' ? n.setMonth(n.getMonth() + dir) : n.setDate(n.getDate() + 7 * dir);
    setAnchorDate(n);
  };

  const goToday = () => {
    const t = new Date();
    setAnchorDate(t);
    onSelectDate(formatDateString(t));
  };

  return (
    <div className="flex flex-col bg-surface border border-border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-1 pb-3 mb-3 border-b border-border">
        <div>
          <h3 className="font-bold text-text text-[13px] leading-tight">
            {viewMode === 'month' ? `${MONTH_NAMES[month]} ${year}` : weekHeaderStr}
          </h3>
          <span className="text-[9px] text-text-muted font-bold uppercase mt-0.5 tracking-wider">
            {viewMode === 'month' ? 'Monthly grid' : 'Weekly cycle'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex bg-bg-app border border-border p-0.5 rounded text-[10px] mr-0.5">
            {['month','week'].map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${viewMode === v ? 'bg-accent text-text' : 'text-text-muted hover:text-text'}`}>
                {v === 'month' ? 'Mo' : 'Wk'}
              </button>
            ))}
          </div>
          <button onClick={goToday} className="px-2 py-1 rounded bg-surface-raised hover:bg-border/60 border border-border text-[10px] font-bold text-text cursor-pointer">Today</button>
          <button onClick={() => nav(-1)} className="p-1 rounded bg-surface-raised hover:bg-border/60 border border-border text-text cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" /></button>
          <button onClick={() => nav(1)}  className="p-1 rounded bg-surface-raised hover:bg-border/60 border border-border text-text cursor-pointer"><ChevronRight className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1 bg-bg-app/50 py-1 rounded">
        {WEEKDAYS.map((d, i) => <span key={i} className="text-[10px] font-bold text-text-muted uppercase">{d}</span>)}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayTasks = tasks.filter(t => t.dueDate === day.dateString);
          const highC = dayTasks.filter(t => t.bucketId === 'high').length;
          const medC  = dayTasks.filter(t => t.bucketId === 'medium').length;
          const lowC  = dayTasks.filter(t => t.bucketId === 'low').length;
          const comC  = dayTasks.filter(t => t.bucketId === 'completed').length;
          const isSel = selectedDate === day.dateString;
          const isHov = draggedOverDate === day.dateString;

          let cls = '';
          if (!day.isCurrentMonth) cls = 'text-text-muted/30 bg-surface/10';
          else cls = 'bg-surface-raised text-text hover:bg-border/20';
          if (day.isToday) cls += ' ring-1 ring-accent font-bold';
          if (isSel)       cls += ' !bg-accent-soft border border-accent text-accent';
          else             cls += ' border border-border/60';
          if (isHov)       cls += ' !bg-border border-dashed border-accent';

          return (
            <div key={day.dateString}
              onDragOver={e => e.preventDefault()}
              onDragEnter={e => { e.preventDefault(); setDraggedOverDate(day.dateString); }}
              onDragLeave={() => setDraggedOverDate(null)}
              onDrop={e => { e.preventDefault(); setDraggedOverDate(null); const id = e.dataTransfer.getData('text/plain'); if (id) onMoveTaskToDate(id, day.dateString); }}
              onClick={() => onSelectDate(isSel ? null : day.dateString)}
              className={`group/cell relative min-h-[40px] p-1 flex flex-col justify-between rounded cursor-pointer transition-all select-none ${cls}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono ${day.isToday ? 'inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-text font-bold' : isSel ? 'text-accent font-bold' : ''}`}>
                  {day.dayOfMonth}
                </span>
                {day.isCurrentMonth && (
                  <button onClick={e => { e.stopPropagation(); onQuickAddTask(day.dateString); }}
                    className="opacity-0 group-hover/cell:opacity-100 p-0.5 rounded bg-border text-text transition-opacity">
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
              <div className="mt-1 flex flex-col gap-0.5">
                {dayTasks.length > 0 ? (
                  dayTasks.length === 1 ? (
                    <div className={`text-[8px] truncate px-1 rounded-sm py-0.5 border leading-none ${
                      dayTasks[0].bucketId === 'high' ? 'bg-danger-soft text-danger border-danger/30' :
                      dayTasks[0].bucketId === 'medium' ? 'bg-warning-soft text-warning border-warning/30' :
                      dayTasks[0].bucketId === 'completed' ? 'bg-success-soft text-success border-success/30 line-through opacity-60' :
                      'bg-accent/10 text-accent border-accent/30'
                    }`} title={dayTasks[0].title}>{dayTasks[0].title}</div>
                  ) : (
                    <div className="flex items-center justify-center gap-0.5 py-0.5">
                      {highC > 0 && <span className="w-1 h-1 rounded-full bg-danger" />}
                      {medC  > 0 && <span className="w-1 h-1 rounded-full bg-warning" />}
                      {lowC  > 0 && <span className="w-1 h-1 rounded-full bg-accent" />}
                      {comC  > 0 && <span className="w-1 h-1 rounded-full bg-success" />}
                      <span className="text-[8px] font-mono font-bold text-text-muted ml-0.5">{dayTasks.length}</span>
                    </div>
                  )
                ) : <div className="h-1.5" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[9px] text-text-muted font-bold uppercase tracking-wider">
        <span>Legend</span>
        <div className="flex items-center gap-2">
          {[['brand-red','High'],['brand-yellow','Med'],['brand-blue','Low'],['brand-green','Done']].map(([c,l]) => (
            <span key={l} className="flex items-center gap-0.5">
              <span className={`w-1.5 h-1.5 rounded-full bg-${c}`} />{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── BucketColumn ──────────────────────────────────────────────────────────────

function BucketColumn({ bucket, tasks, buckets, tagConfigs, onToggleComplete, onEdit, onDelete, onMoveTaskToBucket }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

  const bucketTasks = useMemo(() =>
    tasks.filter(t => t.bucketId === bucket.id).sort((a, b) => a.order - b.order),
    [tasks, bucket.id]
  );

  const colorMap = {
    rose:    { dot: 'bg-danger',    text: 'text-danger' },
    amber:   { dot: 'bg-warning', text: 'text-warning' },
    sky:     { dot: 'bg-accent',   text: 'text-accent' },
    emerald: { dot: 'bg-success',  text: 'text-success' },
  };
  const c = colorMap[bucket.color] || { dot: 'bg-bg-subtle', text: 'text-text' };

  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { const el = document.getElementById(`task-card-${taskId}`); if (el) el.classList.add('opacity-40'); }, 0);
  };
  const onDragEnd = () => {
    document.querySelectorAll('[id^="task-card-"]').forEach(el => el.classList.remove('opacity-40'));
    setHoveredTaskId(null);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDragEnter={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => {
        e.preventDefault(); setIsDragOver(false);
        const taskId = e.dataTransfer.getData('text/plain');
        if (!taskId) return;
        if (hoveredTaskId && taskId !== hoveredTaskId) {
          onMoveTaskToBucket(taskId, bucket.id, hoveredTaskId);
        } else {
          onMoveTaskToBucket(taskId, bucket.id);
        }
        setHoveredTaskId(null);
      }}
      className={`flex flex-col min-h-[380px] rounded-lg border border-border p-3 bg-surface/30 transition-all ${isDragOver ? 'border-accent/80 bg-surface/80' : ''}`}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
          <h3 className="font-bold text-text text-[11px] uppercase tracking-wider select-none">{bucket.name}</h3>
        </div>
        <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-border text-text-muted select-none">{bucketTasks.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 py-1 max-h-[480px]" style={{ scrollbarWidth: 'thin' }}>
        {bucketTasks.length > 0 ? (
          bucketTasks.map(task => (
            <div key={task.id}>
              {hoveredTaskId === task.id && <div className="h-1 bg-accent rounded-full my-1" />}
              <TaskCard
                task={task} buckets={buckets} tagConfigs={tagConfigs}
                onToggleComplete={onToggleComplete} onEdit={onEdit} onDelete={onDelete}
                onDragStart={onDragStart} onDragEnd={onDragEnd}
                onDragOverTask={(e, id) => { e.preventDefault(); e.stopPropagation(); setHoveredTaskId(id); }}
              />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-3 text-center border border-dashed border-border/60 rounded bg-surface-raised/15 select-none">
            {bucket.id === 'completed'
              ? <CheckCircle2 className="w-6 h-6 text-success/45 mb-2 stroke-1" />
              : <Sparkles className="w-6 h-6 text-text-muted/45 mb-2 stroke-1" />
            }
            <p className="text-[10px] font-medium text-text-muted leading-relaxed">
              {bucket.id === 'completed' ? 'Check complete to archive' : 'Empty stage'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TaskModal ─────────────────────────────────────────────────────────────────

function TaskModal({ isOpen, onClose, onSave, editingTask, buckets, initialDate, tagConfigs = [] }) {
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [bucketId, setBucket]   = useState('medium');
  const [dueDate, setDue]       = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags]         = useState([]);
  const [completed, setDone]    = useState(false);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDesc(editingTask.description || '');
      setBucket(editingTask.bucketId);
      setDue(editingTask.dueDate || '');
      setTags(editingTask.tags || []);
      setDone(editingTask.completed);
    } else {
      setTitle(''); setDesc(''); setBucket('medium');
      setDue(initialDate || ''); setTags([]); setDone(false);
    }
  }, [editingTask, isOpen, initialDate]);

  const addTag = e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = tagInput.trim().replace(/,/g, '');
      if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput(''); }
    }
  };

  const submit = e => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim() || undefined, bucketId, dueDate: dueDate || undefined, completed, tags: tags.length > 0 ? tags : undefined });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-bg-app/70 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-xl p-5 shadow-2xl z-10 text-text">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text">
              {editingTask ? 'Edit Task' : 'New Task'}
            </h2>
            <span className="text-[9px] text-text-muted font-bold uppercase font-mono tracking-wide">Task Scheduler</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-border text-text-muted hover:text-text transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Task Title</label>
            <input type="text" required placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border bg-surface-raised text-text text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 placeholder:text-text-muted/50 font-semibold"
              autoFocus />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Notes / Context</label>
            <textarea placeholder="Additional details..." value={description} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded border border-border bg-surface-raised text-text text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 placeholder:text-text-muted/50 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Priority</label>
              <div className="relative">
                <select value={bucketId} onChange={e => setBucket(e.target.value)}
                  className="w-full px-3 py-2 pr-7 rounded border border-border bg-surface-raised text-text text-xs focus:outline-none focus:border-accent cursor-pointer appearance-none font-bold uppercase tracking-wider">
                  {buckets.map(b => <option key={b.id} value={b.id} className="bg-surface">{b.name}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDue(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border bg-surface-raised text-text text-xs focus:outline-none focus:border-accent cursor-pointer font-semibold" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider">Tags</label>

            {/* Selected tag chips */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag, i) => {
                  const cfg = getTagConfig(tag, tagConfigs);
                  const ci = TAG_COLORS[cfg.color] || TAG_COLORS.slate;
                  return (
                    <span key={i} className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-[10px] font-semibold rounded border ${ci.bg} ${ci.text} ${ci.border}`}>
                      {cfg.name}
                      <button type="button" onClick={() => setTags(tags.filter((_, idx) => idx !== i))}
                        className="p-0.5 rounded-full hover:bg-bg-app/20 transition-colors cursor-pointer">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Dropdown picker for existing tags */}
            <div className="relative">
              <select
                value=""
                onChange={e => {
                  const val = e.target.value;
                  if (val && !tags.some(t => t.toLowerCase() === val.toLowerCase())) setTags([...tags, val]);
                  e.target.value = '';
                }}
                className="w-full px-3 py-2 pr-7 rounded border border-border bg-surface-raised text-text text-xs focus:outline-none focus:border-accent cursor-pointer appearance-none font-semibold"
              >
                <option value="" className="bg-surface text-text-muted">Select a tag…</option>
                {tagConfigs
                  .filter(tc => !tags.some(t => t.toLowerCase() === tc.name.toLowerCase()))
                  .map(tc => (
                    <option key={tc.id} value={tc.name} className="bg-surface">{tc.name}</option>
                  ))
                }
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Custom tag text input */}
            <input type="text" placeholder="Or type a new tag and press Enter"
              value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
              className="w-full px-3 py-2 rounded border border-border bg-surface-raised text-text text-[11px] focus:outline-none focus:border-accent placeholder:text-text-muted/40 font-semibold" />
          </div>

          {editingTask && (
            <div className="flex items-center justify-between p-2 rounded border border-border bg-bg-app/50">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Status</span>
              <button type="button"
                onClick={() => { const next = !completed; setDone(next); if (next) setBucket('completed'); else setBucket(editingTask.bucketId === 'completed' ? 'medium' : editingTask.bucketId); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold cursor-pointer transition-all ${completed ? 'bg-success-soft border-success/50 text-success' : 'bg-surface-raised border-border text-text-muted hover:text-text'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {completed ? 'COMPLETED' : 'ACTIVE'}
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded text-xs font-bold text-text-muted hover:text-text transition-colors cursor-pointer">Cancel</button>
            <button type="submit" disabled={!title.trim()}
              className="px-4 py-2 rounded text-xs font-bold text-text bg-accent hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer">
              {editingTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── DailySummaryModal ─────────────────────────────────────────────────────────

function DailySummaryModal({ isOpen, onClose, tasks, buckets, tagConfigs, onToggleComplete, onAddTaskClick }) {
  const todayStr = getRelativeDateString(0);
  const todayTasks = useMemo(() => tasks.filter(t => t.dueDate === todayStr), [tasks, todayStr]);
  const completedCount = todayTasks.filter(t => t.completed).length;
  const totalCount = todayTasks.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const size = 100, sw = 9, r = (size - sw) / 2;
  const circ = r * 2 * Math.PI;
  const offset = circ - (pct / 100) * circ;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-bg-app/70 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl p-6 shadow-2xl z-10 text-text flex flex-col md:flex-row gap-6">
        {/* Progress ring */}
        <div className="flex flex-col items-center justify-center text-center p-4 bg-bg-app/50 border border-border/60 rounded-lg md:w-44 shrink-0">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Today's Focus</span>
          <div className="relative w-[100px] h-[100px] mb-3 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx={size/2} cy={size/2} r={r} className="stroke-brand-border/40" strokeWidth={sw} fill="transparent" />
              <circle cx={size/2} cy={size/2} r={r} className="stroke-brand-blue transition-all duration-700"
                strokeWidth={sw} fill="transparent" strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black font-mono text-text">{pct}%</span>
              <span className="text-[9px] text-text-muted font-bold font-mono">{completedCount}/{totalCount}</span>
            </div>
          </div>
          <p className="text-xs font-bold text-text">
            {totalCount === 0 ? 'No Tasks Yet' : pct === 100 ? 'All Done!' : pct >= 70 ? 'Great Progress!' : pct >= 35 ? 'Keep Going' : 'Just Getting Started'}
          </p>
          <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
            {totalCount === 0 ? 'Add tasks to start tracking.' : pct === 100 ? 'All daily goals completed.' : 'Mark tasks done to move forward.'}
          </p>
        </div>

        {/* Task list */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-start justify-between pb-3 mb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-accent" /> Daily Summary
              </h2>
              <span className="text-[9px] text-text-muted font-bold uppercase font-mono tracking-wide">{todayStr}</span>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-border text-text-muted hover:text-text cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2" style={{ scrollbarWidth: 'thin' }}>
            {totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <AlertCircle className="w-7 h-7 text-text-muted/70" />
                <div>
                  <p className="text-xs font-bold text-text">No Tasks for Today</p>
                  <p className="text-[10px] text-text-muted mt-1">Add tasks to start tracking your day.</p>
                </div>
                <button onClick={() => { onClose(); onAddTaskClick(todayStr); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-bold bg-accent text-text hover:opacity-90 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Add Task
                </button>
              </div>
            ) : (
              todayTasks.map(task => {
                const bucket = buckets.find(b => b.id === task.bucketId);
                return (
                  <div key={task.id} className={`flex items-start gap-2.5 p-2.5 rounded border transition-all ${task.completed ? 'bg-bg-app/50 border-border/45 opacity-75' : 'bg-surface-raised border-border hover:border-accent/40'}`}>
                    <button type="button" onClick={() => onToggleComplete(task.id)} className="mt-0.5 text-text-muted hover:text-accent cursor-pointer shrink-0">
                      {task.completed ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Circle className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold text-text truncate ${task.completed ? 'line-through text-text-muted' : ''}`}>{task.title}</h4>
                      {task.description && <p className="text-[10px] text-text-muted mt-0.5 truncate">{task.description}</p>}
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className={`text-[8px] font-bold font-mono uppercase px-1 rounded border ${
                          task.bucketId === 'high' ? 'bg-danger-soft text-danger border-danger/20' :
                          task.bucketId === 'medium' ? 'bg-warning-soft text-warning border-warning/20' :
                          task.bucketId === 'low' ? 'bg-info-soft text-info border-info/20' :
                          'bg-success-soft text-success border-success/20'
                        }`}>{bucket?.name || 'Task'}</span>
                        {task.tags?.map(tag => {
                          const cfg = getTagConfig(tag, tagConfigs);
                          const ci = TAG_COLORS[cfg.color] || TAG_COLORS.slate;
                          return (
                            <span key={tag} className={`inline-flex items-center gap-0.5 px-1 rounded border text-[8px] ${ci.bg} ${ci.text} ${ci.border}`}>
                              <Tag className="w-2 h-2 opacity-65" />{cfg.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalCount > 0 && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
              <span>Click checkbox to mark done.</span>
              <button onClick={() => { onClose(); onAddTaskClick(todayStr); }}
                className="flex items-center gap-0.5 text-accent font-bold hover:underline cursor-pointer">
                + ADD TASK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main TodoPanel component ──────────────────────────────────────────────────

export default function TodoPanel() {
  const [tasks, setTasks]                 = useState([]);
  const [selectedDate, setSelectedDate]   = useState(null);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingTask, setEditingTask]     = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [activeTag, setActiveTag]         = useState(null);
  const [initialDate, setInitialDate]     = useState(null);
  const [tagConfigs, setTagConfigs]       = useState([]);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isDailySummary, setDailySummary] = useState(false);

  useEffect(() => {
    const tasksData = loadTasks();
    setTasks(tasksData);
    const savedTags = loadTagConfigs();
    const tagsSet = new Set(savedTags.map(t => t.name.toLowerCase()));
    const updated = [...savedTags];
    let changed = false;
    tasksData.forEach(t => (t.tags || []).forEach(tag => {
      if (!tagsSet.has(tag.toLowerCase())) {
        updated.push({ id: tag.toLowerCase(), name: tag, color: 'slate' });
        tagsSet.add(tag.toLowerCase()); changed = true;
      }
    }));
    if (changed) saveTagConfigs(updated);
    setTagConfigs(updated);
  }, []);

  const registerNewTags = newTagsList => {
    if (!newTagsList?.length) return;
    setTagConfigs(prev => {
      const existing = new Set(prev.map(tc => tc.name.toLowerCase()));
      const upd = [...prev]; let ch = false;
      newTagsList.forEach(name => {
        if (!existing.has(name.toLowerCase())) { upd.push({ id: name.toLowerCase(), name, color: 'slate' }); existing.add(name.toLowerCase()); ch = true; }
      });
      if (ch) saveTagConfigs(upd);
      return upd;
    });
  };

  const handleRenameTag = (tagId, newName) => {
    setTagConfigs(prev => {
      const upd = prev.map(tc => {
        if (tc.id === tagId) {
          const oldName = tc.name;
          if (oldName.toLowerCase() !== newName.toLowerCase() && newName.trim()) {
            setTasks(prevT => {
              const r = prevT.map(t => ({ ...t, tags: t.tags?.map(s => s.toLowerCase() === oldName.toLowerCase() ? newName.trim() : s) }));
              saveTasks(r); return r;
            });
          }
          return { ...tc, name: newName };
        }
        return tc;
      });
      saveTagConfigs(upd); return upd;
    });
  };

  const handleUpdateTagColor = (tagId, colorKey) => {
    setTagConfigs(prev => { const upd = prev.map(tc => tc.id === tagId ? { ...tc, color: colorKey } : tc); saveTagConfigs(upd); return upd; });
  };

  const handleAddTag = () => {
    const name = `Tag ${tagConfigs.length + 1}`;
    const colors = Object.keys(TAG_COLORS);
    const color = colors[Math.floor(Math.random() * colors.length)] || 'slate';
    setTagConfigs(prev => { const upd = [...prev, { id: `tag-${Date.now()}`, name, color }]; saveTagConfigs(upd); return upd; });
  };

  const handleDeleteTag = tagId => {
    const cfg = tagConfigs.find(tc => tc.id === tagId);
    if (!cfg) return;
    setTagConfigs(prev => { const upd = prev.filter(tc => tc.id !== tagId); saveTagConfigs(upd); return upd; });
    setTasks(prevT => {
      const upd = prevT.map(t => ({ ...t, tags: t.tags?.filter(s => s.toLowerCase() !== cfg.name.toLowerCase()) || undefined }));
      saveTasks(upd); return upd;
    });
    if (activeTag?.toLowerCase() === cfg.name.toLowerCase()) setActiveTag(null);
  };

  const stats = useMemo(() => {
    const active = tasks.filter(t => !t.completed).length;
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const scheduled = tasks.filter(t => t.dueDate).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { active, completed, total, scheduled, pct };
  }, [tasks]);

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!task.title.toLowerCase().includes(q) && !task.description?.toLowerCase().includes(q) && !task.tags?.some(t => t.toLowerCase().includes(q))) return false;
    }
    if (selectedDate && task.dueDate !== selectedDate) return false;
    if (activeTag && !task.tags?.includes(activeTag)) return false;
    return true;
  }), [tasks, searchQuery, selectedDate, activeTag]);

  const selectedDateTasks = useMemo(() => selectedDate ? tasks.filter(t => t.dueDate === selectedDate) : [], [tasks, selectedDate]);

  const getReordered = (current, movingId, targetBucketId, beforeId) => {
    const moving = current.find(t => t.id === movingId);
    if (!moving) return current;
    const isComp = targetBucketId === 'completed';
    const upd = { ...moving, bucketId: targetBucketId, completed: isComp };
    const others = current.filter(t => t.id !== movingId);
    const bucket = others.filter(t => t.bucketId === targetBucketId).sort((a, b) => a.order - b.order);
    if (beforeId) {
      const idx = bucket.findIndex(t => t.id === beforeId);
      idx !== -1 ? bucket.splice(idx, 0, upd) : bucket.push(upd);
    } else { bucket.push(upd); }
    const orderMap = {};
    bucket.forEach((t, i) => { orderMap[t.id] = i; });
    return current.map(t => t.id === movingId ? { ...upd, order: orderMap[movingId] ?? 0 } : t.bucketId === targetBucketId ? { ...t, order: orderMap[t.id] ?? t.order } : t);
  };

  const moveToBucket = (taskId, targetBucketId, beforeId) => {
    setTasks(prev => { const r = getReordered(prev, taskId, targetBucketId, beforeId); saveTasks(r); return r; });
  };

  const moveToDate = (taskId, targetDate) => {
    setTasks(prev => { const r = prev.map(t => t.id === taskId ? { ...t, dueDate: targetDate } : t); saveTasks(r); return r; });
  };

  const toggleComplete = taskId => {
    setTasks(prev => {
      const r = prev.map(t => {
        if (t.id !== taskId) return t;
        const next = !t.completed;
        return { ...t, completed: next, bucketId: next ? 'completed' : (t.bucketId === 'completed' ? 'medium' : t.bucketId) };
      });
      saveTasks(r); return r;
    });
  };

  const deleteTask = taskId => {
    setTasks(prev => { const r = prev.filter(t => t.id !== taskId); saveTasks(r); return r; });
  };

  const saveTask = taskData => {
    registerNewTags(taskData.tags);
    if (editingTask) {
      setTasks(prev => { const r = prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t); saveTasks(r); return r; });
      setEditingTask(null);
    } else {
      const count = tasks.filter(t => t.bucketId === taskData.bucketId).length;
      const newTask = { id: `task-${Date.now()}`, ...taskData, order: count, createdAt: new Date().toISOString() };
      setTasks(prev => { const r = [...prev, newTask]; saveTasks(r); return r; });
    }
    setInitialDate(null);
  };

  const openAddModal = () => { setEditingTask(null); setInitialDate(selectedDate || getRelativeDateString(0)); setIsModalOpen(true); };
  const openEditModal = task => { setEditingTask(task); setIsModalOpen(true); };
  const quickAdd = dateStr => { setInitialDate(dateStr); setEditingTask(null); setIsModalOpen(true); };
  const clearFilters = () => { setSelectedDate(null); setActiveTag(null); setSearchQuery(''); };

  const hasFilters = selectedDate || activeTag || searchQuery;

  return (
    <div className="bg-surface/60 border border-border rounded-3xl p-6 flex flex-col gap-4">
      {/* Panel header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Task Planner</h3>
          <p className="text-xs text-text-faint mt-0.5">Prioritized task board with calendar scheduling</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Stats pills */}
          <div className="flex items-center gap-2 mr-2">
            <div className="flex items-center gap-1.5 bg-surface-raised/60 border border-border rounded-lg px-2.5 py-1.5">
              <ListTodo className="w-3.5 h-3.5 text-info" />
              <span className="text-xs font-bold text-text-secondary font-mono">{stats.active} active</span>
            </div>
            <button onClick={() => setDailySummary(true)}
              className="flex items-center gap-1.5 bg-surface-raised/60 border border-border rounded-lg px-2.5 py-1.5 hover:border-info/50 hover:text-info text-text-secondary cursor-pointer transition-colors">
              <CheckCircle className="w-3.5 h-3.5 text-success" />
              <span className="text-xs font-bold font-mono">{stats.completed}/{stats.total}</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-40 sm:w-48 pl-7 pr-3 py-1.5 text-[11px] font-semibold bg-surface-raised text-text-secondary border border-border rounded-lg focus:outline-none focus:border-info/50 placeholder:text-text-faint transition-colors" />
            <Search className="w-3.5 h-3.5 text-text-faint absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Daily summary */}
          <button onClick={() => setDailySummary(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-border bg-surface-raised text-text-secondary hover:border-info/50 hover:text-info cursor-pointer transition-colors">
            <Flame className="w-3.5 h-3.5 text-info" /> Today
          </button>

          {/* Add task */}
          <button onClick={openAddModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-info text-text hover:bg-info cursor-pointer transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-[9px] text-text-faint font-bold uppercase tracking-wider whitespace-nowrap">Progress</span>
        <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
          <div className="h-full bg-info transition-all duration-500" style={{ width: `${stats.pct}%` }} />
        </div>
        <span className="text-[9px] text-text-faint font-mono">{stats.pct}%</span>
      </div>

      {/* Active filters */}
      {hasFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-surface-raised/50 border border-border rounded-xl text-[11px]">
          <div className="flex flex-wrap items-center gap-2 text-text-secondary font-medium">
            <span className="font-bold text-info">FILTERS:</span>
            {selectedDate && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border font-mono">
                <Calendar className="w-3 h-3" /> {selectedDate}
                <button onClick={() => setSelectedDate(null)} className="ml-1 hover:text-danger font-bold">×</button>
              </span>
            )}
            {activeTag && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border">
                <Tag className="w-3 h-3" /> #{activeTag}
                <button onClick={() => setActiveTag(null)} className="ml-1 hover:text-danger font-bold">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border font-mono">
                "{searchQuery}" <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-danger font-bold">×</button>
              </span>
            )}
          </div>
          <button onClick={clearFilters} className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-danger hover:bg-bg-subtle cursor-pointer">
            <FilterX className="w-3 h-3" /> Clear
          </button>
        </div>
      )}

      {/* Main content: sidebar + kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* Sidebar: calendar + agenda + tags */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <CalendarView
            tasks={tasks} selectedDate={selectedDate}
            onSelectDate={setSelectedDate} onMoveTaskToDate={moveToDate} onQuickAddTask={quickAdd}
          />

          {/* Agenda / date hint */}
          {selectedDate ? (
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-accent" />
                  <h4 className="font-bold text-[11px] text-text uppercase tracking-wider">Agenda — {selectedDate}</h4>
                </div>
                <button onClick={() => quickAdd(selectedDate)}
                  className="p-1 px-1.5 text-[9px] font-bold rounded bg-accent text-text hover:opacity-90 flex items-center gap-0.5 cursor-pointer">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                {selectedDateTasks.length > 0
                  ? selectedDateTasks.map(task => (
                    <div key={task.id} onClick={() => openEditModal(task)}
                      className={`p-2 rounded border border-border bg-surface-raised hover:border-accent flex items-center justify-between gap-1.5 cursor-pointer select-none ${task.completed ? 'opacity-60' : ''}`}>
                      <p className={`text-[11px] font-bold text-text truncate ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
                      <CheckCircle className={`w-4 h-4 shrink-0 ${task.completed ? 'text-success' : 'text-border'}`} />
                    </div>
                  ))
                  : <div className="py-5 text-center">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wide">No tasks scheduled</p>
                    </div>
                }
              </div>
            </div>
          ) : (
            <div className="bg-surface/60 border border-border rounded-lg p-4 text-center">
              <Calendar className="w-6 h-6 text-accent/30 mx-auto mb-1 stroke-1" />
              <h4 className="text-[11px] font-bold text-text uppercase tracking-wider">Select a Day</h4>
              <p className="text-[9px] text-text-muted mt-0.5 leading-relaxed">Click any calendar day to view or add tasks.</p>
            </div>
          )}

          {/* Tag filters */}
          {tagConfigs.length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-accent" />
                  <h4 className="font-bold text-[11px] text-text uppercase tracking-wider">
                    {isEditingTags ? 'Manage Tags' : 'Tag Filters'}
                  </h4>
                </div>
                <button onClick={() => setIsEditingTags(!isEditingTags)}
                  className={`p-1 px-1.5 text-[9px] font-bold uppercase tracking-wider rounded border cursor-pointer transition-all ${isEditingTags ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:bg-bg-app text-text-muted hover:text-text'}`}>
                  {isEditingTags ? 'Done' : 'Edit'}
                </button>
              </div>

              {!isEditingTags ? (
                <div className="flex flex-wrap gap-1.5">
                  {tagConfigs.map(tc => {
                    const isSel = activeTag?.toLowerCase() === tc.name.toLowerCase();
                    const ci = TAG_COLORS[tc.color] || TAG_COLORS.slate;
                    return (
                      <button key={tc.id}
                        onClick={() => setActiveTag(activeTag?.toLowerCase() === tc.name.toLowerCase() ? null : tc.name)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${isSel ? `${ci.bg} ${ci.text} ${ci.border} ring-1 ring-accent/20` : 'bg-surface-raised border-border text-text-muted hover:text-text hover:bg-bg-app'}`}>
                        #{tc.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'thin' }}>
                  {tagConfigs.map(tc => (
                    <div key={tc.id} className="flex flex-col gap-1.5 p-2 bg-bg-app/40 border border-border/60 rounded">
                      <div className="flex items-center gap-1.5">
                        <input type="text" value={tc.name} onChange={e => handleRenameTag(tc.id, e.target.value)}
                          className="px-2 py-0.5 text-[10px] font-semibold border border-border rounded bg-surface-raised text-text w-full focus:outline-none focus:border-accent" />
                        <button onClick={() => handleDeleteTag(tc.id)}
                          className="text-text-muted hover:text-danger w-5 h-5 rounded flex items-center justify-center cursor-pointer">×</button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] text-text-muted font-bold uppercase tracking-wider shrink-0">Color:</span>
                        <div className="flex items-center gap-1">
                          {Object.entries(TAG_COLORS).map(([k, v]) => (
                            <button key={k} type="button" onClick={() => handleUpdateTagColor(tc.id, k)}
                              className={`w-3.5 h-3.5 rounded-full ${v.dot} border cursor-pointer transition-all ${tc.color === k ? 'ring-1 ring-accent border-border scale-110' : 'border-transparent hover:scale-110'}`}
                              title={v.label} />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={handleAddTag}
                    className="w-full py-1 text-center rounded border border-dashed border-border/60 hover:border-accent bg-surface-raised text-[9px] font-bold text-text-muted hover:text-text cursor-pointer">
                    + Add tag
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kanban columns */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {DEFAULT_BUCKETS.map(bucket => (
              <BucketColumn key={bucket.id} bucket={bucket} tasks={filteredTasks} buckets={DEFAULT_BUCKETS}
                tagConfigs={tagConfigs} onToggleComplete={toggleComplete} onEdit={openEditModal}
                onDelete={deleteTask} onMoveTaskToBucket={moveToBucket} />
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); setInitialDate(null); }}
        onSave={saveTask} editingTask={editingTask} buckets={DEFAULT_BUCKETS}
        initialDate={initialDate} tagConfigs={tagConfigs}
      />
      <DailySummaryModal
        isOpen={isDailySummary} onClose={() => setDailySummary(false)}
        tasks={tasks} buckets={DEFAULT_BUCKETS} tagConfigs={tagConfigs}
        onToggleComplete={toggleComplete} onAddTaskClick={quickAdd}
      />
    </div>
  );
}
