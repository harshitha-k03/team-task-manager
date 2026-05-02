import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  Circle, 
  Clock, 
  Trash2, 
  Edit,
  Loader2,
  Users,
  Calendar,
  Flag,
  X,
  Search,
  UserPlus,
  UserMinus,
  Mail
} from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// Add Member Modal Component
function AddMemberModal({ projectId, currentMembers, onClose, onAdd, saving }) {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchAvailableUsers()
  }, [projectId])

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get(`/api/projects/${projectId}/members/available`)
      setUsers(response.data)
    } catch (error) {
      // Fallback to getting all users if available endpoint fails
      try {
        const response = await api.get('/api/users')
        const memberIds = currentMembers.map(m => m._id)
        const filtered = response.data.filter(u => !memberIds.includes(u._id))
        setUsers(filtered)
      } catch (err) {
        toast.error('Failed to load users')
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!selectedUser) {
      newErrors.selectedUser = 'Please select a user'
    }
    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onAdd(selectedUser)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Team Member
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
                placeholder="Search by name or email..."
              />
            </div>
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Select User
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No users available to add
                </p>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user._id}
                    onClick={() => setSelectedUser(user._id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${
                      selectedUser === user._id
                        ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-500'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {user.role}
                    </div>
                  </div>
                ))
              )}
            </div>
            {errors.selectedUser && (
              <p className="text-sm text-red-500 mt-1">{errors.selectedUser}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || loading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Add to Project
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

// Task Modal Component with Member Selection
function TaskModal({ task, projectId, members, onClose, onSave, saving }) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [status, setStatus] = useState(task?.status || 'pending')
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?._id || task?.assignedTo || '')
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split('T')[0] : '')
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!title.trim()) {
      newErrors.title = 'Task title is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({ 
      title, 
      description, 
      priority, 
      status, 
      assignedTo: assignedTo || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {task?._id ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-400 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[100px]"
              placeholder="What's this task about?"
            />
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Assign To
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="input"
            >
              <option value="">Unassigned</option>
              {members.map(member => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
            {members.length === 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Add team members to assign tasks
              </p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="input"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

{/* Status - Note: 'done' is the valid value, 'completed' is mapped to it */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Status
            </label>
            <select
              value={status === 'completed' ? 'done' : status}
              onChange={(e) => setStatus(e.target.value === 'done' ? 'completed' : e.target.value)}
              className="input"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Completed</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              task?._id ? 'Update Task' : 'Create Task'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [saving, setSaving] = useState(false)
  const [removingMember, setRemovingMember] = useState(null)
  const [filter, setFilter] = useState('all')

// Check if user is admin (project creator) OR is a member of the project
  const isAdmin = user?.role === 'admin' || project?.createdBy?._id === user?._id || project?.createdBy === user?._id
  const isMember = project?.members?.some(m => m._id === user?._id) || isAdmin

  // Get members list (including creator)
  const members = [
    ...(project?.createdBy ? [project.createdBy] : []),
    ...(project?.members || [])
  ]

  useEffect(() => {
    fetchProject()
    fetchTasks()
  }, [id])

  const fetchProject = async () => {
    try {
      const response = await api.get(`/api/projects/${id}`)
      setProject(response.data)
    } catch (error) {
      toast.error('Failed to load project')
      navigate('/projects')
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await api.get(`/api/tasks?project=${id}`)
      setTasks(response.data)
    } catch (error) {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (userId) => {
    setSaving(true)
    try {
      const response = await api.post(`/api/projects/${id}/members`, { userId })
      setProject(response.data)
      toast.success('Member added successfully')
      setAddMemberModalOpen(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) {
      return
    }
    
    setRemovingMember(userId)
    try {
      const response = await api.delete(`/api/projects/${id}/members/${userId}`)
      setProject(response.data)
      toast.success('Member removed successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove member')
    } finally {
      setRemovingMember(null)
    }
  }

  const handleCreate = () => {
    setEditingTask(null)
    setModalOpen(true)
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  const handleDelete = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }
    
    try {
      await api.delete(`/api/tasks/${taskId}`)
      setTasks(prev => prev.filter(t => t._id !== taskId))
      toast.success('Task deleted')
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editingTask?._id) {
        const response = await api.put(`/api/tasks/${editingTask._id}`, data)
        setTasks(prev => prev.map(t => t._id === editingTask._id ? response.data : t))
        toast.success('Task updated')
      } else {
        const response = await api.post('/api/tasks', { ...data, project: id })
        setTasks(prev => [response.data, ...prev])
        toast.success('Task created')
      }
      setModalOpen(false)
      setEditingTask(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />
      default: return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {project?.name}
            </h1>
            {project?.description && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

{/* Team Members Section - Show for both admins and members */}
      {isMember && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Team Members
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({members.length})
              </span>
            </div>
            {isAdmin && (
              <button
                onClick={() => setAddMemberModalOpen(true)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
            )}
          </div>

          {/* Members List */}
          {members.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No team members yet. Add members to assign tasks.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map(member => {
                const isCreator = project?.createdBy?._id === member._id || project?.createdBy === member._id
                return (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {member.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isCreator && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mr-2">
                          Creator
                        </span>
                      )}
                      {!isCreator && isAdmin && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          disabled={removingMember === member._id}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        >
                          {removingMember === member._id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                          ) : (
                            <UserMinus className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

{/* Filters */}
      <div className="flex items-center gap-2">
        {['all', 'pending', 'in-progress', 'done'].map(status => {
          const displayLabel = status === 'done' ? 'Completed' : (status === 'all' ? 'All Tasks' : status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()))
          return (
            <button
              key={status}
              onClick={() => setFilter(status === 'done' ? 'completed' : status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (status === 'done' ? filter === 'completed' : filter === status)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {displayLabel}
            </button>
          )
        })}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tasks yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-4">
            Create your first task to start organizing your project work.
          </p>
          <button
            onClick={handleCreate}
            className="btn-primary"
          >
            Create Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <div
              key={task._id}
              className="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              <button
                onClick={async () => {
                  const newStatus = task.status === 'completed' ? 'pending' : 'completed'
                  try {
                    await api.put(`/api/tasks/${task._id}`, { status: newStatus })
                    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t))
                  } catch (error) {
                    toast.error('Failed to update task')
                  }
                }}
                className="mt-1"
              >
                {getStatusIcon(task.status)}
              </button>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-medium text-gray-900 dark:text-white ${
                      task.status === 'completed' ? 'line-through text-gray-500' : ''
                    }`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(task)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.assignee && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{task.assignee.name}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          projectId={id}
          members={members}
          onClose={() => {
            setModalOpen(false)
            setEditingTask(null)
          }}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* Add Member Modal */}
      {addMemberModalOpen && (
        <AddMemberModal
          projectId={id}
          currentMembers={members}
          onClose={() => setAddMemberModalOpen(false)}
          onAdd={handleAddMember}
          saving={saving}
        />
      )}
    </div>
  )
}
