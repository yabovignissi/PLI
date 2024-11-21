require('dotenv').config({ path: '.env.test' });

let UserServices = require('../../src/services/Users.service');

import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.photo.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.step.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();
});

describe('User Services', () => {
  it('should create a new user and return the user data with JWT token', async () => {
    const mockHash = 'hashed_password';
    const mockToken = 'mock_token';
    (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);

    const req = {
      body: {
        lastName: 'Doe',
        firstName: 'John',
        email: 'johndoe@example.com',
        password: 'password123',
        address: '123 Main St',
        pic: null,
      },
    } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as Partial<Response> as Response;

    await UserServices.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const responseData = (res.json as jest.Mock).mock.calls[0][0];
    expect(responseData).toHaveProperty('token', mockToken);
    expect(responseData.user.email).toBe('johndoe@example.com');
    expect(responseData.user.lastName).toBe('Doe');
    expect(responseData.user.firstName).toBe('John');

    const createdUser = await prisma.user.findUnique({
      where: { email: 'johndoe@example.com' },
    });
    expect(createdUser).not.toBeNull();
    expect(createdUser?.password).toBe(mockHash);
    expect(createdUser?.email).toBe('johndoe@example.com');
  });

  it('should return 409 if email already exists', async () => {
    await prisma.user.create({
      data: {
        lastName: 'Doe',
        firstName: 'John',
        email: 'johndoe@example.com',
        password: await bcrypt.hash('password123', 10),
        address: '123 Main St',
      },
    });

    const req = {
      body: {
        lastName: 'Doe',
        firstName: 'Jane',
        email: 'johndoe@example.com',
        password: 'newpassword',
        address: '456 Main St',
        pic: null,
      },
    } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await UserServices.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' });
  });

  it('should update user details', async () => {
    const user = await prisma.user.create({
      data: {
        lastName: 'Doe',
        firstName: 'John',
        email: 'johndoe@example.com',
        password: await bcrypt.hash('password123', 10),
        address: '123 Main St',
      },
    });

    const req = {
      params: { id: user.id.toString() },
      body: { lastName: 'UpdatedDoe', address: '456 Main St' },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await UserServices.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const updatedUser = (res.json as jest.Mock).mock.calls[0][0];
    expect(updatedUser.lastName).toBe('UpdatedDoe');
    expect(updatedUser.address).toBe('456 Main St');
  });

  it('should return 404 if user not found during password update', async () => {
    const req = {
      params: { id: '9999' },
      body: {
        password: 'oldpassword',
        new_password: 'newpassword',
        repeat_password: 'newpassword',
      },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;

    await UserServices.updatePass(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Utilisateur non trouvé.');
  });

  it('should return error if current password is incorrect', async () => {
    const user = await prisma.user.create({
      data: {
        lastName: 'Doe',
        firstName: 'John',
        email: 'johndoe@example.com',
        password: await bcrypt.hash('password123', 10),
        address: '123 Main St',
      },
    });

    const req = {
      params: { id: user.id.toString() },
      body: {
        password: 'wrongpassword',
        new_password: 'newpassword',
        repeat_password: 'newpassword',
      },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;

    await UserServices.updatePass(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Le mot de passe actuel est incorrect.');
  });

  it('should return error if passwords do not match', async () => {
    const user = await prisma.user.create({
      data: {
        lastName: 'Doe',
        firstName: 'John',
        email: 'johndoe@example.com',
        password: await bcrypt.hash('password123', 10),
        address: '123 Main St',
      },
    });

    const req = {
      params: { id: user.id.toString() },
      body: {
        password: 'password123',
        new_password: 'newpassword',
        repeat_password: 'differentpassword',
      },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;

    await UserServices.updatePass(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      'Le nouveau mot de passe et la confirmation du nouveau mot de passe ne correspondent pas.'
    );
  });

  it('should return 400 if image or MIME type is missing', async () => {
    const req = {
      params: { id: '1' },
      body: {},
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await UserServices.uploadProfilePicture(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'No image or MIME type provided' });
  });

  it('should delete the user successfully', async () => {
    const user = await prisma.user.create({
      data: {
        lastName: 'Doe',
        firstName: 'John',
        email: 'johndoe@example.com',
        password: await bcrypt.hash('password123', 10),
        address: '123 Main St',
      },
    });
  
    const req = { params: { id: user.id.toString() } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as Response;
  
    await UserServices.deleteUser(req, res);
  
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith('User deleted');
  });
  
  it('should return 404 if user does not exist', async () => {
    const req = { params: { id: '9999' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as Response;
  
    await UserServices.deleteUser(req, res);
  
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('User not found');
  });
  
  it('should return 400 for invalid user ID', async () => {
    const req = { params: { id: 'invalid' } } as unknown as Request;
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() } as unknown as Response;
  
    await UserServices.deleteUser(req, res);
  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Invalid user ID');
  });
  
});
