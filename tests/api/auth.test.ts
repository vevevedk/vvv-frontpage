import { createMocks } from 'node-mocks-http';
import { getSession } from 'next-auth/react';
import { prisma } from '../../lib/prisma';
import { generateToken, verifyToken } from '../../lib/jwt';
import bcrypt from 'bcryptjs';
import handler from '../../pages/api/auth/profile';
import changePasswordHandler from '../../pages/api/auth/change-password';
import verifyEmailHandler from '../../pages/api/auth/verify-email';
import deleteAccountHandler from '../../pages/api/auth/delete-account';

type MockPrismaClient = {
  user: {
    update: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
  company: {
    deleteMany: jest.Mock;
  };
};

const mockPrisma = {
  user: {
    update: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  company: {
    deleteMany: jest.fn(),
  },
} as MockPrismaClient;

// Mock dependencies
jest.mock('../../lib/prisma', () => ({
  prisma: mockPrisma,
}));

jest.mock('../../lib/jwt');
jest.mock('../../lib/email');
jest.mock('next-auth/react');

// Cast prisma to our mock type
const typedPrisma = prisma as unknown as MockPrismaClient;

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Profile Update', () => {
    it('should update user profile successfully', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        body: {
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1234567890',
          company: {
            name: 'Test Company',
            address: '123 Test St',
          },
        },
      });

      // Mock session
      (getSession as jest.Mock).mockResolvedValue({
        user: { id: 1, email: 'test@example.com' },
      });

      // Mock Prisma response
      typedPrisma.user.update.mockResolvedValue({
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        company: {
          name: 'Test Company',
          address: '123 Test St',
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toHaveProperty('user');
    });
  });

  describe('Password Change', () => {
    it('should change password successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          current_password: 'oldPassword123',
          new_password: 'newPassword123!',
          confirm_password: 'newPassword123!',
        },
      });

      // Mock session
      (getSession as jest.Mock).mockResolvedValue({
        user: { id: 1, email: 'test@example.com' },
      });

      // Mock Prisma response
      typedPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        password: await bcrypt.hash('oldPassword123', 10),
      });

      await changePasswordHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toHaveProperty('message', 'Password updated successfully');
    });
  });

  describe('Email Verification', () => {
    it('should verify email successfully', async () => {
      const token = 'valid-token';
      const { req, res } = createMocks({
        method: 'POST',
        body: { token },
      });

      // Mock token verification
      (verifyToken as jest.Mock).mockResolvedValue({
        userId: 1,
        email: 'test@example.com',
        type: 'verification',
      });

      // Mock Prisma response
      typedPrisma.user.update.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        email_verified: true,
      });

      await verifyEmailHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toHaveProperty('user');
    });
  });

  describe('Account Deletion', () => {
    it('should delete account successfully', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      });

      // Mock session
      (getSession as jest.Mock).mockResolvedValue({
        user: { id: 1, email: 'test@example.com' },
      });

      // Mock Prisma responses
      typedPrisma.company.deleteMany.mockResolvedValue({ count: 1 });
      typedPrisma.user.delete.mockResolvedValue({ id: 1 });

      await deleteAccountHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toHaveProperty('message', 'Account deleted successfully');
    });
  });
}); 