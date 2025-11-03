-- Create sessions table for doctor panel
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  patient_name TEXT NOT NULL,
  notes TEXT,
  doctor_id UUID NOT NULL,
  doctor_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);

-- Create index on doctor_id for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_doctor_id ON sessions(doctor_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own sessions
CREATE POLICY "Users can view their own sessions"
ON sessions
FOR SELECT
USING (auth.uid() = doctor_id);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions"
ON sessions
FOR INSERT
WITH CHECK (auth.uid() = doctor_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
ON sessions
FOR UPDATE
USING (auth.uid() = doctor_id)
WITH CHECK (auth.uid() = doctor_id);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions"
ON sessions
FOR DELETE
USING (auth.uid() = doctor_id);
