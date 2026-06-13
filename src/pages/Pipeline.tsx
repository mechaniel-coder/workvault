import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, FilePlus2, Landmark } from 'lucide-react'
import { useStore } from '../context/StoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Modal, PageHeader, EmptyState } from '../components/ui/Modal'
import type { ProjectStage, Milestone } from '../lib/types'
import { PROJECT_STAGES } from '../lib/types'
import { formatCurrency, formatDate, getNextNumber } from '../lib/utils'

const STAGE_ORDER: ProjectStage[] = PROJECT_STAGES.map((stage) => stage.id)

function getNextStage(stage: ProjectStage): ProjectStage | null {
  const index = STAGE_ORDER.indexOf(stage)
  return index >= 0 && index < STAGE_ORDER.length - 1 ? STAGE_ORDER[index + 1] : null
}

function getPreviousStage(stage: ProjectStage): ProjectStage | null {
  const index = STAGE_ORDER.indexOf(stage)
  return index > 0 ? STAGE_ORDER[index - 1] : null
}

export default function Pipeline() {
  const { state, addProject, updateProject, deleteProject, addMilestone, updateMilestone, deleteMilestone, addInvoice } = useStore()
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState({
    title: '',
    clientId: '',
    value: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  })
  const [milestoneForm, setMilestoneForm] = useState({
    projectId: '',
    title: '',
    percent: '',
    amount: '',
    dueDate: '',
  })

  const clientOptions = useMemo(
    () => [
      { value: '', label: 'Select client...' },
      ...state.clients.map((client) => ({ value: client.id, label: client.name })),
    ],
    [state.clients]
  )

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'Select project...' },
      ...state.projects.map((project) => ({ value: project.id, label: `${project.title} · ${project.clientName}` })),
    ],
    [state.projects]
  )

  const resetProjectForm = () => {
    setEditingProjectId(null)
    setProjectForm({
      title: '',
      clientId: '',
      value: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
    })
  }

  const resetMilestoneForm = () => {
    setEditingMilestoneId(null)
    setMilestoneForm({
      projectId: '',
      title: '',
      percent: '',
      amount: '',
      dueDate: '',
    })
  }

  const openCreateProject = () => {
    resetProjectForm()
    setShowProjectModal(true)
  }

  const openEditProject = (projectId: string) => {
    const project = state.projects.find((item) => item.id === projectId)
    if (!project) return
    setEditingProjectId(project.id)
    setProjectForm({
      title: project.title,
      clientId: project.clientId,
      value: String(project.value),
      description: project.description,
      startDate: project.startDate,
      dueDate: project.dueDate,
    })
    setShowProjectModal(true)
  }

  const handleSaveProject = () => {
    const client = state.clients.find((item) => item.id === projectForm.clientId)
    const existingProject = editingProjectId
      ? state.projects.find((item) => item.id === editingProjectId)
      : null
    const data = {
      title: projectForm.title.trim(),
      clientId: projectForm.clientId,
      clientName: client?.name || 'Unknown',
      stage: existingProject?.stage || ('lead' as ProjectStage),
      value: parseFloat(projectForm.value) || 0,
      description: projectForm.description,
      startDate: projectForm.startDate,
      dueDate: projectForm.dueDate,
    }

    if (editingProjectId) {
      updateProject(editingProjectId, data)
    } else {
      addProject(data)
    }

    setShowProjectModal(false)
    resetProjectForm()
  }

  const openCreateMilestone = () => {
    resetMilestoneForm()
    setShowMilestoneModal(true)
  }

  const openEditMilestone = (milestone: Milestone) => {
    setEditingMilestoneId(milestone.id)
    setMilestoneForm({
      projectId: milestone.projectId,
      title: milestone.title,
      percent: String(milestone.percent),
      amount: String(milestone.amount),
      dueDate: milestone.dueDate,
    })
    setShowMilestoneModal(true)
  }

  const handleSaveMilestone = () => {
    const project = state.projects.find((item) => item.id === milestoneForm.projectId)
    if (!project) return

    const existingMilestone = editingMilestoneId
      ? state.milestones.find((item) => item.id === editingMilestoneId)
      : null
    const percent = parseFloat(milestoneForm.percent) || 0
    const amount = parseFloat(milestoneForm.amount) || Math.round((project.value * percent) / 100)
    const data = {
      projectId: project.id,
      projectName: project.title,
      clientId: project.clientId,
      clientName: project.clientName,
      title: milestoneForm.title.trim(),
      percent,
      amount,
      dueDate: milestoneForm.dueDate,
      invoiced: existingMilestone?.invoiced || false,
      invoiceId: existingMilestone?.invoiceId || null,
      completed: existingMilestone?.completed || false,
    }

    if (editingMilestoneId) {
      updateMilestone(editingMilestoneId, data)
    } else {
      addMilestone(data)
    }

    setShowMilestoneModal(false)
    resetMilestoneForm()
  }

  const moveProject = (projectId: string, nextStage: ProjectStage) => {
    updateProject(projectId, { stage: nextStage })
  }

  const handleGenerateInvoice = (milestone: Milestone) => {
    const project = state.projects.find((item) => item.id === milestone.projectId)
    if (!project) return

    const invoice = addInvoice({
      number: getNextNumber(state.profile.invoicePrefix, state.invoices.map((item) => item.number)),
      clientId: milestone.clientId,
      clientName: milestone.clientName,
      status: 'draft',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: milestone.dueDate || new Date().toISOString().split('T')[0],
      lineItems: [
        {
          id: crypto.randomUUID(),
          description: `${project.title} - ${milestone.title}`,
          quantity: 1,
          rate: milestone.amount,
          amount: milestone.amount,
        },
      ],
      subtotal: milestone.amount,
      taxRate: 0,
      taxAmount: 0,
      total: milestone.amount,
      notes: `Milestone invoice for ${project.title}`,
      paymentMethodIds: [],
      paymentInstructions: '',
      sentAt: null,
      paidAt: null,
      stripeCheckoutUrl: null,
      stripeSessionId: null,
      paymentLinks: [],
    })

    updateMilestone(milestone.id, {
      invoiced: true,
      invoiceId: invoice.id,
    })
  }

  const projectColumns = PROJECT_STAGES.map((stage) => ({
    ...stage,
    projects: state.projects.filter((project) => project.stage === stage.id),
  }))

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Track projects from lead to payment."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={openCreateMilestone}>
              <FilePlus2 size={16} /> New Milestone
            </Button>
            <Button onClick={openCreateProject}>
              <Plus size={16} /> New Project
            </Button>
          </div>
        }
      />

      <div className="mb-8">
        {state.projects.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Landmark size={24} />}
              title="No projects yet"
              description="Create a project to start moving work through the pipeline."
              action={<Button onClick={openCreateProject}><Plus size={16} /> Add Project</Button>}
            />
          </Card>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="grid min-w-[1200px] grid-cols-6 gap-4">
              {projectColumns.map((stage) => (
                <div key={stage.id} className="flex flex-col gap-3">
                  <div className="rounded-xl border border-surface-200 bg-surface-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold text-surface-900">{stage.label}</h2>
                        <p className="text-xs text-surface-500">{stage.projects.length} project{stage.projects.length === 1 ? '' : 's'}</p>
                      </div>
                      <Badge status={stage.id}>{stage.id}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {stage.projects.map((project) => {
                      const previousStage = getPreviousStage(project.stage)
                      const nextStage = getNextStage(project.stage)
                      return (
                        <Card key={project.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="text-sm font-semibold text-surface-900 truncate">{project.title}</h3>
                              <p className="text-xs text-surface-500 mt-1 truncate">{project.clientName}</p>
                              <p className="text-sm font-medium text-brand-600 mt-2">
                                {formatCurrency(project.value, state.profile.defaultCurrency)}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => deleteProject(project.id)} title="Delete project">
                              <Trash2 size={14} />
                            </Button>
                          </div>

                          {project.description && (
                            <p className="mt-3 text-xs text-surface-600 line-clamp-3">{project.description}</p>
                          )}

                          <div className="mt-3 flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => previousStage && moveProject(project.id, previousStage)}
                              disabled={!previousStage}
                              title="Move to previous stage"
                            >
                              <ChevronLeft size={14} />
                            </Button>
                            <div className="flex flex-1 gap-1 overflow-x-auto">
                              {STAGE_ORDER.map((stageId) => (
                                <button
                                  key={stageId}
                                  type="button"
                                  onClick={() => moveProject(project.id, stageId)}
                                  className={`rounded-md px-2 py-1 text-[10px] font-medium capitalize transition-colors ${
                                    project.stage === stageId
                                      ? 'bg-brand-600 text-white'
                                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                                  }`}
                                >
                                  {stageId}
                                </button>
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => nextStage && moveProject(project.id, nextStage)}
                              disabled={!nextStage}
                              title="Move to next stage"
                            >
                              <ChevronRight size={14} />
                            </Button>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <button
                              onClick={() => openEditProject(project.id)}
                              className="text-xs font-medium text-surface-500 hover:text-brand-600"
                            >
                              Edit
                            </button>
                            <span className="text-[10px] text-surface-400">
                              Due {formatDate(project.dueDate)}
                            </span>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-surface-900">Milestones</h2>
            <p className="text-sm text-surface-500">Track payments and generate invoices from project checkpoints.</p>
          </div>
          <Button variant="secondary" onClick={openCreateMilestone}>
            <Plus size={16} /> Add Milestone
          </Button>
        </div>

        {state.milestones.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FilePlus2 size={24} />}
              title="No milestones yet"
              description="Add milestones to break projects into billable steps."
              action={<Button onClick={openCreateMilestone}><Plus size={16} /> Add Milestone</Button>}
            />
          </Card>
        ) : (
          <div className="grid gap-4">
            {state.milestones.map((milestone) => {
              const project = state.projects.find((item) => item.id === milestone.projectId)
              return (
                <Card key={milestone.id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-surface-900">{milestone.title}</h3>
                        <Badge status={milestone.completed ? 'signed' : milestone.invoiced ? 'sent' : 'draft'}>
                          {milestone.completed ? 'complete' : milestone.invoiced ? 'invoiced' : 'open'}
                        </Badge>
                      </div>
                      <p className="text-sm text-surface-500 mt-1">
                        {milestone.projectName} · {milestone.clientName}
                      </p>
                      <p className="text-sm text-surface-500 mt-1">
                        {milestone.percent}% · {formatCurrency(milestone.amount, state.profile.defaultCurrency)}
                      </p>
                      <p className="text-xs text-surface-400 mt-1">Due {formatDate(milestone.dueDate)}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditMilestone(milestone)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateMilestone(milestone.id, { completed: !milestone.completed })}
                      >
                        <Check size={14} />
                        {milestone.completed ? 'Undo' : 'Complete'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleGenerateInvoice(milestone)}
                        disabled={milestone.invoiced || !project}
                      >
                        <Landmark size={14} />
                        Generate Invoice
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMilestone(milestone.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={showProjectModal}
        onClose={() => {
          setShowProjectModal(false)
          resetProjectForm()
        }}
        title={editingProjectId ? 'Edit Project' : 'New Project'}
        wide
      >
        <div className="space-y-4">
          <Input
            label="Project Title"
            value={projectForm.title}
            onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
            placeholder="Website Redesign"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Client"
              options={clientOptions}
              value={projectForm.clientId}
              onChange={(e) => setProjectForm({ ...projectForm, clientId: e.target.value })}
            />
            <Input
              label="Value"
              type="number"
              value={projectForm.value}
              onChange={(e) => setProjectForm({ ...projectForm, value: e.target.value })}
            />
          </div>
          <Textarea
            label="Description"
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
            placeholder="What this project includes..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={projectForm.startDate}
              onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={projectForm.dueDate}
              onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowProjectModal(false)
                resetProjectForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProject} disabled={!projectForm.title || !projectForm.clientId}>
              {editingProjectId ? 'Save Project' : 'Create Project'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showMilestoneModal}
        onClose={() => {
          setShowMilestoneModal(false)
          resetMilestoneForm()
        }}
        title={editingMilestoneId ? 'Edit Milestone' : 'New Milestone'}
        wide
      >
        <div className="space-y-4">
          <Select
            label="Project"
            options={projectOptions}
            value={milestoneForm.projectId}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, projectId: e.target.value })}
          />
          <Input
            label="Milestone Title"
            value={milestoneForm.title}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
            placeholder="Wireframes approved"
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Percent"
              type="number"
              value={milestoneForm.percent}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, percent: e.target.value })}
            />
            <Input
              label="Amount"
              type="number"
              value={milestoneForm.amount}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, amount: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={milestoneForm.dueDate}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowMilestoneModal(false)
                resetMilestoneForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveMilestone} disabled={!milestoneForm.projectId || !milestoneForm.title}>
              {editingMilestoneId ? 'Save Milestone' : 'Create Milestone'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
