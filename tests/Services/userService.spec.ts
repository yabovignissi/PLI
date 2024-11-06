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
  await prisma.user.deleteMany();
});

describe('User Services - createUser', () => {
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


  describe('createUser', () => {
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
      expect(res.json).toHaveBeenCalledWith({ message: "Email already exists" });
    });
  });

  describe('updatePass', () => {
    it('should return error if user not found', async () => {
      const req = {
        params: { id: '9999' },
        body: {
          password: 'oldpassword',
          new_password: 'newpassword',
          repeat_password: 'newpassword',
        },
      } as unknown as Request;
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await UserServices.updatePass(req, res);
      expect(res.send).toHaveBeenCalledWith("Utilisateur non trouvé.");
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
        send: jest.fn(),
      } as unknown as Response;

      await UserServices.updatePass(req, res);
      expect(res.send).toHaveBeenCalledWith("Le mot de passe actuel est incorrect.");
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
        send: jest.fn(),
      } as unknown as Response;

      await UserServices.updatePass(req, res);
      expect(res.send).toHaveBeenCalledWith("Le nouveau mot de passe et la confirmation du nouveau mot de passe ne correspondent pas.");
    });
  });

  describe('updateUser', () => {
    it('should return 404 if user not found', async () => {
      const req = {
        params: { id: '9999' },
        body: { lastName: 'UpdatedDoe' },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      await UserServices.updateUser(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("User not found");
    });
  });

  describe('uploadProfilePicture', () => {
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
      expect(res.json).toHaveBeenCalledWith({ message: "No image or MIME type provided" });
    });
  });

  describe('getProfilePicture', () => {
    it('should retrieve and send the user profile picture if it exists', async () => {
        const picData = Buffer.from('iVBORw0KGgo=', 'base64');
        const user = await prisma.user.create({
          data: {
            lastName: 'Doe',
            firstName: 'John',
            email: 'johndoe@example.com',
            password: 'password123',
            address: '123 Main St',
            pic: picData,
            picType: 'image/png',
          },
        });
    
        const req = { params: { id: user.id.toString() } } as unknown as Request;
        const res = {
          contentType: jest.fn().mockReturnThis(),
          send: jest.fn(),
        } as unknown as Response;
    
        await UserServices.getProfilePicture(req, res);

        expect(res.contentType).toHaveBeenCalledWith('image/png');
        expect(res.send).toHaveBeenCalledWith(picData);
      });
    
      it('should not send anything if user or profile picture does not exist', async () => {
        const req = { params: { id: '9999' } } as unknown as Request; 
        const res = {
          contentType: jest.fn(),
          send: jest.fn(),
        } as unknown as Response;
    
        await UserServices.getProfilePicture(req, res);
        expect(res.contentType).not.toHaveBeenCalled();
        expect(res.send).not.toHaveBeenCalled();
      });
    
      it('should return 500 on internal error', async () => {
        const req = { params: { id: 'invalid_id' } } as unknown as Request; 
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as unknown as Response;
    
        await UserServices.getProfilePicture(req, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Failed to retrieve profile picture' });
      });
   
  });
 
    describe(' uploadProfilePicture', () => {
        it('should upload profile picture', async () => {
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
            body: { image: 'data:image/png;base64,iVBORw0KGgo=', mimeType: 'image/png' },
          } as unknown as Request;
          const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
          } as unknown as Response;
      
          await UserServices.uploadProfilePicture(req, res);
      
          expect(res.status).toHaveBeenCalledWith(200);
          expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            message: "Profile picture uploaded successfully",
          }));
        
      });

        it('should retrieve the user profile picture', async () => {
          const picData = Buffer.from('iVBORw0KGgo=', 'base64');
          const user = await prisma.user.create({
            data: {
              lastName: 'Doe',
              firstName: 'John',
              email: 'johndoe@example.com',
              password: await bcrypt.hash('password123', 10),
              address: '123 Main St',
              pic: picData,
              picType: 'image/png',
            },
          });
      
          const req = { params: { id: user.id.toString() } } as unknown as Request;
          const res = {
            contentType: jest.fn().mockReturnThis(),
            send: jest.fn(),
          } as unknown as Response;
      
          await UserServices.getProfilePicture(req, res);
      
          expect(res.contentType).toHaveBeenCalledWith('image/png');
          expect(res.send).toHaveBeenCalledWith(picData);
        });
      });
            

      it('should delete the user', async () => {
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
        const res = { send: jest.fn() } as unknown as Response;
    
        await UserServices.deleteUser(req, res);
    
        expect(res.send).toHaveBeenCalledWith("User delete");
        const deletedUser = await prisma.user.findUnique({ where: { id: user.id } });
        expect(deletedUser).toBeNull();
      });
  
  
});
