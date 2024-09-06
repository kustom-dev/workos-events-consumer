-- Migration number: 0001 	 2024-09-06T22:40:10.825Z
-- WorkOS Events cursor
CREATE TABLE
  IF NOT EXISTS events_cursor (
    event_id TEXT PRIMARY KEY NOT NULL,
    event_payload TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    processed_at INTEGER NOT NULL
  );

CREATE INDEX IF NOT EXISTS events_cursor_created_at_idx ON events_cursor (created_at);

-- WorkOS User
CREATE TABLE
  IF NOT EXISTS user (
    id TEXT PRIMARY KEY NOT NULL,
    email VARCHAR(254) NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email_verified BOOLEAN NOT NULL,
    profile_picture_url TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

CREATE INDEX IF NOT EXISTS user_email_idx ON user (email);

-- WorkOS Organization
CREATE TABLE
  IF NOT EXISTS organization (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

CREATE INDEX IF NOT EXISTS organization_name_idx ON organization (name);

-- WorkOS Organization Membership
CREATE TABLE
  IF NOT EXISTS organization_membership (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    role_slug TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user (id),
    FOREIGN KEY (organization_id) REFERENCES organization (id),
    PRIMARY KEY (id, user_id, organization_id)
  );