
-- Create a custom type for shipment status
CREATE TYPE shipment_status AS ENUM (
  'EM TRÂNSITO', 
  'ENTREGA FINAL', 
  'PARADO (PONTO DE APOIO)', 
  'CARREGANDO', 
  'AGUARDANDO', 
  'EM MANUTENÇÃO', 
  'VAZIO'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  full_name TEXT,
  role TEXT DEFAULT 'operator',
  avatar_url TEXT
);

-- Create vehicles table for fleet tracking
CREATE TABLE public.vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plate TEXT NOT NULL UNIQUE,
  prefix TEXT,
  last_lat DOUBLE PRECISION,
  last_lng DOUBLE PRECISION,
  last_speed DOUBLE PRECISION,
  last_update TIMESTAMP WITH TIME ZONE,
  ignition BOOLEAN DEFAULT false,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_name TEXT, -- Fallback name or specific vehicle description
  plate TEXT,        -- Denormalized plate for easier queries
  route TEXT,
  status shipment_status DEFAULT 'AGUARDANDO',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  client TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  last_update TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users ON DELETE SET NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Vehicles policies (Authenticated users can view/manage)
CREATE POLICY "Vehicles are viewable by authenticated users." ON public.vehicles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only authenticated users can manage vehicles." ON public.vehicles
  FOR ALL TO authenticated USING (true);

-- Shipments policies
CREATE POLICY "Shipments are viewable by authenticated users." ON public.shipments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only authenticated users can manage shipments." ON public.shipments
  FOR ALL TO authenticated USING (true);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
