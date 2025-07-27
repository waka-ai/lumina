-- Enhanced features for social media platform

-- Posts reposts/shares table
CREATE TABLE IF NOT EXISTS post_reposts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction VARCHAR(10) NOT NULL, -- emoji or reaction type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

-- User presence table
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  status VARCHAR(20) DEFAULT 'offline', -- online, offline, away, busy
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation settings table
CREATE TABLE IF NOT EXISTS conversation_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  muted_until TIMESTAMP WITH TIME ZONE,
  custom_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- File uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  file_id UUID REFERENCES file_uploads(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced books table additions
ALTER TABLE books ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE books ADD COLUMN IF NOT EXISTS publication_date DATE;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publisher VARCHAR(200);
ALTER TABLE books ADD COLUMN IF NOT EXISTS page_count INTEGER;
ALTER TABLE books ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE books ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Book reviews table
CREATE TABLE IF NOT EXISTS book_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_spoiler BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(book_id, user_id)
);

-- Book recommendations table
CREATE TABLE IF NOT EXISTS book_recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recommender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recommended_to_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reading goals table
CREATE TABLE IF NOT EXISTS reading_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  target_books INTEGER NOT NULL,
  current_books INTEGER DEFAULT 0,
  target_pages INTEGER,
  current_pages INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- Book clubs table
CREATE TABLE IF NOT EXISTS book_clubs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID REFERENCES users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT FALSE,
  member_count INTEGER DEFAULT 1,
  current_book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Book club members table
CREATE TABLE IF NOT EXISTS book_club_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- admin, moderator, member
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- Book club discussions table
CREATE TABLE IF NOT EXISTS book_club_discussions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES book_clubs(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT FALSE,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_post_reposts_user_id ON post_reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reposts_post_id ON post_reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_book_reviews_book_id ON book_reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_book_reviews_user_id ON book_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_book_recommendations_recommended_to_id ON book_recommendations(recommended_to_id);
CREATE INDEX IF NOT EXISTS idx_reading_goals_user_id ON reading_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_book_club_members_club_id ON book_club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_book_club_members_user_id ON book_club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_book_club_discussions_club_id ON book_club_discussions(club_id);

-- Insert sample book data
INSERT INTO books (user_id, title, author, genre, description, total_pages, language, publication_date, publisher) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'The Great Gatsby', 'F. Scott Fitzgerald', 'Classic Literature', 'A classic American novel set in the Jazz Age', 180, 'en', '1925-04-10', 'Charles Scribner''s Sons'),
('550e8400-e29b-41d4-a716-446655440001', 'To Kill a Mockingbird', 'Harper Lee', 'Classic Literature', 'A gripping tale of racial injustice and childhood innocence', 281, 'en', '1960-07-11', 'J.B. Lippincott & Co.'),
('550e8400-e29b-41d4-a716-446655440000', '1984', 'George Orwell', 'Dystopian Fiction', 'A dystopian social science fiction novel', 328, 'en', '1949-06-08', 'Secker & Warburg')
ON CONFLICT DO NOTHING;

-- Insert sample reading progress
INSERT INTO reading_progress (user_id, book_id, current_page, progress_percentage) 
SELECT 
  '550e8400-e29b-41d4-a716-446655440000',
  id,
  FLOOR(RANDOM() * total_pages),
  FLOOR(RANDOM() * 100)
FROM books 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'
ON CONFLICT DO NOTHING;
