import type { Lang, NodeId, PipelineStage, Project, SkillGroup } from './types'

/**
 * Every word on the site lives here, in both languages, side by side so the
 * two never drift apart. Facts come from the CV, the DevOps Lab presentation
 * deck, and the public repositories — nothing is invented.
 */

export const IDENTITY = {
  name: 'Ibrahima Diallo',
  email: 'ibrahimadiallo0899@gmail.com',
  phone: '+221 76 881 59 72',
  phoneHref: '+221768815972',
  city: 'Sangalcam, Dakar',
  country: { fr: 'Sénégal', en: 'Senegal' },
  github: 'https://github.com/brojalloo',
  githubHandle: 'brojalloo',
  linkedin: 'https://www.linkedin.com/in/ibrahima-diallo9147a6301',
  /** Approximate, for the HUD coordinate readout. Sangalcam, Dakar region. */
  coords: '14.7889°N 17.2231°W',
} as const

/** The nine Jenkins stages, in execution order. */
export const STAGES: PipelineStage[] = [
  { key: 'checkout', label: 'CHECKOUT' },
  { key: 'install', label: 'INSTALL' },
  { key: 'test', label: 'TEST' },
  { key: 'sonar', label: 'SONARQUBE' },
  { key: 'gate', label: 'QUALITY GATE' },
  { key: 'build', label: 'DOCKER BUILD' },
  { key: 'trivy', label: 'TRIVY', gate: true },
  { key: 'deploy', label: 'DEPLOY' },
  { key: 'health', label: 'HEALTH CHECK' },
]

export const PROJECTS: Project[] = [
  {
    key: 'devopsLab',
    name: 'DevOps Lab',
    repo: 'https://github.com/brojalloo/devops-lap',
    stack: ['Node.js', 'Express', 'PostgreSQL', 'Jenkins', 'Docker', 'Terraform'],
    year: '2026',
    highlights: ['stages', 'gate', 'observability', 'secrets'],
  },
  {
    key: 'tekkiPro',
    name: 'TekkiPro',
    repo: 'https://github.com/brojalloo/Ma-boutique-',
    stack: ['Java 21', 'JavaFX', 'SQLite'],
    year: '2026',
    highlights: ['modules', 'architecture', 'licensing', 'packaging'],
  },
]

export const SKILL_GROUPS: SkillGroup[] = [
  {
    key: 'cicd',
    items: [
      { name: 'Jenkins', note: 'pipeline' },
      { name: 'Git / GitHub', note: 'versioning' },
      { name: 'Docker', note: 'images' },
      { name: 'Docker Compose', note: 'orchestration' },
    ],
  },
  {
    key: 'security',
    items: [
      { name: 'Trivy', note: 'CVE scan' },
      { name: 'SonarQube', note: 'quality gate' },
      { name: 'Jenkins Credentials', note: 'secrets' },
      { name: 'Réseau / TCP-IP', note: 'fundamentals' },
    ],
  },
  {
    key: 'observability',
    items: [
      { name: 'Prometheus', note: 'metrics' },
      { name: 'Grafana', note: 'dashboards' },
      { name: 'Node Exporter', note: 'host' },
      { name: 'cAdvisor', note: 'containers' },
      { name: 'Sentry', note: 'errors' },
    ],
  },
  {
    key: 'build',
    items: [
      { name: 'Node.js / Express', note: 'API' },
      { name: 'Java / JavaFX', note: 'desktop' },
      { name: 'Python', note: 'scripting' },
      { name: 'PostgreSQL / SQLite', note: 'data' },
      { name: 'Terraform', note: 'IaC' },
    ],
  },
]

/** Ordered most recent first. */
export const TIMELINE = [
  { key: 'l2cyber', period: 'oct. 2024 →', place: 'Institut Supérieur d’Informatique, Keur Massar', kind: 'study' },
  { key: 'certCisco', period: 'déc. 2024', place: 'Cisco Networking Academy', kind: 'cert' },
  { key: 'certForceN', period: 'déc. 2024', place: 'FORCE-N', kind: 'cert' },
  { key: 'l1cyber', period: '2023 — 2024', place: 'Université Numérique Cheikh Hamidou Kane', kind: 'study' },
  { key: 'l3aes', period: '2022 — 2023', place: 'Université Numérique Cheikh Hamidou Kane', kind: 'study' },
  { key: 'stage', period: '2022 — 2023', place: 'Grossiste, Rufisque', kind: 'work' },
  { key: 'l2aes', period: '2021 — 2022', place: 'Institut Supérieur d’Informatique, Keur Massar', kind: 'study' },
  { key: 'assoc', period: '2021 — 2023', place: 'Association des jeunes de Sangalkam', kind: 'work' },
  { key: 'bac', period: '2019 — 2020', place: 'Lycée de Sangalcam, Rufisque', kind: 'study' },
] as const

// ---------------------------------------------------------------------------

const fr = {
  boot: {
    line1: 'Initialisation du laboratoire',
    line2: 'Chargement de la scène',
    enter: 'Entrer',
    hint: 'Faites glisser pour explorer',
  },
  hud: {
    location: 'Position',
    session: 'Session',
    nodes: 'Nœuds',
    back: 'Retour à la vue d’ensemble',
    backShort: 'Vue d’ensemble',
    escape: 'Échap pour revenir',
    drag: 'Glisser pour tourner · Cliquer un nœud pour ouvrir',
    lang: 'English',
    langLabel: 'Passer le site en anglais',
    close: 'Fermer le panneau',
  },
  hero: {
    role: 'Cybersécurité & DevSecOps',
    tagline:
      'J’ai construit, automatisé, sécurisé et observé une API de bout en bout. Voici la machine.',
  },
  nodes: {
    whoami: { title: 'Profil', legend: 'whoami' },
    pipeline: { title: 'Le pipeline', legend: 'pipeline' },
    arsenal: { title: 'Compétences', legend: 'arsenal' },
    parcours: { title: 'Parcours', legend: 'parcours' },
    projets: { title: 'Projets', legend: 'projets' },
    contact: { title: 'Contact', legend: 'contact' },
  } satisfies Record<NodeId, { title: string; legend: string }>,

  whoami: {
    kicker: 'Étudiant en cybersécurité, Dakar',
    heading: 'Je viens des sciences sociales. J’en ai gardé l’habitude de comprendre un système avant de le toucher.',
    body: [
      'J’ai commencé par une licence en Administration Économique et Sociale. Trois ans à analyser des organisations, à chercher pourquoi elles cassent. En 2023 j’ai basculé en cybersécurité, et la question est restée exactement la même — seuls les systèmes ont changé.',
      'Depuis, je construis. Un laboratoire DevOps complet, avec sa chaîne de livraison, ses portes de sécurité et son monitoring. Un logiciel de gestion pour les commerçants, livré en application installable. Je n’apprends pas les outils dans le vide : je les mets en production sur mes propres projets jusqu’à ce qu’ils tiennent.',
      'Je suis basé à Sangalcam, dans la région de Dakar, et je cherche une alternance ou un stage en sécurité opérationnelle, DevSecOps ou administration d’infrastructure.',
    ],
    facts: [
      { label: 'Formation', value: 'Licence 2 Cybersécurité' },
      { label: 'Base', value: 'Sangalcam, Dakar' },
      { label: 'Langues', value: 'Français, Anglais' },
      { label: 'Recherche', value: 'Alternance / stage' },
    ],
  },

  pipeline: {
    kicker: 'Projet principal · devops-lap',
    heading: 'Neuf étapes entre un commit et la production. Deux d’entre elles ont le droit de tout arrêter.',
    intro:
      'Le DevOps Lab est une API Node.js/Express avec PostgreSQL, livrée par un pipeline Jenkins que j’ai écrit et exécuté de bout en bout. Cliquez une étape pour voir ce qu’elle fait.',
    gateNote:
      'Trivy scanne l’image après sa construction avec --severity CRITICAL --exit-code 1. Une vulnérabilité critique fait échouer le build : rien ne part en production.',
    stageDetail: {
      checkout: {
        title: 'Checkout',
        body: 'Jenkins récupère le dépôt Git. Le Jenkinsfile est versionné avec le code, donc le pipeline évolue en même temps que l’application.',
      },
      install: {
        title: 'Install',
        body: 'npm ci plutôt que npm install : l’installation suit le package-lock.json à la lettre et repart d’un node_modules vide. Deux builds du même commit donnent exactement le même arbre de dépendances.',
      },
      test: {
        title: 'Test',
        body: 'npm test exécute la suite de tests automatisés de l’API. Un test rouge arrête le pipeline avant même l’analyse de qualité.',
      },
      sonar: {
        title: 'SonarQube',
        body: 'Analyse statique du code : bugs, code smells, duplication, dette technique. SonarQube tourne en conteneur dans le compose.yml du projet.',
      },
      gate: {
        title: 'Quality Gate',
        body: 'La porte de qualité. Si le code passe sous le seuil défini, le pipeline s’arrête ici. C’est la différence entre mesurer la qualité et l’imposer.',
      },
      build: {
        title: 'Docker Build',
        body: 'Construction de l’image applicative depuis app/Dockerfile. À partir d’ici, ce qui circule dans le pipeline est un artefact, plus du code source.',
      },
      trivy: {
        title: 'Trivy — Security Gate',
        body: 'Scan de vulnérabilités sur l’image construite. Le rapport JSON est archivé dans Jenkins. Le flag --exit-code 1 sur les CRITICAL transforme un rapport en blocage : la faille ne peut pas atteindre la production.',
      },
      deploy: {
        title: 'Deploy',
        body: 'Docker Compose redéploie l’API et sa base. La DSN Sentry est injectée à cet instant par withCredentials, jamais écrite dans un fichier du dépôt.',
      },
      health: {
        title: 'Health Check',
        body: 'Vérification de /health et /db-health. Le pipeline ne se déclare pas réussi parce qu’il a fini : il se déclare réussi parce que l’application répond.',
      },
    } as Record<string, { title: string; body: string }>,
    api: {
      title: 'Surface de l’API',
      rows: [
        { method: 'GET', route: '/health', desc: 'État de l’application' },
        { method: 'GET', route: '/db-health', desc: 'Connexion PostgreSQL' },
        { method: 'GET', route: '/products', desc: 'Lecture des produits' },
        { method: 'POST', route: '/products', desc: 'Création d’un produit' },
        { method: 'GET', route: '/metrics', desc: 'Métriques Prometheus' },
        { method: 'GET', route: '/sentry-test', desc: 'Erreur volontaire, pour valider Sentry' },
      ],
    },
    secrets: {
      title: 'Gestion du secret Sentry',
      steps: [
        'La DSN n’apparaît ni dans app.js, ni dans le Dockerfile, ni dans le Jenkinsfile.',
        'Jenkins la stocke dans une credential Secret Text nommée sentry-dsn.',
        'withCredentials injecte SENTRY_DSN uniquement pendant le déploiement.',
        'compose.yml transmet la variable au conteneur via ${SENTRY_DSN}.',
        '.gitignore exclut .env et ses variantes.',
      ],
    },
    observability: {
      title: 'Ce que je regarde une fois déployé',
      rows: [
        { k: 'HTTP', v: 'Nombre de requêtes, durée, codes 4xx et 5xx' },
        { k: 'Hôte', v: 'CPU et mémoire, via Node Exporter' },
        { k: 'Conteneurs', v: 'CPU et mémoire par conteneur, via cAdvisor' },
        { k: 'Réseau', v: 'Trafic Docker entrant et sortant' },
        { k: 'Erreurs', v: 'Exceptions applicatives centralisées dans Sentry' },
      ],
      note:
        'Prometheus collecte, Grafana dessine, Sentry raconte. Une métrique dit que le taux d’erreur monte ; Sentry dit quelle ligne de code en est responsable.',
    },
    status: {
      title: 'État réel du projet',
      done: 'Validé en local : pipeline Jenkins complet, Quality Gate, scan Trivy, dashboards Grafana, événement Sentry reçu, Terraform initialisé et validé.',
      next: 'Prochaine phase : provisionner deux VPS avec Terraform, réseau et accès SSH, puis y porter la chaîne complète.',
      doneLabel: 'Fait',
      nextLabel: 'En cours',
    },
  },

  arsenal: {
    kicker: 'Outils que j’ai réellement exécutés',
    heading: 'Chaque outil ci-dessous tourne dans un projet que vous pouvez ouvrir sur GitHub.',
    groups: {
      cicd: 'Livraison continue',
      security: 'Sécurité',
      observability: 'Observabilité',
      build: 'Développement',
    } as Record<string, string>,
  },

  parcours: {
    kicker: 'Formation, certifications, engagements',
    heading: 'Un virage à 2023, et rien d’effacé avant.',
    entries: {
      l2cyber: 'Licence 2 — Cybersécurité',
      certCisco: 'Introduction to Cyber Security',
      certForceN: 'Analyste Junior en Cybersécurité',
      l1cyber: 'Licence 1 — Cybersécurité',
      l3aes: 'Licence 3 — Administration Économique et Sociale',
      stage: 'Chargé de clientèle — stage',
      l2aes: 'Licence 2 — Administration Économique et Sociale',
      assoc: 'Membre du bureau — association de jeunes',
      bac: 'Baccalauréat — sciences humaines et sociales',
    } as Record<string, string>,
    kinds: { study: 'Formation', cert: 'Certification', work: 'Expérience' } as Record<string, string>,
  },

  projets: {
    kicker: `github.com/${IDENTITY.githubHandle}`,
    heading: 'Deux projets, deux métiers : tenir une infrastructure, et livrer un produit.',
    open: 'Voir le dépôt',
    devopsLab: {
      summary:
        'Une API Node.js/Express avec PostgreSQL, livrée par un pipeline Jenkins de neuf étapes. Le dépôt contient le Jenkinsfile, le Dockerfile, le compose.yml, la configuration SonarQube et les tests.',
      highlights: {
        stages: 'Pipeline Jenkins complet, du checkout au health check',
        gate: 'Quality Gate SonarQube et scan Trivy bloquants',
        observability: 'Prometheus, Grafana, Node Exporter, cAdvisor et Sentry',
        secrets: 'Secrets injectés par credential Jenkins, jamais commités',
      } as Record<string, string>,
    },
    tekkiPro: {
      summary:
        'Un logiciel de gestion de boutique pour commerçants, en Java 21 et JavaFX, avec base SQLite locale. Environ 266 Ko de code source, livré en version portable Windows qui se lance sans installation.',
      highlights: {
        modules: 'Tableau de bord, stock avec alertes, facturation, dettes, rapports',
        architecture: 'Séparation models / dao / views / config, accès aux données isolé',
        licensing: 'Génération et activation de clés de licence',
        packaging: 'Version portable Windows, base créée au premier lancement',
      } as Record<string, string>,
    },
  },

  contact: {
    kicker: 'Disponible pour une alternance ou un stage',
    heading: 'Écrivez-moi. Je réponds vite.',
    body:
      'Sécurité opérationnelle, DevSecOps, administration d’infrastructure — à Dakar ou à distance. Si vous voulez voir le laboratoire tourner en direct, je peux faire la démonstration en une vingtaine de minutes.',
    labels: {
      email: 'E-mail',
      phone: 'Téléphone',
      location: 'Localisation',
      github: 'GitHub',
      linkedin: 'LinkedIn',
    },
    cv: 'Télécharger le CV',
    copy: 'Copier',
    copied: 'Copié',
  },

  fallback: {
    title: 'Vue simplifiée',
    body: 'Votre appareil ou vos préférences limitent les animations. Tout le contenu reste accessible ci-dessous.',
  },
}

type Content = typeof fr

const en: Content = {
  boot: {
    line1: 'Bringing the lab online',
    line2: 'Loading the scene',
    enter: 'Enter',
    hint: 'Drag to explore',
  },
  hud: {
    location: 'Position',
    session: 'Session',
    nodes: 'Nodes',
    back: 'Back to overview',
    backShort: 'Overview',
    escape: 'Esc to go back',
    drag: 'Drag to rotate · Click a node to open',
    lang: 'Français',
    langLabel: 'Switch the site to French',
    close: 'Close panel',
  },
  hero: {
    role: 'Cybersecurity & DevSecOps',
    tagline: 'I built, automated, secured and observed an API end to end. Here is the machine.',
  },
  nodes: {
    whoami: { title: 'Profile', legend: 'whoami' },
    pipeline: { title: 'The pipeline', legend: 'pipeline' },
    arsenal: { title: 'Skills', legend: 'arsenal' },
    parcours: { title: 'Path', legend: 'path' },
    projets: { title: 'Projects', legend: 'projects' },
    contact: { title: 'Contact', legend: 'contact' },
  },

  whoami: {
    kicker: 'Cybersecurity student, Dakar',
    heading: 'I came from social science. It left me with the habit of understanding a system before touching it.',
    body: [
      'I started with a degree in Economic and Social Administration. Three years analysing organisations, looking for why they break. In 2023 I moved into cybersecurity, and the question stayed exactly the same — only the systems changed.',
      'Since then I build. A full DevOps lab, with its delivery chain, its security gates and its monitoring. A management application for shopkeepers, shipped as an installable program. I do not learn tools in the abstract: I run them on my own projects until they hold.',
      'I am based in Sangalcam, in the Dakar region, and I am looking for an apprenticeship or internship in security operations, DevSecOps or infrastructure administration.',
    ],
    facts: [
      { label: 'Studying', value: 'BSc year 2, Cybersecurity' },
      { label: 'Based in', value: 'Sangalcam, Dakar' },
      { label: 'Languages', value: 'French, English' },
      { label: 'Looking for', value: 'Apprenticeship / internship' },
    ],
  },

  pipeline: {
    kicker: 'Main project · devops-lap',
    heading: 'Nine stages between a commit and production. Two of them are allowed to stop everything.',
    intro:
      'The DevOps Lab is a Node.js/Express API with PostgreSQL, delivered by a Jenkins pipeline I wrote and ran end to end. Click a stage to see what it does.',
    gateNote:
      'Trivy scans the image after it is built, with --severity CRITICAL --exit-code 1. A critical vulnerability fails the build: nothing reaches production.',
    stageDetail: {
      checkout: {
        title: 'Checkout',
        body: 'Jenkins pulls the Git repository. The Jenkinsfile is versioned with the code, so the pipeline evolves alongside the application.',
      },
      install: {
        title: 'Install',
        body: 'npm ci rather than npm install: the install follows package-lock.json exactly and starts from an empty node_modules. Two builds of the same commit produce the same dependency tree.',
      },
      test: {
        title: 'Test',
        body: 'npm test runs the API test suite. A failing test stops the pipeline before quality analysis even begins.',
      },
      sonar: {
        title: 'SonarQube',
        body: 'Static analysis of the code: bugs, code smells, duplication, technical debt. SonarQube runs as a container in the project compose.yml.',
      },
      gate: {
        title: 'Quality Gate',
        body: 'The quality gate. If the code falls below the defined threshold, the pipeline stops here. That is the difference between measuring quality and enforcing it.',
      },
      build: {
        title: 'Docker Build',
        body: 'The application image is built from app/Dockerfile. From here on, what moves through the pipeline is an artifact, not source code.',
      },
      trivy: {
        title: 'Trivy — Security Gate',
        body: 'Vulnerability scan on the built image. The JSON report is archived in Jenkins. The --exit-code 1 flag on CRITICAL findings turns a report into a block: the flaw cannot reach production.',
      },
      deploy: {
        title: 'Deploy',
        body: 'Docker Compose redeploys the API and its database. The Sentry DSN is injected at this moment by withCredentials, never written into a file in the repository.',
      },
      health: {
        title: 'Health Check',
        body: 'Checks /health and /db-health. The pipeline does not call itself successful because it finished: it calls itself successful because the application answers.',
      },
    },
    api: {
      title: 'API surface',
      rows: [
        { method: 'GET', route: '/health', desc: 'Application status' },
        { method: 'GET', route: '/db-health', desc: 'PostgreSQL connection' },
        { method: 'GET', route: '/products', desc: 'Read products' },
        { method: 'POST', route: '/products', desc: 'Create a product' },
        { method: 'GET', route: '/metrics', desc: 'Prometheus metrics' },
        { method: 'GET', route: '/sentry-test', desc: 'Deliberate error, to verify Sentry' },
      ],
    },
    secrets: {
      title: 'Handling the Sentry secret',
      steps: [
        'The DSN appears in neither app.js, nor the Dockerfile, nor the Jenkinsfile.',
        'Jenkins stores it in a Secret Text credential named sentry-dsn.',
        'withCredentials injects SENTRY_DSN only during deployment.',
        'compose.yml passes the variable to the container via ${SENTRY_DSN}.',
        '.gitignore excludes .env and its variants.',
      ],
    },
    observability: {
      title: 'What I watch once it is deployed',
      rows: [
        { k: 'HTTP', v: 'Request count, duration, 4xx and 5xx codes' },
        { k: 'Host', v: 'CPU and memory, via Node Exporter' },
        { k: 'Containers', v: 'CPU and memory per container, via cAdvisor' },
        { k: 'Network', v: 'Docker traffic in and out' },
        { k: 'Errors', v: 'Application exceptions centralised in Sentry' },
      ],
      note:
        'Prometheus collects, Grafana draws, Sentry explains. A metric says the error rate is climbing; Sentry says which line of code is responsible.',
    },
    status: {
      title: 'Where the project actually stands',
      done: 'Validated locally: full Jenkins pipeline, Quality Gate, Trivy scan, Grafana dashboards, Sentry event received, Terraform initialised and validated.',
      next: 'Next phase: provision two VPS with Terraform, network and SSH access, then move the full chain onto them.',
      doneLabel: 'Done',
      nextLabel: 'In progress',
    },
  },

  arsenal: {
    kicker: 'Tools I have actually run',
    heading: 'Every tool below runs in a project you can open on GitHub.',
    groups: {
      cicd: 'Continuous delivery',
      security: 'Security',
      observability: 'Observability',
      build: 'Development',
    },
  },

  parcours: {
    kicker: 'Studies, certifications, involvement',
    heading: 'A turn in 2023, and nothing erased before it.',
    entries: {
      l2cyber: 'Year 2 — Cybersecurity',
      certCisco: 'Introduction to Cyber Security',
      certForceN: 'Junior Cybersecurity Analyst',
      l1cyber: 'Year 1 — Cybersecurity',
      l3aes: 'Year 3 — Economic and Social Administration',
      stage: 'Account handler — internship',
      l2aes: 'Year 2 — Economic and Social Administration',
      assoc: 'Board member — youth association',
      bac: 'Baccalaureate — humanities and social sciences',
    },
    kinds: { study: 'Studies', cert: 'Certification', work: 'Experience' },
  },

  projets: {
    kicker: `github.com/${IDENTITY.githubHandle}`,
    heading: 'Two projects, two jobs: keeping infrastructure alive, and shipping a product.',
    open: 'View repository',
    devopsLab: {
      summary:
        'A Node.js/Express API with PostgreSQL, delivered by a nine-stage Jenkins pipeline. The repository holds the Jenkinsfile, the Dockerfile, the compose.yml, the SonarQube configuration and the tests.',
      highlights: {
        stages: 'Full Jenkins pipeline, checkout through health check',
        gate: 'Blocking SonarQube Quality Gate and Trivy scan',
        observability: 'Prometheus, Grafana, Node Exporter, cAdvisor and Sentry',
        secrets: 'Secrets injected by Jenkins credential, never committed',
      },
    },
    tekkiPro: {
      summary:
        'Shop management software for retailers, in Java 21 and JavaFX, with a local SQLite database. Around 266 KB of source, shipped as a portable Windows build that runs without installation.',
      highlights: {
        modules: 'Dashboard, stock with low-stock alerts, invoicing, debts, reports',
        architecture: 'Separated models / dao / views / config, data access isolated',
        licensing: 'License key generation and activation',
        packaging: 'Portable Windows build, database created on first launch',
      },
    },
  },

  contact: {
    kicker: 'Available for an apprenticeship or internship',
    heading: 'Write to me. I answer quickly.',
    body:
      'Security operations, DevSecOps, infrastructure administration — in Dakar or remote. If you want to see the lab running live, I can walk through it in about twenty minutes.',
    labels: {
      email: 'Email',
      phone: 'Phone',
      location: 'Location',
      github: 'GitHub',
      linkedin: 'LinkedIn',
    },
    cv: 'Download CV',
    copy: 'Copy',
    copied: 'Copied',
  },

  fallback: {
    title: 'Simplified view',
    body: 'Your device or your preferences limit animation. All the content stays available below.',
  },
}

export const CONTENT: Record<Lang, Content> = { fr, en }

/** Convenience hook-free accessor for components that already know the lang. */
export function t(lang: Lang): Content {
  return CONTENT[lang]
}
