require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Job = require('./models/Job');
const Application = require('./models/Application');

const USERS = [
  // Employers
  { name: 'Sarah Chen', email: 'sarah@stripedev.io', password: 'Password1!', role: 'employer', company: 'Stripe' },
  { name: 'James Okafor', email: 'james@linearapp.io', password: 'Password1!', role: 'employer', company: 'Linear' },
  { name: 'Priya Nair', email: 'priya@vercel.io', password: 'Password1!', role: 'employer', company: 'Vercel' },
  { name: 'Tobias Müller', email: 'tobias@supabase.io', password: 'Password1!', role: 'employer', company: 'Supabase' },
  { name: 'Aisha Rahman', email: 'aisha@planetscale.io', password: 'Password1!', role: 'employer', company: 'PlanetScale' },
  // Seekers
  { name: 'Alex Rivera', email: 'alex@devmail.io', password: 'Password1!', role: 'seeker' },
  { name: 'Morgan Liu', email: 'morgan@devmail.io', password: 'Password1!', role: 'seeker' },
  { name: 'Jordan Smith', email: 'jordan@devmail.io', password: 'Password1!', role: 'seeker' },
];

const JOB_SEEDS = [
  {
    employerIdx: 0, // Stripe
    title: 'Senior Frontend Engineer',
    location: 'Remote',
    type: 'full-time',
    description: `We're looking for a Senior Frontend Engineer to join our growth infrastructure team at Stripe.

You'll be working on the Stripe Dashboard — the command centre for millions of businesses worldwide. This means building complex, high-performance React applications that handle real-time financial data at scale.

Responsibilities:
- Lead the design and implementation of major Dashboard features
- Collaborate with product, design, and backend engineers
- Define frontend best practices and mentor junior engineers
- Improve rendering performance and Core Web Vitals across the Dashboard
- Ship reliable code with strong test coverage

What we're looking for:
- 5+ years of professional frontend engineering experience
- Expert knowledge of React, TypeScript, and modern CSS
- Experience with design systems and component libraries
- A track record of shipping impactful features in production
- Strong communication and collaborative skills`,
  },
  {
    employerIdx: 0, // Stripe
    title: 'Backend Engineer – Payments Core',
    location: 'San Francisco, CA',
    type: 'full-time',
    description: `Join Stripe's Payments Core team to build the infrastructure that processes hundreds of billions of dollars annually.

Your work will directly impact the reliability and performance of the world's most trusted payment platform. You'll design distributed systems that must handle millions of transactions per second with sub-millisecond latency.

Responsibilities:
- Design and own critical payments infrastructure services
- Lead technical discussions and write detailed design documents
- Debug complex production issues across distributed systems
- Improve system observability and on-call runbooks
- Mentor engineers and participate in structured interviews

Requirements:
- 4+ years of backend systems engineering experience
- Proficiency in Go, Java, or Scala
- Strong understanding of distributed systems, consensus algorithms, and fault tolerance
- Experience with high-throughput, low-latency service design`,
  },
  {
    employerIdx: 1, // Linear
    title: 'Product Engineer',
    location: 'Remote',
    type: 'full-time',
    description: `Linear is building the future of software project management. We're a small, focused team that cares deeply about craftsmanship and building tools developers actually love.

As a Product Engineer at Linear, you'll own entire product areas end-to-end — from database schema through API to polished UI. We don't have separate frontend and backend teams; we trust engineers to do both.

What you'll do:
- Design and build core product features from scratch
- Make architectural decisions that affect millions of developers
- Work closely with co-founders on product direction
- Write exceptionally clean, maintainable code
- Improve the performance and reliability of our Electron and web apps

Who you are:
- 3+ years of full-stack product engineering
- Comfortable with TypeScript, React, Node.js, and PostgreSQL
- You have strong opinions about developer tooling
- Obsessive about code quality and user experience`,
  },
  {
    employerIdx: 1, // Linear
    title: 'Infrastructure Engineer',
    location: 'Remote',
    type: 'full-time',
    description: `We're hiring an Infrastructure Engineer to help Linear scale reliably as our user base grows rapidly.

You'll own the infrastructure that keeps Linear fast and available for hundreds of thousands of engineering teams. Our stack runs on AWS and we use modern devops tooling throughout.

Key areas:
- Kubernetes cluster management and reliability engineering
- CI/CD pipeline optimisation and developer experience improvements
- Database performance tuning (PostgreSQL, Redis)
- Incident response, post-mortems, and reliability improvements
- Security hardening and compliance automation

What we need:
- 3+ years of infrastructure or platform engineering
- Strong Kubernetes and AWS experience
- Terraform and infrastructure-as-code mindset
- Experience running databases at scale
- On-call experience with complex distributed systems`,
  },
  {
    employerIdx: 2, // Vercel
    title: 'Developer Experience Engineer',
    location: 'Remote',
    type: 'full-time',
    description: `Vercel's mission is to enable the world to ship the best products. As a Developer Experience Engineer, you'll make that mission real by improving the tooling, documentation, and integrations that millions of developers use every day.

What you'll work on:
- Build and maintain official SDK integrations for Vercel's platform APIs
- Create compelling code examples and starter templates
- Contribute to Next.js open-source development
- Work with developer communities to understand pain points
- Write technical content and improve our documentation site

You'll thrive here if you:
- Have 3+ years of experience with JavaScript / TypeScript
- Love developer tooling and have strong opinions about DX
- Have experience contributing to open-source projects
- Can write clearly for a technical audience
- Are comfortable working asynchronously across timezones`,
  },
  {
    employerIdx: 2, // Vercel
    title: 'Frontend Engineer – Edge Runtime',
    location: 'Remote',
    type: 'full-time',
    description: `We're looking for a frontend engineer to work on Vercel's Edge Runtime — the technology that makes Next.js deployments blazingly fast anywhere in the world.

You'll build the developer-facing surfaces of our edge product: configuration UIs, analytics dashboards, and the tools teams use to manage their edge deployments.

Responsibilities:
- Build polished, high-performance React UIs for edge product features
- Collaborate with our Edge Runtime platform team on the developer APIs
- Improve the Vercel dashboard's performance metrics and loading experience
- Write integration and end-to-end tests for critical flows
- Participate in code review and help establish UI best practices

Requirements:
- Strong React and TypeScript skills
- Experience with performance optimisation (Core Web Vitals, bundle analysis)
- Familiarity with edge computing concepts is a bonus
- 2+ years of professional frontend development`,
  },
  {
    employerIdx: 3, // Supabase
    title: 'Full-Stack Engineer – Realtime',
    location: 'Remote',
    type: 'full-time',
    description: `Supabase is the open-source Firebase alternative. Our Realtime product lets developers build collaborative features like live cursors, multiplayer editing, and push notifications using Postgres.

We need a full-stack engineer to expand Realtime's capabilities and make it the default choice for real-time features on the web.

What you'll do:
- Extend Supabase Realtime's Elixir/Phoenix backend
- Build the client-side JavaScript SDKs that developers use
- Improve the Studio UI for configuring realtime channels
- Write comprehensive documentation and guides
- Engage with our open-source community on GitHub

What we're looking for:
- Comfortable with Elixir or Erlang (or willing to learn fast)
- Strong JavaScript / TypeScript for SDK work
- Experience with WebSockets and real-time systems
- Love for open-source and developer communities`,
  },
  {
    employerIdx: 3, // Supabase
    title: 'Postgres Engineer',
    location: 'Remote',
    type: 'full-time',
    description: `Supabase gives every project a full Postgres database. We're looking for a Postgres specialist to push the boundaries of what's possible with managed Postgres at scale.

You'll work on our database provisioning infrastructure, query performance tooling, and the extensions layer that makes Supabase Postgres uniquely powerful (pgvector, PostGIS, pg_cron, and more).

Responsibilities:
- Improve Supabase's Postgres provisioning and upgrade pipelines
- Build query analysis and performance tooling for the Studio
- Maintain and extend our custom Postgres extension suite
- Contribute to PGlite (Postgres in the browser) development
- Work with the infrastructure team on database HA and failover

Requirements:
- Deep knowledge of PostgreSQL internals and query planning
- Experience writing Postgres extensions in C or Rust
- Familiarity with replication, PITR, and HA setups
- Strong debugging skills for complex query performance issues`,
  },
  {
    employerIdx: 4, // PlanetScale
    title: 'Software Engineer – Query Engine',
    location: 'Remote',
    type: 'full-time',
    description: `PlanetScale is the most advanced serverless MySQL platform. We're hiring engineers to work on our distributed query engine built on top of Vitess.

You'll work on the systems that make PlanetScale scale to trillions of rows while maintaining strong consistency guarantees that developers can rely on.

What you'll be doing:
- Improve query planning and execution in our Vitess-based engine
- Build the non-blocking schema migrations that PlanetScale is famous for
- Work on our connection pooling and query routing layer
- Improve observability tooling for complex distributed queries
- Collaborate closely with the Vitess open-source community

Requirements:
- Strong Go engineering skills
- Experience with MySQL internals or distributed SQL systems
- Understanding of query optimisation, execution plans, and cardinality estimation
- Comfortable working in a distributed systems codebase`,
  },
  {
    employerIdx: 4, // PlanetScale
    title: 'Frontend Engineer – Console',
    location: 'Remote',
    type: 'contract',
    description: `We're hiring a contract Frontend Engineer to work on the PlanetScale Console — the web UI through which developers manage their databases, run queries, and analyse their data.

This is a 6-month contract with the possibility of converting to full-time based on performance.

What you'll work on:
- Build new Console features like enhanced query analytics and schema visualisation
- Improve the performance of our data browser for tables with millions of rows
- Write comprehensive tests for complex UI interactions
- Collaborate closely with our design team on a refreshed Console experience

Skills needed:
- Expert-level React and TypeScript
- Experience with data-heavy UIs (tables, charts, query editors)
- Strong CSS and animation skills
- Attention to detail and design sensibility`,
  },
  {
    employerIdx: 0, // Stripe
    title: 'Data Engineer – ML Platform',
    location: 'Seattle, WA',
    type: 'full-time',
    description: `Stripe's ML Platform team is looking for a Data Engineer to build the pipelines and infrastructure that power our machine learning systems — including fraud detection, revenue recognition, and intelligent routing.

Responsibilities:
- Design and maintain high-throughput data pipelines in Apache Spark and Flink
- Build feature stores and training data pipelines for ML teams
- Improve data quality monitoring and alerting infrastructure
- Collaborate with ML engineers to optimise model training workflows
- Participate in on-call rotation for data infrastructure

Requirements:
- 3+ years of data engineering experience
- Proficiency with Spark, Flink, or similar distributed processing systems
- Experience with data warehouses (Redshift, BigQuery, or Snowflake)
- Comfortable with Python and SQL at scale
- Understanding of ML pipelines and feature engineering`,
  },
  {
    employerIdx: 2, // Vercel
    title: 'Engineering Manager – Growth',
    location: 'New York, NY',
    type: 'full-time',
    description: `Vercel is looking for an Engineering Manager to lead our Growth engineering team. This team owns the onboarding funnel, conversion experiments, and the integrations marketplace.

You'll partner directly with the Head of Growth to set technical strategy while also staying close to the code through design reviews and pair programming sessions.

What success looks like:
- Your team ships high-quality experiments and features weekly
- Engineers grow technically and in their careers under your leadership
- You establish engineering best practices that spread across the org
- Team reliability improves through better on-call processes

Requirements:
- 5+ years of software engineering experience
- 2+ years of engineering management experience
- Strong technical depth in TypeScript and React
- Experience running growth or product engineering teams
- Excellent communication and stakeholder management skills`,
  },
  {
    employerIdx: 1, // Linear
    title: 'iOS Engineer',
    location: 'Remote',
    type: 'full-time',
    description: `Linear is building a native iOS app that brings our product management experience to mobile. We're looking for an iOS engineer who cares deeply about craftsmanship and performance.

You'll be one of the first engineers on the iOS team, which means significant ownership and influence over the architecture and product direction.

What you'll build:
- A fast, fluid native iOS app using SwiftUI and UIKit where appropriate
- Offline-first data sync using our GraphQL API
- Rich notification and background processing features
- Drag-and-drop interfaces for issue management

Who we want:
- 4+ years of iOS development experience
- Expert in SwiftUI and UIKit
- Strong understanding of Core Data or similar persistence layers
- Experience with real-time sync and offline-first architectures
- An eye for design and obsession with performance`,
  },
  {
    employerIdx: 3, // Supabase
    title: 'Developer Advocate',
    location: 'Remote',
    type: 'full-time',
    description: `Supabase is hiring a Developer Advocate to grow our community of developers building on Supabase. You'll be the bridge between our engineering team and the developer community.

What you'll do:
- Create technical content: tutorials, videos, live streams, and blog posts
- Represent Supabase at conferences and developer events worldwide
- Build sample applications that showcase Supabase capabilities
- Gather community feedback and bring it back to the product team
- Grow and nurture our Discord and GitHub communities

Who you are:
- A developer first — you should be comfortable writing code
- Experience with Supabase, Firebase, or similar BaaS platforms
- Strong communication skills in written and spoken English
- Comfortable on camera and on stage
- Genuine passion for developer education and community`,
  },
  {
    employerIdx: 4, // PlanetScale
    title: 'Backend Engineer – API Platform',
    location: 'Remote',
    type: 'part-time',
    description: `PlanetScale is looking for a part-time Backend Engineer to help expand our public API platform. This role is ideal for an experienced engineer who wants to work 20 hours per week on meaningful infrastructure work.

The API platform powers all integrations with PlanetScale — from Terraform providers to GitHub Actions to third-party database management tools.

You'll own:
- Design and implementation of new API endpoints
- API versioning strategy and backwards-compatibility guarantees
- Rate limiting, authentication, and access control improvements
- Developer-facing documentation and OpenAPI spec maintenance

Requirements:
- 4+ years of backend engineering
- Strong Go or Ruby experience
- Familiarity with REST API design best practices
- Experience with API versioning and deprecation strategies`,
  },
  {
    employerIdx: 0, // Stripe
    title: 'Security Engineer – Application Security',
    location: 'Dublin, Ireland',
    type: 'full-time',
    description: `Stripe is looking for an Application Security Engineer to join our Security organisation in Dublin. You'll help protect the financial infrastructure of the internet.

Key responsibilities:
- Conduct security design reviews and threat modelling for new products
- Perform application penetration testing and coordinate bug bounty triage
- Build automated security scanning into our CI/CD pipelines
- Develop security libraries and frameworks used by product engineers
- Lead security incident response and post-mortem processes

What we're looking for:
- 5+ years of application security experience
- Strong understanding of web application vulnerabilities (OWASP Top 10)
- Experience with penetration testing and offensive security tooling
- Familiarity with cloud security (AWS or GCP)
- Strong communication skills to work with product teams`,
  },
  {
    employerIdx: 2, // Vercel
    title: 'Frontend Engineer',
    location: 'Remote',
    type: 'internship',
    description: `Vercel is offering a 3-month internship for a Frontend Engineering intern to work alongside our product team on real features that ship to millions of users.

What you'll work on:
- Build React components for the Vercel Dashboard
- Write automated tests for existing UI flows
- Contribute to our design system with new components
- Fix UI bugs and improve accessibility across the Dashboard
- Join regular design critiques and engineering discussions

What we're looking for:
- Currently pursuing a Computer Science or related degree
- Solid understanding of HTML, CSS, and JavaScript
- Familiarity with React and modern frontend tooling
- Curiosity, initiative, and a love for building great UIs

This internship is fully remote and compensated. There is a strong possibility of a return offer for exceptional interns.`,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      tlsInsecure: process.env.MONGO_TLS_INSECURE === 'true',
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Create users (let the pre-save hook hash passwords)
    const createdUsers = await User.insertMany(
      USERS.map((u) => ({ ...u })),
      { ordered: true }
    );

    // insertMany skips pre-save hooks, so we create them one by one
    await User.deleteMany({});
    const users = [];
    for (const u of USERS) {
      const user = await User.create(u);
      users.push(user);
      console.log(`Created user: ${user.name} (${user.role})`);
    }

    const employers = users.filter((u) => u.role === 'employer');
    const seekers = users.filter((u) => u.role === 'seeker');

    // Create jobs
    const jobs = [];
    for (const seed of JOB_SEEDS) {
      const employer = employers[seed.employerIdx];
      const job = await Job.create({
        title: seed.title,
        company: employer.company,
        location: seed.location,
        type: seed.type,
        description: seed.description,
        isActive: true,
        createdBy: employer._id,
      });
      jobs.push(job);
      console.log(`Created job: ${job.title} @ ${job.company}`);
    }

    console.log('\n--- Seed complete ---');
    console.log(`Users: ${users.length} (${employers.length} employers, ${seekers.length} seekers)`);
    console.log(`Jobs: ${jobs.length}`);
    console.log('\nTest accounts:');
    console.log('  Employer: sarah@stripedev.io / Password1!');
    console.log('  Employer: james@linearapp.io / Password1!');
    console.log('  Seeker:   alex@devmail.io   / Password1!');
    console.log('  Seeker:   morgan@devmail.io  / Password1!');

  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDB connection closed');
  }
}

seed();
