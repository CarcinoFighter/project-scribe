CREATE TABLE IF NOT EXISTS public.discarded_applications (
  timestamp TEXT PRIMARY KEY,
  discarded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: enable Row Level Security (though we access it via admin client)
ALTER TABLE public.discarded_applications ENABLE ROW LEVEL SECURITY;
