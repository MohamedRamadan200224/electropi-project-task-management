import { createTask, listTasks, getTask, deleteTask } from '../services/task.service';
import { Project } from '../models/Project';
import { Task } from '../models/Task';

jest.mock('../models/Project');
jest.mock('../models/Task');

const userId = 'user123';
const projectId = 'proj123';
const taskId = 'task123';

const mockProject = {
  _id: projectId,
  owner: userId,
  members: [userId],
};

const mockTask = {
  _id: taskId,
  title: 'Test Task',
  status: 'pending',
  priority: 'medium',
  project: projectId,
  createdBy: userId,
  save: jest.fn(),
  deleteOne: jest.fn(),
};

describe('TaskService.createTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a task under an accessible project', async () => {
    (Project.findById as jest.Mock).mockResolvedValue(mockProject);
    (Task.create as jest.Mock).mockResolvedValue(mockTask);

    const result = await createTask(
      projectId,
      { title: 'Test Task', description: '', status: 'pending', priority: 'medium' },
      userId,
      'member',
    );

    expect(result).toBe(mockTask);
    expect(Task.create).toHaveBeenCalledWith(
      expect.objectContaining({ project: projectId, createdBy: userId }),
    );
  });

  it('throws 404 when project does not exist', async () => {
    (Project.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      createTask(projectId, { title: 'T', description: '', status: 'pending', priority: 'medium' }, userId, 'member'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when member has no project access', async () => {
    (Project.findById as jest.Mock).mockResolvedValue({
      _id: projectId, owner: 'otherUser', members: ['otherUser'],
    });

    await expect(
      createTask(projectId, { title: 'T', description: '', status: 'pending', priority: 'medium' }, userId, 'member'),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('TaskService.getTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a task when found', async () => {
    (Project.findById as jest.Mock).mockResolvedValue(mockProject);
    const inner = { populate: jest.fn().mockResolvedValue(mockTask) };
    const outer = { populate: jest.fn().mockReturnValue(inner) };
    (Task.findOne as jest.Mock).mockReturnValue(outer);

    const result = await getTask(projectId, taskId, userId, 'member');
    expect(result).toBe(mockTask);
  });

  it('throws 404 when task not found', async () => {
    (Project.findById as jest.Mock).mockResolvedValue(mockProject);
    const inner = { populate: jest.fn().mockResolvedValue(null) };
    const outer = { populate: jest.fn().mockReturnValue(inner) };
    (Task.findOne as jest.Mock).mockReturnValue(outer);

    await expect(getTask(projectId, 'bad-id', userId, 'member'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('TaskService.deleteTask', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes task successfully', async () => {
    (Project.findById as jest.Mock).mockResolvedValue(mockProject);
    const task = { ...mockTask, deleteOne: jest.fn() };
    (Task.findOne as jest.Mock).mockResolvedValue(task);

    await deleteTask(projectId, taskId, userId, 'member');
    expect(task.deleteOne).toHaveBeenCalled();
  });

  it('throws 404 when task does not exist', async () => {
    (Project.findById as jest.Mock).mockResolvedValue(mockProject);
    (Task.findOne as jest.Mock).mockResolvedValue(null);

    await expect(deleteTask(projectId, 'bad', userId, 'member'))
      .rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('TaskService.listTasks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated tasks', async () => {
    (Project.findById as jest.Mock).mockResolvedValue(mockProject);

    const mockFind = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      then: undefined,
    };
    const lastPopulate = { populate: jest.fn().mockResolvedValue([mockTask]) };
    mockFind.populate.mockReturnValueOnce(mockFind).mockReturnValueOnce(lastPopulate);

    (Task.find as jest.Mock).mockReturnValue(mockFind);
    (Task.countDocuments as jest.Mock).mockResolvedValue(1);

    const result = await listTasks(projectId, userId, 'member', {
      page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc',
    });

    expect(result.pagination.total).toBe(1);
  });
});
