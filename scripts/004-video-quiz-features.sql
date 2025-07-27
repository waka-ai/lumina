-- Video platform and quiz system features

-- Videos table enhancements
ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_quality VARCHAR(10) DEFAULT '720p';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'completed';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_generated BOOLEAN DEFAULT FALSE;

-- Video interactions table
CREATE TABLE IF NOT EXISTS video_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL, -- like, dislike, view
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, user_id, interaction_type)
);

-- Video comments table
CREATE TABLE IF NOT EXISTS video_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES video_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  timestamp_seconds INTEGER, -- for timestamped comments
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video comment likes table
CREATE TABLE IF NOT EXISTS video_comment_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comment_id UUID REFERENCES video_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Video playlists table
CREATE TABLE IF NOT EXISTS video_playlists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  video_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video playlist items table
CREATE TABLE IF NOT EXISTS video_playlist_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  playlist_id UUID REFERENCES video_playlists(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(playlist_id, video_id)
);

-- Watch progress table
CREATE TABLE IF NOT EXISTS watch_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  time_taken INTEGER, -- in seconds
  answers JSONB NOT NULL,
  passed BOOLEAN DEFAULT FALSE,
  attempt_number INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz analytics table
CREATE TABLE IF NOT EXISTS quiz_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  total_attempts INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.00,
  pass_rate DECIMAL(5,2) DEFAULT 0.00,
  most_missed_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiz_id)
);

-- Video subscriptions table
CREATE TABLE IF NOT EXISTS video_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subscriber_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notifications_enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(subscriber_id, channel_owner_id)
);

-- Create indexes for video and quiz features
CREATE INDEX IF NOT EXISTS idx_video_interactions_video_id ON video_interactions(video_id);
CREATE INDEX IF NOT EXISTS idx_video_interactions_user_id ON video_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_user_id ON video_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_video_playlists_user_id ON video_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_video_playlist_items_playlist_id ON video_playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_user_id ON watch_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_video_id ON watch_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_analytics_quiz_id ON quiz_analytics(quiz_id);
CREATE INDEX IF NOT EXISTS idx_video_subscriptions_subscriber_id ON video_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_video_subscriptions_channel_owner_id ON video_subscriptions(channel_owner_id);

-- Insert sample videos
INSERT INTO videos (user_id, title, description, video_url, duration, category, tags) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Introduction to Web Development', 'Learn the basics of HTML, CSS, and JavaScript', '/videos/web-dev-intro.mp4', 1800, 'Education', ARRAY['programming', 'web development', 'tutorial']),
('550e8400-e29b-41d4-a716-446655440001', 'Digital Art Techniques', 'Advanced techniques for digital illustration', '/videos/digital-art.mp4', 2400, 'Art', ARRAY['art', 'digital', 'illustration', 'tutorial']),
('550e8400-e29b-41d4-a716-446655440002', 'Travel Vlog: Tokyo Adventure', 'Exploring the streets of Tokyo', '/videos/tokyo-vlog.mp4', 900, 'Travel', ARRAY['travel', 'japan', 'vlog', 'culture'])
ON CONFLICT DO NOTHING;

-- Insert sample quizzes
INSERT INTO quizzes (user_id, title, description, category, difficulty, questions_count, time_limit, passing_score) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'JavaScript Fundamentals', 'Test your knowledge of JavaScript basics', 'Programming', 'beginner', 10, 1800, 70),
('550e8400-e29b-41d4-a716-446655440001', 'Art History Quiz', 'Famous artists and art movements', 'Art', 'intermediate', 15, 2400, 75),
('550e8400-e29b-41d4-a716-446655440000', 'World Geography', 'Countries, capitals, and landmarks', 'Geography', 'easy', 20, 1200, 60)
ON CONFLICT DO NOTHING;

-- Insert sample quiz questions
INSERT INTO questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points, order_index)
SELECT 
  q.id,
  'What does HTML stand for?',
  'multiple_choice',
  ARRAY['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink and Text Markup Language'],
  'HyperText Markup Language',
  'HTML stands for HyperText Markup Language, which is the standard markup language for creating web pages.',
  1,
  1
FROM quizzes q WHERE q.title = 'JavaScript Fundamentals'
ON CONFLICT DO NOTHING;

INSERT INTO questions (quiz_id, question_text, question_type, options, correct_answer, explanation, points, order_index)
SELECT 
  q.id,
  'Which method is used to add an element to the end of an array in JavaScript?',
  'multiple_choice',
  ARRAY['push()', 'pop()', 'shift()', 'unshift()'],
  'push()',
  'The push() method adds one or more elements to the end of an array and returns the new length of the array.',
  1,
  2
FROM quizzes q WHERE q.title = 'JavaScript Fundamentals'
ON CONFLICT DO NOTHING;

-- Initialize quiz analytics
INSERT INTO quiz_analytics (quiz_id, total_attempts, average_score, pass_rate)
SELECT id, 0, 0.00, 0.00 FROM quizzes
ON CONFLICT DO NOTHING;

-- Insert sample video playlists
INSERT INTO video_playlists (user_id, name, description, is_public) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Programming Tutorials', 'Collection of programming tutorial videos', TRUE),
('550e8400-e29b-41d4-a716-446655440001', 'Art Inspiration', 'Videos that inspire my artistic work', FALSE),
('550e8400-e29b-41d4-a716-446655440002', 'Travel Adventures', 'My travel vlogs and experiences', TRUE)
ON CONFLICT DO NOTHING;
