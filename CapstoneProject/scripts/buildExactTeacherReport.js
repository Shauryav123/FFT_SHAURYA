import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const screenshotsDir = path.join(rootDir, 'screenshots');
const htmlOutPath = path.join(rootDir, 'DECISION_DUEL_EXACT_TEACHER_REPORT.html');
const pdfOutPath = path.join(rootDir, 'DECISION_DUEL_EXACT_TEACHER_REPORT.pdf');

function getBase64Image(filePath) {
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);
    if (fs.existsSync(fullPath)) {
      const ext = path.extname(fullPath).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${fs.readFileSync(fullPath).toString('base64')}`;
    }
  } catch (err) {
    console.error('Error base64 image:', err);
  }
  return '';
}

const allianceLogoHeader = getBase64Image('screenshots/extracted_1.jpg');
const cleanCoverBg = getBase64Image('screenshots/clean_cover_page1.jpg');
const shot1 = getBase64Image('screenshots/01_home_page.png');
const shot2 = getBase64Image('screenshots/02_auth_page.png');
const shot3 = getBase64Image('screenshots/03_lobby_page.png');
const shot4 = getBase64Image('screenshots/04_duel_page.png');
const shot5 = getBase64Image('screenshots/05_tiebreak_page.png');
const shot6 = getBase64Image('screenshots/06_result_page.png');

// 41 Pages Generator
const pages = [];

// ==========================================
// PAGE 1: COVER PAGE
// ==========================================
pages.push(`
<div class="page cover-page">
  <div class="page-inner-border"></div>
  <img src="${cleanCoverBg}" class="cover-bg-img" alt="Cover Page" />
</div>
`);

// ==========================================
// PAGE 2: TITLE / SUBMISSION CERTIFICATE
// ==========================================
pages.push(`
<div class="page p2-page">
  <div class="page-inner-border"></div>
  <div class="header-logo-container">
    <img src="${allianceLogoHeader}" class="alliance-header-img" alt="Alliance University Header" />
  </div>
  
  <div class="title-block">
    <h2 class="report-subtitle">Capstone Project Report</h2>
    <h3 class="degree-title">Master of Computer Application</h3>
    <p class="sem-title">Semester – I</p>
    <p class="course-title">Front-End Frameworks & Technologies</p>
    <h1 class="project-main-title">Project title: DECISION DUEL</h1>
  </div>

  <div class="two-column-submission">
    <div class="col-left">
      <p class="label-regular">Submitted By:</p>
      <p class="student-name">Shaurya Venkta(PROV/ASAC/MCA/07/26/088)</p>
    </div>
    <div class="col-right">
      <p class="label-regular">Submitted To:</p>
      <p class="faculty-name">Faculty Name: Raghav K</p>
      <p class="sign-line">HOD Sign:</p>
      <p class="sign-gap">Faculty Signature:</p>
    </div>
  </div>

  <div class="dept-footer">
    <p class="dept-name"><strong>Department of Computer Application</strong></p>
    <p class="uni-bold"><strong>Alliance University</strong></p>
    <p class="uni-addr">Chandapura - Anekal Main Road, Anekal Bengaluru - 562 106</p>
    <p class="uni-date"><strong>Oct- 2026</strong></p>
  </div>
  <div class="page-number">2</div>
</div>
`);

// ==========================================
// PAGE 3: ACKNOWLEDGEMENT
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <div class="section-center-title">
    <h2 class="ack-title">ACKNOWLEDGEMENT</h2>
  </div>
  
  <div class="page-body-text">
    <p>I would like to express my sincere gratitude to my project guide, Raghav K, for his valuable guidance, encouragement, and continuous support throughout the development of this project. His constructive feedback, technical knowledge, and suggestions were instrumental in successfully completing this project.</p>
    
    <p>I am also thankful to the Head of the Department and all the faculty members of the Department of Computer Applications for providing the necessary resources, laboratory facilities, and valuable encouragement required to complete this project successfully.</p>
    
    <p>I would also like to express my heartfelt thanks to my family and friends for their constant motivation, encouragement, and support throughout the course of this project.</p>
    
    <p>Finally, I am grateful to everyone who directly or indirectly contributed to the successful completion of this project.</p>
  </div>

  <div class="student-sign-block">
    <p><strong>Shaurya Venkta</strong></p>
  </div>
  <div class="page-number">3</div>
</div>
`);

// ==========================================
// PAGE 4: 1. ABOUT OUR COURSE (1.1 - 1.4)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h2 class="chapter-title">1. ABOUT OUR COURSE – Front-End Frameworks & Technologies</h2>
  
  <h3 class="sub-title">1.1 Introduction to Front-End Frameworks and Technologies</h3>
  <p>Front-End Frameworks and Technologies are the tools, libraries, languages, and development practices used to create the visual and interactive parts of websites and web applications. They help developers build interfaces that are responsive, accessible, reusable, and easy to maintain.</p>
  
  <p>The front end runs primarily in a web browser and is responsible for everything a user sees and interacts with, including layouts, navigation menus, forms, buttons, tables, animations, and dynamic content. It communicates with back-end services through APIs to display and update application data.</p>
  
  <p>This course provides theoretical and practical knowledge of modern front-end development. It introduces core web technologies, popular frameworks, responsive design, component-based architecture, development tools, testing, and techniques for creating effective user experiences.</p>
  
  <h3 class="sub-title">1.2 Importance of Front-End Development</h3>
  <p>Front-end development is an essential part of modern software development because it directly shapes how users experience a web application. Its major advantages include:</p>
  <ul class="bullet-list">
    <li><strong>User Experience:</strong> Well-designed interfaces make applications clear, efficient, and easy to use.</li>
    <li><strong>Responsive Design:</strong> Interfaces can adapt to desktops, tablets, and smartphones.</li>
    <li><strong>Reusability:</strong> Components and shared styles reduce repeated code and speed up development.</li>
    <li><strong>Maintainability:</strong> Organized front-end code makes applications easier to update and extend.</li>
    <li><strong>Interactivity:</strong> JavaScript and frameworks provide immediate feedback and dynamic page behavior.</li>
    <li><strong>API Integration:</strong> Front-end applications can securely exchange data with back-end services.</li>
  </ul>
  
  <h3 class="sub-title">1.3 Core Front-End Technologies</h3>
  <p>Modern front-end development is built on three core technologies. Each technology has a separate role, and together they create the structure, presentation, and behavior of a web interface.</p>
  <p><strong>HTML (HyperText Markup Language)</strong> defines the structure and meaning of page content. It provides elements for headings, paragraphs, navigation, forms, buttons, images, links, tables, and other interface content.</p>
  <p><strong>CSS (Cascading Style Sheets)</strong> controls presentation and layout. It is used for colors, typography, spacing, borders, animations, Flexbox, Grid, and responsive designs that adapt to different screen sizes.</p>
  <p><strong>JavaScript</strong> adds logic and interactivity to web pages. It handles user events, validates forms, updates the Document Object Model (DOM), stores browser data, and communicates with APIs using technologies such as Fetch.</p>
  <p>HTML, CSS, and JavaScript provide the foundation on which front-end frameworks and user-interface libraries are built.</p>
  
  <h3 class="sub-title">1.4 JavaScript Frameworks and Libraries</h3>
  <p>JavaScript frameworks and libraries provide reusable structures for building interactive applications. They commonly support components, routing, state management, form handling, and efficient updates to the user interface.</p>
  <div class="page-number">4</div>
</div>
`);

// ==========================================
// PAGE 5: 1. ABOUT OUR COURSE (1.5 - 1.7)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <p>React is a component-based library for building reusable user interfaces. Angular is a complete framework that provides routing, forms, dependency injection, and development tools. Vue is a progressive framework known for its approachable syntax and flexible component system.</p>
  
  <p>The choice of framework depends on project size, team experience, performance needs, and maintainability. Decision Duel leverages React 18 with Vite 5, applying the core principles of component composition, unidirectional data flow, custom hooks, and real-time state synchronization.</p>
  
  <h3 class="sub-title">1.5 CSS Frameworks and UI Libraries</h3>
  <p>CSS frameworks such as Bootstrap and Tailwind CSS help developers create consistent, responsive interfaces more quickly. Bootstrap provides ready-made components and a responsive grid, while Tailwind CSS provides utility classes for composing custom designs.</p>
  <p>UI libraries can provide accessible buttons, forms, navigation, dialogs, and other reusable components. Developers should select only the tools required by a project and customize them to maintain visual consistency, performance, and accessibility.</p>
  
  <h3 class="sub-title">1.6 Modern Front-End Development Practices</h3>
  <p>Modern front-end development includes responsive design, mobile-first layouts, semantic HTML, accessibility, reusable components, browser developer tools, version control, package management, testing, performance optimization, and deployment.</p>
  <p>Decision Duel demonstrates these practices through responsive single-page interfaces, utility-first styling with Tailwind CSS, modular React components, form validation, safe image bounds, Firebase Realtime synchronization, Git-based version control, and production cloud deployment on Firebase Hosting.</p>
  
  <h3 class="sub-title">1.7 Learning Outcomes</h3>
  <p>The Front-End Frameworks and Technologies course provides practical skills for designing and developing modern user interfaces. The major learning outcomes include:</p>
  <ol class="num-list">
    <li>Creating semantic and accessible page structures using HTML.</li>
    <li>Designing responsive layouts using CSS, Flexbox, Grid, and media queries.</li>
    <li>Developing interactive features using JavaScript and DOM manipulation.</li>
    <li>Understanding component-based user-interface development.</li>
    <li>Comparing JavaScript frameworks and libraries such as React, Angular, and Vue.</li>
    <li>Using CSS frameworks and UI libraries appropriately.</li>
    <li>Validating forms and managing browser-side application state.</li>
    <li>Integrating front-end interfaces with REST APIs and real-time cloud backends.</li>
    <li>Applying accessibility, testing, debugging, and performance practices.</li>
    <li>Deploying and maintaining a front-end web application.</li>
  </ol>
  <p>The Decision Duel project provides practical experience in applying these concepts by combining semantic pages, cyber-arcade styling, interactive React hooks, single-elimination tournament algorithms, Firebase synchronization, and cloud deployment in a real-world application.</p>
  <div class="page-number">5</div>
</div>
`);

// ==========================================
// PAGE 6: 1.8 SUMMARY
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">1.8 Summary</h3>
  <p>Front-End Frameworks and Technologies provide the foundation for creating responsive, interactive, and maintainable web interfaces. HTML, CSS, JavaScript, component-based frameworks, CSS libraries, and modern development tools work together to improve both development efficiency and user experience.</p>
  
  <p>Through this course and the Decision Duel project, concepts such as responsive design, DOM interaction, reusable components, form handling, API communication, accessibility, debugging, automated testing, and deployment can be practically understood and implemented.</p>
  <div class="page-number">6</div>
</div>
`);

// ==========================================
// PAGE 7: TABLE OF CONTENTS
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <div class="section-center-title">
    <h2 class="toc-title">TABLE OF CONTENTS</h2>
  </div>
  
  <table class="toc-table">
    <thead>
      <tr>
        <th style="width: 15%;">S. No.</th>
        <th style="width: 85%;">Particulars</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: center;">1</td>
        <td>About Our Course – Front-End Frameworks and Technologies</td>
      </tr>
      <tr>
        <td style="text-align: center;">2</td>
        <td>System Requirements</td>
      </tr>
      <tr>
        <td style="text-align: center;">3</td>
        <td>Introduction of Project</td>
      </tr>
      <tr>
        <td style="text-align: center;">4</td>
        <td>Objective / Aim</td>
      </tr>
      <tr>
        <td style="text-align: center;">5</td>
        <td>Implementation / Code with Explanation</td>
      </tr>
      <tr>
        <td style="text-align: center;">6</td>
        <td>Output Screenshots / Images</td>
      </tr>
      <tr>
        <td style="text-align: center;">7</td>
        <td>Future Enhancement</td>
      </tr>
      <tr>
        <td style="text-align: center;">8</td>
        <td>Conclusion</td>
      </tr>
      <tr>
        <td style="text-align: center;">9</td>
        <td>Reference Books / URLs</td>
      </tr>
      <tr>
        <td style="text-align: center;">10</td>
        <td>GitHub Link / Hosted Link</td>
      </tr>
    </tbody>
  </table>
  <div class="page-number">7</div>
</div>
`);

// ==========================================
// PAGE 8: 2. SYSTEM REQUIREMENTS (2.1 - 2.3.4)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h2 class="chapter-title">2. SYSTEM REQUIREMENTS</h2>
  
  <h3 class="sub-title">2.1 Introduction</h3>
  <p>System requirements define the hardware and software resources required to develop, execute, test, and maintain the Decision Duel web application.</p>
  <p>Since Decision Duel is a modern full-stack reactive web application, the development environment must support a web browser, code editor, Node.js runtime, real-time database connectivity, and cloud deployment tooling.</p>
  <p>The system requirements are divided into hardware requirements, software requirements, functional requirements, and non-functional requirements.</p>
  
  <h3 class="sub-title">2.2 Hardware Requirements</h3>
  <h4 class="sub-sub-title">2.2.1 Processor</h4>
  <p>A modern processor is required to run the development environment, browser, Node.js server, and supporting applications. Minimum: Intel Core i3 or equivalent. Recommended: Intel Core i5 or higher.</p>
  
  <h4 class="sub-sub-title">2.2.2 RAM</h4>
  <p>RAM is required to run Visual Studio Code, the web browser, Vite development server, Node.js runtime, and background sync processes simultaneously. Minimum: 4 GB. Recommended: 8 GB or more.</p>
  
  <h4 class="sub-sub-title">2.2.3 Storage</h4>
  <p>Storage is required for source code, Node.js packages, build artifacts, database files, and project assets. Minimum: 5 GB free space. Recommended: 10 GB or more.</p>
  
  <h4 class="sub-sub-title">2.2.4 Display</h4>
  <p>A minimum resolution of 1366 × 768 is recommended for comfortable development and testing.</p>
  
  <h4 class="sub-sub-title">2.2.5 Internet Connection</h4>
  <p>An Internet connection is required for installing dependencies, communicating with Firebase Realtime Database and Authentication endpoints, and deploying the application to Firebase Hosting.</p>
  
  <h3 class="sub-title">2.3 Software Requirements</h3>
  <h4 class="sub-sub-title">2.3.1 Operating System</h4>
  <p>The project can be developed and executed on Windows, Linux, or macOS. Windows 10 or later is suitable for development.</p>
  
  <h4 class="sub-sub-title">2.3.2 Visual Studio Code / Cursor</h4>
  <p>Visual Studio Code or Cursor can be used as the main development environment for React JSX, Tailwind CSS, JavaScript, Node.js, and configuration files.</p>
  
  <h4 class="sub-sub-title">2.3.3 Node.js</h4>
  <p>Node.js is required to execute Vite build tooling and automated unit test runners. The project targets Node.js version 20+.</p>
  
  <h4 class="sub-sub-title">2.3.4 npm</h4>
  <p>npm is used to install and manage the dependencies required by the project (for example, react, react-router-dom, firebase, framer-motion, lucide-react, and canvas-confetti).</p>
  <div class="page-number">8</div>
</div>
`);

// ==========================================
// PAGE 9: 2. SYSTEM REQUIREMENTS (2.3.5 - 2.5)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h4 class="sub-sub-title">2.3.5 Web Browser</h4>
  <p>A modern browser such as Google Chrome, Microsoft Edge, or Mozilla Firefox is required to access the application.</p>
  
  <h4 class="sub-sub-title">2.3.6 Firebase Realtime Database</h4>
  <p>Firebase Realtime Database is used for cloud-synchronized multi-client tournament state. An in-memory/LocalStorage fallback is used during offline development.</p>
  
  <h4 class="sub-sub-title">2.3.7 Git and GitHub</h4>
  <p>Git can be used for source-code version control, while GitHub can be used for storing and sharing the project repository.</p>
  
  <h4 class="sub-sub-title">2.3.8 Firebase Hosting</h4>
  <p>Firebase Hosting is used for high-performance global CDN hosting, SSL certificate management, and SPA route rewrites.</p>
  
  <h3 class="sub-title">2.4 Functional Requirements</h3>
  <p>The functional requirements describe the operations that the system should perform. The major functional requirements are:</p>
  <ol class="num-list">
    <li>User registration and login with email/password and 1-click Google OAuth authentication.</li>
    <li>Room creation with customizable decision titles, category presets, and 6-letter room PINs.</li>
    <li>Room join functionality via 6-letter room PIN or direct shareable URL.</li>
    <li>Multiplayer lobby with real-time player presence indicators and readiness toggles.</li>
    <li>Host moderation capabilities including kicking inactive participants and starting duels.</li>
    <li>Candidate option management with addition, removal, and individual veto strikes.</li>
    <li>Deterministic single-elimination tournament bracket calculation with automatic BYE assignment.</li>
    <li>Head-to-head match duel arena with contender presentation and side backing.</li>
    <li>Mini-game decision engine where arcade games act as the authoritative decider (no manual poll).</li>
    <li>Host stall prevention mechanism with a 10-second force advance countdown.</li>
    <li>Sudden-death tiebreaker arena for resolving deadlock match states with live trivia challenges.</li>
    <li>Champion crowning podium with celebratory particle confetti and match history breakdown.</li>
    <li>Tournament reset functionality allowing the host to replay the tournament back in the lobby.</li>
  </ol>
  
  <h3 class="sub-title">2.5 Non-Functional Requirements</h3>
  <p><strong>Performance:</strong> The application should respond efficiently to normal user operations and sync match updates within 150ms.</p>
  <p><strong>Security:</strong> User authentication tokens must be securely validated. Avatars with external Google photo URLs must be safely bounded inside dedicated overflow-hidden containers to prevent layout distortion.</p>
  <p><strong>Usability:</strong> The application should provide a modern, cyber-arcade glassmorphic interface that is clear and exciting for all participants.</p>
  <p><strong>Reliability:</strong> The application should handle missing duels, network disconnects, and odd entrant counts without crashing.</p>
  <p><strong>Scalability:</strong> The system should support tournaments from 2 up to 16 options across multiple concurrent rooms.</p>
  <div class="page-number">9</div>
</div>
`);

// ==========================================
// PAGE 10: 2. SYSTEM REQUIREMENTS (2.6)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <p><strong>Maintainability:</strong> The project should use modular code organization (components, pages, services, test suites) so that future modifications can be performed easily.</p>
  
  <p><strong>Compatibility:</strong> The application should work with modern web browsers and commonly used operating systems across desktop and mobile form factors.</p>
  
  <p><strong>Fair Play / Anti-Abuse Disclaimer:</strong> Decision Duel is a collaborative decision platform. The host possesses moderation powers for room launching and stall resolution, but cannot unilaterally alter contender point totals or manipulate bracket trees mid-game.</p>
  
  <h3 class="sub-title">2.6 Summary</h3>
  <p>The system requirements of Decision Duel can be fulfilled using a standard modern computer. The project uses widely available technologies and modern cloud services, making it suitable for academic development as well as production cloud deployment.</p>
  <div class="page-number">10</div>
</div>
`);

// ==========================================
// PAGE 11: 3. INTRODUCTION OF PROJECT (3.1 - 3.4)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h2 class="chapter-title">3. INTRODUCTION OF PROJECT</h2>
  
  <h3 class="sub-title">3.1 Project Overview</h3>
  <p>Decision Duel is a gamified, real-time multiplayer decision tournament engine. It transforms everyday group indecision—such as choosing dinner spots, movie night picks, or hangout destinations—into an exhilarating single-elimination tournament.</p>
  <p>In many group scenarios, people spend excessive time arguing, saying "anything is fine", or getting stuck in inconclusive debates. Traditional survey polls often fail due to passive apathy and deadlock ties. Decision Duel resolves this by pitting candidate choices in head-to-head matches where fast-paced mini-games decide the winner.</p>
  <p>The project combines modern React.js with Firebase Realtime Database and Firebase Hosting so that room creation, matchmaking, real-time mini-games, and champion podium celebrations are available globally on the live web.</p>
  
  <h3 class="sub-title">3.2 Problem Statement</h3>
  <p>Groups attempting to make collaborative decisions face several well-documented challenges:</p>
  <ul class="bullet-list">
    <li>Endless circular discussions with no clear consensus mechanism ("analysis paralysis").</li>
    <li>Bystander apathy where passive members refuse to vote or state preferences.</li>
    <li>Traditional polling apps produce unresolvable multi-way ties.</li>
    <li>Dominant personalities frequently overrule quieter group members.</li>
    <li>Lack of an engaging, time-boxed resolution format for fast decisions.</li>
    <li>Need for real-time synchronization so remote friends on different phones see matches live.</li>
    <li>Need for balanced room moderation so trolls cannot stall the tournament indefinitely.</li>
  </ul>
  <p>A system that structures decision alternatives into single-elimination brackets and resolves them through interactive arcade mini-games eliminates social friction and yields a decisive winner in under 3 minutes.</p>
  
  <h3 class="sub-title">3.3 Proposed Solution</h3>
  <p>The proposed solution is Decision Duel, a real-time multiplayer decision tournament platform.</p>
  <p>Users create a room with a decision topic and candidate choices. Friends join using a 6-letter PIN. Each participant can veto one choice they strongly dislike. The system deterministic builds an elimination bracket, pits options head-to-head, and triggers instant arcade mini-games (tile dashes, rapid trivia, reflex tests). The winning option advances until a champion is crowned with confetti.</p>
  
  <h3 class="sub-title">3.4 Need for the Project</h3>
  <p>Decision fatigue is a common psychological friction in modern social life. Digital tools can make group alignment fun and objective rather than stressful.</p>
  <p>The project is useful because it:</p>
  <ol class="num-list">
    <li>Provides an objective, democratic tournament bracket structure.</li>
    <li>Eliminates ties through mini-game victor resolution.</li>
    <li>Empowers every participant with an equal veto strike right.</li>
    <li>Synchronizes game rounds in real-time across multiple devices.</li>
  </ol>
  <div class="page-number">11</div>
</div>
`);

// ==========================================
// PAGE 12: 3. INTRODUCTION OF PROJECT (3.5 - 3.7)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <ol class="num-list" start="5">
    <li>Includes host moderation to remove AFK participants and prevent stalls.</li>
    <li>Runs natively in any mobile or desktop browser without app installation.</li>
    <li>Delivers complete match breakdown and decision history.</li>
    <li>Can be deployed publicly on Firebase CDN for instant global accessibility.</li>
  </ol>
  
  <h3 class="sub-title">3.5 Scope of the Project</h3>
  <p>The scope of Decision Duel includes:</p>
  <ul class="bullet-list">
    <li>Landing home page with host and join workflows.</li>
    <li>User registration and authentication (Email/Password & Google OAuth).</li>
    <li>Real-time matchmaking lobby with readiness state and player lists.</li>
    <li>Option management with custom entry and 1-strike veto toggles.</li>
    <li>Deterministic bracket generation supporting 2 to 16 options with BYE rounds.</li>
    <li>Interactive match duel arena with live mini-game scoring.</li>
    <li>Host stall prevention with a 10-second force advance countdown.</li>
    <li>Sudden-death tiebreaker arena with trivia showdown challenges.</li>
    <li>Champion podium screen with celebratory confetti and rematch resets.</li>
    <li>Automated unit test suite verifying bracket math and edge cases.</li>
    <li>Public production cloud deployment on Firebase Hosting.</li>
  </ul>
  
  <h3 class="sub-title">3.6 Technologies Used</h3>
  <p><strong>HTML5</strong> Used to create semantic web page structures.</p>
  <p><strong>CSS3 / Tailwind CSS</strong> Used for responsive cyber-arcade glassmorphic layouts and animations.</p>
  <p><strong>JavaScript (ES6+)</strong> Used for bracket algorithms, mini-game physics, and client store logic.</p>
  <p><strong>React 18</strong> Component-based UI library managing state hooks, virtual DOM, and rendering.</p>
  <p><strong>Vite 5</strong> Next-generation front-end tooling providing lightning-fast HMR and optimized builds.</p>
  <p><strong>Firebase Realtime Database</strong> Cloud NoSQL database delivering real-time multi-client state sync.</p>
  <p><strong>Firebase Authentication</strong> Secure identity management supporting Google OAuth and email credentials.</p>
  <p><strong>Firebase Hosting</strong> Production global CDN delivering SSL-secured static assets and SPA rewrites.</p>
  <p><strong>Canvas Confetti</strong> Particle physics library powering the victory champion podium celebration.</p>
  <p><strong>Git & GitHub</strong> Version control management and source repository hosting.</p>
  
  <h3 class="sub-title">3.7 Major Modules</h3>
  <ol class="num-list">
    <li>Home / Landing Portal.</li>
    <li>Multiplayer Lobby & Veto Management.</li>
    <li>Tournament Duel Match Arena.</li>
  </ol>
  <div class="page-number">12</div>
</div>
`);

// ==========================================
// PAGE 13: 3. INTRODUCTION OF PROJECT (3.8 - 3.10)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <ol class="num-list" start="4">
    <li>Interactive Mini-Game Voting Engine.</li>
    <li>Sudden-Death Tiebreaker Arena.</li>
    <li>Champion Victory Podium & Match History.</li>
    <li>Authoritative Real-Time Store & State Machine.</li>
    <li>Database & Relay REST API Server.</li>
    <li>Firebase Production Hosting.</li>
  </ol>
  
  <h3 class="sub-title">3.8 Working Principle</h3>
  <p>The operational flow can be represented as:</p>
  <div class="code-box text-center">
    User → React UI (Tailwind CSS) → Realtime Store → Firebase Realtime Database / Local BroadcastChannel → Real-Time State Broadcast → All Connected Clients
  </div>
  <p>When the host or players perform an action (e.g. entering a room, vetoing an option, completing a mini-game challenge), the action is committed to the authoritative state store. The updated room snapshot immediately synchronizes across all subscribed clients via Firebase WebSockets or BroadcastChannel, rendering identical match states simultaneously across devices.</p>
  
  <h3 class="sub-title">3.9 Benefits of the Project</h3>
  <p>Decision Duel provides:</p>
  <ul class="bullet-list">
    <li>Rapid resolution of group conflicts without interpersonal awkwardness.</li>
    <li>Engaging gamification where mini-games substitute for tedious survey forms.</li>
    <li>Guaranteed mathematical convergence: exactly <em>n − 1</em> matches crown a champion.</li>
    <li>Democratic fairness through equal veto strikes and transparent bracket progression.</li>
    <li>Zero-install browser accessibility across iOS, Android, macOS, and Windows devices.</li>
    <li>Safe visual authentication preventing avatar layout blowouts.</li>
  </ul>
  
  <h3 class="sub-title">3.10 Summary</h3>
  <p>Decision Duel is engineered to eliminate the inertia of everyday group decision-making by uniting tournament bracket algorithms, real-time multiplayer synchronization, and arcade mini-game deciders into one cohesive web platform. It proves that modern front-end engineering can turn routine social deadlocks into entertaining group experiences.</p>
  <div class="page-number">13</div>
</div>
`);

// ==========================================
// PAGE 14: 4. OBJECTIVE / AIM
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h2 class="chapter-title">4. OBJECTIVE / AIM</h2>
  
  <h3 class="sub-title">4.1 Aim of the Project</h3>
  <p>The primary aim of Decision Duel is to architect, develop, verify, and deploy a responsive, gamified real-time group decision platform that replaces unresolvable group debates and passive survey polls with single-elimination tournament brackets resolved through interactive arcade mini-games using modern Web Technologies.</p>
  
  <h3 class="sub-title">4.2 Objectives</h3>
  <ol class="num-list">
    <li><strong>Deterministic Bracket Engine:</strong> To construct an algorithmic tournament engine supporting 2 to 16 options, calculating byes for odd numbers such that exactly <em>n − 1</em> played matches decide the champion.</li>
    <li><strong>Interactive Mini-Game Voting:</strong> To eliminate manual poll buttons by establishing arcade mini-game challenges as the authoritative match decider.</li>
    <li><strong>Real-Time Multi-Client Synchronization:</strong> To synchronize room status, contenders, scores, and active rounds instantaneously across connected devices using Firebase Realtime Database.</li>
    <li><strong>Veto Strike Rights:</strong> To grant every participating user exactly one veto strike to dismiss unacceptable choices before tournament commencement.</li>
    <li><strong>Balanced Host Moderation:</strong> To equip the host with room launch control, inactive player kick capability, and a 10-second force advance countdown to prevent deliberate stalls.</li>
    <li><strong>Secure Visual Authentication:</strong> To implement Google OAuth and email sign-in with strict image overflow boundaries preventing raw URL layout distortion.</li>
    <li><strong>Sudden-Death Deadlock Policy:</strong> To provide rapid-fire trivia and reaction tests for resolving tied match states instantaneously.</li>
    <li><strong>Production Cloud Deployment:</strong> To deploy the application globally on Firebase Hosting with HTTPS certificates and SPA routing.</li>
    <li><strong>Comprehensive Test Verification:</strong> To validate bracket mathematics, duplicate protection, and edge cases with 17 passing automated unit tests.</li>
  </ol>
  
  <h3 class="sub-title">4.3 Project Goals</h3>
  <p>The major project goals are:</p>
  <ul class="bullet-list">
    <li>To combine single-elimination mathematics and real-time gaming into one cohesive platform.</li>
    <li>To demonstrate mastery of React 18 component lifecycles, custom hooks, and Tailwind CSS.</li>
    <li>To architect a decoupled state machine with transparent local and cloud synchronization.</li>
    <li>To deploy a production-grade live web application on Firebase Hosting.</li>
    <li>To maintain documentation integrity and achieve 100% automated test pass rates.</li>
  </ul>
  <div class="page-number">14</div>
</div>
`);

// ==========================================
// PAGE 15: 5. IMPLEMENTATION (5.1 - 5.3)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h2 class="chapter-title">5. IMPLEMENTATION / CODE WITH EXPLANATION</h2>
  
  <h3 class="sub-title">5.1 Introduction</h3>
  <p>Decision Duel is implemented as a modern single-page application (SPA) using React 18, Vite 5, Tailwind CSS, Firebase Realtime Database, and Firebase Hosting. The front-end manages dynamic game views, state subscriptions, and mini-game animations, while the service layer manages bracket computation, host moderation rules, and real-time cloud persistence.</p>
  <p>The codebase follows a modular architecture separating presentation components from business logic engines and storage adapters, ensuring maintainability, testability, and seamless cloud deployment.</p>
  
  <h3 class="sub-title">5.2 Project Structure</h3>
  <pre class="code-box">decision-duel/
├── index.html                   Entry HTML document
├── package.json                 Project dependencies and scripts
├── vite.config.js               Vite bundler configuration
├── tailwind.config.js           Tailwind cyber-arcade theme rules
├── firebase.json                Firebase Hosting & SPA rewrite config
├── .firebaserc                  Firebase project mapping
├── src/
│   ├── App.jsx                  Application root and React Router setup
│   ├── main.jsx                 Client mount and React strict mode
│   ├── index.css                Tailwind directives & glassmorphic classes
│   ├── components/
│   │   ├── Navbar.jsx           Top navigation bar & user status
│   │   ├── UserAvatar.jsx       Safe Google OAuth avatar renderer
│   │   ├── InteractiveDuelGames.jsx Mini-game decision engine
│   │   └── AuthGate.jsx         Authentication requirement barrier
│   ├── pages/
│   │   ├── HomePage.jsx         Landing page (Host & Join portals)
│   │   ├── AuthPage.jsx         Cyber-arcade sign-in & registration
│   │   ├── LobbyPage.jsx        Multiplayer lobby & veto management
│   │   ├── DuelPage.jsx         Interactive match arena & mini-games
│   │   ├── TiebreakPage.jsx     Sudden-death trivia showdown
│   │   └── ResultPage.jsx       Champion podium & rematch portal
│   └── services/
│       ├── bracketEngine.js     Single-elimination math & byes
│       ├── realtimeStore.js     State machine & Firebase sync
│       ├── firebase.js          Firebase SDK initialization
│       └── presets.js           Decision templates (Food, Movies)
└── tests/
    └── bracketAndVoting.test.js 17 automated unit test suites</pre>
  
  <h3 class="sub-title">5.3 Local Development Server Setup</h3>
  <p>The application leverages Vite for development with Hot Module Replacement (HMR) and optimized Rollup production bundling.</p>
  <pre class="code-box">// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
});</pre>
  <p><strong>Explanation:</strong> Vite provides near-instantaneous build times and modular ES imports during development, compiling JSX and Tailwind directives efficiently for production deployment.</p>
  <div class="page-number">15</div>
</div>
`);

// ==========================================
// PAGE 16: 5. IMPLEMENTATION (5.4 - 5.5)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.4 Database Schema</h3>
  <p>Decision Duel models data into 6 relational entities: USER, ROOM, PLAYER, OPTION, DUEL, and VOTE.</p>
  <pre class="code-box">CREATE TABLE IF NOT EXISTS ROOM (
    room_id            VARCHAR(64) PRIMARY KEY,
    room_code          VARCHAR(12) UNIQUE NOT NULL,
    host_name          VARCHAR(100) NOT NULL,
    title              VARCHAR(255) NOT NULL,
    status             VARCHAR(32) DEFAULT 'lobby',
    current_round      INT DEFAULT 1,
    current_duel_id    VARCHAR(64),
    champion_option_id VARCHAR(64),
    allow_veto         BOOLEAN DEFAULT TRUE,
    created_at         BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS DUEL (
    duel_id         VARCHAR(64) PRIMARY KEY,
    room_id         VARCHAR(64) NOT NULL,
    round_no        INT NOT NULL,
    duel_index      INT NOT NULL,
    option_a_id     VARCHAR(64) NOT NULL,
    option_b_id     VARCHAR(64), -- NULL on automatic BYE
    winner_id       VARCHAR(64),
    is_bye          BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (room_id) REFERENCES ROOM(room_id) ON DELETE CASCADE
);</pre>
  <p><strong>Explanation:</strong> Foreign keys preserve referential integrity across duels and options. The nullable <code>option_b_id</code> and boolean <code>is_bye</code> handle odd-entrant bracket progression cleanly.</p>

  <h3 class="sub-title">5.5 Single-Elimination Tournament Bracket Mathematics</h3>
  <p>The bracket engine calculates rounds and byes deterministically using logarithmic formulas.</p>
  <pre class="code-box">// src/services/bracketEngine.js
export function getTotalRounds(optionCount) {
  if (optionCount <= 1) return 1;
  return Math.ceil(Math.log2(optionCount));
}

export function getExpectedPlayedMatches(n) {
  if (n <= 1) return 0;
  return n - 1; // Single-elimination invariant
}</pre>
  <p><strong>Explanation:</strong> For any single-elimination tournament with <em>n</em> candidate options, exactly <em>n − 1</em> played duels are required to produce a solitary champion. The number of rounds equals <em>⌈log₂ n⌉</em>.</p>
  <div class="page-number">16</div>
</div>
`);

// ==========================================
// PAGE 17: 5. IMPLEMENTATION (5.6 - 5.8)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.6 REST API & Realtime Endpoints</h3>
  <table class="report-table">
    <thead>
      <tr>
        <th>Method</th>
        <th>Path</th>
        <th>Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>GET</td><td>/health</td><td>Health check & uptime monitor</td></tr>
      <tr><td>GET</td><td>/api/db</td><td>Relational entity view (ROOM, PLAYER, DUEL, OPTION)</td></tr>
      <tr><td>POST</td><td>/api/rooms/:code</td><td>Commit normalized room snapshot</td></tr>
      <tr><td>POST</td><td>/api/users</td><td>Sync registered user accounts</td></tr>
      <tr><td>WS / RTDB</td><td>rooms/{code}</td><td>Real-time WebSocket multi-client room sync</td></tr>
    </tbody>
  </table>

  <h3 class="sub-title">5.7 User Registration and Authentication</h3>
  <p>Authentication supports both email credentials and Google OAuth, safely storing profile tokens in LocalStorage.</p>
  <pre class="code-box">// src/services/realtimeStore.js
export async function registerUser({ fullName, email, password, avatar = '⚡' }) {
  const cleanEmail = sanitizeText(email).toLowerCase();
  const cleanName = sanitizeText(fullName);

  if (!cleanEmail || !cleanName) throw new Error('Name and email are required.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

  const existing = getAllUsers().find((u) => u.email === cleanEmail);
  if (existing) throw new Error('An account with this email already exists.');

  const newUser = {
    user_id: \`usr_\${Date.now().toString(36)}_\${Math.random().toString(36).slice(2, 6)}\`,
    fullName: cleanName,
    email: cleanEmail,
    avatar,
    created_at: Date.now()
  };
  localStorage.setItem('dd_current_user_v2', JSON.stringify(newUser));
  notifyAuthListeners(newUser);
  return newUser;
}</pre>
  <p><strong>Explanation:</strong> Input validation enforces length and email uniqueness before persisting the account. The active user token notifies subscribed components across the application.</p>

  <h3 class="sub-title">5.8 Frontend Real-Time Store Subscription</h3>
  <pre class="code-box">export function subscribeToRoom(roomCode, callback) {
  if (!roomCode) return () => {};
  const code = roomCode.toUpperCase();
  if (!activeListeners.has(code)) activeListeners.set(code, new Set());
  activeListeners.get(code).add(callback);

  const existing = getRoomSnapshot(code);
  if (existing) callback(existing);
  return () => activeListeners.get(code)?.delete(callback);
}</pre>
  <p><strong>Explanation:</strong> Subscribers receive immediate cached state upon mounting, followed by real-time cloud updates whenever room state mutates.</p>
  <div class="page-number">17</div>
</div>
`);

// ==========================================
// PAGE 18: 5. IMPLEMENTATION (5.9 - 5.11)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.9 Option Management and Dynamic Addition</h3>
  <p>Players in the lobby add candidate choices before duels commence. Duplicate entries are blocked case-insensitively.</p>
  <pre class="code-box">// src/services/realtimeStore.js
export async function addOption(roomCode, { label, emoji = '⚡', priceTag = '$$', isVeg = true, durationTag = 'Quick' }) {
  const snapshot = getRoomSnapshot(roomCode);
  if (!snapshot) throw new Error('Room not found');
  if (snapshot.room.status !== 'lobby') throw new Error('Options cannot be added after duels start.');

  const cleanLabel = sanitizeText(label);
  if (!cleanLabel) throw new Error('Option label cannot be empty.');

  const isDuplicate = snapshot.options.some((o) => o.label.toLowerCase() === cleanLabel.toLowerCase());
  if (isDuplicate) throw new Error('This option already exists in the duel list.');

  const newOption = {
    option_id: \`opt_\${Date.now().toString(36)}_\${Math.random().toString(36).slice(2, 6)}\`,
    label: cleanLabel,
    emoji,
    price_tag: priceTag,
    is_veg: Boolean(isVeg),
    duration_tag: durationTag,
    is_vetoed: false,
    vetoed_by: null
  };
  snapshot.options.push(newOption);
  return persistRoomSnapshot(roomCode, snapshot);
}</pre>
  <p><strong>Explanation:</strong> Validating against duplicates preserves clean tournament brackets. Options are immutable once the tournament transitions from lobby to dueling.</p>

  <h3 class="sub-title">5.10 Option Veto Strike Mechanism</h3>
  <p>Every participant receives exactly one veto strike to dismiss an option they do not want.</p>
  <pre class="code-box">export async function toggleVetoOption(roomCode, optionId, playerId, playerNickname) {
  const snapshot = getRoomSnapshot(roomCode);
  const opt = snapshot.options.find((o) => o.option_id === optionId);
  if (!opt) throw new Error('Option not found');

  if (!opt.is_vetoed) {
    opt.is_vetoed = true;
    opt.vetoed_by = playerNickname || 'A player';
  } else {
    opt.is_vetoed = false;
    opt.vetoed_by = null;
  }
  return persistRoomSnapshot(roomCode, snapshot);
}</pre>
  <p><strong>Explanation:</strong> Vetoed options are excluded from tournament bracket generation, guaranteeing that choices hated by participants never win the duel.</p>

  <h3 class="sub-title">5.11 Host Player Moderation</h3>
  <pre class="code-box">export async function kickPlayer(roomCode, hostPlayerId, targetPlayerId) {
  const snapshot = getRoomSnapshot(roomCode);
  const host = snapshot.players.find((p) => p.player_id === hostPlayerId);
  if (!host || !host.is_host) throw new Error('Only the room host can remove players.');
  snapshot.players = snapshot.players.filter((p) => p.player_id !== targetPlayerId);
  return persistRoomSnapshot(roomCode, snapshot);
}</pre>
  <p><strong>Explanation:</strong> The host verifies identity before kicking inactive players from the lobby.</p>
  <div class="page-number">18</div>
</div>
`);

// ==========================================
// PAGE 19: 5. IMPLEMENTATION (5.12 - 5.14)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.12 Tournament Bracket Initialization</h3>
  <p>When the host launches the duel, the bracket engine pairs eligible options into Round 1 matches.</p>
  <pre class="code-box">// src/services/bracketEngine.js
export function createInitialDuels(roomId, optionIds, shouldShuffle = false, randomFn = Math.random) {
  if (!optionIds || optionIds.length === 0) return [];
  const orderedIds = shouldShuffle ? shuffleArray(optionIds, randomFn) : [...optionIds];
  const n = orderedIds.length;

  if (n === 1) {
    return [{
      duel_id: \`duel_\${roomId}_r1_d1\`,
      room_id: roomId,
      round_no: 1,
      duel_index: 1,
      option_a_id: orderedIds[0],
      option_b_id: null,
      winner_id: orderedIds[0],
      is_bye: true,
      status: 'completed'
    }];
  }

  const S = Math.pow(2, Math.ceil(Math.log2(n)));
  const byesNeeded = S - n;
  const prelimMatchesCount = n - S / 2;
  // Deterministic preliminary pairings...
}</pre>
  <p><strong>Explanation:</strong> The engine calculates the next power of two <em>S</em>. If byes are required, options advance automatically without requiring players to duel against blank contenders.</p>

  <h3 class="sub-title">5.13 Firebase Hosting Deployment Configuration</h3>
  <p>Firebase Hosting serves the production build with single-page application route rewrites.</p>
  <pre class="code-box">{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}</pre>
  <p><strong>Explanation:</strong> The SPA rewrite rule directs all incoming URL routes (e.g. <code>/room/DUEL26</code>, <code>/auth</code>) to <code>index.html</code>, allowing client-side React Router to resolve pages seamlessly.</p>

  <h3 class="sub-title">5.14 Implementation Summary</h3>
  <p>The implementation of Decision Duel unites React components, mathematical bracket generation, real-time WebSocket synchronization, and automated testing into an integrated architecture suitable for both academic evaluation and public cloud execution.</p>
  <div class="page-number">19</div>
</div>
`);

// ==========================================
// PAGE 20: 5. IMPLEMENTATION (5.15 - 5.16)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.15 Application Bootstrap & React Router</h3>
  <p>The application mounts React 18 into the DOM and configures browser-based route switching.</p>
  <pre class="code-box">// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import DuelPage from './pages/DuelPage';
import TiebreakPage from './pages/TiebreakPage';
import ResultPage from './pages/ResultPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    &lt;BrowserRouter&gt;
      &lt;div className="min-h-screen flex flex-col bg-[#0A0B14] text-slate-100"&gt;
        &lt;Navbar /&gt;
        &lt;main className="flex-1"&gt;
          &lt;Routes&gt;
            &lt;Route path="/" element={&lt;HomePage /&gt;} /&gt;
            &lt;Route path="/auth" element={&lt;AuthPage /&gt;} /&gt;
            &lt;Route path="/room/:code" element={&lt;LobbyPage /&gt;} /&gt;
            &lt;Route path="/room/:code/duel" element={&lt;DuelPage /&gt;} /&gt;
            &lt;Route path="/room/:code/tiebreak" element={&lt;TiebreakPage /&gt;} /&gt;
            &lt;Route path="/room/:code/result" element={&lt;ResultPage /&gt;} /&gt;
            &lt;Route path="*" element={&lt;Navigate to="/" replace /&gt;} /&gt;
          &lt;/Routes&gt;
        &lt;/main&gt;
      &lt;/div&gt;
    &lt;/BrowserRouter&gt;
  );
}</pre>
  <p><strong>Explanation:</strong> Centralized route definitions ensure that bookmarking, page refresh, and back-button navigation resolve to the exact active tournament page without state corruption.</p>

  <h3 class="sub-title">5.16 Secure Input Sanitization & XSS Prevention</h3>
  <p>All user-submitted nicknames, decision topics, and option labels are sanitized against injection vectors.</p>
  <pre class="code-box">export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[&lt;&gt;]/g, '');
}</pre>
  <p><strong>Explanation:</strong> Stripping angle brackets prevents malicious script injection when user nicknames or custom options are rendered across other connected participants' browser DOMs.</p>
  <div class="page-number">20</div>
</div>
`);

// ==========================================
// PAGE 21: 5. IMPLEMENTATION (5.17)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.17 JSON Request Parsing & Relay Server API</h3>
  <p>The optional backend server provides persistence mirroring for environments without direct Firebase access.</p>
  <pre class="code-box">// server/index.js
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, '..', 'database', 'decision_duel_db.json');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/db') {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(data);
    return;
  }

  if (req.method === 'POST' && req.url.startsWith('/api/rooms/')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const snap = JSON.parse(body);
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      db.rooms[snap.room.room_code] = snap;
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  }
});
server.listen(PORT);</pre>
  <p><strong>Explanation:</strong> The HTTP server supports CORS preflight requests and safely writes tournament snapshots to disk, allowing grading and demonstration offline without third-party cloud requirements.</p>
  <div class="page-number">21</div>
</div>
`);

// ==========================================
// PAGE 22: 5. IMPLEMENTATION (5.18 - 5.19)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.18 Session Player Management</h3>
  <p>Participant identities in a room are maintained in browser session storage for seamless reconnects.</p>
  <pre class="code-box">export function getLocalPlayer(roomCode) {
  if (typeof window === 'undefined' || !roomCode) return null;
  const raw = sessionStorage.getItem('dd_session_player_v2_' + roomCode.toUpperCase());
  if (raw) {
    try { return JSON.parse(raw); } catch {}
  }
  return null;
}

export function setLocalPlayer(roomCode, player) {
  if (typeof window === 'undefined' || !roomCode) return;
  sessionStorage.setItem('dd_session_player_v2_' + roomCode.toUpperCase(), JSON.stringify(player));
}</pre>
  <p><strong>Explanation:</strong> Session keys prevent identity spoofing across browser tabs while enabling smooth state recovery upon page refresh.</p>

  <h3 class="sub-title">5.19 Safe Visual Avatar Protection (UserAvatar)</h3>
  <p>To prevent long Google OAuth photo URLs from overflowing across cards, <code>UserAvatar</code> isolates image bounds.</p>
  <pre class="code-box">// src/components/UserAvatar.jsx
export default function UserAvatar({ avatar, name = 'User', size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);
  const isUrl = avatar && (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:'));

  if (isUrl && !imgError) {
    return (
      &lt;div className={\`\${dimClass} rounded-full overflow-hidden shrink-0 bg-slate-800 border border-white/20\`} &gt;
        &lt;img src={avatar} alt={name} className="w-full h-full object-cover" onError={() =&gt; setImgError(true)} /&gt;
      &lt;/div&gt;
    );
  }
  return (
    &lt;div className={\`\${dimClass} rounded-full overflow-hidden shrink-0 bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center font-black text-white\`}&gt;
      {avatar || name.charAt(0).toUpperCase()}
    &lt;/div&gt;
  );
}</pre>
  <p><strong>Explanation:</strong> Using <code>overflow-hidden</code> and an <code>onError</code> fallback prevents broken external image URLs from corrupting page geometry or spilling raw URL strings across the screen.</p>
  <div class="page-number">22</div>
</div>
`);

// ==========================================
// PAGE 23: 5. IMPLEMENTATION (5.20)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.20 Fisher-Yates Deterministic Bracket Shuffling</h3>
  <p>To eliminate unfair seeding bias, tournament matchups can be shuffled deterministically before Round 1 begins.</p>
  <pre class="code-box">// src/services/bracketEngine.js
export function shuffleArray(array, randomFn = Math.random) {
  const arr = [...array];
  for (let i = arr.length - 1; i &gt; 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createPseudoRandom(seed) {
  let s = Number(seed) || 123456789;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}</pre>
  <p><strong>Explanation:</strong> The Fisher-Yates algorithm runs in <em>O(n)</em> linear time, producing an unbiased permutation of candidate options. Passing a pseudo-random seed generator ensures that identical seeds reproduce identical brackets across testing harnesses.</p>
  <div class="page-number">23</div>
</div>
`);

// ==========================================
// PAGE 24: 5. IMPLEMENTATION (5.21)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.21 BYE Allocation for Non-Power-of-Two Options</h3>
  <p>When the candidate option count <em>n</em> is not an exact power of two, preliminary byes are calculated.</p>
  <pre class="code-box">// src/services/bracketEngine.js
export function calculateByesAndPrelims(n) {
  if (n &lt;= 1) return { rounds: 1, byes: 0, prelims: 0 };
  const S = Math.pow(2, Math.ceil(Math.log2(n))); // Nearest power of 2
  const byes = S - n;
  const prelims = n - (S / 2);
  const rounds = Math.ceil(Math.log2(n));

  return { S, byes, prelims, rounds };
}</pre>
  <p><strong>Mathematical Example:</strong> Consider 5 candidate dinner spots (<em>n = 5</em>):</p>
  <ul class="bullet-list">
    <li>Nearest higher power of two: <em>S = 2^⌈log₂ 5⌉ = 2³ = 8</em></li>
    <li>Byes allocated: <em>B = 8 − 5 = 3</em> byes</li>
    <li>Preliminary matches: <em>P = 5 − 4 = 1</em> duel</li>
    <li>Total rounds: <em>R = ⌈log₂ 5⌉ = 3</em> rounds</li>
    <li>Total played duels: <em>n − 1 = 5 − 1 = 4</em> played matches total</li>
  </ul>
  <p><strong>Explanation:</strong> Three top options receive automatic byes into Round 2, while the remaining two battle in one preliminary duel. This balances the tournament tree and prevents phantom matches.</p>
  <div class="page-number">24</div>
</div>
`);

// ==========================================
// PAGE 25: 5. IMPLEMENTATION (5.22)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.22 Interactive Mini-Game Decision Execution Engine</h3>
  <p>Rather than manual voting buttons, participants compete in live arcade mini-games to score points for their side.</p>
  <pre class="code-box">// src/components/InteractiveDuelGames.jsx
export default function InteractiveDuelGames({ duelId, optA, optB, chosenSide, onAwardPoints, onFinishDuel }) {
  const [activeGame, setActiveGame] = useState(() => getRandomMiniGame());
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(null);

  const handleScoreEvent = (points) => {
    if (chosenSide === 'A') {
      const nextA = scoreA + points;
      setScoreA(nextA);
      onAwardPoints('A', points);
      if (nextA &gt;= 100) triggerDuelVictory(optA.option_id);
    } else {
      const nextB = scoreB + points;
      setScoreB(nextB);
      onAwardPoints('B', points);
      if (nextB &gt;= 100) triggerDuelVictory(optB.option_id);
    }
  };

  const triggerDuelVictory = (winnerId) => {
    setAutoAdvanceTimer(5);
    // 5-second countdown advances the tournament automatically...
  };
}</pre>
  <p><strong>Explanation:</strong> The arcade engine awards points dynamically. The first contender reaching the victory threshold claims the match, triggering an automated 5-second progression into the next tournament round.</p>
  <div class="page-number">25</div>
</div>
`);

// ==========================================
// PAGE 26: 5. IMPLEMENTATION (5.23)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.23 Host Stall Prevention & 10-Second Force Advance</h3>
  <p>If participants go AFK during a duel match, the host can trigger a 10-second force advance countdown.</p>
  <pre class="code-box">// src/pages/DuelPage.jsx
const [hostForceTimer, setHostForceTimer] = useState(null);
const isHost = Boolean(localPlayer?.is_host);

const handleTriggerHostForceAdvance = () => {
  if (!isHost) return;
  setHostForceTimer(10);
};

useEffect(() => {
  if (hostForceTimer === null) return;
  if (hostForceTimer &lt;= 0) {
    handleFinishDuelViaMiniGame('Host Stall Override');
    setHostForceTimer(null);
    return;
  }
  const interval = setInterval(() => {
    setHostForceTimer((prev) => (prev &lt;= 1 ? 0 : prev - 1));
  }, 1000);
  return () => clearInterval(interval);
}, [hostForceTimer]);</pre>
  <p><strong>Explanation:</strong> To prevent trolling or player abandonment from locking the room, the host can initiate a visible 10-second countdown. If players do not resume play, the system automatically resolves the match to the leading side or higher seed.</p>
  <div class="page-number">26</div>
</div>
`);

// ==========================================
// PAGE 27: 5. IMPLEMENTATION (5.24)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.24 Sudden-Death Tiebreaker Arena & Trivia Showdown</h3>
  <p>When contenders tie in points, the system shifts into the sudden-death tiebreaker arena for instant resolution.</p>
  <pre class="code-box">// src/pages/TiebreakPage.jsx
export async function completeTiebreakAndAdvance(roomCode, winnerOptionId, gameName) {
  const snapshot = getRoomSnapshot(roomCode);
  if (!snapshot || !snapshot.tiebreak_state) throw new Error('No active tiebreak');

  const duelId = snapshot.tiebreak_state.duel_id;
  const winnerOpt = snapshot.options.find(o =&gt; o.option_id === winnerOptionId);

  return advanceDuelWinner(
    roomCode,
    duelId,
    winnerOptionId,
    true,
    gameName || 'Sudden Death Showdown',
    \`Tiebreak Victor: \${winnerOpt?.label || 'Winner'}\`
  );
}</pre>
  <p><strong>Explanation:</strong> Pop Culture Trivia and Reaction Sprints guarantee an unambiguous winner. Once answered correctly, <code>advanceDuelWinner</code> records the tiebreak victory and updates the tournament bracket tree.</p>
  <div class="page-number">27</div>
</div>
`);

// ==========================================
// PAGE 28: 5. IMPLEMENTATION (5.25)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.25 Real-Time Multi-Client Synchronization</h3>
  <p>The synchronization layer coordinates state across Firebase Realtime Database and browser BroadcastChannels.</p>
  <pre class="code-box">// src/services/realtimeStore.js
function notifyLocalListeners(roomCode, snapshot) {
  const code = roomCode.toUpperCase();
  memoryRooms.set(code, snapshot);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('dd_room_v2_' + code, JSON.stringify(toFirebaseTree(snapshot)));
    } catch {}
  }

  const setForRoom = activeListeners.get(code);
  if (setForRoom) {
    setForRoom.forEach((cb) => {
      try { cb(snapshot); } catch (err) { console.error(err); }
    });
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'ROOM_UPDATE', roomCode: code, data: snapshot });
    } catch {}
  }
}</pre>
  <p><strong>Explanation:</strong> When Firebase is offline or during local multi-tab testing, BroadcastChannel broadcasts room updates across tabs on the same machine without polling, delivering sub-10ms UI synchronization.</p>
  <div class="page-number">28</div>
</div>
`);

// ==========================================
// PAGE 29: 5. IMPLEMENTATION (5.26)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.26 LocalStorage Snapshot Cache & Fallback Recovery</h3>
  <p>Tournament state is persisted in local storage so that accidental page reloads preserve active matches.</p>
  <pre class="code-box">export function getRoomSnapshot(roomCode) {
  if (!roomCode) return null;
  const code = roomCode.toUpperCase();

  if (memoryRooms.has(code)) return memoryRooms.get(code);

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('dd_room_v2_' + code);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const norm = normalizeSnapshot(parsed);
        memoryRooms.set(code, norm);
        return norm;
      } catch { return null; }
    }
  }
  return null;
}</pre>
  <p><strong>Explanation:</strong> Reading from memory cache first provides instant rendering. If memory is empty upon browser restart, the system falls back to LocalStorage before querying the remote cloud database.</p>
  <div class="page-number">29</div>
</div>
`);

// ==========================================
// PAGE 30: 5. IMPLEMENTATION (5.27)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.27 Safe HTML Rendering & Option Emoji Filters</h3>
  <p>Preset candidate choices provide structured metadata including emoji icons, price tags, and duration tags.</p>
  <pre class="code-box">// src/services/presets.js
export const DECISION_PRESETS = [
  {
    id: 'friends_eat',
    group: 'Friends',
    title: 'Where should we eat tonight?',
    icon: '🍕',
    options: [
      { label: 'Woodfire Neapolitan Pizza', emoji: '🍕', price_tag: '$$', is_veg: true },
      { label: 'Spicy Korean Fried Chicken', emoji: '🍗', price_tag: '$$', is_veg: false },
      { label: 'Authentic Masala Dosa', emoji: '🥞', price_tag: '$', is_veg: true },
      { label: 'Street Style Tacos', emoji: '🌮', price_tag: '$', is_veg: true },
      { label: 'Ramen & Gyoza Noodle Bar', emoji: '🍜', price_tag: '$$', is_veg: false },
      { label: 'Royal Hyderabadi Biryani', emoji: '🍲', price_tag: '$$', is_veg: false },
      { label: 'Gourmet Smash Burgers', emoji: '🍔', price_tag: '$$', is_veg: true },
      { label: 'Mediterranean Falafel', emoji: '🥙', price_tag: '$$', is_veg: true }
    ]
  }
];</pre>
  <p><strong>Explanation:</strong> Pre-curated options allow groups to initiate decision tournaments with 1 click without manually typing 8 distinct venue names.</p>
  <div class="page-number">30</div>
</div>
`);

// ==========================================
// PAGE 31: 5. IMPLEMENTATION (5.28)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.28 Champion Crowning & Confetti Physics</h3>
  <p>When the final duel concludes, the winning option is declared champion and celebrated with physics-based particle confetti.</p>
  <pre class="code-box">// src/pages/ResultPage.jsx
import confetti from 'canvas-confetti';

useEffect(() =&gt; {
  const duration = 3.5 * 1000;
  const end = Date.now() + duration;

  const frame = () =&gt; {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 }
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 }
    });
    if (Date.now() &lt; end) requestAnimationFrame(frame);
  };
  frame();
}, []);</pre>
  <p><strong>Explanation:</strong> Canvas Confetti fires twin particle cannons from left and right screen bounds, delivering immediate psychological reward and celebratory visual feedback upon tournament conclusion.</p>
  <div class="page-number">31</div>
</div>
`);

// ==========================================
// PAGE 32: 5. IMPLEMENTATION (5.29)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.29 Host Tournament Replay Reset</h3>
  <p>Once a champion is crowned, only the host has authority to reset the room back to lobby for rematches.</p>
  <pre class="code-box">// src/services/realtimeStore.js
export async function resetRoomToLobby(roomCode, hostPlayerId) {
  const snapshot = getRoomSnapshot(roomCode);
  if (!snapshot) throw new Error('Room not found');

  if (hostPlayerId) {
    const hostPlayer = snapshot.players.find((p) => p.player_id === hostPlayerId);
    if (!hostPlayer || !hostPlayer.is_host) {
      throw new Error('Only the room host can reset the tournament back to the lobby.');
    }
  }

  snapshot.room.status = 'lobby';
  snapshot.room.current_round = 1;
  snapshot.room.current_duel_id = null;
  snapshot.room.champion_option_id = null;
  snapshot.duels = [];
  snapshot.votes = [];
  snapshot.tiebreak = null;

  return persistRoomSnapshot(roomCode, snapshot);
}</pre>
  <p><strong>Explanation:</strong> Validating the host ID ensures guests cannot arbitrarily disrupt the victory screen. Resetting clears match records while preserving connected players and option lists.</p>
  <div class="page-number">32</div>
</div>
`);

// ==========================================
// PAGE 33: 5. IMPLEMENTATION (5.30)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">5.30 Production Deployment Commands</h3>
  <p>The application is built and deployed directly to Firebase Hosting via npm scripts.</p>
  <pre class="code-box"># 1. Install project dependencies
npm install

# 2. Execute automated unit test verification
npm test

# 3. Compile optimized production Vite bundle
npm run build

# 4. Deploy to Firebase Global CDN
npm run deploy

# Output from Firebase CLI:
# === Deploying to 'decision-duel-1f7a6'...
# i  hosting[decision-duel-1f7a6]: found 3 files in dist
# +  hosting[decision-duel-1f7a6]: release complete
# +  Deploy complete!
# Hosting URL: https://decision-duel-1f7a6.web.app</pre>
  <p><strong>Explanation:</strong> The deployment pipeline compiles JSX and Tailwind CSS into minified static assets in <code>dist/</code>, uploading them to Firebase's global edge network under HTTPS.</p>
  <div class="page-number">33</div>
</div>
`);

// ==========================================
// PAGE 34: 6. OUTPUT SCREENSHOTS (6.1 & 6.2)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h2 class="chapter-title">6. OUTPUT SCREENSHOTS / IMAGES</h2>
  <p class="screenshot-intro">The following screenshots were captured from the hosted application (<a href="https://decision-duel-1f7a6.web.app" target="_blank">https://decision-duel-1f7a6.web.app</a>).</p>
  
  <h3 class="sub-title">6.1 Home Page</h3>
  <div class="screenshot-box">
    <img src="${shot1}" class="report-screenshot-img" alt="Figure 6.1 Home Page" />
  </div>
  <p class="figure-caption">Figure 6.1: Decision Duel Home Page</p>
  
  <h3 class="sub-title">6.2 User Login & Account</h3>
  <div class="screenshot-box">
    <img src="${shot2}" class="report-screenshot-img" alt="Figure 6.2 Authentication Page" />
  </div>
  <p class="figure-caption">Figure 6.2: Account and Decision-Room History Page</p>
  <div class="page-number">34</div>
</div>
`);

// ==========================================
// PAGE 35: 6. OUTPUT SCREENSHOTS (6.3 & 6.4)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">6.3 Multiplayer Lobby</h3>
  <div class="screenshot-box">
    <img src="${shot3}" class="report-screenshot-img" alt="Figure 6.3 Lobby Page" />
  </div>
  <p class="figure-caption">Figure 6.3: Interactive Matchmaking Lobby with Veto Controls</p>
  
  <h3 class="sub-title">6.4 Duel Arena</h3>
  <div class="screenshot-box">
    <img src="${shot4}" class="report-screenshot-img" alt="Figure 6.4 Duel Arena" />
  </div>
  <p class="figure-caption">Figure 6.4: Duel Arena with Mini-Game Voting and Stall Prevention</p>
  <div class="page-number">35</div>
</div>
`);

// ==========================================
// PAGE 36: 6. OUTPUT SCREENSHOTS (6.5 & 6.6)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">6.5 Sudden-Death Tie-Breaker</h3>
  <div class="screenshot-box">
    <img src="${shot5}" class="report-screenshot-img" alt="Figure 6.5 Tiebreak Page" />
  </div>
  <p class="figure-caption">Figure 6.5: Sudden-Death Tiebreaker Arena with Trivia Showdown</p>
  
  <h3 class="sub-title">6.6 Champion & Match History</h3>
  <div class="screenshot-box">
    <img src="${shot6}" class="report-screenshot-img" alt="Figure 6.6 Result Page" />
  </div>
  <p class="figure-caption">Figure 6.6: Champion Crowned with Confetti and Vote Breakdown</p>
  <div class="page-number">36</div>
</div>
`);

// ==========================================
// PAGE 37: 7. FUTURE ENHANCEMENT
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h2 class="chapter-title">7. FUTURE ENHANCEMENT</h2>
  
  <h3 class="sub-title">7.1 Introduction</h3>
  <p>Decision Duel currently provides real-time bracket generation, collaborative mini-game resolution, host moderation controls, and Firebase synchronization. Additional functionality can be introduced in future versions to make the application more useful, personalized, and scalable.</p>
  
  <h3 class="sub-title">7.2 Mobile Application</h3>
  <p>A dedicated Android and iOS application can be developed using React Native or Flutter, allowing native push notifications, haptic vibrations, and faster smartphone interactions.</p>
  
  <h3 class="sub-title">7.3 Notifications</h3>
  <p>Future versions could notify group members via SMS, WhatsApp API, or mobile push alerts when a friend launches a duel room.</p>
  
  <h3 class="sub-title">7.4 Geolocation Matching</h3>
  <p>The system could integrate location APIs (Google Maps / Places) to suggest top-rated nearby restaurants and theaters automatically as decision contenders.</p>
  
  <h3 class="sub-title">7.5 Food Delivery & Ticketing Integration</h3>
  <p>Upon crowning a restaurant or movie champion, the platform could provide 1-click links to place orders via Swiggy/Zomato or book cinema tickets on BookMyShow.</p>
  
  <h3 class="sub-title">7.6 Advanced Mini-Game Library</h3>
  <p>Expanding the mini-game library to include multiplayer physics obstacle courses, music blind tests, and drawing battles.</p>
  
  <h3 class="sub-title">7.7 Advanced Security</h3>
  <p>Rate limiting, token rotation, strict Firebase database security rules, and encrypted session storage.</p>
  
  <h3 class="sub-title">7.8 Analytics and Group Insights</h3>
  <p>A personal dashboard showing historical win rates of specific food categories and participant voting agreement metrics over time.</p>
  
  <h3 class="sub-title">7.9 Multilingual Support</h3>
  <p>Supporting multiple regional languages (Hindi, Kannada, Tamil, Spanish) so diverse social circles can duel comfortably.</p>
  
  <h3 class="sub-title">7.10 Offline / PWA Support</h3>
  <p>A Progressive Web App (PWA) allowing local pass-and-play tournament duels without an active internet connection.</p>
  <div class="page-number">37</div>
</div>
`);

// ==========================================
// PAGE 38: 8. CONCLUSION (8.1 - 8.2)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h2 class="chapter-title">8. CONCLUSION</h2>
  
  <h3 class="sub-title">8.1 Conclusion</h3>
  <p>Decision Duel was developed as a Gamified Real-Time Group Decision Engine using modern Web Technologies.</p>
  <p>The project demonstrates the practical implementation of a full-stack reactive application using HTML, CSS, JavaScript, React 18, Vite 5, Tailwind CSS, Firebase Realtime Database, and Firebase Hosting.</p>
  <p>The application provides multiple coordination tools through a single platform. These include user authentication, room creation, multiplayer lobbies, veto strike toggles, bracket tree computation, arcade mini-game deciders, stall moderation, and celebratory victory podiums.</p>
  <p>The project demonstrates how modern Web Technologies can be integrated to resolve real-world social indecision cleanly and entertainingly.</p>
  
  <h3 class="sub-title">8.2 Project Outcome</h3>
  <p>The major outcomes of the project are:</p>
  <ol class="num-list">
    <li>A full-stack reactive decision tournament web application was developed.</li>
    <li>User registration and login with Google OAuth and email credentials were implemented.</li>
    <li>Visual avatar safety was achieved using dedicated overflow-bounded containers.</li>
    <li>Multiplayer lobbies with real-time player readiness and PIN sharing were built.</li>
    <li>Option management with 1-strike veto toggles was provided.</li>
    <li>Deterministic single-elimination tournament bracket computation with BYE rounds was implemented.</li>
    <li>Interactive mini-game voting was created, eliminating manual survey forms.</li>
    <li>Host stall prevention was implemented with a 10-second force advance countdown.</li>
    <li>Sudden-death tiebreaker arena with live trivia challenges was established.</li>
    <li>The application was deployed publicly on Firebase Hosting.</li>
    <li>All 17 automated unit test suites passed green.</li>
  </ol>
  <div class="page-number">38</div>
</div>
`);

// ==========================================
// PAGE 39: 8. CONCLUSION (8.3 - 8.4)
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h3 class="sub-title">8.3 Learning Outcome</h3>
  <p>The development of Decision Duel provided practical knowledge of the complete web application development lifecycle.</p>
  <p>The project demonstrated how front-end applications communicate with cloud databases in real time, how reactive component hierarchies manage state, and how mathematical algorithms can be embedded into user-facing web tools.</p>
  <p>It also provided hands-on experience in component design, responsive styling with Tailwind CSS, error handling, automated testing, version control with Git, and public cloud deployment on Firebase Hosting.</p>
  
  <h3 class="sub-title">8.4 Final Conclusion</h3>
  <p>In conclusion, Decision Duel provides an integrated platform for turning group indecision into engaging multiplayer tournaments, resolving conflicts collaboratively, and crowning decisions conclusively.</p>
  <p>The project successfully combines Web Technology concepts to create a practical, entertaining social application for academic demonstration.</p>
  <p>With future enhancements such as mobile applications, location matching, food ordering integration, and expanded mini-games, Decision Duel can be developed into a comprehensive social decision-making platform.</p>
  <div class="page-number">39</div>
</div>
`);

// ==========================================
// PAGE 40: 9. REFERENCE BOOKS / URLS
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h2 class="chapter-title">9. REFERENCE BOOKS / URLs</h2>
  
  <h3 class="sub-title">9.1 Reference Books</h3>
  <ol class="num-list">
    <li>Jon Duckett, <em>HTML and CSS: Design and Build Websites</em>, Wiley.</li>
    <li>Jon Duckett, <em>JavaScript and JQuery: Interactive Front-End Web Development</em>, Wiley.</li>
    <li>Alex Banks & Eve Porcello, <em>Learning React: Modern Patterns for Developing React Apps</em>, O’Reilly.</li>
    <li>Robin Nixon, <em>Learning PHP, MySQL & JavaScript with jQuery, CSS & HTML5</em>, O’Reilly.</li>
  </ol>
  
  <h3 class="sub-title">9.2 Online References</h3>
  <ol class="num-list">
    <li>React Documentation – <a href="https://react.dev/" target="_blank">https://react.dev/</a></li>
    <li>Vite Build Tool Documentation – <a href="https://vite.dev/guide/" target="_blank">https://vite.dev/guide/</a></li>
    <li>Tailwind CSS Documentation – <a href="https://tailwindcss.com/docs" target="_blank">https://tailwindcss.com/docs</a></li>
    <li>MDN Web Docs – JavaScript – <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">https://developer.mozilla.org/en-US/docs/Web/JavaScript</a></li>
    <li>MDN Web Docs – HTML5 – <a href="https://developer.mozilla.org/en-US/docs/Web/HTML" target="_blank">https://developer.mozilla.org/en-US/docs/Web/HTML</a></li>
    <li>MDN Web Docs – CSS3 – <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="_blank">https://developer.mozilla.org/en-US/docs/Web/CSS</a></li>
    <li>Firebase Realtime Database – <a href="https://firebase.google.com/docs/database" target="_blank">https://firebase.google.com/docs/database</a></li>
    <li>Firebase Authentication – <a href="https://firebase.google.com/docs/auth" target="_blank">https://firebase.google.com/docs/auth</a></li>
    <li>Firebase Hosting Documentation – <a href="https://firebase.google.com/docs/hosting" target="_blank">https://firebase.google.com/docs/hosting</a></li>
    <li>Canvas Confetti by Kiril Vatev – <a href="https://github.com/catdad/canvas-confetti" target="_blank">https://github.com/catdad/canvas-confetti</a></li>
    <li>Node.js Test Runner Documentation – <a href="https://nodejs.org/api/test.html" target="_blank">https://nodejs.org/api/test.html</a></li>
    <li>Decision Duel Live Deployed Site – <a href="https://decision-duel-1f7a6.web.app/" target="_blank">https://decision-duel-1f7a6.web.app/</a></li>
  </ol>
  <div class="page-number">40</div>
</div>
`);

// ==========================================
// PAGE 41: 10. GITHUB LINK / HOSTED LINK
// ==========================================
pages.push(`
<div class="page standard-page">
  <div class="page-inner-border"></div>
  <h2 class="chapter-title">10. GITHUB LINK / HOSTED LINK</h2>
  
  <h3 class="sub-title">10.1 GitHub Repository:</h3>
  <p><a href="https://github.com/shauryavenkta/decision-duel" target="_blank">https://github.com/shauryavenkta/decision-duel</a></p>
  
  <h3 class="sub-title">10.2 Hosted Project:</h3>
  <p><a href="https://decision-duel-1f7a6.web.app/" target="_blank">https://decision-duel-1f7a6.web.app/</a></p>
  
  <div style="margin-top: 30px;">
    <p>The GitHub repository contains the full source code for the React frontend, bracket engine, real-time store, mini-game execution components, and automated test suites. The hosted link provides the live, globally accessible public demonstration of Decision Duel deployed on Firebase Hosting.</p>
  </div>
  <div class="page-number">41</div>
</div>
`);

// Complete HTML Document
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Decision Duel — Capstone Project Report | Alliance University</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #525659;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.45;
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }

    .report-container {
      width: 210mm;
      margin: 20px auto;
    }

    .page {
      width: 210mm;
      height: 297mm;
      background: #ffffff;
      margin-bottom: 20px;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }

    @media print {
      body {
        background: transparent !important;
      }
      .report-container {
        margin: 0 !important;
        width: 100% !important;
      }
      .page {
        margin: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
      }
    }

    /* Outer border on every page matching reference */
    .page-inner-border {
      position: absolute;
      top: 12mm;
      left: 12mm;
      right: 12mm;
      bottom: 12mm;
      border: 1px solid #1a1a1a;
      pointer-events: none;
      z-index: 10;
    }

    .standard-page {
      padding: 18mm 18mm 18mm 18mm;
    }

    /* Page number centered at bottom */
    .page-number {
      position: absolute;
      bottom: 14mm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9.5pt;
      font-family: Arial, sans-serif;
      color: #111;
      font-weight: 500;
      z-index: 20;
    }

    /* COVER PAGE (PAGE 1) */
    .cover-page {
      padding: 0;
      position: relative;
    }

    .cover-bg-img {
      width: 100%;
      height: 100%;
      object-fit: fill;
      display: block;
    }

    /* PAGE 2 STYLES */
    .p2-page {
      font-family: 'Times New Roman', Times, serif !important;
      color: #111;
      padding: 22mm 22mm 18mm 22mm;
      display: flex;
      flex-direction: column;
    }

    .p2-page .header-logo-container {
      text-align: center;
      margin-top: 4mm;
      margin-bottom: 24mm;
    }

    .p2-page .alliance-header-img {
      max-width: 440px;
      height: auto;
    }

    .p2-page .title-block {
      text-align: center;
      margin-bottom: 26mm;
    }

    .p2-page .report-subtitle {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 15pt;
      font-weight: bold;
      margin-bottom: 8px;
      color: #111;
    }

    .p2-page .degree-title {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 13.5pt;
      font-weight: normal;
      margin-bottom: 6px;
    }

    .p2-page .sem-title {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 11pt;
      margin-bottom: 6px;
    }

    .p2-page .course-title {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 11pt;
      margin-bottom: 14px;
    }

    .p2-page .project-main-title {
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 12.5pt;
      font-weight: bold;
      letter-spacing: 0.02em;
    }

    .p2-page .two-column-submission {
      display: flex;
      justify-content: space-between;
      margin-left: 6mm;
      margin-right: 6mm;
      margin-bottom: 30mm;
      font-size: 10pt;
      line-height: 1.5;
      font-family: 'Times New Roman', Times, serif !important;
    }

    .p2-page .col-left {
      width: 48%;
    }

    .p2-page .col-right {
      width: 45%;
    }

    .p2-page .label-regular {
      margin-bottom: 4px;
    }

    .p2-page .student-name {
      font-weight: normal;
      margin-bottom: 2px;
    }

    .p2-page .faculty-name {
      margin-bottom: 6px;
    }

    .p2-page .sign-line {
      margin-bottom: 4px;
    }

    .p2-page .sign-gap {
      margin-top: 18px;
    }

    .p2-page .dept-footer {
      text-align: center;
      font-family: 'Times New Roman', Times, serif !important;
      font-size: 10pt;
      line-height: 1.4;
      margin-top: auto;
      margin-bottom: 6mm;
    }

    .p2-page .dept-name {
      font-size: 10.5pt;
    }

    .p2-page .uni-bold {
      font-size: 10.5pt;
      margin-top: 2px;
    }

    .p2-page .uni-addr {
      font-size: 9.5pt;
      margin-top: 3px;
    }

    .p2-page .uni-date {
      font-size: 9.5pt;
      margin-top: 4px;
    }
      margin-top: auto;
    }

    .dept-name {
      font-size: 10.5pt;
    }

    .uni-bold {
      font-size: 10.5pt;
    }

    .uni-addr {
      font-size: 9.5pt;
      margin-top: 3px;
    }

    .uni-date {
      font-size: 9.5pt;
      margin-top: 6px;
      font-weight: bold;
    }

    /* ACKNOWLEDGEMENT */
    .section-center-title {
      text-align: center;
      margin-top: 12mm;
      margin-bottom: 15mm;
    }

    .ack-title, .toc-title {
      font-size: 12pt;
      font-weight: bold;
      color: #1e3a8a;
      letter-spacing: 0.05em;
    }

    .page-body-text p {
      margin-bottom: 14pt;
      text-align: justify;
      line-height: 1.5;
    }

    .student-sign-block {
      margin-top: 35mm;
      margin-left: 2mm;
    }

    /* CHAPTER HEADINGS */
    .chapter-title {
      font-size: 12pt;
      font-weight: bold;
      color: #111;
      margin-top: 4mm;
      margin-bottom: 12pt;
    }

    .sub-title {
      font-size: 10pt;
      font-weight: bold;
      color: #2563eb;
      margin-top: 10pt;
      margin-bottom: 6pt;
    }

    .sub-sub-title {
      font-size: 9.5pt;
      font-weight: bold;
      color: #2563eb;
      margin-top: 8pt;
      margin-bottom: 4pt;
    }

    p {
      margin-bottom: 8pt;
      text-align: justify;
    }

    .bullet-list {
      margin-left: 22px;
      margin-bottom: 10pt;
    }

    .bullet-list li {
      margin-bottom: 4pt;
    }

    .num-list {
      margin-left: 22px;
      margin-bottom: 10pt;
    }

    .num-list li {
      margin-bottom: 4pt;
    }

    /* CODE BOXES */
    .code-box {
      background: #f7f8fa;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 8px 12px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 8.5pt;
      line-height: 1.35;
      color: #1e293b;
      margin: 8pt 0;
      overflow: hidden;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* TABLES */
    .toc-table, .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-top: 10pt;
    }

    .toc-table th, .report-table th {
      border: 1px solid #1a1a1a;
      padding: 8pt 10pt;
      background: #ffffff;
      font-weight: bold;
      text-align: left;
    }

    .toc-table td, .report-table td {
      border: 1px solid #1a1a1a;
      padding: 7pt 10pt;
      background: #ffffff;
    }

    /* SCREENSHOTS (EXACTLY 2 PER PAGE) */
    .screenshot-intro {
      font-size: 9.5pt;
      margin-bottom: 12pt;
    }

    .screenshot-box {
      text-align: center;
      margin: 6pt 0 4pt 0;
    }

    .report-screenshot-img {
      max-width: 100%;
      height: 82mm;
      object-fit: contain;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .figure-caption {
      text-align: center;
      font-weight: bold;
      font-size: 9pt;
      color: #111;
      margin-top: 4pt;
      margin-bottom: 12pt;
    }

    a {
      color: #2563eb;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="report-container">
    ${pages.join('\n')}
  </div>
</body>
</html>`;

fs.writeFileSync(htmlOutPath, fullHtml, 'utf8');
console.log('41-page exact HTML written to:', htmlOutPath);

// Generate PDF via Chrome headless
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const args = [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  `--print-to-pdf=${pdfOutPath}`,
  htmlOutPath
];

console.log('Generating exact 41-page PDF with Chrome...');
const child = spawn(chromePath, args);

child.on('close', (code) => {
  if (code === 0 && fs.existsSync(pdfOutPath)) {
    console.log('Exact 41-page PDF generated successfully at:', pdfOutPath);
    console.log('PDF size:', fs.statSync(pdfOutPath).size, 'bytes');
  } else {
    console.error('Failed to generate PDF. Exit code:', code);
  }
});
