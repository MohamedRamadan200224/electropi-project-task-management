import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Task } from '../models/Task';

async function seed() {
  await connectDB();

  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({})]);
  console.log('Cleared existing data');

  const [adminPass, memberPass] = await Promise.all([
    bcrypt.hash('admin123', 12),
    bcrypt.hash('member123', 12),
  ]);

  const [admin, member] = await User.create([
    { name: 'Admin User', email: 'admin@electropi.com', password: adminPass, role: 'admin' },
    { name: 'Member User', email: 'member@electropi.com', password: memberPass, role: 'member' },
  ]);

  console.log('Created users');

  const project = await Project.create({
    title: 'ElectroPi Platform',
    description: 'Main platform project',
    status: 'active',
    owner: admin._id,
    members: [admin._id, member._id],
  });

  console.log('Created project');

  await Task.create([
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment',
      status: 'done',
      priority: 'high',
      project: project._id,
      createdBy: admin._id,
      assignedTo: admin._id,
    },
    {
      title: 'Design database schema',
      description: 'Create ERD and finalize collections',
      status: 'in_progress',
      priority: 'high',
      project: project._id,
      createdBy: admin._id,
      assignedTo: member._id,
    },
    {
      title: 'Write API documentation',
      description: 'Document all endpoints with Postman or Swagger',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      project: project._id,
      createdBy: member._id,
      assignedTo: member._id,
    },
  ]);

  console.log('Created tasks');
  console.log('\nSeed complete. Credentials:');
  console.log('  Admin  → admin@electropi.com / admin123');
  console.log('  Member → member@electropi.com / member123');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
