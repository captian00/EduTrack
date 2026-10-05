import type { User } from '@supabase/supabase-js';
import type { Request } from 'express';

export type AuthenticatedRequest = Request & { user: User };
