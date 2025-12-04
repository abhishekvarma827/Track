import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Target, Plus, TrendingUp, Briefcase, Users, Play, Pause, Square, User, BarChart3, Download, PieChart, Bell, Mail, AlertCircle, LogIn, Activity } from 'lucide-react';

export default function TaskTracker() {
  const [currentUser, setCurrentUser] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Work');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState('weekly');
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [workSessions, setWorkSessions] = useState<any[]>([]);
  const [userEmails, setUserEmails] = useState<any>({});
  const [userLoginTimes, setUserLoginTimes] = useState<any>({});
  const timerIntervalRef = useRef<any>(null);

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

  const loadData = () => {
    try {
      const tasksData = localStorage.getItem('shared-tasks');
      const sessionsData = localStorage.getItem('shared-sessions');
      const emailsData = localStorage.getItem('user-emails');
      const loginTimesData = localStorage.getItem('user-login-times');
      
      if (tasksData) setTasks(JSON.parse(tasksData));
      if (sessionsData) setWorkSessions(JSON.parse(sessionsData));
      if (emailsData) setUserEmails(JSON.parse(emailsData));
      if (loginTimesData) setUserLoginTimes(JSON.parse(loginTimesData));
    } catch (error) {
      console.log('Starting fresh');
    }
  };

  const saveData = () => {
    try {
      localStorage.setItem('shared-tasks', JSON.stringify(tasks));
      localStorage.setItem('shared-sessions', JSON.stringify(workSessions));
      localStorage.setItem('user-emails', JSON.stringify(userEmails));
      localStorage.setItem('user-login-times', JSON.stringify(userLoginTimes));
    } catch (error) {
      console.error('Save failed');
    }
  };

  useEffect(() => {
    if (isLoggedIn) saveData();
  }, [tasks, workSessions, isLoggedIn, userEmails, userLoginTimes]);

  const categories = ['Work', 'Sales', 'Marketing', 'Finance', 'Operations', 'Critical'];
  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const addNotification = (message: string, type = 'info') => {
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
        const daysLeft = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft === 0) {
          task.deadlineWarning = 'Due today!';
        } else if (daysLeft === 1) {
          task.deadlineWarning = '1 day';
        } else if (daysLeft > 0 && daysLeft <= 3) {
          task.deadlineWarning = `${daysLeft} days`;
        } else if (daysLeft < 0) {
          task.deadlineWarning = `${Math.abs(daysLeft)}d late`;
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
      addNotification(`Session saved: ${formatTime(currentSessionTime)}`, 'success');
    }
    setIsTimerRunning(false);
    setCurrentSessionTime(0);
  };

  const getUniqueUsers = () => {
    const users = new Set<string>();
    workSessions.forEach(s => users.add(s.user));
    tasks.forEach(t => users.add(t.createdBy));
    return Array.from(users);
  };

  const getUserWorkTime = (userName: string, dateFilter = 'today') => {
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
      loginTime: userLoginTimes[user]?.loginTime || 'N/A',
      loginDate: userLoginTimes[user]?.loginDate || 'N/A',
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

  const downloadData = (period: string) => {
    const workTimeData = getWorkTimeData();
    const now = new Date();
    
    const data = {
      exportDate: now.toISOString(),
      period: period,
      users: workTimeData.map(d => ({
        name: d.user,
        email: userEmails[d.user] || 'Not provided',
        loginTime: d.loginTime,
        loginDate: d.loginDate,
        workTime: period === 'weekly' ? d.weekly : period === 'monthly' ? d.monthly : d.yearly,
        workTimeSeconds: period === 'weekly' ? d.weeklySeconds : period === 'monthly' ? d.monthlySeconds : d.yearlySeconds
      })),
      tasks: tasks,
      sessions: workSessions
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
    addNotification(`Downloaded ${period} data`, 'success');
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
      addNotification(`Task "${newTaskName}" added`, 'success');
    }
  };

  const toggleTask = (id: number) => {
    const task = tasks.find(t => t.id === id);
    const wasCompleted = task?.completed;
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    if (!wasCompleted && task) {
      addNotification(`✓ ${task.name}`, 'success');
    }
  };

  const deleteTask = (id: number) => {
    const task = tasks.find(t => t.id === id);
    setTasks(tasks.filter(task => task.id !== id));
    if (task) {
      addNotification(`Deleted: ${task.name}`, 'info');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: any = {
      'Work': 'from-blue-600 to-blue-700',
      'Sales': 'from-green-600 to-green-700',
      'Marketing': 'from-purple-600 to-purple-700',
      'Finance': 'from-yellow-600 to-yellow-700',
      'Operations': 'from-indigo-600 to-indigo-700',
      'Critical': 'from-red-600 to-red-700'
    };
    return colors[category] || 'from-gray-600 to-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors: any = {
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay()
    };
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (date: number) => {
    const today = new Date();
    return date === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const getTasksForDate = (date: number) => {
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = date.toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return tasks.filter(t => t.date === dateStr);
  };

  const handleDateClick = (date: number) => {
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
      const loginInfo = {
        loginTime: new Date().toLocaleTimeString(),
        loginDate: new Date().toLocaleDateString(),
        timestamp: Date.now()
      };
      setUserEmails((prev: any) => ({ ...prev, [currentUser]: currentEmail }));
      setUserLoginTimes((prev: any) => ({ ...prev, [currentUser]: loginInfo }));
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
            <h1 className="text-3xl font-bold mb-2 text-white">Business Task Tracker</h1>
            <p className="text-slate-400">Professional Team Management</p>
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
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-lg font-semibold transition-all text-white"
            >
              Start Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-hidden flex flex-col">
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

      {/* Header */}
      <div className="bg-slate-800/40 backdrop-blur-sm border-b border-slate-700/50 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase size={18} />
            <h1 className="text-sm font-bold">Business Task Tracker</h1>
            <span className="text-xs text-slate-400">• {currentUser}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-400">
              {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
            </div>
            <button
              onClick={() => {
                setIsTimerRunning(!isTimerRunning);
                if (!isTimerRunning) addNotification('Timer started', 'info');
              }}
              className={`${isTimerRunning ? 'bg-red-600' : 'bg-green-600'} hover:opacity-90 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1`}
            >
              <Clock size={12} />
              {isTimerRunning ? 'Stop' : 'Start'} Timer
            </button>
            {isTimerRunning && (
              <button
                onClick={endTimer}
                className="bg-orange-600 hover:opacity-90 px-3 py-1 rounded text-xs font-semibold"
              >
                End Session
              </button>
            )}
          </div>
        </div>
        {isTimerRunning && (
          <div className="mt-2 text-center">
            <div className="text-2xl font-bold text-green-400">{formatTime(currentSessionTime)}</div>
          </div>
        )}
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 grid grid-cols-3 gap-2 p-2 overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="space-y-2 overflow-y-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-3">
              <Target size={18} className="mb-1 opacity-70" />
              <div className="text-xl font-bold">{totalTasks}</div>
              <div className="text-xs opacity-90">Total Tasks</div>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-3">
              <TrendingUp size={18} className="mb-1 opacity-70" />
              <div className="text-xl font-bold">{completedTasks}</div>
              <div className="text-xs opacity-90">Completed</div>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-3">
              <Calendar size={18} className="mb-1 opacity-70" />
              <div className="text-xl font-bold">{todayTasks.length}</div>
              <div className="text-xs opacity-90">Today</div>
            </div>
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-3">
              <Clock size={18} className="mb-1 opacity-70" />
              <div className="text-base font-bold">{formatTime(totalWorkTimeSeconds)}</div>
              <div className="text-xs opacity-90">Total Time</div>
            </div>
          </div>

          {/* Add Task */}
          <div className="bg-slate-800/60 backdrop-blur rounded-lg p-3">
            <h3 className="text-xs font-bold mb-2 flex items-center gap-1">
              <Plus size={12} /> Add Task
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Task name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
                className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-xs"
                >
                  {categories.map(cat => <option key={cat}>{cat}</option>)}
                </select>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  className="px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-xs"
                >
                  {priorities.map(pri => <option key={pri}>{pri}</option>)}
                </select>
              </div>
              <input
                type="date"
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-xs"
              />
              <button
                onClick={addTask}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1.5 rounded text-xs font-semibold"
              >
                Add Task
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-slate-800/60 backdrop-blur rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => changeMonth(-1)} className="text-slate-400 hover:text-white text-xs">←</button>
              <h3 className="text-xs font-bold">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
              <button onClick={() => changeMonth(1)} className="text-slate-400 hover:text-white text-xs">→</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs text-slate-400">{day}</div>
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

          {/* User Login Info */}
          <div className="bg-slate-800/60 backdrop-blur rounded-lg p-3">
            <h3 className="text-xs font-bold mb-2 flex items-center gap-1">
              <LogIn size={12} /> User Activity
            </h3>
            <div className="space-y-1.5">
              {workTimeData.slice(0, 5).map((data, idx) => (
                <div key={idx} className="bg-slate-700/30 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <User size={10} className="text-blue-400" />
                      <span className="text-xs font-semibold">{data.user}</span>
                    </div>
                    <span className="text-xs text-green-400">{data.daily}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Login: {data.loginDate} • {data.loginTime}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN */}
        <div className="space-y-2 overflow-y-auto">
          {/* Today's Tasks */}
          <div className="bg-slate-800/60 backdrop-blur rounded-lg p-3">
            <h3 className="text-xs font-bold mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Today's Tasks
              </span>
              <span className="text-slate-400">{todayTasks.length}</span>
            </h3>
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">No tasks for today</div>
              ) : (
                todayTasks.map(task => (
                  <div key={task.id} className={`bg-gradient-to-r ${getCategoryColor(task.category)} rounded p-2 relative`}>
                    {task.deadlineWarning && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded">{task.deadlineWarning}</div>
                    )}
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-3 h-3 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className={`text-xs font-medium ${task.completed ? 'line-through opacity-50' : ''}`}>
                          {task.name}
                        </div>
                        <div className="flex gap-1 mt-1">
                          <span className={`text-xs px-1 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs px-1 py-0.5 bg-black/20 rounded">{task.category}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-white/70 hover:text-white">×</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* All Tasks / Selected Date */}
          <div className="bg-slate-800/60 backdrop-blur rounded-lg p-3">
            <h3 className="text-xs font-bold mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Target size={12} />
                {selectedDate ? `Tasks: ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'All Tasks'}
              </span>
              {selectedDate && (
                <button onClick={() => setSelectedDate(null)} className="text-slate-400 hover:text-white">×</button>
              )}
            </h3>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {(selectedDate ? getSelectedDateTasks() : tasks).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">No tasks</div>
              ) : (
                (selectedDate ? getSelectedDateTasks() : tasks).map(task => (
                  <div key={task.id} className={`bg-gradient-to-r ${getCategoryColor(task.category)} rounded p-2 relative`}>
                    {task.deadlineWarning && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded">{task.deadlineWarning}</div>
                    )}
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        className="w-3 h-3 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className={`text-xs font-medium ${task.completed ? 'line-through opacity-50' : ''}`}>
                          {task.name}
                        </div>
                        <div className="flex gap-1 mt-1">
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

          {/* Export */}
          <div className="bg-slate-800/60 backdrop-blur rounded-lg p-3">
            <h3 className="text-xs font-bold mb-2 flex items-center gap-1">
              <Download size={12} /> Export Data
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => downloadData('weekly')} className="bg-blue-600 hover:bg-blue-700 px-2 py-1.5 rounded text-xs font-semibold">
                Weekly
              </button>
              <button onClick={() => downloadData('monthly')} className="bg-purple-600 hover:bg-purple-700 px-2 py-1.5 rounded text-xs font-semibold">
                Monthly
              </button>
              <button onClick={() => downloadData('yearly')} className="bg-green-600 hover:bg-green-700 px-2 py-1.5 rounded text-xs font-semibold">
                Yearly
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-2 overflow-y-auto">
          {/* Team Work Time Bar Chart */}
          <div className="bg-slate-800/60 backdrop-blur rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold flex items-center gap-1">
                <BarChart3 size={12} /> Team Performance
              </h3>
              <div className="flex gap-1">
                {['daily', 'weekly', 'monthly', 'yearly'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-1.5 py-0.5 rounded text-xs ${viewMode === mode ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    {mode[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {workTimeData.slice(0, 8).map((data, idx) => {
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
                  <div key={idx}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1">
                        <User size={10} className="text-slate-400" />
                        {data.user}
                      </span>
                      <span className="font-mono text-green-400 font-semibold">{displayTime}</span>
                    </div>
                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 25 && <span className="text-white text-xs font-bold">{Math.round(percentage)}%</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {workTimeData.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">No work sessions recorded</div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-slate-800/60 backdrop-blur rounded-lg p-3">
            <h3 className="text-xs font-bold mb-3 flex items-center gap-1">
              <PieChart size={12} /> Work Distribution
            </h3>
            {workTimeData.length > 0 ? (
              <div className="flex items-center justify-center gap-4">
                <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
                  {(() => {
                    let currentAngle = 0;
                    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];
                    return workTimeData.map((data, idx) => {
                      const currentSeconds = viewMode === 'daily' ? data.dailySeconds : 
                                            viewMode === 'weekly' ? data.weeklySeconds : 
                                            viewMode === 'monthly' ? data.monthlySeconds :
                                            data.yearlySeconds;
                      const percentage = totalWorkTimeSeconds > 0 ? (currentSeconds / totalWorkTimeSeconds) : 0;
                      const angle = percentage * 360;
                      const startAngle = currentAngle;
                      currentAngle += angle;
                      
                      const x1 = 70 + 65 * Math.cos((startAngle * Math.PI) / 180);
                      const y1 = 70 + 65 * Math.sin((startAngle * Math.PI) / 180);
                      const x2 = 70 + 65 * Math.cos((currentAngle * Math.PI) / 180);
                      const y2 = 70 + 65 * Math.sin((currentAngle * Math.PI) / 180);
                      const largeArc = angle > 180 ? 1 : 0;
                      
                      return (
                        <path
                          key={idx}
                          d={`M 70 70 L ${x1} ${y1} A 65 65 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={colors[idx % colors.length]}
                          opacity="0.9"
                        />
                      );
                    });
                  })()}
                  <circle cx="70" cy="70" r="35" fill="#1e293b" />
                </svg>
                <div className="flex-1 space-y-1">
                  {workTimeData.map((data, idx) => {
                    const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500'];
                    const currentSeconds = viewMode === 'daily' ? data.dailySeconds : 
                                          viewMode === 'weekly' ? data.weeklySeconds : 
                                          viewMode === 'monthly' ? data.monthlySeconds :
                                          data.yearlySeconds;
                    const percentage = totalWorkTimeSeconds > 0 ? ((currentSeconds / totalWorkTimeSeconds) * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={idx} className="flex items-center gap-1 text-xs">
                        <div className={`w-2 h-2 rounded ${colors[idx % colors.length]}`}></div>
                        <span className="text-slate-300 flex-1 truncate">{data.user}</span>
                        <span className="text-slate-400 font-semibold">{percentage}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">No data to visualize</div>
            )}
          </div>

          {/* Detailed User Stats */}
          <div className="bg-slate-800/60 backdrop-blur rounded-lg p-3">
            <h3 className="text-xs font-bold mb-3 flex items-center gap-1">
              <Activity size={12} /> Detailed Analytics
            </h3>
            <div className="space-y-2">
              {workTimeData.map((data, idx) => (
                <div key={idx} className="bg-slate-700/30 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1">
                      <User size={12} className="text-blue-400" />
                      <span className="text-xs font-bold">{data.user}</span>
                    </div>
                    <span className="text-xs text-slate-400">{userEmails[data.user]}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    <div className="bg-blue-600/20 rounded p-1 text-center">
                      <div className="font-mono text-blue-400">{data.daily}</div>
                      <div className="text-xs text-slate-400">Daily</div>
                    </div>
                    <div className="bg-purple-600/20 rounded p-1 text-center">
                      <div className="font-mono text-purple-400">{data.weekly}</div>
                      <div className="text-xs text-slate-400">Week</div>
                    </div>
                    <div className="bg-green-600/20 rounded p-1 text-center">
                      <div className="font-mono text-green-400">{data.monthly}</div>
                      <div className="text-xs text-slate-400">Month</div>
                    </div>
                    <div className="bg-orange-600/20 rounded p-1 text-center">
                      <div className="font-mono text-orange-400">{data.yearly}</div>
                      <div className="text-xs text-slate-400">Year</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
