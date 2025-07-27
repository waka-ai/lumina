-- Maps and Library enhanced features

-- Map templates table
CREATE TABLE IF NOT EXISTS map_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  category VARCHAR(50),
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Map collaborators table
CREATE TABLE IF NOT EXISTS map_collaborators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(20) DEFAULT 'view', -- view, edit, admin
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(map_id, user_id)
);

-- Map comments table
CREATE TABLE IF NOT EXISTS map_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  map_id UUID REFERENCES maps(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  position_x DECIMAL(10,6),
  position_y DECIMAL(10,6),
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced library features
-- Book collections table
CREATE TABLE IF NOT EXISTS book_collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  book_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Book collection items table
CREATE TABLE IF NOT EXISTS book_collection_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES book_collections(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, book_id)
);

-- Book annotations table
CREATE TABLE IF NOT EXISTS book_annotations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  annotation_type VARCHAR(20) NOT NULL, -- highlight, note, bookmark
  content TEXT,
  position_data JSONB,
  color VARCHAR(7) DEFAULT '#ffff00',
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Library statistics table
CREATE TABLE IF NOT EXISTS library_statistics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_books INTEGER DEFAULT 0,
  books_read INTEGER DEFAULT 0,
  books_reading INTEGER DEFAULT 0,
  books_to_read INTEGER DEFAULT 0,
  total_pages_read INTEGER DEFAULT 0,
  reading_streak_days INTEGER DEFAULT 0,
  last_reading_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for maps and library features
CREATE INDEX IF NOT EXISTS idx_map_templates_category ON map_templates(category);
CREATE INDEX IF NOT EXISTS idx_map_templates_created_by ON map_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_map_collaborators_map_id ON map_collaborators(map_id);
CREATE INDEX IF NOT EXISTS idx_map_collaborators_user_id ON map_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_map_comments_map_id ON map_comments(map_id);
CREATE INDEX IF NOT EXISTS idx_book_collections_user_id ON book_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_book_collection_items_collection_id ON book_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_book_annotations_book_id ON book_annotations(book_id);
CREATE INDEX IF NOT EXISTS idx_book_annotations_user_id ON book_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_library_statistics_user_id ON library_statistics(user_id);

-- Insert sample map templates
INSERT INTO map_templates (name, description, template_data, category, created_by) VALUES
('World Map', 'Basic world map template', '{"type": "world", "zoom": 2, "center": [0, 0]}', 'Geography', '550e8400-e29b-41d4-a716-446655440000'),
('City Planning', 'Template for city planning projects', '{"type": "city", "zoom": 10, "tools": ["roads", "buildings", "parks"]}', 'Urban Planning', '550e8400-e29b-41d4-a716-446655440001'),
('Fantasy World', 'Template for fantasy world building', '{"type": "fantasy", "tools": ["kingdoms", "mountains", "forests", "rivers"]}', 'Creative', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- Insert sample book collections
INSERT INTO book_collections (user_id, name, description, is_public) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Classic Literature', 'My collection of classic literary works', TRUE),
('550e8400-e29b-41d4-a716-446655440001', 'Science Fiction Favorites', 'Best sci-fi books I''ve read', TRUE),
('550e8400-e29b-41d4-a716-446655440000', 'Currently Reading', 'Books I''m currently working through', FALSE)
ON CONFLICT DO NOTHING;

-- Initialize library statistics for sample users
INSERT INTO library_statistics (user_id, total_books, books_read, books_reading, books_to_read) VALUES
('550e8400-e29b-41d4-a716-446655440000', 15, 8, 2, 5),
('550e8400-e29b-41d4-a716-446655440001', 12, 10, 1, 1),
('550e8400-e29b-41d4-a716-446655440002', 8, 5, 2, 1)
ON CONFLICT DO NOTHING;
