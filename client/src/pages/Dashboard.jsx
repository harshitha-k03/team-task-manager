import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { 
  Plus, 
  Calendar, 
  User, 
  MoreVertical, 
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  Loader2,
  Filter,
  Search,
  FolderKanban,
  Folder,
  ArrowRight,
  ClipboardList
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const COLUMNS = [
  { id: 'todo', title: 'To Do', icon: Circle, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'in-progress', title: 'In Progress', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'done', title: 'Done', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' }
]

const STATUS_LABELS = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done'
}

function TaskCard({ task, index, onStatusChange, onDelete, isAdmin }) {
  const [menuOpen, setMenuOpen] = useState(false)
  
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
  
  const formatDate = (date) => {
    if (!date) return null
    const d = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (d.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleStatusChange = (newStatus) => {
    onStatusChange(task._id, newStatus)
    setMenuOpen(false)
  }

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group card p-4 hover:shadow-md transition-all duration-200 ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''
          } ${isOverdue ? 'ring-2 ring-red-300 dark:ring-red-700' : ''}`}
        >
          {/* Card header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
              {task.title}
            </h3>
            {isAdmin && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <button
                      onClick={() => handleStatusChange('todo')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      Move to To Do
                    </button>
                    <button
                      onClick={() => handleStatusChange('in-progress')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      Move to In Progress
                    </button>
                    <button
                      onClick={() => handleStatusChange('done')}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      Move to Done
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={() => {
                        onDelete(task._id)
                        setMenuOpen(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          {/* Card meta */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {/* Due date */}
            {task.dueDate && (
              <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(task.dueDate)}</span>
                {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
              </div>
            )}

            {/* Assigned to */}
            {task.assignedTo ? (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <User className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="truncate max-w-[80px]">{task.assignedTo.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <User className="w-3.5 h-3.5" />
                <span>Unassigned</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}

function EmptyColumn({ column, onAddTask }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className={`w-12 h-12 rounded-full ${column.bg} flex items-center justify-center mb-3`}>
        <column.icon className={`w-6 h-6 ${column.color}`} />
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        No {column.title.toLowerCase()} tasks yet
      </p>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [myProjects, setMyProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      if (isAdmin) {
        // Admin sees all tasks and projects
        const [tasksRes, projectsRes] = await Promise.all([
          api.get('/api/tasks'),
          api.get('/api/projects')
        ])
        setTasks(tasksRes.data)
        setProjects(projectsRes.data)
        setMyTasks(tasksRes.data)
        setMyProjects(projectsRes.data)
      } else {
        // Member sees their projects and assigned tasks
        const [myTasksRes, myProjectsRes] = await Promise.all([
          api.get('/api/tasks/my-tasks'),
          api.get('/api/projects')
        ])
        setMyTasks(myTasksRes.data)
        setMyProjects(myProjectsRes.data)
        setTasks(myTasksRes.data)
        setProjects(myProjectsRes.data)
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = useMemo(() => {
    let filtered = tasks
    
    // Filter by project
    if (selectedProject) {
      filtered = filtered.filter(task => task.project?._id === selectedProject)
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [tasks, selectedProject, searchQuery])

  const tasksByStatus = useMemo(() => {
    const grouped = {
      'todo': [],
      'in-progress': [],
      'done': []
    }
    
    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })
    
    return grouped
  }, [filteredTasks])

  const handleDragEnd = async (result) => {
    const { destination, draggableId } = result
    
    if (!destination) return
    
    if (
      destination.droppableId === result.source.droppableId &&
      destination.index === result.source.index
    ) {
      return
    }

    const newStatus = destination.droppableId
    
    // Optimistic update
    setTasks(prev => prev.map(task => 
      task._id === draggableId ? { ...task, status: newStatus } : task
    ))

    try {
      await api.put(`/api/tasks/${draggableId}`, { status: newStatus })
      toast.success('Task status updated')
    } catch (error) {
      toast.error('Failed to update task')
      fetchData() // Revert on error
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks(prev => prev.map(task => 
      task._id === taskId ? { ...task, status: newStatus } : task
    ))

    try {
      await api.put(`/api/tasks/${taskId}`, { status: newStatus })
      toast.success('Task status updated')
    } catch (error) {
      toast.error('Failed to update task')
      fetchData()
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/api/tasks/${taskId}`)
      setTasks(prev => prev.filter(task => task._id !== taskId))
      toast.success('Task deleted')
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your tasks across projects
          </p>
        </div>
        {isAdmin && projects.length > 0 && (
          <button
            onClick={() => navigate(`/projects/${selectedProject || projects[0]._id}`)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>

{/* Filters */}
      {isAdmin && projects.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Project filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="input py-2"
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="input pl-10"
            />
          </div>
        </div>
      )}

      {/* SECTION 1: MY PROJECTS - Only for Members */}
      {!isAdmin && myProjects.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Folder className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Projects
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProjects.map(project => (
              <div
                key={project._id}
                onClick={() => navigate(`/projects/${project._id}`)}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Folder className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {project.members?.length || 0} members
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: MY TASKS - Only for Members */}
      {!isAdmin && myTasks.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Tasks
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({myTasks.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTasks.map(task => (
              <div
                key={task._id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                    {task.title}
                  </h3>
                </div>
                {task.project && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {task.project.name}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  {/* Status Badge */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'done' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    task.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                  }`}>
                    {STATUS_LABELS[task.status] || task.status}
                  </span>
                  {/* Due Date */}
                  {task.dueDate && (
                    <div className={`flex items-center gap-1 text-xs ${
                      new Date(task.dueDate) < new Date() && task.status !== 'done'
                        ? 'text-red-500 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

{/* Empty state */}
      {tasks.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isAdmin ? 'No tasks yet' : 'No tasks assigned to you'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm">
            {isAdmin 
              ? 'Create a project first, then add tasks to get started.'
              : 'You can drag tasks between columns to update their status.'}
          </p>
          {isAdmin && projects.length === 0 && (
            <button
              onClick={() => navigate('/projects')}
              className="btn-primary mt-4"
            >
              Create Project
            </button>
          )}
        </div>
      ) : (
        /* Kanban Board */
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map(column => (
              <div key={column.id} className="flex flex-col">
                {/* Column header */}
                <div className={`flex items-center gap-2 px-4 py-3 rounded-t-lg ${column.bg}`}>
                  <column.icon className={`w-5 h-5 ${column.color}`} />
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {column.title}
                  </h2>
                  <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                    {tasksByStatus[column.id].length}
                  </span>
                </div>

                {/* Column content */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 bg-gray-100 dark:bg-gray-800/50 rounded-b-lg min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                    >
                      {tasksByStatus[column.id].length > 0 ? (
                        <div className="space-y-3">
                          {tasksByStatus[column.id].map((task, index) => (
                            <TaskCard
                              key={task._id}
                              task={task}
                              index={index}
                              onStatusChange={handleStatusChange}
                              onDelete={handleDeleteTask}
                              isAdmin={isAdmin}
                            />
                          ))}
                        </div>
                      ) : (
                        <EmptyColumn column={column} />
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Stats summary */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{tasks.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">To Do</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{tasksByStatus.todo.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{tasksByStatus['in-progress'].length}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{tasksByStatus.done.length}</p>
          </div>
        </div>
      )}
    </div>
  )
}
