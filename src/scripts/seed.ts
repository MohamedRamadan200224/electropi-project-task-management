import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Task } from '../models/Task';

function requireSeedPassword(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 12) {
    throw new Error(`${name} must be set in .env to at least 12 characters. See .env.example.`);
  }
  return value;
}

async function seed() {
  // Seeding wipes all collections. Never run it against production.
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('Refusing to seed in production: seed wipes all users, projects and tasks.');
  }

  const adminPassword = requireSeedPassword('SEED_ADMIN_PASSWORD');
  const memberPassword = requireSeedPassword('SEED_MEMBER_PASSWORD');

  await connectDB();

  await Promise.all([User.deleteMany({}), Project.deleteMany({}), Task.deleteMany({})]);
  console.log('Cleared existing data');

  const [adminPass, memberPass] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(memberPassword, 12),
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
  console.log('\nSeed complete. Users created:');
  console.log('  Admin  → admin@electropi.com');
  console.log('  Member → member@electropi.com');
  console.log('Passwords are the SEED_ADMIN_PASSWORD / SEED_MEMBER_PASSWORD values from your .env — they are not printed here.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
