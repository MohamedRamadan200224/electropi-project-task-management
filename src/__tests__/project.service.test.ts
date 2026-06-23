import { createProject, listProjects, getProject, deleteProject } from '../services/project.service';
import { Project } from '../models/Project';

jest.mock('../models/Project');

const adminId = 'admin123';
const memberId = 'member123';

const mockProject = {
  _id: 'proj1',
  title: 'Test Project',
  description: 'desc',
  status: 'active',
  owner: { _id: adminId },
  members: [adminId],
  save: jest.fn(),
  deleteOne: jest.fn(),
};

describe('ProjectService.createProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates and returns a project', async () => {
    (Project.create as jest.Mock).mockResolvedValue(mockProject);

    const result = await createProject({ title: 'Test', description: '', status: 'active' }, adminId);
    expect(result).toBe(mockProject);
    expect(Project.create).toHaveBeenCalledWith(
      expect.objectContaining({ owner: adminId }),
    );
  });
});

describe('ProjectService.listProjects', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns paginated projects for admin (no filter)', async () => {
    const mockFind = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([mockProject]),
    };
    (Project.find as jest.Mock).mockReturnValue(mockFind);
    (Project.countDocuments as jest.Mock).mockResolvedValue(1);

    const result = await listProjects(adminId, 'admin', {
      page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc',
    });

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    // Admin: no owner/member filter
    expect(Project.find).toHaveBeenCalledWith({});
  });

  it('filters by owner/members for regular member', async () => {
    const mockFind = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue([]),
    };
    (Project.find as jest.Mock).mockReturnValue(mockFind);
    (Project.countDocuments as jest.Mock).mockResolvedValue(0);

    await listProjects(memberId, 'member', {
      page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc',
    });

    expect(Project.find).toHaveBeenCalledWith(
      expect.objectContaining({ $or: expect.any(Array) }),
    );
  });
});

describe('ProjectService.getProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns project for owner', async () => {
    (Project.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({ ...mockProject, owner: { _id: adminId } }),
    });

    const result = await getProject('proj1', adminId, 'member');
    expect(result).toBeDefined();
  });

  it('throws 404 when project not found', async () => {
    (Project.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    await expect(getProject('nonexistent', adminId, 'member'))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 when member has no access', async () => {
    (Project.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        ...mockProject,
        owner: { _id: 'anotherUser' },
        members: ['anotherUser'],
      }),
    });

    await expect(getProject('proj1', memberId, 'member'))
      .rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('ProjectService.deleteProject', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes project when owner requests it', async () => {
    const proj = { ...mockProject, owner: adminId, deleteOne: jest.fn() };
    (Project.findById as jest.Mock).mockResolvedValue(proj);

    await deleteProject('proj1', adminId, 'member');
    expect(proj.deleteOne).toHaveBeenCalled();
  });

  it('throws 403 when non-owner member tries to delete', async () => {
    (Project.findById as jest.Mock).mockResolvedValue({ ...mockProject, owner: adminId });

    await expect(deleteProject('proj1', memberId, 'member'))
      .rejects.toMatchObject({ statusCode: 403 });
  });
});
