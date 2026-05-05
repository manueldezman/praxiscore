// Database types for Supabase tables

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  public_key: string;
  encrypted_secret_key: string;
  created_at: string;
}

export interface SubAccount {
  id: string;
  user_id: string;
  bucket_type: string;
  public_key: string;
  encrypted_secret_key: string;
  balance_lamports: number;
  created_at: string;
}

export interface BucketWallet {
  id: string;
  user_id: string;
  bucket_id: string;
  label: string;
  address: string;
  category: string;
  network: string;
  created_at: string;
}

export interface Rule {
  id: string;
  user_id: string;
  parent_rule_id?: string;
  name: string;
  rule_text: string;
  bucket: string;
  allocation_type: 'percent' | 'fixed' | 'remainder';
  percent?: number;
  fixed_amount?: number;
  token: string;
  trigger_type: 'on_income' | 'scheduled' | 'one_off';
  cron_expression?: string;
  run_at?: string;
  is_active: boolean;
  created_at: string;
}

export interface RuleCondition {
  id: string;
  rule_id: string;
  annual_cap?: number;
  monthly_cap?: number;
  redirect_bucket?: string;
  reset_period: 'calendar_year' | 'rolling_12';
  pause_if_below?: number;
  created_at: string;
}

export interface RuleExecution {
  id: string;
  rule_id: string;
  user_id: string;
  amount: number;
  token: string;
  destination: string;
  tx_signatures: string[];
  executed_at: string;
  period_year: number;
  period_month: number;
  status: 'success' | 'failed' | 'capped';
}

export interface Schedule {
  id: string;
  rule_id: string;
  trigger_job_id: string;
  next_run_at: string;
  last_run_at?: string;
}

// Tables type for Supabase
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<User>;
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, 'id' | 'created_at'>;
        Update: Partial<Wallet>;
      };
      sub_accounts: {
        Row: SubAccount;
        Insert: Omit<SubAccount, 'id' | 'created_at'>;
        Update: Partial<SubAccount>;
      };
      bucket_wallets: {
        Row: BucketWallet;
        Insert: Omit<BucketWallet, 'id' | 'created_at'>;
        Update: Partial<BucketWallet>;
      };
      rules: {
        Row: Rule;
        Insert: Omit<Rule, 'id' | 'created_at'>;
        Update: Partial<Rule>;
      };
      rule_conditions: {
        Row: RuleCondition;
        Insert: Omit<RuleCondition, 'id' | 'created_at'>;
        Update: Partial<RuleCondition>;
      };
      rule_executions: {
        Row: RuleExecution;
        Insert: Omit<RuleExecution, 'id' | 'executed_at'>;
        Update: Partial<RuleExecution>;
      };
      schedules: {
        Row: Schedule;
        Insert: Omit<Schedule, 'id'>;
        Update: Partial<Schedule>;
      };
    };
  };
};
