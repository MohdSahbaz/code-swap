-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create snippets table
CREATE TABLE public.snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  description TEXT NOT NULL,
  code TEXT NOT NULL,
  likes INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

-- Snippets policies
CREATE POLICY "Snippets are viewable by everyone"
  ON public.snippets FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create snippets"
  ON public.snippets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snippets"
  ON public.snippets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snippets"
  ON public.snippets FOR DELETE
  USING (auth.uid() = user_id);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create likes table for tracking who liked what
CREATE TABLE public.snippet_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(snippet_id, user_id)
);

-- Enable RLS
ALTER TABLE public.snippet_likes ENABLE ROW LEVEL SECURITY;

-- Likes policies
CREATE POLICY "Likes are viewable by everyone"
  ON public.snippet_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like snippets"
  ON public.snippet_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike snippets"
  ON public.snippet_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update snippet likes count
CREATE OR REPLACE FUNCTION public.update_snippet_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.snippets 
    SET likes = likes + 1 
    WHERE id = NEW.snippet_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.snippets 
    SET likes = likes - 1 
    WHERE id = OLD.snippet_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update likes count
CREATE TRIGGER update_snippet_likes_trigger
AFTER INSERT OR DELETE ON public.snippet_likes
FOR EACH ROW EXECUTE FUNCTION public.update_snippet_likes();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for snippets updated_at
CREATE TRIGGER update_snippets_updated_at
BEFORE UPDATE ON public.snippets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();