const SKILL_CATEGORIES = {
  Languages: [
    'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'golang',
    'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl',
    'bash', 'shell', 'powershell', 'html', 'css', 'sql', 'dart', 'elixir',
    'haskell', 'lua', 'groovy', 'vba', 'assembly',
  ],
  Frontend: [
    'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt.js', 'gatsby',
    'webpack', 'vite', 'redux', 'vuex', 'pinia', 'zustand', 'tailwind',
    'tailwindcss', 'bootstrap', 'sass', 'less', 'styled-components',
    'jquery', 'd3.js', 'three.js', 'webgl', 'electron', 'storybook',
    'remix', 'astro',
  ],
  Backend: [
    'node.js', 'express', 'fastapi', 'django', 'flask', 'spring', 'spring boot',
    'laravel', 'rails', 'asp.net', 'fastify', 'nestjs', 'hapi', 'koa',
    'gin', 'fiber', 'echo', 'actix', 'phoenix', 'sinatra',
    'microservices', 'rest api', 'graphql', 'grpc', 'websockets', 'celery',
  ],
  Databases: [
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite',
    'cassandra', 'dynamodb', 'firebase', 'supabase', 'cockroachdb',
    'neo4j', 'mariadb', 'oracle', 'mssql', 'sql server', 'prisma',
    'sequelize', 'mongoose', 'typeorm', 'hibernate', 'sqlalchemy',
  ],
  CloudDevOps: [
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'terraform',
    'ansible', 'puppet', 'chef', 'jenkins', 'github actions', 'gitlab ci',
    'circleci', 'travis ci', 'nginx', 'apache', 'linux', 'ubuntu',
    'ci/cd', 'helm', 'istio', 'prometheus', 'grafana', 'datadog',
    'cloudformation', 'pulumi',
  ],
  AIML: [
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
    'scikit-learn', 'pandas', 'numpy', 'scipy', 'opencv', 'nlp',
    'natural language processing', 'computer vision', 'data science',
    'neural networks', 'transformers', 'hugging face', 'llm', 'rag',
    'reinforcement learning', 'xgboost', 'lightgbm', 'mlflow', 'airflow',
    'spark', 'hadoop', 'kafka',
  ],
  Mobile: [
    'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic',
    'swiftui', 'jetpack compose', 'expo',
  ],
  Testing: [
    'jest', 'pytest', 'mocha', 'jasmine', 'cypress', 'selenium',
    'playwright', 'vitest', 'junit', 'testng', 'rspec',
    'unit testing', 'integration testing', 'e2e testing', 'tdd', 'bdd',
    'load testing', 'performance testing', 'postman',
  ],
  ToolsPractices: [
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence',
    'figma', 'swagger', 'openapi', 'agile', 'scrum', 'kanban',
    'devops', 'devsecops', 'solid principles', 'design patterns',
    'clean architecture', 'ddd', 'event-driven', 'cqrs',
    'code review', 'pair programming',
  ],
  Security: [
    'oauth', 'jwt', 'ssl', 'tls', 'encryption', 'cybersecurity',
    'penetration testing', 'owasp', 'sso', 'ldap', 'keycloak',
  ],
};

const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

module.exports = { ALL_SKILLS, SKILL_CATEGORIES };
