export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface AnalysisResult {
  accuracy: number;
  mse: number;
  rSquared: number;
  sampleSize: number;
  data: any[];
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  type: 'upload' | 'update' | 'login' | 'error';
}
