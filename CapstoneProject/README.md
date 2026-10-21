# Decision Duel — Real-Time Group Decision-Making Website

**Tagline:** *Stop arguing. Start dueling.*

Decision Duel turns the question *"where should we eat or what should we watch?"* into a quick, fair, and fun head-to-head tournament that every member of the group votes in from their own device in real time.

---

## 1. Authoritative Architecture & Firebase Integration

Decision Duel uses **Firebase Realtime Database (RTDB)** as its single authoritative, real-time shared data store across all desktop, tablet, and mobile browsers.

> [!IMPORTANT]
> **Firebase Realtime Database vs. Cloud Firestore**
> Decision Duel uses **Firebase Realtime Database** (`firebase/database`), **NOT** Cloud Firestore.
> In your Firebase Console, access **Build > Realtime Database** to view the live JSON tree.

### Canonical Database Tree Layout
```
rooms/
  {roomCode}/
    metadata:
      room_id: "room_ABC123"
      room_code: "ABC123"
      host_name: "HostNickname"
      title: "Where to Eat"
      status: "lobby" | "dueling" | "tiebreak" | "finished"
      current_round: 1
      current_duel_id: "duel_room_ABC123_r1_d1"
      champion_option_id: null
      allow_veto: true
      created_at: 1729240000000
    players/
      {playerId}:
        player_id: "p_123"
        nickname: "Alex"
        is_host: true
        joined_at: 1729240001000
    options/
      {optionId}:
        option_id: "opt_123"
        label: "Woodfire Pizza"
        emoji: "🍕"
        price_tag: "$$"
        is_veg: true
        is_vetoed: false
        vetoed_by: null
    duels/
      {duelId}:
        duel_id: "duel_room_ABC123_r1_d1"
        round_no: 1
        duel_index: 1
        option_a_id: "opt_1"
        option_b_id: "opt_2"
        winner_id: null
        is_bye: false
        status: "pending" | "completed"
        won_by_tiebreak: false
        tiebreak_type: null
        tiebreak_detail: null
    votes/
      {duelId}/
        {playerId}:
          vote_id: "v_duel_p1"
          duel_id: "duel_room_ABC123_r1_d1"
          player_id: "p_123"
          option_id: "opt_1"
          created_at: 1729240010000
    tiebreak:
      duel_id: "duel_room_ABC123_r1_d1"
      option_a_id: "opt_1"
      option_b_id: "opt_2"
      game_type: "tap_race" | "reaction" | "rps"
      status: "ready" | "playing" | "completed"
      score_a: 0
      score_b: 0
      winner_option_id: null
```

---

## 2. Step-by-Step: Enabling Firebase Realtime Database in Firebase Console

If your application data does not yet appear in the Firebase Console, follow these steps:

1. **Open Firebase Console**:
   Visit [https://console.firebase.google.com](https://console.firebase.google.com).

2. **Select or Create Your Project**:
   Click your project (e.g. `test-f63aa`).

3. **Create the Realtime Database**:
   - In the left sidebar, expand **Build** and click **Realtime Database**.
   - If not yet created, click the blue **Create Database** button.
   - Choose a Realtime Database location (e.g. `United States (us-central1)` or `Singapore (asia-southeast1)`).
   - In the Security Rules step, select **Start in test mode** for initial testing, or start in locked mode and deploy the security rules below.

4. **Copy the Database URL**:
   - At the top of the **Data** tab in the Realtime Database console, locate the database URL reference:
     `https://<YOUR-PROJECT-ID>-default-rtdb.firebaseio.com`
     *(or with a region prefix, e.g. `https://<YOUR-PROJECT-ID>-default-rtdb.asia-southeast1.firebasedatabase.app`)*
   - Copy this URL exact string.

5. **Configure `.env`**:
   In the root of the project (`decision-duel/.env`), paste your configuration:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...YourRealApiKey
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```

6. **Deploy Security Rules**:
   The repository includes [`database.rules.json`](file:///C:/Users/SHAURYA%20VENKTA/Desktop/FFTProject/decision-duel/database.rules.json).
   You can deploy them either via Firebase CLI:
   ```bash
   firebase deploy --only database
   ```
   Or copy the contents of `database.rules.json` directly into **Firebase Console > Realtime Database > Rules tab** and click **Publish**.

7. **Verify Live Data**:
   Open Decision Duel in your browser, create a room, and check the **Data tab** under **Realtime Database** in Firebase Console. You will see the `rooms/{roomCode}` tree appear instantly.

---

## 3. Game Rules & Bracket Mechanics

- **One Vote per Player per Duel**: Each player can vote at most once per duel. Duplicate votes from the same player are rejected authoritatively.
- **Strict Majority Advancement**: If a duel ends with a majority vote (e.g., 3–1, 2–1, 4–0), the majority winner advances immediately. Mini-games do **NOT** trigger.
- **Tiebreak Mini-Games**: Mini-games are triggered **if and only if** votes are strictly tied (e.g., 2–2, 1–1).
- **Power-of-Two Bye Seeding**: Tournaments with non-power-of-two option counts (3, 5, 7, 9, etc.) assign byes during preliminary rounds so all subsequent rounds form clean power-of-two matchups.
- **Exact $N - 1$ Duels**: Every tournament of size $N$ produces exactly $N - 1$ competitive duels to determine the champion.
- **Per-Player Veto Power**: Each player in the lobby gets exactly 1 veto to eliminate their least favorite choice before the tournament begins.

---

## 4. Running the Project Locally

### Prerequisites
- Node.js 18+ (tested with Node 26)
- npm 9+

### Commands

1. **Install dependencies**:
   ```bash
   npm.cmd install
   ```

2. **Run automated test suite** (17 tests covering bracket engine, byes, voting rules, and ties):
   ```bash
   npm.cmd test
   ```

3. **Build production bundle**:
   ```bash
   npm.cmd run build
   ```

4. **Start Vite development server**:
   ```bash
   npm.cmd run dev
   ```

5. **Start optional backend server**:
   ```bash
   npm.cmd run server
   ```

---

## 5. Verification Test Suite

Run `npm.cmd test` to execute all 17 automated tests implemented with Node.js test runner:
1. Bracket generation with 0 options throws or returns empty tournament safely.
2. Bracket generation with 1 option marks it as champion without duels.
3. Bracket generation with 2 options produces exactly 1 duel.
4. Bracket generation with 3 options produces 1 bye and 2 duels total.
5. Bracket generation with 4 options produces 3 duels across 2 rounds.
6. Bracket generation with 5 options produces 3 byes, 1 preliminary duel, and 4 duels total.
7. Bracket generation with 7 options produces 1 bye and 6 duels total.
8. Bracket generation with 8 options produces 7 duels across 3 rounds.
9. Bracket generation with 9 options produces 7 byes and 8 duels total.
10. Bracket generation with 16 options produces 15 duels across 4 rounds.
11. Every completed single-elimination tournament of size $N$ produces exactly $N - 1$ played duels.
12. Deterministic shuffling: identical seed yields identical bracket matchups.
13. Duplicate option rejection: adding existing option name (case-insensitive) fails.
14. Single vote enforcement: duplicate `castVote` for same player in same duel is rejected.
15. Majority vote resolution: 3–1 vote advances majority choice without mini-game.
16. Tied vote resolution: 2–2 vote triggers tiebreak mini-game.
17. Zero votes resolution: auto-advances option A without crashing when timer expires with 0 votes.
