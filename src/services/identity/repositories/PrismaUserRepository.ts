import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../repositories/IUserRepository';
import { User } from '../types/User';
import { v4 as uuidv4 } from 'uuid';

/**
 * Prisma-based implementation of IUserRepository.
 * Provides persistence for user data in PostgreSQL.
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(
    user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        id: uuidv4(),
        email: user.email,
        passwordHash: user.passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        isLocked: user.isLocked,
        failedLoginAttempts: user.failedLoginAttempts,
      },
    }) as Promise<User>;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user as User | null;
  }

  async update(
    id: string,
    updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: updates,
    }) as Promise<User>;
  }

  async lockAccount(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        isLocked: true,
        lastFailedLoginAt: new Date(),
      },
    });
  }

  async unlockAccount(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isLocked: false },
    });
  }

  async incrementFailedLoginAttempts(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        failedLoginAttempts: {
          increment: 1,
        },
        lastFailedLoginAt: new Date(),
      },
    });
  }

  async resetFailedLoginAttempts(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { failedLoginAttempts: 0 },
    });
  }

  async updateLastLoginAt(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
