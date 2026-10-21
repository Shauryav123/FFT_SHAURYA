-- ============================================================================
-- Decision Duel — Relational Database Schema (Matches Section 5 ER Diagram)
-- Entities: USER, ROOM, PLAYER, OPTION, DUEL, VOTE
-- ============================================================================

CREATE TABLE IF NOT EXISTS USER (
    user_id       VARCHAR(64) PRIMARY KEY,
    full_name     VARCHAR(120) NOT NULL,
    email         VARCHAR(160) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar        VARCHAR(16) DEFAULT '⚡',
    created_at    BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS ROOM (
    room_id            VARCHAR(64) PRIMARY KEY,
    room_code          VARCHAR(12) UNIQUE NOT NULL,
    host_name          VARCHAR(100) NOT NULL,
    host_user_id       VARCHAR(64),
    title              VARCHAR(255) NOT NULL,
    status             VARCHAR(32) NOT NULL DEFAULT 'lobby', -- 'lobby' | 'dueling' | 'tiebreak' | 'finished'
    current_round      INT DEFAULT 1,
    current_duel_id    VARCHAR(64),
    champion_option_id VARCHAR(64),
    created_at         BIGINT NOT NULL,
    FOREIGN KEY (host_user_id) REFERENCES USER(user_id)
);

CREATE TABLE IF NOT EXISTS PLAYER (
    player_id  VARCHAR(64) PRIMARY KEY,
    room_id    VARCHAR(64) NOT NULL,
    nickname   VARCHAR(100) NOT NULL,
    is_host    BOOLEAN DEFAULT FALSE,
    joined_at  BIGINT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS OPTION (
    option_id    VARCHAR(64) PRIMARY KEY,
    room_id      VARCHAR(64) NOT NULL,
    label        VARCHAR(255) NOT NULL,
    is_vetoed    BOOLEAN DEFAULT FALSE,
    emoji        VARCHAR(16) DEFAULT '🍕',
    price_tag    VARCHAR(8) DEFAULT '$$',
    is_veg       BOOLEAN DEFAULT TRUE,
    duration_tag VARCHAR(32) DEFAULT 'Quick',
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS DUEL (
    duel_id         VARCHAR(64) PRIMARY KEY,
    room_id         VARCHAR(64) NOT NULL,
    round_no        INT NOT NULL,
    duel_index      INT NOT NULL,
    option_a_id     VARCHAR(64) NOT NULL,
    option_b_id     VARCHAR(64), -- NULL when automatic BYE for odd counts
    winner_id       VARCHAR(64),
    is_bye          BOOLEAN DEFAULT FALSE,
    won_by_tiebreak BOOLEAN DEFAULT FALSE,
    tiebreak_type   VARCHAR(64),
    tiebreak_detail VARCHAR(255),
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id) ON DELETE CASCADE,
    FOREIGN KEY (option_a_id) REFERENCES OPTION(option_id),
    FOREIGN KEY (option_b_id) REFERENCES OPTION(option_id),
    FOREIGN KEY (winner_id) REFERENCES OPTION(option_id)
);

CREATE TABLE IF NOT EXISTS VOTE (
    vote_id    VARCHAR(64) PRIMARY KEY,
    duel_id    VARCHAR(64) NOT NULL,
    player_id  VARCHAR(64) NOT NULL,
    option_id  VARCHAR(64) NOT NULL,
    created_at BIGINT NOT NULL,
    UNIQUE (duel_id, player_id), -- Objective 2: One vote per player per duel
    FOREIGN KEY (duel_id) REFERENCES DUEL(duel_id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES PLAYER(player_id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES OPTION(option_id) ON DELETE CASCADE
);
