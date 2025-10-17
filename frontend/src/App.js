import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

// Icons
import { 
  LayoutDashboard, 
  BookOpen, 
  Clock, 
  Calculator, 
  BarChart3, 
  MessageCircle,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Play,
  Pause,
  Send
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Dashboard Component
const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [status, setStatus] = useState(null);
  const [gpaCalc, setGpaCalc] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, statusRes, gpaRes] = await Promise.all([
        axios.get(`${API}/analytics/dashboard`),
        axios.get(`${API}/status`),
        axios.post(`${API}/gpa/calculate`, {})
      ]);
      setAnalytics(analyticsRes.data);
      setStatus(statusRes.data);
      setGpaCalc(gpaRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  if (!analytics || !status) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6" data-testid="dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900" data-testid="dashboard-title">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your academic progress</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card glass-card" data-testid="current-cgpa-card">
          <CardHeader className="pb-2">
            <CardDescription>Current CGPA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{status.current_cgpa}</div>
            <p className="text-sm text-gray-500 mt-1">Target: {status.target_cgpa}</p>
          </CardContent>
        </Card>

        <Card className="stat-card glass-card" data-testid="predicted-gpa-card">
          <CardHeader className="pb-2">
            <CardDescription>Predicted Semester GPA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {gpaCalc?.predicted_current_gpa || 'N/A'}
            </div>
            <p className="text-sm text-gray-500 mt-1">Based on tasks</p>
          </CardContent>
        </Card>

        <Card className="stat-card glass-card" data-testid="study-hours-card">
          <CardHeader className="pb-2">
            <CardDescription>Weekly Study Hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{analytics.weekly_study_hours}h</div>
            <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="stat-card glass-card" data-testid="completion-rate-card">
          <CardHeader className="pb-2">
            <CardDescription>Task Completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{analytics.completion_rate}%</div>
            <p className="text-sm text-gray-500 mt-1">{analytics.completed_tasks}/{analytics.total_tasks} tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* GPA Goal */}
      <Card className="glass-card" data-testid="gpa-goal-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            GPA Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Progress to Target CGPA</span>
              <span className="text-sm font-bold">{((status.current_cgpa / status.target_cgpa) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(status.current_cgpa / status.target_cgpa) * 100} className="h-3" />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Required GPA in Remaining Credits</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{gpaCalc?.required_gpa || 'N/A'}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Focus Streak</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{analytics.focus_streak} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance */}
      {analytics.subject_performance.length > 0 && (
        <Card className="glass-card" data-testid="subject-performance-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.subject_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#9333ea" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Study Planner Component
const StudyPlanner = () => {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', credits: 3, color: '#9333ea' });
  const [newTask, setNewTask] = useState({
    subject_id: '',
    title: '',
    description: '',
    task_type: 'assignment',
    deadline: '',
    max_marks: 100
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, tasksRes] = await Promise.all([
        axios.get(`${API}/subjects`),
        axios.get(`${API}/tasks`)
      ]);
      setSubjects(subjectsRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const createSubject = async () => {
    try {
      await axios.post(`${API}/subjects`, newSubject);
      toast.success('Subject created!');
      setShowSubjectDialog(false);
      setNewSubject({ name: '', credits: 3, color: '#9333ea' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create subject');
    }
  };

  const createTask = async () => {
    try {
      await axios.post(`${API}/tasks`, newTask);
      toast.success('Task created!');
      setShowTaskDialog(false);
      setNewTask({ subject_id: '', title: '', description: '', task_type: 'assignment', deadline: '', max_marks: 100 });
      fetchData();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.patch(`${API}/tasks/${taskId}`, { status: newStatus });
      fetchData();
      toast.success('Task updated!');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      fetchData();
      toast.success('Task deleted!');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown';
  };

  return (
    <div className="p-6 space-y-6" data-testid="study-planner">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900" data-testid="planner-title">Study Planner</h1>
          <p className="text-gray-600 mt-1">Manage subjects, tasks, and deadlines</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="add-subject-btn">
                <Plus className="w-4 h-4" /> Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-subject-dialog">
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Subject Name</Label>
                  <Input
                    data-testid="subject-name-input"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    placeholder="e.g., Data Structures"
                  />
                </div>
                <div>
                  <Label>Credits</Label>
                  <Input
                    data-testid="subject-credits-input"
                    type="number"
                    value={newSubject.credits}
                    onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) })}
                  />
                </div>
                <Button data-testid="create-subject-btn" onClick={createSubject} className="w-full">Create Subject</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="add-task-btn">
                <Plus className="w-4 h-4" /> Add Task
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="add-task-dialog">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Subject</Label>
                  <Select
                    data-testid="task-subject-select"
                    value={newTask.subject_id}
                    onValueChange={(value) => setNewTask({ ...newTask, subject_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Task Title</Label>
                  <Input
                    data-testid="task-title-input"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="e.g., Assignment 1"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    data-testid="task-type-select"
                    value={newTask.task_type}
                    onValueChange={(value) => setNewTask({ ...newTask, task_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Deadline</Label>
                  <Input
                    data-testid="task-deadline-input"
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  />
                </div>
                <Button data-testid="create-task-btn" onClick={createTask} className="w-full">Create Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Subjects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subjects.map(subject => (
          <Card key={subject.id} className="glass-card" data-testid={`subject-card-${subject.id}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }}></div>
                {subject.name}
              </CardTitle>
              <CardDescription>{subject.credits} credits</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Tasks */}
      <Card className="glass-card" data-testid="tasks-card">
        <CardHeader>
          <CardTitle>Tasks & Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            {['all', 'pending', 'in_progress', 'completed'].map(status => (
              <TabsContent key={status} value={status} className="space-y-2 mt-4">
                {tasks
                  .filter(t => status === 'all' || t.status === status)
                  .map(task => (
                    <div
                      key={task.id}
                      className="task-item flex items-center justify-between p-4 rounded-lg border"
                      data-testid={`task-item-${task.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          data-testid={`task-status-btn-${task.id}`}
                          onClick={() => {
                            const statusMap = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' };
                            updateTaskStatus(task.id, statusMap[task.status]);
                          }}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-gray-500">
                            {getSubjectName(task.subject_id)} • {task.task_type}
                            {task.deadline && ` • Due: ${new Date(task.deadline).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`delete-task-btn-${task.id}`}
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                {tasks.filter(t => status === 'all' || t.status === status).length === 0 && (
                  <p className="text-center text-gray-500 py-8">No tasks found</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Focus Tracker Component
const FocusTracker = () => {
  const [sessions, setSessions] = useState([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [pomodoroLength, setPomodoroLength] = useState(25);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        if (timerSeconds === 0) {
          if (timerMinutes === 0) {
            // Timer completed
            setIsTimerRunning(false);
            saveFocusSession(pomodoroLength);
            toast.success('Focus session completed! 🎉');
            setTimerMinutes(pomodoroLength);
          } else {
            setTimerMinutes(timerMinutes - 1);
            setTimerSeconds(59);
          }
        } else {
          setTimerSeconds(timerSeconds - 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerMinutes, timerSeconds, pomodoroLength]);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/focus-sessions`);
      setSessions(res.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const saveFocusSession = async (duration) => {
    try {
      await axios.post(`${API}/focus-sessions`, {
        duration_minutes: duration
      });
      fetchSessions();
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerMinutes(pomodoroLength);
    setTimerSeconds(0);
  };

  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.date === today);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

  return (
    <div className="p-6 space-y-6" data-testid="focus-tracker">
      <div>
        <h1 className="text-4xl font-bold text-gray-900" data-testid="focus-title">Focus Tracker</h1>
        <p className="text-gray-600 mt-1">Track your study sessions with Pomodoro timer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer */}
        <Card className="glass-card" data-testid="pomodoro-timer-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Pomodoro Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className={`text-7xl font-bold ${isTimerRunning ? 'focus-timer' : ''}`} data-testid="timer-display">
                {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
              </div>
              <p className="text-gray-500 mt-2">Focus time</p>
            </div>

            <div className="flex gap-2 justify-center">
              {!isTimerRunning ? (
                <Button data-testid="start-timer-btn" onClick={startTimer} size="lg" className="gap-2">
                  <Play className="w-5 h-5" /> Start
                </Button>
              ) : (
                <Button data-testid="pause-timer-btn" onClick={pauseTimer} size="lg" variant="outline" className="gap-2">
                  <Pause className="w-5 h-5" /> Pause
                </Button>
              )}
              <Button data-testid="reset-timer-btn" onClick={resetTimer} size="lg" variant="outline">
                Reset
              </Button>
            </div>

            <div>
              <Label>Session Length (minutes)</Label>
              <Select
                data-testid="session-length-select"
                value={String(pomodoroLength)}
                onValueChange={(val) => {
                  const len = parseInt(val);
                  setPomodoroLength(len);
                  if (!isTimerRunning) {
                    setTimerMinutes(len);
                    setTimerSeconds(0);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="25">25 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          <Card className="glass-card" data-testid="today-focus-card">
            <CardHeader>
              <CardTitle>Today's Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">{Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m</div>
              <p className="text-gray-500 mt-1">{todaySessions.length} sessions completed</p>
            </CardContent>
          </Card>

          <Card className="glass-card" data-testid="total-focus-card">
            <CardHeader>
              <CardTitle>Total Focus Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{Math.floor(totalMinutes / 60)}h</div>
              <p className="text-gray-500 mt-1">{sessions.length} total sessions</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Sessions */}
      <Card className="glass-card" data-testid="recent-sessions-card">
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sessions.slice(-10).reverse().map(session => (
              <div key={session.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50" data-testid={`session-item-${session.id}`}>
                <span className="font-medium">{session.duration_minutes} minutes</span>
                <span className="text-sm text-gray-500">{new Date(session.date).toLocaleDateString()}</span>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-center text-gray-500 py-8">No sessions yet. Start your first focus session!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// GPA Calculator Component
const GPACalculator = () => {
  const [status, setStatus] = useState(null);
  const [calculation, setCalculation] = useState(null);
  const [formData, setFormData] = useState({
    total_credits: 86,
    completed_credits: 86,
    current_cgpa: 7.67,
    target_cgpa: 9.0
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API}/status`);
      setStatus(res.data);
      setFormData({
        total_credits: res.data.total_credits,
        completed_credits: res.data.completed_credits,
        current_cgpa: res.data.current_cgpa,
        target_cgpa: res.data.target_cgpa
      });
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const calculateGPA = async () => {
    try {
      const res = await axios.post(`${API}/gpa/calculate`, formData);
      setCalculation(res.data);
      
      // Update status
      await axios.patch(`${API}/status`, formData);
      toast.success('GPA calculated!');
    } catch (error) {
      toast.error('Failed to calculate GPA');
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="gpa-calculator">
      <div>
        <h1 className="text-4xl font-bold text-gray-900" data-testid="calculator-title">GPA Calculator</h1>
        <p className="text-gray-600 mt-1">Calculate required GPA to achieve your target</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="glass-card" data-testid="gpa-input-card">
          <CardHeader>
            <CardTitle>Your Academic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Total Credits (Full Degree)</Label>
              <Input
                data-testid="total-credits-input"
                type="number"
                value={formData.total_credits}
                onChange={(e) => setFormData({ ...formData, total_credits: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Completed Credits</Label>
              <Input
                data-testid="completed-credits-input"
                type="number"
                value={formData.completed_credits}
                onChange={(e) => setFormData({ ...formData, completed_credits: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Current CGPA</Label>
              <Input
                data-testid="current-cgpa-input"
                type="number"
                step="0.01"
                value={formData.current_cgpa}
                onChange={(e) => setFormData({ ...formData, current_cgpa: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Target CGPA</Label>
              <Input
                data-testid="target-cgpa-input"
                type="number"
                step="0.01"
                value={formData.target_cgpa}
                onChange={(e) => setFormData({ ...formData, target_cgpa: parseFloat(e.target.value) })}
              />
            </div>
            <Button data-testid="calculate-btn" onClick={calculateGPA} className="w-full">Calculate Required GPA</Button>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {calculation && (
            <>
              <Card className="glass-card bg-gradient-to-br from-purple-50 to-blue-50" data-testid="required-gpa-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-purple-600" />
                    Required GPA
                  </CardTitle>
                  <CardDescription>You need to achieve this GPA in remaining credits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl font-bold text-purple-600">{calculation.required_gpa}</div>
                  <p className="text-gray-600 mt-2">In {calculation.remaining_credits} remaining credits</p>
                </CardContent>
              </Card>

              {calculation.predicted_current_gpa && (
                <Card className="glass-card bg-gradient-to-br from-green-50 to-blue-50" data-testid="predicted-gpa-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Predicted Current Semester GPA
                    </CardTitle>
                    <CardDescription>Based on your completed task marks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-6xl font-bold text-green-600">{calculation.predicted_current_gpa}</div>
                  </CardContent>
                </Card>
              )}

              <Card className="glass-card" data-testid="formula-card">
                <CardHeader>
                  <CardTitle>Formula Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                    Required GPA = <br />
                    [(Target CGPA × Total Credits) - (Current CGPA × Completed Credits)] / Remaining Credits
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Analytics Component
const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, sessionsRes] = await Promise.all([
        axios.get(`${API}/analytics/dashboard`),
        axios.get(`${API}/focus-sessions`)
      ]);
      setAnalytics(analyticsRes.data);
      setSessions(sessionsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  if (!analytics) return <div className="p-6">Loading...</div>;

  // Prepare chart data for study hours trend (last 7 days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const daySessions = sessions.filter(s => s.date === dateStr);
    const hours = daySessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60;
    last7Days.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      hours: parseFloat(hours.toFixed(2))
    });
  }

  return (
    <div className="p-6 space-y-6" data-testid="analytics">
      <div>
        <h1 className="text-4xl font-bold text-gray-900" data-testid="analytics-title">Analytics</h1>
        <p className="text-gray-600 mt-1">Track your performance and study patterns</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card" data-testid="completion-metric-card">
          <CardHeader className="pb-2">
            <CardDescription>Task Completion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600">{analytics.completion_rate}%</div>
            <Progress value={analytics.completion_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card" data-testid="weekly-hours-metric-card">
          <CardHeader className="pb-2">
            <CardDescription>Weekly Study Hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">{analytics.weekly_study_hours}h</div>
            <p className="text-sm text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="glass-card" data-testid="focus-streak-metric-card">
          <CardHeader className="pb-2">
            <CardDescription>Focus Streak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{analytics.focus_streak} days</div>
            <p className="text-sm text-gray-500 mt-1">Keep it up!</p>
          </CardContent>
        </Card>
      </div>

      {/* Study Hours Trend */}
      <Card className="glass-card" data-testid="study-hours-trend-card">
        <CardHeader>
          <CardTitle>Study Hours Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="hours" stroke="#9333ea" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Subject Performance */}
      {analytics.subject_performance.length > 0 && (
        <Card className="glass-card" data-testid="subject-performance-analytics-card">
          <CardHeader>
            <CardTitle>Subject-wise Performance</CardTitle>
            <CardDescription>Average scores from completed tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.subject_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// AI Chat Component
const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/chat/history`);
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API}/chat`, { message: userMessage });
      await fetchHistory();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col" data-testid="ai-chat">
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-gray-900" data-testid="chat-title">AI Coach</h1>
        <p className="text-gray-600 mt-1">Your personal academic assistant</p>
      </div>

      <Card className="glass-card flex-1 flex flex-col" data-testid="chat-card">
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" data-testid="chat-messages">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-12">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Start a conversation with your AI coach!</p>
                <p className="text-sm mt-2">Ask about study schedules, performance analysis, or motivation.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`chat-message-${msg.id}`}
              >
                <div
                  className={`max-w-[70%] p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                data-testid="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask your AI coach anything..."
                className="resize-none"
                rows={2}
              />
              <Button
                data-testid="send-message-btn"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                size="lg"
                className="gap-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main App
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen gradient-bg">
        <div className="flex">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main Content */}
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/planner" element={<StudyPlanner />} />
              <Route path="/focus" element={<FocusTracker />} />
              <Route path="/calculator" element={<GPACalculator />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/chat" element={<AIChat />} />
            </Routes>
          </div>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/planner', icon: BookOpen, label: 'Study Planner' },
    { path: '/focus', icon: Clock, label: 'Focus Tracker' },
    { path: '/calculator', icon: Calculator, label: 'GPA Calculator' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/chat', icon: MessageCircle, label: 'AI Coach' },
  ];

  return (
    <div className="w-64 bg-[#0a0a0a] border-r border-gray-800 min-h-screen p-4" data-testid="sidebar">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-purple-500">AI GPA Coach</h1>
        <p className="text-sm text-gray-400 mt-1">Your Academic Assistant</p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              data-testid={`nav-link-${link.label.toLowerCase().replace(' ', '-')}`}
              className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default App;