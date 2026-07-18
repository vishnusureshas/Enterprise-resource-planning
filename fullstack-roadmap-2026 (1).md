# 📘 Full Stack Development Roadmap (2026 Edition)

A single-reference guide covering the complete full-stack journey — from fundamentals to production deployment. Each topic includes a definition, workflow, real-world use case, and a study example.

---

## Table of Contents
1. [Software Engineering Fundamentals](#part-1--software-engineering-fundamentals)
2. [Frontend Development](#part-2--frontend-development)
3. [Backend Development](#part-3--backend-development)
4. [Database Engineering](#part-4--database-engineering)
5. [Mobile Development](#part-5--mobile-development)
6. [DevOps](#part-6--devops)
7. [Security](#part-7--security)
8. [Testing](#part-8--testing)
9. [Deployment](#part-9--deployment)
10. [System Design](#part-10--system-design)
11. [AI Integration](#part-11--ai-integration)
12. [Real Production Project](#part-12--real-production-project)
13. [Bonus](#bonus)

---

## Part 1 — Software Engineering Fundamentals

### SDLC (Software Development Life Cycle)
**Definition:** The structured process a team follows to plan, build, test, and maintain software — typically phases like requirements, design, implementation, testing, deployment, and maintenance.
**Workflow:** Gather requirements → design architecture → code → test → deploy → monitor and iterate.
**Use case:** A team building an e-commerce platform uses SDLC to move from a client's requirements doc to a live, maintained product without skipping critical stages like QA.
**Example:**
```
Requirements: "Users need to reset passwords"
  → Design: forgot-password flow + email service
  → Implement: /auth/forgot-password endpoint
  → Test: unit + manual QA
  → Deploy: ship behind feature flag
  → Monitor: track reset email delivery rate
```

### Agile & Scrum
**Definition:** Agile is an iterative philosophy for building software in small increments with continuous feedback; Scrum is the most common framework implementing it, using sprints, standups, and retrospectives.
**Workflow:** Backlog grooming → sprint planning → daily standup → sprint execution → sprint review → retrospective.
**Use case:** A startup ships a new feature every two weeks by running two-week sprints, adjusting priorities based on user feedback after each cycle.
**Example:**
```
Sprint 12 (2 weeks):
- Mon: Sprint planning - pick 8 story points
- Daily: 15-min standup (yesterday/today/blockers)
- Fri (wk2): Sprint review demo + retro
```

### Git Workflow
**Definition:** A structured way of using Git branches to manage collaborative development — commonly Git Flow, trunk-based development, or GitHub Flow.
**Workflow:** Create feature branch → commit changes → open pull request → code review → merge to main → deploy.
**Use case:** A team of five developers avoids stepping on each other's code by working in isolated feature branches and merging via reviewed PRs.
**Example:**
```bash
git checkout -b feature/user-auth
git add .
git commit -m "feat: add JWT login endpoint"
git push origin feature/user-auth
# open PR on GitHub, get review, then merge
```

### Software Architecture
**Definition:** The high-level structure of a system — how components are organized and interact (e.g., layered, microservices, event-driven).
**Workflow:** Define requirements → choose architecture style → design component boundaries → document data flow → implement.
**Use case:** A fintech app chooses a layered architecture (controller → service → repository) to keep business logic separate from database access.
**Example:**
```
/routes/user.routes.js     → defines endpoints
/controllers/user.controller.js → handles req/res
/services/user.service.js  → business logic
/repositories/user.repo.js → talks to the DB
```

### Design Principles (SOLID, DRY, KISS)
**Definition:** SOLID is five object-oriented design principles for maintainable code; DRY means "Don't Repeat Yourself"; KISS means "Keep It Simple, Stupid."
**Workflow:** Write code → review for repeated logic or overly complex functions → refactor into reusable, single-responsibility units.
**Use case:** A developer extracts duplicated validation logic scattered across three controllers into one reusable validator function, applying DRY.
**Example:**
```js
// Before (repeated in 3 files):
if (!email.includes('@')) throw new Error('Invalid email');

// After (DRY):
function validateEmail(email) {
  if (!email.includes('@')) throw new Error('Invalid email');
}
```


---

## Part 2 — Frontend Development

### HTML5
**Definition:** The markup language that structures content on the web, with semantic tags (`<header>`, `<article>`, `<section>`) added in the HTML5 spec.
**Workflow:** Structure page with semantic tags → link CSS/JS → validate accessibility of markup.
**Use case:** Using `<nav>` and `<main>` instead of generic `<div>`s improves both SEO and screen-reader navigation on a blog site.
**Example:**
```html
<header><nav>...</nav></header>
<main>
  <article><h1>Post Title</h1><p>Content</p></article>
</main>
```

### CSS3
**Definition:** The styling language for the web, including modern features like Flexbox, Grid, animations, and custom properties (variables).
**Workflow:** Write styles → use Flexbox/Grid for layout → add responsive breakpoints → optimize for performance.
**Use case:** A dashboard uses CSS Grid to arrange widgets that reflow automatically on smaller screens.
**Example:**
```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
```

### JavaScript (ES6+)
**Definition:** The core scripting language of the web, with ES6+ adding arrow functions, destructuring, promises, async/await, and modules.
**Workflow:** Write logic using modern syntax → handle async operations with async/await → modularize with import/export.
**Use case:** Fetching user data from an API using `async/await` instead of nested callbacks makes error handling and readability far easier.
**Example:**
```js
async function getUser(id) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}
```

### TypeScript
**Definition:** A superset of JavaScript that adds static typing, catching type errors at compile time instead of runtime.
**Workflow:** Define types/interfaces → write typed functions and components → let the compiler catch mismatches before deployment.
**Use case:** A large React codebase uses TypeScript interfaces for API responses so a renamed backend field breaks the build immediately, not in production.
**Example:**
```ts
interface User {
  id: string;
  name: string;
  email: string;
}
function greet(user: User): string {
  return `Hello, ${user.name}`;
}
```

### Responsive Design
**Definition:** Building UIs that adapt to different screen sizes using flexible layouts, relative units, and media queries.
**Workflow:** Design mobile-first → add breakpoints for tablet/desktop → test across device sizes.
**Use case:** An e-commerce site's product grid shows 1 column on mobile, 2 on tablet, and 4 on desktop using the same codebase.
**Example:**
```css
.grid { grid-template-columns: 1fr; }
@media (min-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(4, 1fr); } }
```

### Tailwind CSS
**Definition:** A utility-first CSS framework where styling is done via composable classes directly in markup instead of separate stylesheets.
**Workflow:** Install and configure Tailwind → style components using utility classes → customize theme via config file.
**Use case:** A developer builds a fully responsive landing page in hours by combining utility classes like `flex`, `gap-4`, and `md:grid-cols-3`.
**Example:**
```html
<div class="flex flex-col md:flex-row gap-4 p-6 bg-white rounded-lg shadow">
  <h2 class="text-xl font-bold">Card Title</h2>
</div>
```

### React.js
**Definition:** A component-based JavaScript library for building user interfaces using a virtual DOM for efficient updates.
**Workflow:** Break UI into components → manage state/props → render conditionally → handle side effects with hooks.
**Use case:** A chat app renders a `MessageList` component that re-renders only the new message bubble instead of the whole list.
**Example:**
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Next.js
**Definition:** A React framework adding server-side rendering, static generation, file-based routing, and API routes.
**Workflow:** Create pages/routes as files → choose rendering strategy (SSR/SSG/ISR) → deploy to Vercel or similar.
**Use case:** A blog uses Next.js static generation so pages are pre-built at deploy time, loading instantly for SEO and speed.
**Example:**
```jsx
// app/blog/[slug]/page.js
export default async function Post({ params }) {
  const post = await getPost(params.slug);
  return <article>{post.title}</article>;
}
```

### State Management
**Definition:** Techniques and tools (Context API, Redux, Zustand) for sharing and updating application data across components.
**Workflow:** Identify shared state → choose a state management approach → connect components to the store.
**Use case:** A shopping cart's item count needs to update in the navbar from a product page, so global state avoids prop-drilling through five components.
**Example:**
```js
// Zustand store
const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
}));
```

### React Query
**Definition:** A data-fetching library that handles caching, background refetching, and synchronization of server state in React apps.
**Workflow:** Wrap app in QueryClientProvider → fetch data with `useQuery` → mutate data with `useMutation` → let caching handle re-fetch logic.
**Use case:** A dashboard automatically refreshes stale data every 30 seconds without manually managing loading/error states for each request.
**Example:**
```jsx
const { data, isLoading } = useQuery({
  queryKey: ['orders'],
  queryFn: () => fetch('/api/orders').then(r => r.json()),
  refetchInterval: 30000,
});
```

### Forms
**Definition:** Structured input handling — validation, submission, and error display — often managed with libraries like React Hook Form or Formik.
**Workflow:** Define form schema/validation → bind inputs → handle submit → display validation errors.
**Use case:** A signup form validates email format and password strength client-side before ever hitting the backend, giving instant feedback.
**Example:**
```jsx
const { register, handleSubmit, formState: { errors } } = useForm();
<input {...register("email", { required: true, pattern: /^\S+@\S+$/ })} />
{errors.email && <span>Invalid email</span>}
```

### Authentication (Frontend)
**Definition:** The client-side logic for logging users in, storing tokens, and protecting routes based on auth state.
**Workflow:** Send login credentials → receive and store token (cookie/localStorage) → attach token to requests → guard protected routes.
**Use case:** A React app redirects unauthenticated users away from `/dashboard` back to `/login` using a route guard checking token presence.
**Example:**
```jsx
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}
```

### Performance Optimization
**Definition:** Techniques to reduce load time and improve responsiveness — code splitting, lazy loading, memoization, image optimization.
**Workflow:** Measure with Lighthouse/DevTools → identify bottlenecks → apply lazy loading/memoization → re-measure.
**Use case:** A media-heavy site lazy-loads images below the fold, cutting initial page load time significantly.
**Example:**
```jsx
const Chart = lazy(() => import('./Chart'));
<Suspense fallback={<Spinner />}><Chart /></Suspense>
```

### SEO
**Definition:** Practices that help search engines index and rank a site — meta tags, semantic HTML, sitemap, structured data.
**Workflow:** Add meta title/description → use semantic HTML → generate sitemap → verify with Search Console.
**Use case:** A Next.js blog uses dynamic `<Head>` tags per article so each post has a unique, search-friendly title and description.
**Example:**
```jsx
export const metadata = {
  title: "10 React Tips",
  description: "Practical React tips for 2026",
};
```

### Accessibility
**Definition:** Designing interfaces usable by people with disabilities — proper ARIA labels, keyboard navigation, sufficient color contrast.
**Workflow:** Use semantic elements → add ARIA attributes where needed → test keyboard-only navigation → check contrast ratios.
**Use case:** A modal traps keyboard focus inside it and can be closed with the Escape key, meeting basic accessibility requirements.
**Example:**
```jsx
<button aria-label="Close modal" onClick={close}>
  <XIcon aria-hidden="true" />
</button>
```


---

## Part 3 — Backend Development

### Node.js
**Definition:** A JavaScript runtime built on Chrome's V8 engine that allows JavaScript to run server-side, using an event-driven, non-blocking I/O model.
**Workflow:** Write server logic in JS → handle async I/O with callbacks/promises → run via `node server.js`.
**Use case:** A real-time notification service uses Node.js's non-blocking I/O to handle thousands of concurrent connections efficiently.
**Example:**
```js
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200); res.end('Hello Node');
}).listen(3000);
```

### Express.js
**Definition:** A minimal, unopinionated web framework for Node.js used to build APIs and web servers with routing and middleware support.
**Workflow:** Set up app → define routes → add middleware (auth, parsing, error handling) → start server.
**Use case:** A REST API for a blog defines routes like `GET /posts` and `POST /posts`, each passing through an auth middleware first.
**Example:**
```js
const app = require('express')();
app.use(express.json());
app.get('/posts', (req, res) => res.json(posts));
app.listen(5000);
```

### REST API
**Definition:** An architectural style for APIs using HTTP methods (GET, POST, PUT, DELETE) and resource-based URLs.
**Workflow:** Design resource endpoints → implement CRUD handlers → return consistent JSON responses with proper status codes.
**Use case:** A mobile app fetches user profiles via `GET /api/users/:id` and updates them via `PUT /api/users/:id`.
**Example:**
```
GET    /api/users       -> list users
GET    /api/users/:id   -> get one user
POST   /api/users       -> create user
PUT    /api/users/:id   -> update user
DELETE /api/users/:id   -> delete user
```

### GraphQL
**Definition:** A query language for APIs letting clients request exactly the data they need in a single request, instead of multiple REST calls.
**Workflow:** Define schema/types → write resolvers → client sends queries specifying needed fields.
**Use case:** A mobile app fetches a user's name, avatar, and last 3 posts in one GraphQL query instead of three separate REST calls.
**Example:**
```graphql
query {
  user(id: "1") { name avatar posts(limit: 3) { title } }
}
```

### Authentication (Backend)
**Definition:** Verifying a user's identity server-side, typically via credentials, tokens, or third-party providers.
**Workflow:** Receive credentials → verify against stored hash → issue a session or token → validate token on subsequent requests.
**Use case:** A login endpoint compares a submitted password's hash against the stored hash before issuing a JWT.
**Example:**
```js
const valid = await bcrypt.compare(password, user.hashedPassword);
if (!valid) return res.status(401).send('Invalid credentials');
```

### Authorization
**Definition:** Determining what an authenticated user is allowed to do, often via roles or permissions.
**Workflow:** Attach user role to session/token → check role/permission before allowing an action → deny with 403 if unauthorized.
**Use case:** An admin dashboard route checks that the logged-in user has an `admin` role before allowing access to user management.
**Example:**
```js
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).send('Forbidden');
  next();
}
```

### JWT (JSON Web Tokens)
**Definition:** A compact, signed token format used to securely transmit identity claims between client and server without server-side session storage.
**Workflow:** Sign a token on login containing user ID/role → client sends it in the Authorization header → server verifies signature on each request.
**Use case:** A stateless API verifies a user's identity on every request just by validating the JWT signature, without querying a session store.
**Example:**
```js
const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### OAuth
**Definition:** An authorization protocol letting users log in via third-party providers (Google, GitHub) without sharing their password with your app.
**Workflow:** Redirect to provider → user grants permission → provider returns an auth code → exchange code for an access token.
**Use case:** A SaaS app offers "Sign in with Google," letting users skip creating a new password entirely.
**Example:**
```js
// Passport.js Google strategy (simplified)
passport.use(new GoogleStrategy({ clientID, clientSecret, callbackURL },
  (accessToken, refreshToken, profile, done) => done(null, profile)
));
```

### File Uploads
**Definition:** Handling binary file data sent from a client, typically via `multipart/form-data`, and storing it locally or in cloud storage.
**Workflow:** Accept upload via middleware (e.g., Multer) → validate file type/size → store in S3/cloud or filesystem → save reference in DB.
**Use case:** A user uploads a profile picture, which is validated for size, uploaded to S3, and its URL saved to their user record.
**Example:**
```js
const upload = multer({ dest: 'uploads/' });
app.post('/avatar', upload.single('image'), (req, res) => {
  res.json({ file: req.file.filename });
});
```

### Email Services
**Definition:** Sending transactional or marketing emails from the backend using services like SendGrid, Resend, or Nodemailer with SMTP.
**Workflow:** Trigger event (e.g., signup) → format email template → send via provider API → log delivery status.
**Use case:** A signup flow sends a verification email via SendGrid immediately after account creation.
**Example:**
```js
await sgMail.send({
  to: user.email, from: 'noreply@app.com',
  subject: 'Verify your email', text: `Code: ${otp}`,
});
```

### Payment Gateway
**Definition:** Third-party services (Stripe, Razorpay) that handle secure payment processing so you never touch raw card data.
**Workflow:** Create a payment intent on the backend → client confirms payment via SDK → verify webhook confirms success → update order status.
**Use case:** An e-commerce checkout creates a Stripe payment intent, and a webhook confirms payment before marking the order as paid.
**Example:**
```js
const intent = await stripe.paymentIntents.create({
  amount: 2000, currency: 'usd',
});
res.json({ clientSecret: intent.client_secret });
```

### API Security
**Definition:** Practices protecting APIs from abuse and attacks — input validation, authentication, rate limiting, and proper error handling.
**Workflow:** Validate/sanitize all inputs → enforce auth on protected routes → rate-limit sensitive endpoints → avoid leaking stack traces in errors.
**Use case:** A login endpoint rejects malformed input immediately and returns generic error messages to avoid leaking whether an email exists.
**Example:**
```js
if (!validator.isEmail(email)) return res.status(400).send('Invalid input');
```

### Rate Limiting
**Definition:** Restricting how many requests a client can make in a given time window to prevent abuse or overload.
**Workflow:** Track requests per IP/user → reject requests exceeding a threshold → return 429 status when limited.
**Use case:** A login endpoint allows only 5 attempts per minute per IP to slow down brute-force attacks.
**Example:**
```js
const limiter = rateLimit({ windowMs: 60000, max: 5 });
app.use('/login', limiter);
```

### Logging
**Definition:** Recording application events, errors, and requests for debugging, auditing, and monitoring, often with tools like Winston or Pino.
**Workflow:** Instrument code with log statements → set log levels (info/warn/error) → ship logs to a central service.
**Use case:** When a payment fails in production, structured logs show exactly which request and user triggered the error.
**Example:**
```js
logger.error('Payment failed', { userId: user.id, orderId, error: err.message });
```

### Caching
**Definition:** Temporarily storing frequently accessed data (in memory, Redis, or CDN) to reduce repeated computation or DB load.
**Workflow:** Identify expensive/frequent queries → store result in cache with TTL → serve from cache until it expires or is invalidated.
**Use case:** A product listing page caches results in Redis for 60 seconds, cutting database load during traffic spikes.
**Example:**
```js
const cached = await redis.get('products');
if (cached) return JSON.parse(cached);
const products = await db.query('SELECT * FROM products');
await redis.set('products', JSON.stringify(products), 'EX', 60);
```

### Background Jobs
**Definition:** Tasks executed outside the main request-response cycle, often queued and processed asynchronously (e.g., with Bull/BullMQ).
**Workflow:** Enqueue a job → worker process picks it up → execute task → retry on failure.
**Use case:** Sending a bulk email newsletter is queued as a background job so the API request returns instantly instead of waiting for all emails to send.
**Example:**
```js
await emailQueue.add('newsletter', { userId: user.id });
// worker.js
emailQueue.process('newsletter', async (job) => sendEmail(job.data.userId));
```

### WebSockets
**Definition:** A protocol enabling persistent, two-way real-time communication between client and server, unlike request-response HTTP.
**Workflow:** Establish a WebSocket connection → emit/listen for events on both ends → broadcast updates to connected clients.
**Use case:** A chat app uses WebSockets (via Socket.IO) to push new messages to all participants instantly without polling.
**Example:**
```js
io.on('connection', (socket) => {
  socket.on('message', (msg) => io.emit('message', msg));
});
```


---

## Part 4 — Database Engineering

### SQL
**Definition:** A standard query language for interacting with relational databases — creating, reading, updating, and deleting structured data.
**Workflow:** Design tables → write queries (SELECT/INSERT/UPDATE/DELETE) → optimize with indexes and joins.
**Use case:** An analytics dashboard runs a `JOIN` across orders and users tables to report revenue per customer.
**Example:**
```sql
SELECT u.name, SUM(o.total) AS revenue
FROM users u JOIN orders o ON o.user_id = u.id
GROUP BY u.name;
```

### PostgreSQL
**Definition:** A powerful open-source relational database known for strong consistency, extensibility, and support for advanced data types (JSON, arrays).
**Workflow:** Design schema → set up tables/relations → query with SQL → use extensions as needed (e.g., PostGIS).
**Use case:** A fintech app uses PostgreSQL for its strong transactional guarantees when processing account balances.
**Example:**
```sql
CREATE TABLE accounts (id SERIAL PRIMARY KEY, balance NUMERIC(10,2) NOT NULL);
```

### MongoDB
**Definition:** A NoSQL, document-oriented database storing flexible, JSON-like documents instead of rigid tables.
**Workflow:** Design document schema → insert/query documents via driver or Mongoose → index frequently queried fields.
**Use case:** A content platform stores blog posts with nested comments as a single document, avoiding complex joins.
**Example:**
```js
db.posts.insertOne({
  title: "Hello", comments: [{ user: "Vishnu", text: "Nice post!" }]
});
```

### Prisma ORM
**Definition:** A type-safe ORM for Node.js/TypeScript that generates a query client from a schema file, working with SQL databases.
**Workflow:** Define schema.prisma → run migrations → query database using the generated, type-safe client.
**Use case:** A TypeScript backend catches a typo in a field name at compile time because Prisma generates types directly from the DB schema.
**Example:**
```ts
const user = await prisma.user.create({
  data: { name: "Vishnu", email: "v@example.com" },
});
```

### Mongoose
**Definition:** An ODM (Object Document Mapper) for MongoDB in Node.js, providing schema validation and a structured query API.
**Workflow:** Define a schema/model → validate data on save → query using model methods (`find`, `create`, `updateOne`).
**Use case:** A `User` schema enforces that `email` is required and unique before a document can be saved to MongoDB.
**Example:**
```js
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
});
const User = mongoose.model('User', userSchema);
```

### Indexing
**Definition:** A data structure that speeds up query lookups on specific fields at the cost of extra storage and slower writes.
**Workflow:** Identify frequently queried fields → create an index on them → monitor query performance improvement.
**Use case:** Adding an index on `email` in a users collection turns a login lookup from a full collection scan into a near-instant lookup.
**Example:**
```js
db.users.createIndex({ email: 1 });
```

### Transactions
**Definition:** A group of database operations that succeed or fail together, ensuring data consistency (ACID properties).
**Workflow:** Begin transaction → perform multiple writes → commit if all succeed, or rollback if any fail.
**Use case:** Transferring money between two accounts debits one and credits the other inside a single transaction, so a crash mid-way can't leave money missing.
**Example:**
```sql
BEGIN;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

### Database Design
**Definition:** Planning how data is structured, related, and constrained before implementation — entities, relationships, keys.
**Workflow:** Identify entities → define relationships → choose keys/constraints → draw an ER diagram before building tables.
**Use case:** Designing a school system, a developer maps out `Students`, `Courses`, and a many-to-many `Enrollments` table before writing any code.
**Example:**
```
Students(id, name) --< Enrollments >-- Courses(id, title)
Enrollments(student_id, course_id, grade)
```

### Normalization
**Definition:** Organizing relational data to reduce redundancy and improve integrity, typically following normal forms (1NF, 2NF, 3NF).
**Workflow:** Identify repeating groups → split into related tables → link via foreign keys.
**Use case:** Instead of repeating a customer's address in every order row, normalization moves it to a separate `customers` table referenced by ID.
**Example:**
```sql
-- Instead of storing address in every order row:
orders(id, customer_id, product)
customers(id, address)
```

### Migrations
**Definition:** Version-controlled scripts that incrementally modify a database schema over time, keeping environments in sync.
**Workflow:** Write a migration file describing the schema change → run it against dev → apply the same migration to staging/production.
**Use case:** Adding a new `phone_number` column to the users table is done via a migration so every environment updates identically.
**Example:**
```bash
npx prisma migrate dev --name add_phone_number
```

### Backup
**Definition:** Creating recoverable copies of a database to protect against data loss from failures or human error.
**Workflow:** Schedule automated backups → store off-site/cloud → periodically test restoring from a backup.
**Use case:** A SaaS provider runs nightly automated PostgreSQL backups to S3 and tests a restore quarterly.
**Example:**
```bash
pg_dump mydb > backup_$(date +%F).sql
```

### Replication
**Definition:** Copying data across multiple database servers to improve availability and read performance.
**Workflow:** Set up a primary node for writes → configure replicas to sync from primary → route read queries to replicas.
**Use case:** A high-traffic app routes read-heavy dashboard queries to a read replica, keeping the primary database free for writes.
**Example:**
```
Primary (writes) --sync--> Replica 1 (reads)
                --sync--> Replica 2 (reads)
```

### Performance Tuning
**Definition:** Optimizing database queries and configuration to reduce latency and resource usage.
**Workflow:** Profile slow queries → add/adjust indexes → rewrite inefficient queries → monitor with EXPLAIN plans.
**Use case:** A slow report query is sped up 20x after adding a composite index and rewriting a subquery as a JOIN.
**Example:**
```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 5;
-- shows if it's using an index scan or a slow seq scan
```


---

## Part 5 — Mobile Development

### React Native
**Definition:** A framework for building native mobile apps for iOS and Android using React and JavaScript/TypeScript, sharing most code across platforms.
**Workflow:** Build UI with React Native components → handle platform differences where needed → build/run on simulator or device.
**Use case:** A startup ships both iOS and Android apps from one React Native codebase instead of maintaining two separate native apps.
**Example:**
```jsx
import { View, Text } from 'react-native';
export default function App() {
  return <View><Text>Hello React Native</Text></View>;
}
```

### Expo
**Definition:** A toolchain and managed workflow built on top of React Native that simplifies setup, building, and deploying apps.
**Workflow:** Initialize project with Expo CLI → develop using Expo Go for live preview → build binaries via EAS Build.
**Use case:** A solo developer avoids configuring native Xcode/Android Studio projects manually by using Expo's managed workflow.
**Example:**
```bash
npx create-expo-app myApp
cd myApp && npx expo start
```

### Navigation
**Definition:** Managing screen transitions and routing within a mobile app, typically via React Navigation.
**Workflow:** Define a navigator (stack/tab/drawer) → register screens → navigate programmatically between them.
**Use case:** A shopping app uses a stack navigator so tapping a product pushes a detail screen, with a native back gesture to return.
**Example:**
```jsx
<Stack.Navigator>
  <Stack.Screen name="Home" component={Home} />
  <Stack.Screen name="Detail" component={Detail} />
</Stack.Navigator>
// navigation.navigate('Detail', { id: 5 })
```

### Push Notifications
**Definition:** Messages sent to a user's device even when the app isn't open, delivered via platform services (FCM, APNs).
**Workflow:** Register device token → send token to backend → backend triggers notification via FCM/APNs → device displays it.
**Use case:** A food delivery app pushes a notification the moment an order status changes to "Out for Delivery."
**Example:**
```js
await Notifications.scheduleNotificationAsync({
  content: { title: "Order update", body: "Out for delivery!" },
  trigger: null,
});
```

### Offline Storage
**Definition:** Persisting data on-device so the app remains functional without an internet connection, via AsyncStorage, SQLite, or MMKV.
**Workflow:** Cache critical data locally → sync with server when connection resumes → handle conflict resolution if needed.
**Use case:** A note-taking app lets users create and edit notes offline, syncing them to the server once connectivity returns.
**Example:**
```js
await AsyncStorage.setItem('draft_note', JSON.stringify(note));
const saved = JSON.parse(await AsyncStorage.getItem('draft_note'));
```

### Deep Linking
**Definition:** URLs that open a specific screen inside a mobile app instead of just launching it to the home screen.
**Workflow:** Register a URL scheme/universal link → parse the incoming URL → navigate to the matching screen with parameters.
**Use case:** Tapping a "View Order" link in an email opens the app directly to that specific order's detail screen.
**Example:**
```
myapp://order/1234  -> opens OrderDetail screen with id=1234
```

### Play Store Deployment
**Definition:** The process of publishing an Android app to the Google Play Store, including builds, testing tracks, and review.
**Workflow:** Generate a signed AAB → upload to Play Console → configure testing tracks → submit for review → release to production.
**Use case:** A developer runs a closed testing track with real users for the required stability window before promoting the build to production.
**Example:**
```bash
eas build --platform android --profile production
# upload the resulting .aab to Play Console
```

### App Store Deployment
**Definition:** The process of publishing an iOS app to Apple's App Store, including provisioning, TestFlight, and review.
**Workflow:** Generate a signed build → upload via Xcode/Transporter → test via TestFlight → submit for App Review → release.
**Use case:** A team uses TestFlight to get beta feedback from 50 testers before submitting the final build for Apple's review.
**Example:**
```bash
eas build --platform ios --profile production
eas submit --platform ios
```


---

## Part 6 — DevOps

### Linux
**Definition:** The open-source operating system underlying most servers, requiring command-line proficiency for deployment and management.
**Workflow:** Navigate filesystem → manage processes/users/permissions → install and configure services via terminal.
**Use case:** A developer SSHes into a production server to check disk usage and restart a hung service.
**Example:**
```bash
df -h                 # check disk usage
sudo systemctl restart nginx
```

### Shell Commands
**Definition:** Text-based commands for interacting with the OS — file operations, process management, text processing (grep, awk, sed).
**Workflow:** Chain commands with pipes → automate repetitive tasks in shell scripts → schedule with cron.
**Use case:** A bash script using `grep` and `awk` extracts error counts from a log file every hour via a cron job.
**Example:**
```bash
grep "ERROR" app.log | awk '{print $1}' | sort | uniq -c
```

### Docker
**Definition:** A platform for packaging applications and their dependencies into portable, isolated containers.
**Workflow:** Write a Dockerfile → build an image → run it as a container → push image to a registry.
**Use case:** A Node.js app runs identically on a developer's laptop and in production because both use the same Docker image.
**Example:**
```dockerfile
FROM node:20
COPY . /app
WORKDIR /app
RUN npm install
CMD ["node", "server.js"]
```

### Docker Compose
**Definition:** A tool for defining and running multi-container Docker applications using a single YAML file.
**Workflow:** Define services (app, DB, cache) in `docker-compose.yml` → run `docker compose up` to start everything together.
**Use case:** A local dev environment spins up the Node app, PostgreSQL, and Redis together with one command.
**Example:**
```yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
  db:
    image: postgres
```

### Kubernetes
**Definition:** A container orchestration platform that automates deployment, scaling, and management of containerized applications.
**Workflow:** Define deployments/services in YAML manifests → apply to a cluster → Kubernetes handles scaling and self-healing.
**Use case:** A high-traffic app automatically scales from 3 to 15 pods during a sale event, then scales back down after.
**Example:**
```yaml
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: app
          image: myapp:latest
```

### Nginx
**Definition:** A high-performance web server commonly used as a reverse proxy, load balancer, or static file server.
**Workflow:** Configure server blocks → route incoming requests to backend services → handle SSL termination.
**Use case:** Nginx routes `/api` requests to a Node backend and serves the React build's static files directly.
**Example:**
```nginx
location /api { proxy_pass http://localhost:5000; }
location / { root /var/www/build; }
```

### Reverse Proxy
**Definition:** A server that sits between clients and backend servers, forwarding requests and often handling caching, SSL, and load balancing.
**Workflow:** Client request hits the proxy → proxy forwards to the appropriate backend → response passes back through the proxy.
**Use case:** Nginx as a reverse proxy hides three internal microservices behind one public domain.
**Example:**
```nginx
location /users { proxy_pass http://user-service:4001; }
location /orders { proxy_pass http://order-service:4002; }
```

### SSL
**Definition:** A protocol (technically now TLS) that encrypts data between client and server, shown as HTTPS in browsers.
**Workflow:** Obtain a certificate (e.g., via Let's Encrypt) → configure the web server to use it → enforce HTTPS redirects.
**Use case:** A site auto-renews its free Let's Encrypt SSL certificate via Certbot, keeping HTTPS active without manual intervention.
**Example:**
```bash
sudo certbot --nginx -d myapp.com
```

### GitHub Actions
**Definition:** A CI/CD automation platform built into GitHub for running workflows on events like pushes or pull requests.
**Workflow:** Define a workflow YAML file → trigger on push/PR → run steps like test, build, deploy.
**Use case:** Every push to `main` triggers a GitHub Actions workflow that runs tests and deploys automatically if they pass.
**Example:**
```yaml
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

### CI/CD
**Definition:** Continuous Integration (automatically testing/merging code) and Continuous Deployment (automatically releasing it) practices.
**Workflow:** Push code → automated pipeline runs tests/builds → deploy automatically or with manual approval.
**Use case:** A team merges a PR and, within minutes, the change is live in production with zero manual deployment steps.
**Example:**
```
push -> lint -> test -> build -> deploy to staging -> manual approve -> deploy prod
```

### AWS Basics
**Definition:** Foundational knowledge of Amazon Web Services' core cloud infrastructure offerings.
**Workflow:** Choose the right service for a need (compute, storage, database) → provision via console or IaC → monitor usage/cost.
**Use case:** A startup hosts its backend on EC2, stores files in S3, and serves static assets via CloudFront.
**Example:**
```bash
aws s3 cp ./build s3://my-bucket --recursive
```

### EC2
**Definition:** Amazon's virtual server service, letting you rent scalable compute capacity in the cloud.
**Workflow:** Launch an instance with a chosen OS/size → configure security groups → deploy your app onto it.
**Use case:** A backend API runs on a t3.medium EC2 instance behind a load balancer.
**Example:**
```bash
ssh -i key.pem ubuntu@ec2-instance-ip
```

### S3
**Definition:** Amazon's object storage service for storing and retrieving files (images, backups, static assets) at scale.
**Workflow:** Create a bucket → upload/retrieve objects via SDK or console → configure access permissions.
**Use case:** User-uploaded profile pictures are stored in an S3 bucket and served via a public URL.
**Example:**
```js
await s3.putObject({ Bucket: 'my-bucket', Key: 'avatar.png', Body: fileBuffer });
```

### CloudFront
**Definition:** Amazon's CDN service that caches and delivers content from edge locations close to users worldwide.
**Workflow:** Point CloudFront at an origin (S3/EC2) → configure caching rules → distribute content globally.
**Use case:** A media site serves videos faster to users in Europe by caching them at a nearby CloudFront edge location.
**Example:**
```
Origin: my-bucket.s3.amazonaws.com
Distribution URL: d123abc.cloudfront.net
```

### Load Balancer
**Definition:** A component that distributes incoming traffic across multiple servers to improve reliability and performance.
**Workflow:** Register backend instances → configure health checks → route traffic based on load/rules.
**Use case:** An AWS Application Load Balancer distributes traffic across three EC2 instances, removing any that fail health checks.
**Example:**
```
ALB -> health check GET /health every 30s
     -> routes to instance-1, instance-2, instance-3
```

### Monitoring
**Definition:** Continuously tracking application and infrastructure health — uptime, errors, resource usage.
**Workflow:** Instrument app with metrics/traces → set up dashboards → configure alerts for anomalies.
**Use case:** An on-call engineer gets paged within a minute when API error rates spike above a threshold.
**Example:**
```
Alert rule: error_rate > 5% for 2 minutes -> send PagerDuty alert
```

### Prometheus
**Definition:** An open-source monitoring system that collects and stores time-series metrics, commonly paired with Grafana.
**Workflow:** Expose metrics endpoint in app → Prometheus scrapes metrics periodically → query/alert on stored data.
**Use case:** Prometheus scrapes CPU and request-latency metrics from a Node app every 15 seconds for historical analysis.
**Example:**
```yaml
scrape_configs:
  - job_name: 'node-app'
    static_configs: [{ targets: ['localhost:3000'] }]
```

### Grafana
**Definition:** A visualization tool for building dashboards from metrics sources like Prometheus.
**Workflow:** Connect a data source → build dashboard panels → set up alert rules on visualized metrics.
**Use case:** A team watches a Grafana dashboard showing real-time request latency and error rates during a product launch.
**Example:**
```
Panel query: rate(http_requests_total[5m])
```

### PM2
**Definition:** A production process manager for Node.js apps, handling restarts, clustering, and log management.
**Workflow:** Start app with `pm2 start` → configure auto-restart on crash → cluster across CPU cores.
**Use case:** PM2 automatically restarts a Node API that crashed due to an unhandled exception, with zero manual intervention.
**Example:**
```bash
pm2 start server.js -i max --name api
pm2 logs api
```

### Redis
**Definition:** An in-memory key-value data store used for caching, session storage, and pub/sub messaging.
**Workflow:** Store frequently accessed data with a TTL → read from cache before hitting the DB → invalidate on updates.
**Use case:** Session tokens are stored in Redis for fast lookup on every authenticated request instead of querying the main database.
**Example:**
```bash
redis-cli SET session:abc123 "userId:5" EX 3600
```

### RabbitMQ
**Definition:** A message broker implementing queuing protocols (AMQP) for decoupled, asynchronous communication between services.
**Workflow:** Producer publishes a message to a queue → consumer(s) subscribe and process messages → acknowledge on completion.
**Use case:** An order service publishes an "order placed" event to RabbitMQ, which a separate email service consumes to send confirmations.
**Example:**
```js
channel.sendToQueue('orders', Buffer.from(JSON.stringify({ orderId: 1 })));
```

### Kafka
**Definition:** A distributed event-streaming platform designed for high-throughput, durable, real-time data pipelines.
**Workflow:** Producers publish events to topics → Kafka persists them → consumers read/process at their own pace.
**Use case:** A large e-commerce platform streams every click event through Kafka for real-time analytics processing.
**Example:**
```js
await producer.send({ topic: 'clicks', messages: [{ value: JSON.stringify(event) }] });
```


---

## Part 7 — Security

### OWASP Top 10
**Definition:** A regularly updated list of the ten most critical web application security risks, maintained by the OWASP foundation.
**Workflow:** Review the current list → audit your app against each risk category → remediate found vulnerabilities.
**Use case:** A security audit checklist for a new API is built directly from the current OWASP Top 10 categories.
**Example:**
```
Checklist includes: Broken Access Control, Injection,
Cryptographic Failures, Security Misconfiguration...
```

### XSS (Cross-Site Scripting)
**Definition:** An attack where malicious scripts are injected into a page and executed in other users' browsers.
**Workflow:** Sanitize/escape all user-generated content before rendering → use frameworks that auto-escape by default (React does this).
**Use case:** A comment section escapes HTML in user input so a comment containing `<script>` tags renders as plain text, not executable code.
**Example:**
```jsx
// React auto-escapes this - safe by default:
<p>{userComment}</p>
// Dangerous only if you explicitly bypass escaping:
<div dangerouslySetInnerHTML={{ __html: userComment }} /> // avoid this
```

### CSRF (Cross-Site Request Forgery)
**Definition:** An attack tricking an authenticated user's browser into making unwanted requests to a site they're logged into.
**Workflow:** Generate a CSRF token per session → require it on state-changing requests → reject requests missing a valid token.
**Use case:** A bank's "transfer funds" form embeds a CSRF token so a malicious external site can't trigger a transfer using the user's session.
**Example:**
```js
app.use(csrf());
<input type="hidden" name="_csrf" value={csrfToken} />
```

### SQL Injection
**Definition:** An attack where malicious SQL is inserted into a query via unsanitized input, potentially exposing or corrupting data.
**Workflow:** Use parameterized queries/prepared statements → never concatenate raw user input into SQL strings → use an ORM that escapes by default.
**Use case:** A login form using parameterized queries prevents an attacker from bypassing authentication with input like `' OR '1'='1`.
**Example:**
```js
// Unsafe: `SELECT * FROM users WHERE email = '${email}'`
// Safe:
db.query('SELECT * FROM users WHERE email = ?', [email]);
```

### CORS (Cross-Origin Resource Sharing)
**Definition:** A browser security mechanism controlling which origins are allowed to make requests to your API.
**Workflow:** Define allowed origins on the backend → configure CORS middleware → browser enforces the policy on cross-origin requests.
**Use case:** An API only allows requests from `app.example.com`, blocking requests initiated from an unrelated malicious site.
**Example:**
```js
app.use(cors({ origin: 'https://app.example.com' }));
```

### HTTPS
**Definition:** HTTP over TLS/SSL, encrypting data in transit between client and server.
**Workflow:** Obtain and install a certificate → redirect all HTTP traffic to HTTPS → renew certificates before expiry.
**Use case:** A login page enforces HTTPS so credentials aren't transmitted in plaintext over the network.
**Example:**
```js
app.use((req, res, next) => {
  if (!req.secure) return res.redirect(`https://${req.headers.host}${req.url}`);
  next();
});
```

### Encryption
**Definition:** Converting data into a coded form that can only be read with the correct key, protecting confidentiality.
**Workflow:** Choose an encryption algorithm → encrypt sensitive data at rest/in transit → manage keys securely.
**Use case:** A healthcare app encrypts patient records at rest in the database to comply with data protection regulations.
**Example:**
```js
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
```

### Hashing
**Definition:** A one-way transformation of data (like passwords) into a fixed-length string that can't be reversed.
**Workflow:** Hash passwords with a salt using bcrypt/Argon2 before storing → compare hashes on login, never store plaintext.
**Use case:** A user's password is hashed with bcrypt before being saved, so even a database breach doesn't expose actual passwords.
**Example:**
```js
const hashed = await bcrypt.hash(password, 10);
```

### Secrets Management
**Definition:** Securely storing and accessing sensitive credentials (API keys, DB passwords) instead of hardcoding them in code.
**Workflow:** Store secrets in environment variables or a secrets manager (AWS Secrets Manager, Vault) → inject at runtime → never commit to version control.
**Use case:** A Gemini API key is loaded from an environment variable set in the hosting platform's dashboard, never committed to GitHub.
**Example:**
```js
// .env (in .gitignore)
GEMINI_API_KEY=xxxx
// code
const key = process.env.GEMINI_API_KEY;
```

---

## Part 8 — Testing

### Jest
**Definition:** A popular JavaScript testing framework with built-in test runner, assertions, and mocking support.
**Workflow:** Write test files → run with `jest` → assert expected outputs against actual results.
**Use case:** A utility function calculating tax is covered by Jest unit tests verifying correct output for multiple input cases.
**Example:**
```js
test('calculates 10% tax', () => {
  expect(calculateTax(100)).toBe(10);
});
```

### Vitest
**Definition:** A fast, Vite-native testing framework with a Jest-compatible API, popular in modern frontend projects.
**Workflow:** Configure Vitest in a Vite project → write tests → run with near-instant hot reload during development.
**Use case:** A Vite + React project uses Vitest for unit tests, benefiting from the same fast build pipeline as the app itself.
**Example:**
```js
import { expect, test } from 'vitest';
test('adds numbers', () => { expect(1 + 2).toBe(3); });
```

### React Testing Library
**Definition:** A testing utility focused on testing React components the way users interact with them, rather than internal implementation details.
**Workflow:** Render a component → query elements by role/text → simulate user interaction → assert the resulting UI state.
**Use case:** A test clicks a "Submit" button and asserts an error message appears when the form is submitted empty.
**Example:**
```jsx
render(<LoginForm />);
fireEvent.click(screen.getByText('Submit'));
expect(await screen.findByText('Email required')).toBeInTheDocument();
```

### Cypress
**Definition:** An end-to-end testing framework that runs tests in a real browser, simulating full user flows.
**Workflow:** Write test scripts describing user actions → run against a live or local app → assert on resulting page state.
**Use case:** A Cypress test logs in, adds an item to a cart, and verifies checkout completes successfully — simulating a real user journey.
**Example:**
```js
cy.visit('/login');
cy.get('#email').type('test@test.com');
cy.get('button').contains('Login').click();
cy.url().should('include', '/dashboard');
```

### Playwright
**Definition:** A modern end-to-end testing framework supporting multiple browsers (Chromium, Firefox, WebKit) with strong automation capabilities.
**Workflow:** Write test scripts → run across multiple browsers in parallel → capture screenshots/videos on failure.
**Use case:** A team runs Playwright tests across Chrome, Firefox, and Safari engines in CI to catch browser-specific bugs before release.
**Example:**
```js
await page.goto('/login');
await page.fill('#email', 'test@test.com');
await page.click('text=Login');
```

### Integration Testing
**Definition:** Testing how multiple units/modules work together, such as an API endpoint interacting with a real database.
**Workflow:** Set up a test database/environment → call the actual API endpoint → assert on the full response and side effects.
**Use case:** An integration test hits `POST /orders` and verifies both the API response and that a row was correctly inserted into the database.
**Example:**
```js
const res = await request(app).post('/orders').send({ item: 'Book' });
expect(res.status).toBe(201);
const order = await db.orders.findOne({ item: 'Book' });
expect(order).toBeTruthy();
```

### Unit Testing
**Definition:** Testing individual functions or components in isolation, mocking any external dependencies.
**Workflow:** Isolate a function → mock dependencies → assert output for given inputs, including edge cases.
**Use case:** A `calculateDiscount()` function is unit tested with multiple input combinations, without touching the database or network.
**Example:**
```js
expect(calculateDiscount(100, 0.1)).toBe(90);
expect(calculateDiscount(0, 0.1)).toBe(0);
```

### E2E Testing (End-to-End)
**Definition:** Testing an entire application flow from the user's perspective, across frontend, backend, and database.
**Workflow:** Simulate a real user journey through the full stack → assert final expected outcome.
**Use case:** An E2E test signs up a new user, verifies the welcome email flow, and confirms they can log in — testing the whole pipeline.
**Example:**
```js
// Playwright/Cypress test spanning signup -> email link -> login
cy.visit('/signup'); cy.get('#submit').click();
cy.visit('/login'); cy.get('#submit').click();
cy.url().should('include', '/dashboard');
```

---

## Part 9 — Deployment

### Railway
**Definition:** A developer-friendly cloud platform for deploying apps and databases with minimal configuration.
**Workflow:** Connect a GitHub repo → Railway auto-detects and builds the app → deploy with auto-generated URL.
**Use case:** A Node/Express backend deploys automatically to Railway on every push to `main`.
**Example:**
```bash
railway login
railway init
railway up
```

### Render
**Definition:** A cloud platform offering free and paid hosting for web services, static sites, and databases.
**Workflow:** Connect repo → configure build/start commands → Render builds and deploys automatically.
**Use case:** A student hosts a free full-stack MERN project on Render for a portfolio demo.
**Example:**
```
Build Command: npm install
Start Command: node server.js
```

### Vercel
**Definition:** A deployment platform optimized for frontend frameworks (especially Next.js), offering serverless functions and instant global CDN.
**Workflow:** Connect repo → Vercel auto-builds on push → preview deployments for every PR → promote to production.
**Use case:** Every pull request gets its own preview URL on Vercel, letting reviewers test changes before merging.
**Example:**
```bash
npm i -g vercel
vercel --prod
```

### Docker Deployment
**Definition:** Deploying an application packaged as a Docker container to a server or orchestration platform.
**Workflow:** Build a Docker image → push to a registry → pull and run the image on the target server.
**Use case:** A production server pulls the latest Docker image and restarts the container with zero manual dependency installation.
**Example:**
```bash
docker build -t myapp .
docker push myrepo/myapp
docker run -d -p 80:3000 myrepo/myapp
```

### VPS Deployment
**Definition:** Deploying an app to a Virtual Private Server you manage yourself, without a managed PaaS abstraction.
**Workflow:** Provision a VPS → install runtime/dependencies → configure Nginx/PM2 → deploy code manually or via CI.
**Use case:** A developer deploys a Node app to a DigitalOcean droplet, configuring Nginx as a reverse proxy in front of it.
**Example:**
```bash
git pull origin main
npm install --production
pm2 restart api
```

### DigitalOcean
**Definition:** A cloud provider offering simplified VPS ("Droplets"), managed databases, and app hosting.
**Workflow:** Create a Droplet or App Platform app → configure environment → deploy and monitor.
**Use case:** A small team hosts their app on a DigitalOcean Droplet for predictable, low-cost pricing compared to AWS.
**Example:**
```bash
doctl compute droplet create my-app --region nyc1 --size s-1vcpu-1gb
```

### AWS (Deployment Context)
**Definition:** Using AWS services (EC2, ECS, Elastic Beanstalk) specifically for deploying and running production applications.
**Workflow:** Choose a deployment target (EC2/ECS/Beanstalk) → configure infrastructure → deploy application code → set up monitoring.
**Use case:** A scaling startup migrates from a single Render service to AWS ECS for finer control over infrastructure as traffic grows.
**Example:**
```bash
eb init && eb create production-env && eb deploy
```

### Domain Configuration
**Definition:** Connecting a purchased domain name to your hosted application.
**Workflow:** Purchase domain → point DNS records to hosting provider → verify propagation.
**Use case:** A custom domain `myapp.com` is pointed at a Vercel deployment by adding the provided A/CNAME records.
**Example:**
```
A record: @ -> 76.76.21.21
CNAME:   www -> cname.vercel-dns.com
```

### DNS
**Definition:** The system translating human-readable domain names into IP addresses.
**Workflow:** Configure records (A, CNAME, MX) at your registrar → changes propagate globally over time.
**Use case:** An MX record is added to a domain's DNS so that email sent to `contact@myapp.com` routes to the correct mail provider.
**Example:**
```
MX record: @ -> mail.protonmail.ch (priority 10)
```

### SSL (Deployment Context)
**Definition:** Ensuring your deployed domain serves traffic over HTTPS with a valid certificate.
**Workflow:** Provision a certificate (often automatic via the host) → enforce HTTPS redirects → monitor expiry/renewal.
**Use case:** Vercel and Render both auto-provision and renew SSL certificates for custom domains with zero manual setup.
**Example:**
```
Add custom domain in Vercel dashboard -> SSL cert auto-issued within minutes
```

### Monitoring (Deployment Context)
**Definition:** Tracking a deployed application's health, uptime, and errors post-launch.
**Workflow:** Integrate an error tracker (Sentry) and uptime monitor → set alert thresholds → review regularly.
**Use case:** Sentry alerts the team within seconds of a spike in 500 errors right after a new deployment.
**Example:**
```js
Sentry.init({ dsn: "https://xxxx@sentry.io/1234" });
```

### Scaling
**Definition:** Increasing an application's capacity to handle more traffic, either vertically (bigger server) or horizontally (more servers).
**Workflow:** Monitor load → add more instances (horizontal) or upgrade instance size (vertical) → load balance across them.
**Use case:** During a flash sale, an app auto-scales from 2 to 8 instances to handle the traffic surge, then scales back down.
**Example:**
```
Auto-scaling rule: if CPU > 70% for 5 min -> add instance
```


---

## Part 10 — System Design

### Monolith
**Definition:** An architecture where all application functionality lives in a single, unified codebase and deployment unit.
**Workflow:** Build all features within one codebase → deploy as a single unit → scale the whole app together.
**Use case:** An early-stage startup builds a monolithic Node/Express app since it's faster to develop and deploy with a small team.
**Example:**
```
/app
  /auth /orders /payments /users   <- all in one deployable app
```

### Microservices
**Definition:** An architecture splitting an application into small, independently deployable services, each owning a specific domain.
**Workflow:** Split functionality by domain (auth, orders, payments) → each service has its own DB/deployment → services communicate via APIs/events.
**Use case:** A large e-commerce platform separates its inventory, payment, and shipping logic into independently scalable microservices.
**Example:**
```
auth-service (port 4001) -> own DB
order-service (port 4002) -> own DB
payment-service (port 4003) -> own DB
```

### API Gateway
**Definition:** A single entry point that routes client requests to the appropriate backend microservice, often handling auth and rate limiting centrally.
**Workflow:** Client sends request to gateway → gateway authenticates and routes to the correct microservice → aggregates responses if needed.
**Use case:** A mobile app calls one API Gateway endpoint that internally routes to separate user, order, and payment microservices.
**Example:**
```
GET api.myapp.com/orders -> gateway -> order-service:4002
```

### Event Driven Architecture
**Definition:** A design where services communicate by producing and reacting to events rather than direct synchronous calls.
**Workflow:** A service publishes an event → interested services subscribe and react independently → no direct coupling between producer and consumer.
**Use case:** When an order is placed, an "OrderCreated" event triggers inventory updates, email confirmation, and analytics logging — all independently.
**Example:**
```js
eventBus.emit('OrderCreated', { orderId: 1 });
// inventoryService, emailService, analyticsService all listen independently
```

### Message Queues
**Definition:** Systems that hold messages between producers and consumers, decoupling services and smoothing out load spikes.
**Workflow:** Producer pushes a message to a queue → consumer pulls and processes it at its own pace → message is acknowledged/removed.
**Use case:** A video processing service queues uploaded videos so encoding happens asynchronously without blocking the upload response.
**Example:**
```js
await videoQueue.add({ videoId: 42 });
// worker processes at its own pace, independent of upload request
```

### Caching (System Design)
**Definition:** Storing computed or frequently accessed results closer to the consumer to reduce latency and backend load at scale.
**Workflow:** Identify hot data paths → cache at appropriate layer (CDN, app, DB) → define invalidation strategy.
**Use case:** A news site caches its homepage HTML at the CDN layer, so most visitors never hit the origin server at all.
**Example:**
```
Cache-Control: public, max-age=300
```

### CDN
**Definition:** A geographically distributed network of servers that cache and serve content closer to users for lower latency.
**Workflow:** Upload static assets → CDN caches them at edge locations → users are served from the nearest edge node.
**Use case:** Images on a global e-commerce site load quickly for users in Asia because a CDN edge node in Singapore serves them, not a US origin server.
**Example:**
```
<img src="https://cdn.myapp.com/product1.jpg" />
```

### Scaling (System Design)
**Definition:** Architectural strategies for growing a system's capacity — horizontal scaling, database sharding, stateless services.
**Workflow:** Identify the bottleneck (DB, compute, network) → apply the appropriate scaling strategy → re-test under load.
**Use case:** A social app shards its user database by user ID range once a single database instance can no longer handle write volume.
**Example:**
```
Shard 1: users 0-999999
Shard 2: users 1000000-1999999
```

### CAP Theorem
**Definition:** A principle stating a distributed system can only guarantee two of three properties at once: Consistency, Availability, Partition tolerance.
**Workflow:** Identify your system's priority (consistency vs. availability) during a network partition → choose a database/architecture accordingly.
**Use case:** A banking system prioritizes Consistency over Availability, refusing a transaction rather than risking an inconsistent balance during a network split.
**Example:**
```
MongoDB (default): favors Consistency + Partition tolerance (CP)
Cassandra: favors Availability + Partition tolerance (AP)
```

### Load Balancing (System Design)
**Definition:** Distributing incoming traffic across multiple servers to prevent any single one from becoming a bottleneck or failure point.
**Workflow:** Place a load balancer in front of multiple instances → route based on algorithm (round-robin, least connections) → health-check instances.
**Use case:** A load balancer removes an unhealthy server from rotation automatically after it fails three consecutive health checks.
**Example:**
```
Algorithm: round-robin across [server1, server2, server3]
```

### High Availability
**Definition:** Designing systems to remain operational with minimal downtime, even during failures.
**Workflow:** Eliminate single points of failure → replicate critical components → implement failover mechanisms.
**Use case:** A database runs with a primary and standby replica in different availability zones, so a zone outage doesn't take the app down.
**Example:**
```
Primary DB (us-east-1a) -> Standby (us-east-1b) auto-failover
```

---

## Part 11 — AI Integration

### OpenAI APIs
**Definition:** APIs from OpenAI providing access to models like GPT for chat, completion, embeddings, and more.
**Workflow:** Send a prompt/messages array to the API → receive a completion → handle streaming or structured outputs as needed.
**Use case:** A customer support widget calls the OpenAI API to generate contextual responses based on a knowledge base.
**Example:**
```js
const res = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Summarize this ticket" }],
});
```

### Gemini
**Definition:** Google's family of multimodal AI models, accessible via the Gemini API with a generous free tier.
**Workflow:** Send prompt (text/image/etc.) to the API → receive a generated response → integrate into your app's logic.
**Use case:** A free-tier chatbot built on the MERN stack uses Gemini Flash to generate responses without any API cost during development.
**Example:**
```js
const result = await model.generateContent("Explain closures in JS simply");
console.log(result.response.text());
```

### Claude
**Definition:** Anthropic's family of AI models, accessible via the Claude API, known for strong reasoning and long-context handling.
**Workflow:** Send messages to the API with a system prompt → receive a response → optionally use tool calling for agentic behavior.
**Use case:** A document analysis tool uses Claude's large context window to summarize an entire long PDF report in one request.
**Example:**
```js
const res = await anthropic.messages.create({
  model: "claude-sonnet-4-6", max_tokens: 500,
  messages: [{ role: "user", content: "Summarize this contract" }],
});
```

### MCP (Model Context Protocol)
**Definition:** An open protocol standardizing how AI models connect to external tools and data sources (like databases, APIs, or apps).
**Workflow:** Expose a service as an MCP server → an AI client connects to it → the model can call its tools within a conversation.
**Use case:** An AI agent uses an MCP server to query a company's internal ticketing system directly during a conversation, without custom integration code.
**Example:**
```js
mcp_servers: [{ type: "url", url: "https://mcp.myservice.com/sse", name: "tickets" }]
```

### AI Agents
**Definition:** AI systems that can plan, use tools, and take multi-step actions autonomously toward a goal, rather than just responding once.
**Workflow:** Define available tools/functions → model reasons about which to call → execute tool → feed result back → repeat until task is complete.
**Use case:** A research agent searches the web, reads several pages, and compiles a summary report — all through a multi-step tool-calling loop.
**Example:**
```js
tools: [{ name: "search_web", description: "Search the internet" }]
// model decides: call search_web -> gets results -> calls again -> final answer
```

### LangChain
**Definition:** A framework for building LLM-powered applications, providing abstractions for chains, agents, memory, and tool integration.
**Workflow:** Define a chain or agent → connect it to an LLM and tools → run it against user input.
**Use case:** A developer uses LangChain.js to quickly wire together a retrieval step and an LLM call into a single reusable RAG chain.
**Example:**
```js
const chain = RunnableSequence.from([retriever, promptTemplate, model]);
const answer = await chain.invoke({ question: "What is RAG?" });
```

### RAG (Retrieval-Augmented Generation)
**Definition:** A technique where relevant external documents are retrieved and fed into an LLM's context to ground its answers in real data.
**Workflow:** Embed documents into a vector store → on a query, retrieve the most relevant chunks → pass them to the LLM alongside the question.
**Use case:** A support chatbot retrieves relevant help-center articles before answering, so responses stay accurate instead of hallucinated.
**Example:**
```js
const docs = await vectorStore.similaritySearch(query, 3);
const context = docs.map(d => d.pageContent).join("\n");
const prompt = `Context: ${context}\n\nQuestion: ${query}`;
```

### Vector Databases
**Definition:** Databases optimized for storing and searching high-dimensional vector embeddings by similarity.
**Workflow:** Convert text to embeddings → store vectors in the DB → query with a new embedding to retrieve semantically similar results.
**Use case:** A RAG pipeline stores document embeddings in a vector database like Pinecone or Chroma to retrieve relevant context at query time.
**Example:**
```js
await index.upsert([{ id: "doc1", values: embedding, metadata: { text } }]);
const results = await index.query({ vector: queryEmbedding, topK: 3 });
```


---

## Part 12 — Real Production Project (LMS Case Study)

### LMS Architecture
**Definition:** The overall system design for a Learning Management System — how students, courses, content, and progress tracking fit together.
**Workflow:** Design entities (Users, Courses, Lessons, Enrollments, Progress) → define API structure → plan frontend/mobile/backend separation.
**Use case:** An LMS separates concerns into an admin panel (course creation), a student web app, and a backend API serving both.
**Example:**
```
Users -- Enrollments --< Courses -- Lessons -- Progress
```

### Authentication Flow
**Definition:** The end-to-end process of how users sign up, log in, and stay authenticated across a real production app.
**Workflow:** User registers → email verification → login issues JWT/refresh token pair → token refreshed silently → logout clears tokens.
**Use case:** A student stays logged into the LMS mobile app for weeks via a refresh token, without needing to re-enter credentials daily.
**Example:**
```js
// on 401, silently refresh:
const { accessToken } = await refreshTokenRequest();
retryOriginalRequest(accessToken);
```

### Folder Structure
**Definition:** The organization of a codebase into logical directories for maintainability at scale.
**Workflow:** Separate by feature or layer (controllers, services, routes, models) → keep consistent naming → document conventions for the team.
**Use case:** The LMS backend organizes code into `/controllers`, `/services`, `/routes`, and `/models`, making it easy for new developers to find relevant code.
**Example:**
```
/src
  /controllers/course.controller.js
  /services/course.service.js
  /models/Course.js
  /routes/course.routes.js
```

### Backend Workflow
**Definition:** How a request flows through the backend from route to response in a real production system.
**Workflow:** Request hits router → passes through middleware (auth, validation) → controller calls service → service interacts with DB → response returned.
**Use case:** A "mark lesson complete" request passes through auth middleware, validation, a service updating progress, and finally returns updated stats.
**Example:**
```js
router.post('/lessons/:id/complete', auth, validate, courseController.completeLesson);
```

### Frontend Workflow
**Definition:** How data and user interaction flow through a production frontend application.
**Workflow:** Component mounts → fetches data via React Query → user interacts → state updates → UI re-renders → mutations sync back to server.
**Use case:** A course progress bar updates instantly when a student completes a lesson, then syncs to the backend in the background.
**Example:**
```jsx
const mutation = useMutation({ mutationFn: completeLesson });
<button onClick={() => mutation.mutate(lessonId)}>Mark Complete</button>
```

### Mobile Workflow
**Definition:** How the mobile app version of the same product handles data, navigation, and offline behavior.
**Workflow:** App fetches and caches data locally → navigation moves between screens → offline changes queue and sync when reconnected.
**Use case:** A student downloads a course's video lessons for offline viewing during a commute, with progress syncing once back online.
**Example:**
```js
if (!isConnected) await AsyncStorage.setItem('pending_progress', JSON.stringify(update));
else await syncProgress(update);
```

### Deployment Workflow
**Definition:** The concrete steps taken to move code from a developer's machine to production for a real product.
**Workflow:** Push to a feature branch → CI runs tests → merge to main → CI/CD builds and deploys to staging → manual/automatic promotion to production.
**Use case:** The LMS backend deploys to Railway automatically on merge to `main`, while the mobile app is built via EAS and submitted to app stores separately.
**Example:**
```
main branch push -> GitHub Actions -> tests pass -> Railway auto-deploy
```

### CI/CD Workflow
**Definition:** The specific automated pipeline configuration used to test and deploy a production application continuously.
**Workflow:** Define pipeline stages (lint, test, build, deploy) in a config file → trigger on push/PR → fail fast on any stage error.
**Use case:** A GitHub Actions pipeline blocks a merge if any Jest test fails, preventing broken code from reaching production.
**Example:**
```yaml
jobs:
  ci:
    steps:
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

### Monitoring (Production Project)
**Definition:** Real-time visibility into how the live LMS product is performing and where it's failing.
**Workflow:** Instrument key metrics (API latency, error rate, active users) → visualize on dashboards → alert on anomalies.
**Use case:** The team notices via Grafana that quiz submission latency spikes every day at 6 PM when most students are active, prompting a scaling review.
**Example:**
```
Dashboard panel: p95 latency for POST /quiz/submit over last 24h
```

### Logging (Production Project)
**Definition:** Structured, centralized logs capturing what happened across the LMS's distributed components.
**Workflow:** Log key events with context (user ID, request ID) → ship to a centralized log service → search/filter during incident investigation.
**Use case:** When a student reports a failed payment, support searches logs by their user ID to trace exactly what happened during checkout.
**Example:**
```js
logger.info('payment_attempt', { userId, orderId, status: 'failed', reason: err.message });
```

### Production Checklist
**Definition:** A final review process before and after launching a real application to catch common gaps.
**Workflow:** Verify env vars/secrets are set → confirm backups are running → check error tracking is live → load-test critical endpoints → review security headers.
**Use case:** Before launch, the LMS team confirms SSL is active, database backups are scheduled, and Sentry is capturing errors — avoiding a blind launch.
**Example:**
```
[ ] .env vars set on host
[ ] DB backups scheduled
[ ] Sentry capturing errors
[ ] Load test passed at 500 req/s
```

---

## Bonus

### Interview Questions (500+)
**Definition:** A curated bank of technical interview questions spanning JS, React, Node, databases, and system design.
**Workflow:** Practice topic-by-topic → simulate timed mock interviews → review weak areas repeatedly.
**Use case:** A developer preparing for interviews works through JavaScript closures and React hooks questions before mock system design rounds.
**Example:**
```
Q: What is a closure in JavaScript?
A: A function that retains access to its lexical scope even after the outer function returns.
```

### Coding Standards
**Definition:** Agreed-upon conventions for writing consistent, readable code across a team (naming, formatting, structure).
**Workflow:** Adopt a style guide → enforce via linter/formatter (ESLint/Prettier) → review in PRs.
**Use case:** An ESLint config with team-agreed rules automatically flags inconsistent code style before a PR can be merged.
**Example:**
```json
{ "extends": "airbnb", "rules": { "no-console": "warn" } }
```

### Folder Structures (Reference)
**Definition:** Common, battle-tested project layout patterns for frontend, backend, and mobile codebases.
**Workflow:** Choose a structure matching project size/type → apply consistently → document it for onboarding.
**Use case:** A new hire gets productive faster because the project follows a familiar, documented folder structure instead of an ad hoc layout.
**Example:**
```
/src /components /hooks /pages /services /utils
```

### Naming Conventions
**Definition:** Consistent rules for naming variables, functions, files, and database fields.
**Workflow:** Agree on casing conventions (camelCase, PascalCase, snake_case) per context → apply consistently → enforce via linting where possible.
**Use case:** A team uses `camelCase` for JS variables, `PascalCase` for React components, and `snake_case` for database columns — consistently across the whole codebase.
**Example:**
```js
const userName = "Vishnu";       // camelCase
function UserCard() {}           // PascalCase (component)
// DB column: user_name           // snake_case
```

### Design Patterns
**Definition:** Reusable, proven solutions to common software design problems (Singleton, Factory, Observer, etc.).
**Workflow:** Recognize a recurring problem → apply the matching pattern → implement without over-engineering simple cases.
**Use case:** A notification system uses the Observer pattern so multiple subscribers (email, push, SMS) react to the same event without tight coupling.
**Example:**
```js
class EventEmitter {
  on(event, cb) { /* subscribe */ }
  emit(event, data) { /* notify all subscribers */ }
}
```

### Best Practices
**Definition:** Industry-accepted approaches that tend to produce more maintainable, secure, and performant software.
**Workflow:** Learn established practices for your stack → apply them by default → revisit and update as the ecosystem evolves.
**Use case:** A developer defaults to input validation and parameterized queries on every new endpoint as standard practice, not an afterthought.
**Example:**
```js
// Always validate before processing:
if (!req.body.email) return res.status(400).send('Email required');
```

### Real-world Case Studies
**Definition:** Analysis of how real companies solved specific engineering challenges at scale.
**Workflow:** Study the problem context → understand the solution and trade-offs made → extract transferable lessons.
**Use case:** Reading how a company migrated from a monolith to microservices helps a team avoid similar pitfalls in their own migration.
**Example:**
```
Case: Netflix migrated from monolith to microservices
Lesson: they moved incrementally, service by service, not all at once
```

### Troubleshooting Guide
**Definition:** A structured reference for diagnosing and resolving common production issues.
**Workflow:** Reproduce the issue → check logs/metrics → narrow down the root cause → apply and verify a fix.
**Use case:** A "500 error spike" playbook guides an on-call engineer through checking recent deploys, DB connections, and third-party API status in order.
**Example:**
```
1. Check recent deploys (rollback candidate?)
2. Check DB connection pool
3. Check third-party API status pages
```

### Cheat Sheets
**Definition:** Quick-reference summaries of syntax, commands, or concepts for fast lookup without deep re-reading.
**Workflow:** Compile the most frequently needed commands/snippets per topic → keep updated as tools evolve.
**Use case:** A Git cheat sheet sits open in a second monitor, saving a developer from searching documentation for the correct rebase command.
**Example:**
```bash
git rebase -i HEAD~3   # interactive rebase last 3 commits
git stash               # save uncommitted changes
git cherry-pick <hash>  # apply a specific commit
```

---

*End of roadmap. Each section pairs a concise explanation with a runnable/study example. For deep dives with full code walkthroughs on any specific topic (e.g., AI Agents, RAG pipelines, or a specific Part), just ask.*
