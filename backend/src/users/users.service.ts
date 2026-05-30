import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  full_name: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<User>(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email],
    );
    return result.rows[0] || null;
  }

  async create(data: CreateUserData): Promise<User> {
    const result = await this.pool.query<User>(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.email, data.password_hash, data.full_name],
    );
    return result.rows[0];
  }

  async updateProfile(
    id: string,
    data: { full_name?: string; avatar_url?: string },
  ): Promise<User> {
    const sets: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.full_name !== undefined) {
      sets.push(`full_name = $${paramIndex++}`);
      values.push(data.full_name);
    }
    if (data.avatar_url !== undefined) {
      sets.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatar_url);
    }

    if (sets.length === 0) {
      return this.findById(id) as Promise<User>;
    }

    values.push(id);
    const result = await this.pool.query<User>(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  toSafeUser(user: User): { id: string; email: string; name: string; avatar: string | null; createdAt: Date } {
    return {
      id: user.id,
      email: user.email,
      name: user.full_name,
      avatar: user.avatar_url,
      createdAt: user.created_at,
    };
  }
}
