-- Create function to check for compromised passwords using HIBP
CREATE OR REPLACE FUNCTION public.check_password_hash(password_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This is a placeholder function for HIBP integration
  -- In practice, this would call the HIBP API via an edge function
  -- For now, return false (not compromised) as default
  RETURN false;
END;
$$;

-- Create table for tracking security events
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Create policy for security events
CREATE POLICY "Users can view their own security events"
ON public.security_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert security events"
ON public.security_events
FOR INSERT
WITH CHECK (true);

-- Create table for user preferences and settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  auto_lock_minutes integer DEFAULT 15,
  password_generator_length integer DEFAULT 16,
  password_generator_options jsonb DEFAULT '{"uppercase": true, "lowercase": true, "numbers": true, "symbols": true}',
  theme text DEFAULT 'system',
  educational_tips_enabled boolean DEFAULT true,
  gamification_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user preferences
CREATE POLICY "Users can manage their own preferences"
ON public.user_preferences
FOR ALL
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for gamification data
CREATE TABLE IF NOT EXISTS public.user_gamification (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  total_points integer DEFAULT 0,
  level integer DEFAULT 1,
  badges jsonb DEFAULT '[]',
  completed_challenges jsonb DEFAULT '[]',
  streak_days integer DEFAULT 0,
  last_activity_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_gamification
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

-- Create policies for user gamification
CREATE POLICY "Users can manage their own gamification data"
ON public.user_gamification
FOR ALL
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_gamification_updated_at
  BEFORE UPDATE ON public.user_gamification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize user data
CREATE OR REPLACE FUNCTION public.initialize_user_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert gamification data
  INSERT INTO public.user_gamification (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Update the existing handle_new_user function to call initialize_user_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, argon2_hash, salt, vault_key_encrypted)
  VALUES (
    NEW.id,
    NEW.email,
    '',  -- Will be set by application
    '',  -- Will be set by application
    ''   -- Will be set by application
  );
  
  -- Initialize additional user data
  PERFORM public.initialize_user_data();
  
  RETURN NEW;
END;
$$;