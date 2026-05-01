import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  FolderKanban, 
  Users, 
  MoreVertical, 
  Trash2, 
  Edit,
  Loader2,
  Calendar,
  Clock
} from 'lucide-react'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

function ProjectCard({ project, onEdit, onDelete, onView }) {
  const [menuOpen, setMenuOpen] = useState(false)
  
  const memberCount = project.members?.length || 0
  const createdAt = new Date(project.createdAt).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Card header */}
      <div 
        className="p-5 bg-gradient-to-br from-primary-600 to-primary-700 cursor-pointer"
        onClick={() => onView(project._id)}
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen(!menuOpen)
              }}
              className="p-1.5 rounded-lg text-white/80 hover:bg-white/20 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(project)
                    setMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(project._id)
                    setMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600 dark:text-red-400 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white line-clamp-1">
          {project.name}
        </h3>
        {project.description && (
          <p className="mt-2 text-sm text-white/80 line-clamp-2">
            {project.description}
          </p>
        )}
      </div>

      {/* Card body */}
      <div className="p-5">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{createdAt}</span>
          </div>
        </div>

        {/* Members avatars */}
        {memberCount > 0 && (
          <div className="flex items-center mt-4 -space-x-2">
            {project.members.slice(0, 5).map((member, index) => (
              <div 
                key={member._id || index}
                className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 border-2 border-white dark:border-gray-100 flex items-center justify-center"
                style={{ zIndex: 5 - index }}
                title={member.name}
              >
                <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                  {member.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
            {memberCount > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-100 flex items-center justify-center" style={{ zIndex: 0 }}>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  +{memberCount - 5}
                </span>
              </div>
            )}
          </div>
        )}

        {/* View button */}
        <button
          onClick={() => onView(project._id)}
          className="w-full mt-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
        >
          View Tasks
        </button>
      </div>
    </div>
  )
}

function ProjectModal({ project, onClose, onSave, availableUsers, saving }) {
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')
  const [members, setMembers] = useState(project?.members?.map(m => m._id) || [])
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}
    if (!name.trim()) {
      newErrors.name = 'Project name is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSave({ name, description, members })
  }

  const toggleMember = (userId) => {
    setMembers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {project?._id ? 'Edit Project' : 'Create Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-400 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="My Awesome Project"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
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
              placeholder="What's this project about?"
            />
          </div>

          {/* Members */}
          {availableUsers && availableUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Team Members
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableUsers.map(user => (
                  <label
                    key={user._id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      members.includes(user._id)
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={members.includes(user._id)}
                      onChange={() => toggleMember(user._id)}
                      className="sr-only"
                    />
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    {members.includes(user._id) && (
                      <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                        <Plus className="w-3 h-3 text-white rotate-45" />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

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
              project?._id ? 'Update Project' : 'Create Project'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Projects() {
  const toast = useToast()
  const navigate = useNavigate()
  
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [availableUsers, setAvailableUsers] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/projects')
      setProjects(response.data)
    } catch (error) {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async (projectId) => {
    try {
      const response = await api.get(`/api/projects/${projectId}/members/available`)
      setAvailableUsers(response.data)
    } catch (error) {
      setAvailableUsers([])
    }
  }

  const handleEdit = async (project) => {
    setEditingProject(project)
    await fetchAvailableUsers(project._id)
    setModalOpen(true)
  }

const handleCreate = async () => {
    setEditingProject(null)
    // For new projects, get all users as available
    try {
      // Fetch an empty project to get available users or get all users
      const response = await api.get('/api/users')
      setAvailableUsers(response.data || [])
    } catch (error) {
      setAvailableUsers([])
    }
    setModalOpen(true)
  }

  const handleDelete = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project? All tasks will be deleted too.')) {
      return
    }
    
    try {
      await api.delete(`/api/projects/${projectId}`)
      setProjects(prev => prev.filter(p => p._id !== projectId))
      toast.success('Project deleted')
    } catch (error) {
      toast.error('Failed to delete project')
    }
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editingProject?._id) {
        const response = await api.put(`/api/projects/${editingProject._id}`, data)
        setProjects(prev => prev.map(p => p._id === editingProject._id ? response.data : p))
        toast.success('Project updated')
      } else {
        const response = await api.post('/api/projects', data)
        setProjects(prev => [response.data, ...prev])
        toast.success('Project created')
      }
      setModalOpen(false)
      setEditingProject(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  const handleView = (projectId) => {
    navigate(`/projects/${projectId}`)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage your team projects
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No projects yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-4">
            Create your first project to start organizing tasks with your team.
          </p>
          <button
            onClick={handleCreate}
            className="btn-primary"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard
              key={project._id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ProjectModal
          project={editingProject}
          onClose={() => {
            setModalOpen(false)
            setEditingProject(null)
          }}
          onSave={handleSave}
          availableUsers={availableUsers}
          saving={saving}
        />
      )}
    </div>
  )
}
