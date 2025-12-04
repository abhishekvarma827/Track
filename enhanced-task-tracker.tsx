import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Target, Plus, TrendingUp, Briefcase, Users, Play, Pause, Square, User, BarChart3, Download, PieChart, Bell, Mail, AlertCircle } from 'lucide-react';

export default function TaskTracker() {
  const [currentUser, setCurrentUser] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Work');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('weekly');
  const [notifications, setNotifications] = useState([]);
  
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [workSessions, setWorkSessions] = useState([]);
  const [showTimerPanel, setShowTimerPanel] = useState(false);
  const [userEmails, setUserEmails] = useState({});
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setCurrentSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    checkDeadlines();
  }, [tasks]);

  const loadData = async () => {
    try {
      const tasksResult = await window.storage.get('shared-tasks', true);
      const sessionsResult = await window.storage.get('shared-sessions', true);
      const emailsResult = await window.storage.get('user-emails', true);
      if (tasksResult?.value) setTasks(JSON.parse(tasksResult.value));
      if (sessionsResult?.value) setWorkSessions(JSON.parse(sessionsResult.value));
      if (emailsResult?.value) setUserEmails(JSON.parse(emailsResult.value));
    } catch (error) {
      console.log('Starting fresh');
    }
  };

  const saveData = async () => {
    try {
      await window.storage.set('shared-tasks', JSON.stringify(tasks), true);
      await window.storage.set('shared-sessions', JSON.stringify(workSessions), true);
      await window.storage.set('user-emails', JSON.stringify(userEmails), true);
    } catch (error) {
      console.error('Save failed');
    }
  };

  useEffect(() => {
    if (isLoggedIn) saveData();
  }, [tasks, workSessions, isLoggedIn, userEmails]);

  const categories = ['Work', 'Sales', 'Marketing', 'Finance', 'Operations', 'Critical'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const checkDeadlines = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    tasks.forEach(task => {
      if (!task.completed) {
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysLeft === 0) {
          task.deadlineWarning = 'Due today!';
        } else if (daysLeft === 1) {
          task.deadlineWarning = '1 day left';
        } else if (daysLeft > 0 && daysLeft <= 3) {
          task.deadlineWarning = `${daysLeft} days left`;
        } else if (daysLeft < 0) {
          task.deadlineWarning = `Overdue by ${Math.abs(daysLeft)} days`;
        }
      }
    });
  };

  const endTimer = () => {
    if (currentSessionTime > 0) {
      const newSession = {
        duration: currentSessionTime,
        timestamp: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        user: currentUser
      };
      setWorkSessions([...workSessions, newSession]);
    }
    setIsTimerRunning(false);
    setCurrentSessionTime(0);
  };

  const getUniqueUsers = () => {
    const users = new Set();
    workSessions.forEach(s => users.add(s.user));
    tasks.forEach(t => users.add(t.createdBy));
    return Array.from(users);
  };

  const getUserWorkTime = (userName, dateFilter = 'today') => {
    let filteredSessions = workSessions.filter(s => s.user === userName);
    
    if (dateFilter === 'today') {
      const today = new Date().toLocaleDateString();
      filteredSessions = filteredSessions.filter(s => s.date === today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredSessions = filteredSessions.filter(s => new Date(s.timestamp) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filteredSessions = filteredSessions.filter(s => new Date(s.timestamp) >= monthAgo);
    } else if (dateFilter === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      filteredSessions = filteredSessions.filter(s => new Date(s.timestamp) >= yearAgo);
    }
    
    const total = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
    return { formatted: formatTime(total), seconds: total };
  };

  const getWorkTimeData = () => {
    const users = getUniqueUsers();
    return users.map(user => ({
      user,
      daily: getUserWorkTime(user, 'today').formatted,
      weekly: getUserWorkTime(user, 'week').formatted,
      monthly: getUserWorkTime(user, 'month').formatted,
      yearly: getUserWorkTime(user, 'year').formatted,
      dailySeconds: getUserWorkTime(user, 'today').seconds,
      weeklySeconds: getUserWorkTime(user, 'week').seconds,
      monthlySeconds: getUserWorkTime(user, 'month').seconds,
      yearlySeconds: getUserWorkTime(user, 'year').seconds
    }));
  };

  const downloadData = (period) => {
    const workTimeData = getWorkTimeData();
    const now = new Date();
    
    let data = {
      exportDate: now.toISOString(),
      period: period,
      users: workTimeData.map(d => ({
        name: d.user,
        email: userEmails[d.user] || 'Not provided',
        workTime: period === 'weekly' ? d.weekly : period === 'monthly' ? d.monthly : d.yearly,
        workTimeSeconds: period === 'weekly' ? d.weeklySeconds : period === 'monthly' ? d.monthlySeconds : d.yearlySeconds
      })),
      tasks: tasks.map(t => ({
        name: t.name,
        category: t.category,
        priority: t.priority,
        date: t.date,
        completed: t.completed,
        createdBy: t.createdBy
      })),
      sessions: workSessions.filter(s => {
        const sessionDate = new Date(s.timestamp);
        if (period === 'weekly') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return sessionDate >= weekAgo;
        } else if (period === 'monthly') {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return sessionDate >= monthAgo;
        } else {
          const yearAgo = new Date();
          yearAgo.setFullYear(yearAgo.getFullYear() - 1);
          return sessionDate >= yearAgo;
        }
      })
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-tracker-${period}-${now.toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification(`Downloaded ${period} data report`, 'success');
  };

  const addTask = () => {
    if (newTaskName.trim() && newTaskDate) {
      const newTask = {
        id: Date.now(),
        name: newTaskName,
        category: newTaskCategory,
        priority: newTaskPriority,
        date: newTaskDate,
        createdBy: currentUser,
        completed: false
      };
      setTasks([...tasks, newTask]);
      setNewTaskName('');
      setNewTaskDate(new Date().toISOString().split('T')[0]);
      addNotification(`Task "${newTaskName}" added by ${currentUser}`, 'success');
    }
  };

  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    const wasCompleted = task.completed;
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    if (!wasCompleted) {
      addNotification(`Task "${task.name}" completed by ${currentUser}`, 'success');
    }
  };

  const deleteTask = (id) => {
    const task = tasks.find(t => t.id === id);
    setTasks(tasks.filter(task => task.id !== id));
    addNotification(`Task "${task.name}" deleted`, 'info');
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Work': 'from-blue-600 to-blue-700',
      'Sales': 'from-green-600 to-green-700',
      'Marketing': 'from-purple-600 to-purple-700',
      'Finance': 'from-yellow-600 to-yellow-700',
      'Operations': 'from-indigo-600 to-indigo-700',
      'Critical': 'from-red-600 to-red-700'
    };
    return colors[category] || 'from-gray-600 to-gray-700';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-blue-500',
      'Medium': 'bg-yellow-500',
      'High': 'bg-orange-500',
      'Critical': 'bg-red-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const todayTasks = tasks.filter(t => t.date === new Date().toISOString().split('T')[0]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay()
    };
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const getTasksForDate = (date) => {
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = date.toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return tasks.filter(t => t.date === dateStr);
  };

  const handleDateClick = (date) => {
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = date.toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setSelectedDate(dateStr);
  };

  const getSelectedDateTasks = () => {
    if (!selectedDate) return [];
    return tasks.filter(t => t.date === selectedDate);
  };

  const workTimeData = getWorkTimeData();
  const maxTime = Math.max(...workTimeData.map(d => 
    viewMode === 'daily' ? d.dailySeconds : 
    viewMode === 'weekly' ? d.weeklySeconds : 
    viewMode === 'monthly' ? d.monthlySeconds :
    d.yearlySeconds
  ), 1);

  const totalWorkTimeSeconds = workTimeData.reduce((sum, d) => 
    sum + (viewMode === 'daily' ? d.dailySeconds : 
           viewMode === 'weekly' ? d.weeklySeconds : 
           viewMode === 'monthly' ? d.monthlySeconds :
           d.yearlySeconds), 0
  );

  const handleLogin = () => {
    if (currentUser.trim() && currentEmail.trim()) {
      setUserEmails(prev => ({ ...prev, [currentUser]: currentEmail }));
      setIsLoggedIn(true);
      addNotification(`Welcome ${currentUser}!`, 'success');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/40 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 w-full max-w-md">
          <div className="text-center mb-8">
            <Briefcase className="mx-auto mb-4 text-blue-400" size={48} />
            <h1 className="text-3xl font-bold mb-2">Business Task Tracker</h1>
            <p className="text-slate-400">Enter your details to continue</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Your Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Your Email</label>
              <input
                type="email"
                placeholder="john@example.com"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Start Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-3">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2" style={{ maxWidth: '350px' }}>
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`flex items-center gap-2 p-3 rounded-lg shadow-lg backdrop-blur-sm border animate-slide-in ${
              notif.type === 'success' ? 'bg-green-600/90 border-green-500' :
              notif.type === 'error' ? 'bg-red-600/90 border-red-500' :
              'bg-blue-600/90 border-blue-500'
            }`}
          >
            <Bell size={16} />
            <span className="text-sm flex-1">{notif.message}</span>
          </div>
        ))}
      </div>

      <div className="max-w-[1900px] mx-auto">
        {/* Compact Header */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-3 mb-3 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase size={20} />
              <div>
                <h1 className="text-base font-bold">Task Tracker</h1>
                <p className="text-xs text-slate-400">{currentUser} • {currentEmail}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTimerPanel(!showTimerPanel)}
                className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1"
              >
                <Clock size={14} />
                Timer
              </button>
              
                href="https://sellercentral.amazon.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1"
              >
                <Briefcase size={14} />
                Amazon
              </a>
            </div>
          </div>
        </div>

        {/* Compact Timer Panel */}
        {showTimerPanel && (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-3 mb-3 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Clock className="text-blue-400" size={24} />
                <div className="text-2xl font-bold">{formatTime(currentSessionTime)}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`${isTimerRunning ? 'bg-yellow-600' : 'bg-green-600'} hover:opacity-90 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1`}
                  >
                    {isTimerRunning ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Start</>}
                  </button>
                  <button onClick={endTimer} className="bg-red-600 hover:opacity-90 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Square size={12} /> End
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                {getUniqueUsers().slice(0, 4).map(user => (
                  <div key={user} className="flex items-center gap-1 bg-slate-700/30 rounded px-2 py-1">
                    <User size={10} />
                    <span className="text-xs">{user.split(' ')[0]}</span>
                    <span className="text-green-400 font-mono text-xs">{getUserWorkTime(user, 'today').formatted}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Compact Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-3 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <div className="text-xs text-blue-100">Total Tasks</div>
              </div>
              <Target size={24} className="opacity-50" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-3 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{completedTasks}</div>
                <div className="text-xs text-green-100">Completed</div>
              </div>
              <TrendingUp size={24} className="opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-3 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{todayTasks.length}</div>
                <div className="text-xs text-purple-100">Today</div>
              </div>
              <Calendar size={24} className="opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-3 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">{formatTime(totalWorkTimeSeconds)}</div>
                <div className="text-xs text-orange-100">Work Time</div>
              </div>
              <Clock size={24} className="opacity-50" />
            </div>
          </div>
        </div>

        {/* Compact Add Task */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-3 mb-3 border border-slate-700/50">
          <div className="grid grid-cols-6 gap-2">
            <input
              type="text"
              placeholder="Task name"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              className="col-span-2 px-2 py-1.5 bg-slate-700/50 border border-slate-600 rounded text-white text-xs"
            />
            <select
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value)}
              className="px-2 py-1.5 bg-slate-700/50 border border-slate-600 rounded text-white text-xs"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="px-2 py-1.5 bg-slate-700/50 border border-slate-600 rounded text-white text-xs"
            >
              {priorities.map(pri => <option key={pri} value={pri}>{pri}</option>)}
            </select>
            <input
              type="date"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              className="px-2 py-1.5 bg-slate-700/50 border border-slate-600 rounded text-white text-xs"
            />
            <button
              onClick={addTask}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-3 py-1.5 rounded font-semibold text-xs"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Main Content Grid - Compact */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          {/* Compact Calendar */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => changeMonth(-1)} className="text-slate-400 hover:text-white text-xs">←</button>
              <h2 className="font-bold text-xs">{currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</h2>
              <button onClick={() => changeMonth(1)} className="text-slate-400 hover:text-white text-xs">→</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs text-slate-400 font-medium">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: getDaysInMonth(currentDate).startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              {Array.from({ length: getDaysInMonth(currentDate).daysInMonth }).map((_, i) => {
                const date = i + 1;
                const tasksForDate = getTasksForDate(date);
                const today = isToday(date);
                const year = currentDate.getFullYear();
                const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
                const day = date.toString().padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                const isSelected = selectedDate === dateStr;
                
                return (
                  <button
                    key={date}
                    onClick={() => handleDateClick(date)}
                    className={`aspect-square flex items-center justify-center text-xs rounded relative ${
                      isSelected ? 'bg-purple-600 font-bold' :
                      today ? 'bg-yellow-500/30 font-bold' : 
                      tasksForDate.length > 0 ? 'bg-slate-700/50' : 
                      'hover:bg-slate-700/30'
                    }`}
                  >
                    {date}
                    {tasksForDate.length > 0 && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's Tasks - Compact */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-xs flex items-center gap-1">
                <Calendar size={12} />
                Today's Tasks
              </h2>
              <span className="text-xs text-slate-400">{todayTasks.length}</span>
            </div>
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">No tasks</div>
              ) : (
                todayTasks.map(task => (
                  <div key={task.id} className={`bg-gradient-to-r ${getCategoryColor(task.category)} rounded p-1.5 border border-slate-600/30 relative`}>
                    {task.deadlineWarning && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded flex items-center gap-0.5">
                        <AlertCircle size={8} />
                        {task.deadlineWarning}
                      </div>
                    )}
                    <div className="flex items-start gap-1.5">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-3 h-3 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium ${task.completed ? 'line-through text-white/50' : ''}`}>
                          {task.name}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-xs px-1 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-white/70 hover:text-white">×</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected/All Tasks - Compact */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-xs flex items-center gap-1">
                <Target size={12} />
                {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'All Tasks'}
              </h2>
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-white text-sm">×</button>
              )}
            </div>
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {(selectedDate ? getSelectedDateTasks() : tasks).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">No tasks</div>
              ) : (
                (selectedDate ? getSelectedDateTasks() : tasks).slice(0, 10).map(task => (
                  <div key={task.id} className={`bg-gradient-to-r ${getCategoryColor(task.category)} rounded p-1.5 border border-slate-600/30 relative`}>
                    {task.deadlineWarning && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded flex items-center gap-0.5">
                        <AlertCircle size={8} />
                        {task.deadlineWarning}
                      </div>
                    )}
                    <div className="flex items-start gap-1.5">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-3 h-3 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium ${task.completed ? 'line-through text-white/50' : ''}`}>
                          {task.name}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`text-xs px-1 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-white/70">{new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-white/70 hover:text-white">×</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Download & Export - Compact */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-1 mb-2">
              <Download size={12} />
              <h2 className="font-bold text-xs">Export Data</h2>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => downloadData('weekly')}
                className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Download size={10} />
                Weekly
              </button>
              <button
                onClick={() => downloadData('monthly')}
                className="w-full bg-purple-600 hover:bg-purple-700 px-2 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Download size={10} />
                Monthly
              </button>
              <button
                onClick={() => downloadData('yearly')}
                className="w-full bg-green-600 hover:bg-green-700 px-2 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Download size={10} />
                Yearly
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700">
              <h3 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
                <Mail size={10} />
                Team Emails
              </h3>
              <div className="space-y-1 max-h-[80px] overflow-y-auto">
                {Object.entries(userEmails).map(([user, email]) => (
                  <div key={user} className="text-xs text-slate-300 truncate">
                    {user}: {email}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Analytics - Compact */}
        <div className="grid grid-cols-2 gap-3">
          {/* Bar Chart - Compact */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-xs flex items-center gap-1">
                <BarChart3 size={12} />
                Team Work Time
              </h2>
              <div className="flex gap-1">
                {['daily', 'weekly', 'monthly', 'yearly'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      viewMode === mode ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {workTimeData.slice(0, 6).map((data, idx) => {
                const currentSeconds = viewMode === 'daily' ? data.dailySeconds : 
                                      viewMode === 'weekly' ? data.weeklySeconds : 
                                      viewMode === 'monthly' ? data.monthlySeconds :
                                      data.yearlySeconds;
                const percentage = maxTime > 0 ? (currentSeconds / maxTime) * 100 : 0;
                const displayTime = viewMode === 'daily' ? data.daily : 
                                   viewMode === 'weekly' ? data.weekly : 
                                   viewMode === 'monthly' ? data.monthly :
                                   data.yearly;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {data.user}
                      </span>
                      <span className="font-mono text-green-400 font-semibold">{displayTime}</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {workTimeData.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">No sessions recorded</div>
            )}
          </div>

          {/* Pie Chart - Compact */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <h2 className="font-bold text-xs mb-3 flex items-center gap-1">
              <PieChart size={12} />
              Work Distribution
            </h2>

            {workTimeData.length > 0 ? (
              <div className="flex items-center gap-4">
                <svg width="120" height="120" viewBox="0 0 120 120" className="transform -rotate-90">
                  {(() => {
                    let currentAngle = 0;
                    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
                    return workTimeData.map((data, idx) => {
                      const currentSeconds = viewMode === 'daily' ? data.dailySeconds : 
                                            viewMode === 'weekly' ? data.weeklySeconds : 
                                            viewMode === 'monthly' ? data.monthlySeconds :
                                            data.yearlySeconds;
                      const percentage = totalWorkTimeSeconds > 0 ? (currentSeconds / totalWorkTimeSeconds) : 0;
                      const angle = percentage * 360;
                      const startAngle = currentAngle;
                      currentAngle += angle;
                      
                      const x1 = 60 + 55 * Math.cos((startAngle * Math.PI) / 180);
                      const y1 = 60 + 55 * Math.sin((startAngle * Math.PI) / 180);
                      const x2 = 60 + 55 * Math.cos((currentAngle * Math.PI) / 180);
                      const y2 = 60 + 55 * Math.sin((currentAngle * Math.PI) / 180);
                      const largeArc = angle > 180 ? 1 : 0;
                      
                      return (
                        <path
                          key={idx}
                          d={`M 60 60 L ${x1} ${y1} A 55 55 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={colors[idx % colors.length]}
                          opacity="0.8"
                        />
                      );
                    });
                  })()}
                </svg>

                <div className="flex-1 space-y-1">
                  {workTimeData.slice(0, 6).map((data, idx) => {
                    const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-cyan-500'];
                    const currentSeconds = viewMode === 'daily' ? data.dailySeconds : 
                                          viewMode === 'weekly' ? data.weeklySeconds : 
                                          viewMode === 'monthly' ? data.monthlySeconds :
                                          data.yearlySeconds;
                    const percentage = totalWorkTimeSeconds > 0 ? ((currentSeconds / totalWorkTimeSeconds) * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={idx} className="flex items-center gap-1 text-xs">
                        <div className={`w-2 h-2 rounded ${colors[idx % colors.length]}`}></div>
                        <span className="text-slate-300 flex-1 truncate">{data.user}</span>
                        <span className="text-slate-500">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">No data</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}