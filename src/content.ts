import type {
  Certification,
  Lang,
  NodeId,
  PipelineStage,
  Project,
  SkillGroup,
} from './types'

/**
 * Every word on the site lives here, in both languages, side by side so the
 * two never drift apart.
 *
 * Facts come from the CV, the DevOps Lab presentation deck, and the public
 * repositories. Nothing is invented — in particular the pipeline stages and the
 * test count were read out of `devops-lap`'s Jenkinsfile and test file, not out
 * of the slides.
 */

export const IDENTITY = {
  name: 'Ibrahima Diallo',
  role: { fr: 'Junior DevOps / DevSecOps Engineer', en: 'Junior DevOps / DevSecOps Engineer' },
  email: 'ibrahimadiallo1208@gmail.com',
  phone: '+221 76 881 59 72',
  phoneHref: '+221768815972',
  whatsapp: 'https://wa.me/221768815972',
  whatsappPrefilled:
    'https://wa.me/221768815972?text=Bonjour%20Ibrahima%2C%20je%20viens%20de%20voir%20votre%20portfolio.',
  city: 'Sangalkam, Dakar',
  postcode: '20000',
  country: { fr: 'Sénégal', en: 'Senegal' },
  github: 'https://github.com/brojalloo',
  githubHandle: 'brojalloo',
  linkedin: 'https://www.linkedin.com/in/ibrahima-diallo9147a6301',
  cv: 'CV-Ibrahima-Diallo.pdf',
  photo: 'img/ibrahima-diallo-640.jpg',
  photo2x: 'img/ibrahima-diallo-1280.jpg',
  /** Approximate, for the HUD coordinate readout. Sangalkam, Dakar region. */
  coords: '14.7889°N 17.2231°W',
} as const

/** The nine Jenkins stages, in the order they appear in the Jenkinsfile. */
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

/** The tool chain, as it flows. Rendered as a vertical diagram. */
export const ARCHITECTURE = [
  { key: 'github', label: 'GitHub', group: 'source' },
  { key: 'jenkins', label: 'Jenkins', group: 'ci' },
  { key: 'tests', label: 'Tests Jest', group: 'ci' },
  { key: 'sonarqube', label: 'SonarQube', group: 'quality' },
  { key: 'quality', label: 'Quality Gate', group: 'quality' },
  { key: 'build', label: 'Docker Build', group: 'build' },
  { key: 'trivy', label: 'Trivy', group: 'security' },
  { key: 'compose', label: 'Docker Compose', group: 'deploy' },
  { key: 'app', label: 'API Node.js + PostgreSQL', group: 'deploy' },
  { key: 'metrics', label: 'Prometheus / Grafana', group: 'observe' },
  { key: 'sentry', label: 'Sentry', group: 'observe' },
] as const

/** Certifications, most recent first. Dates exactly as issued. */
export const CERTIFICATIONS: Certification[] = [
  { key: 'entrepreneurship', name: "Découvrir l'esprit d'entreprise", issuer: 'Cisco Networking Academy', date: '2025-09' },
  { key: 'ccna2', name: 'CCNA 2', issuer: 'Cisco Networking Academy', date: null, featured: true },
  { key: 'ai', name: 'Introduction to Modern AI', issuer: 'Cisco Networking Academy', date: '2025-08' },
  { key: 'cyberthreat', name: 'Cybermenace : Contenu et Déroulement', issuer: 'Cisco Networking Academy', date: '2025-08' },
  { key: 'ethicalhacker', name: 'Ethical Hacker', issuer: 'Cisco Networking Academy', date: '2025-08', featured: true },
  { key: 'ccna1', name: 'CCNA 1 : Présentation des réseaux', issuer: 'Cisco Networking Academy', date: '2025-08', featured: true },
  { key: 'introcyber', name: 'Introduction to Cyber Security', issuer: 'Cisco Networking Academy', date: '2024-12', featured: true },
  { key: 'analyste', name: 'Analyste Junior en Cybersécurité', issuer: 'FORCE-N', date: '2024-12', featured: true },
]

export const PROJECTS: Project[] = [
  {
    key: 'devopsLab',
    name: 'DevOps Lab',
    repo: 'https://github.com/brojalloo/devops-lap',
    stack: [
      'Jenkins',
      'Docker',
      'Node.js',
      'Express',
      'PostgreSQL',
      'SonarQube',
      'Trivy',
      'Prometheus',
      'Grafana',
      'Sentry',
      'Terraform',
    ],
    year: '2026',
    featured: true,
    highlights: ['stages', 'gate', 'observability', 'secrets'],
  },
  {
    key: 'oncc',
    name: 'ONCC Sénégal',
    repo: 'https://github.com/brojalloo/oncc-senegal-laravel',
    stack: ['Laravel 12', 'PHP 8.2', 'PostgreSQL', 'Docker', 'GitHub Actions', 'Leaflet'],
    year: '2026',
    highlights: ['roles', 'data', 'infra', 'ci'],
  },
  {
    key: 'tekkiProSaas',
    name: 'TekkiPro',
    repo: 'https://github.com/brojalloo/tekkipro',
    stack: ['Node.js', 'Express', 'Prisma', 'React', 'React Native', 'PostgreSQL'],
    year: '2026',
    highlights: ['monorepo', 'api', 'mobile', 'ci'],
  },
  {
    key: 'senRecrutement',
    name: 'Sen-Recrutement',
    repo: 'https://github.com/brojalloo/Sen-Recrutement',
    stack: ['Laravel', 'PHP', 'Docker', 'Render'],
    year: '2026',
    highlights: ['scope', 'container', 'deploy'],
  },
  {
    key: 'tekkiPro',
    name: 'TekkiPro — version desktop',
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
      { name: 'GitHub Actions', note: 'workflows' },
      { name: 'Git', note: 'versioning' },
      { name: 'GitHub', note: 'remote' },
    ],
  },
  {
    key: 'containers',
    items: [
      { name: 'Docker', note: 'images' },
      { name: 'Docker Compose', note: 'orchestration' },
    ],
  },
  {
    key: 'devsecops',
    items: [
      { name: 'SonarQube', note: 'quality gate' },
      { name: 'Trivy', note: 'CVE scan' },
      { name: 'Sentry', note: 'errors' },
    ],
  },
  {
    key: 'monitoring',
    items: [
      { name: 'Prometheus', note: 'metrics' },
      { name: 'Grafana', note: 'dashboards' },
      { name: 'Node Exporter', note: 'host' },
      { name: 'cAdvisor', note: 'containers' },
    ],
  },
  {
    key: 'infra',
    items: [
      { name: 'Terraform', note: 'IaC' },
      { name: 'Nginx', note: 'reverse proxy' },
      { name: 'Linux', note: 'système' },
    ],
  },
  {
    key: 'networks',
    items: [
      { name: 'Réseaux informatiques' },
      { name: 'CCNA 1', note: 'Cisco' },
      { name: 'CCNA 2', note: 'Cisco' },
    ],
  },
  {
    key: 'security',
    items: [
      { name: 'Ethical Hacker', note: 'Cisco' },
      { name: 'Introduction to Cyber Security', note: 'Cisco' },
      { name: 'Analyste Junior', note: 'FORCE-N' },
    ],
  },
  {
    key: 'backend',
    items: [
      { name: 'Node.js / Express', note: 'API' },
      { name: 'Laravel', note: 'PHP' },
      { name: 'React', note: 'web' },
      { name: 'React Native', note: 'mobile' },
      { name: 'Prisma', note: 'ORM' },
      { name: 'Java', note: 'desktop' },
      { name: 'Python', note: 'scripting' },
      { name: 'HTML / CSS' },
    ],
  },
  {
    key: 'data',
    items: [
      { name: 'PostgreSQL' },
      { name: 'SQLite' },
    ],
  },
  {
    key: 'office',
    items: [{ name: 'Excel' }, { name: 'Word' }, { name: 'PowerPoint' }],
  },
]

/** Studies and work, most recent first. */
export const TIMELINE = [
  { key: 'master2', period: 'août 2026 →', place: 'Université Numérique Cheikh Hamidou Kane, Keur Massar', kind: 'study' },
  { key: 'master1', period: 'mai 2025 — juin 2026', place: 'Université Numérique Cheikh Hamidou Kane, Keur Massar', kind: 'study' },
  { key: 'l2cyber', period: 'oct. 2024 — juil. 2025', place: "Institut Supérieur d'Informatique, Keur Massar", kind: 'study' },
  { key: 'l1cyber', period: 'nov. 2023 — juil. 2024', place: 'Université Numérique Cheikh Hamidou Kane, Keur Massar', kind: 'study' },
  { key: 'l3eco', period: 'sept. 2022 — juil. 2023', place: 'Université Numérique Cheikh Hamidou Kane, Keur Massar', kind: 'study' },
  { key: 'stage', period: '2022 — 2023', place: 'Grossiste, Rufisque', kind: 'work' },
  { key: 'l2aes', period: 'sept. 2021 — juil. 2022', place: "Institut Supérieur d'Informatique, Keur Massar", kind: 'study' },
  { key: 'l1aes', period: 'janv. 2021 — août 2021', place: 'Université Numérique Cheikh Hamidou Kane, Keur Massar', kind: 'study' },
  { key: 'bac', period: 'oct. 2019 — sept. 2020', place: 'Lycée de Sangalkam, Rufisque', kind: 'study' },
] as const

/** Results actually observed. Nothing here is aspirational. */
export const PROOFS = [
  'jenkins',
  'tests',
  'sonar',
  'trivy',
  'docker',
  'prometheus',
  'grafana',
  'nodeexporter',
  'cadvisor',
  'sentry',
  'terraform',
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
    nodes: 'Sections',
    back: "Retour à la vue d'ensemble",
    backShort: "Vue d'ensemble",
    escape: 'Échap pour revenir',
    drag: 'Glisser pour tourner · Cliquer un nœud pour ouvrir',
    lang: 'English',
    langLabel: 'Passer le site en anglais',
    close: 'Fermer le panneau',
  },
  hero: {
    role: 'Junior DevOps / DevSecOps Engineer',
    keywords: 'CI/CD · Docker · Linux · Cybersécurité · Monitoring · Terraform',
    tagline:
      'Je construis des environnements DevOps pratiques autour de la CI/CD, de la sécurité, du monitoring et de l’automatisation.',
  },
  nodes: {
    whoami: { title: 'À propos', legend: 'whoami' },
    arsenal: { title: 'Compétences', legend: 'skills' },
    certifications: { title: 'Certifications', legend: 'certs' },
    projets: { title: 'Projets', legend: 'projects' },
    pipeline: { title: 'DevOps Lab', legend: 'devops-lab' },
    parcours: { title: 'Parcours', legend: 'parcours' },
    contact: { title: 'Contact', legend: 'contact' },
  } satisfies Record<NodeId, { title: string; legend: string }>,

  whoami: {
    kicker: 'Junior DevOps / DevSecOps · Dakar',
    heading:
      'Je viens de l’économie. J’en ai gardé l’habitude de comprendre un système avant de le toucher.',
    photoAlt: 'Ibrahima Diallo, portrait professionnel',
    body: [
      'Je suis étudiant en Master 2 d’Économie de l’environnement et du développement durable, après deux années de licence en cybersécurité. Ce parcours en apparence décousu a une logique : trois ans à analyser des organisations m’ont appris à chercher pourquoi un système casse. Depuis 2023, les systèmes que j’analyse sont techniques.',
      'Je développe mes compétences en DevOps, DevSecOps, automatisation, conteneurs, CI/CD, monitoring et Infrastructure as Code à travers des projets pratiques et des laboratoires techniques. Je n’apprends pas les outils dans le vide : je les mets en service sur mes propres projets jusqu’à ce qu’ils tiennent.',
      'Mon laboratoire DevOps couvre la chaîne complète — build, tests, analyse qualité, portes de sécurité, déploiement, monitoring et observabilité. Mon second projet est un logiciel de gestion livré en application installable pour des commerçants.',
      'Je cherche une alternance ou un stage en DevOps, DevSecOps, cloud, infrastructure ou administration système, à Dakar ou à distance.',
    ],
    facts: [
      { label: 'Poste visé', value: 'Junior DevOps / DevSecOps' },
      { label: 'Formation', value: 'Master 2 Économie de l’environnement · Licence 1 & 2 Cybersécurité' },
      { label: 'Base', value: 'Sangalkam, Dakar' },
      { label: 'Langues', value: 'Français, Anglais' },
    ],
    path: {
      title: 'Une progression, pas une hésitation',
      steps: ['Économie', 'Cybersécurité', 'Réseaux', 'Développement', 'DevOps', 'DevSecOps / Cloud'],
      note:
        'Chaque étape a laissé quelque chose : l’économie l’analyse des systèmes, la cybersécurité le réflexe de la menace, les réseaux les fondations, le développement la pratique du code. Le DevOps est l’endroit où tout cela sert en même temps.',
    },
  },

  pipeline: {
    kicker: 'Projet principal · devops-lap',
    heading:
      'Neuf étapes entre un commit et la production. Deux d’entre elles ont le droit de tout arrêter.',
    intro:
      'Laboratoire DevOps complet permettant d’automatiser le build, les tests, l’analyse qualité, la sécurité, le déploiement, le monitoring et l’observabilité d’une API Node.js/PostgreSQL. Faites défiler pour parcourir la chaîne, étape par étape.',
    gateNote:
      'Trivy scanne l’image après sa construction avec --severity CRITICAL --exit-code 1. Une vulnérabilité critique fait échouer le build : rien ne part en production.',
    stageDetail: {
      checkout: {
        title: 'Checkout',
        body: 'Récupération automatique du code depuis GitHub. Le Jenkinsfile est versionné avec l’application, donc le pipeline évolue en même temps qu’elle.',
      },
      install: {
        title: 'Install',
        body: 'npm ci plutôt que npm install : l’installation suit le package-lock.json à la lettre et repart d’un node_modules vide. Deux builds du même commit donnent le même arbre de dépendances.',
      },
      test: {
        title: 'Test',
        body: 'Exécution des tests Jest avant toute livraison. Cinq tests couvrent /health, la route racine, /db-health, la lecture et la création de produits. Un test rouge arrête le pipeline avant l’analyse qualité.',
      },
      sonar: {
        title: 'SonarQube Analysis',
        body: 'Analyse de la qualité et de la dette technique : bugs, code smells, duplication. SonarQube tourne en conteneur dans le compose.yml du projet, sous la clé DevOps-Lab-API.',
      },
      gate: {
        title: 'Quality Gate',
        body: 'La porte de qualité, en mode bloquant (abortPipeline). Si le code passe sous le seuil, le pipeline s’arrête ici. C’est la différence entre mesurer la qualité et l’imposer.',
      },
      build: {
        title: 'Docker Build',
        body: 'Construction de l’image applicative depuis app/Dockerfile. À partir d’ici, ce qui circule dans le pipeline est un artefact, plus du code source.',
      },
      trivy: {
        title: 'Trivy Security Scan',
        body: 'Analyse des vulnérabilités de l’image Docker. Le rapport JSON est archivé dans Jenkins, puis un second passage sur les CRITICAL avec --exit-code 1 transforme le rapport en blocage : la faille ne peut pas atteindre la production.',
      },
      deploy: {
        title: 'Deploy',
        body: 'Déploiement avec Docker Compose. La DSN Sentry est injectée à cet instant par withCredentials, jamais écrite dans un fichier du dépôt.',
      },
      health: {
        title: 'Health Check',
        body: 'Vérification de l’API et de PostgreSQL, par curl sur /health et /db-health. Le pipeline ne se déclare pas réussi parce qu’il a fini, mais parce que l’application répond.',
      },
    } as Record<string, { title: string; body: string }>,
    architecture: {
      title: 'Architecture de la chaîne',
      note: 'Du dépôt jusqu’aux tableaux de bord, chaque brique passe la main à la suivante.',
      groups: {
        source: 'Source',
        ci: 'Intégration',
        quality: 'Qualité',
        build: 'Artefact',
        security: 'Sécurité',
        deploy: 'Livraison',
        observe: 'Observabilité',
      } as Record<string, string>,
    },
    proofs: {
      title: 'Résultats obtenus',
      note: 'Ce qui a réellement été exécuté et vérifié en local.',
      items: {
        jenkins: 'Pipeline Jenkins : SUCCESS',
        tests: 'Tests Jest : 5/5 passés',
        sonar: 'SonarQube : Quality Gate validé',
        trivy: 'Trivy : Security Gate CRITICAL actif',
        docker: 'Docker : image construite',
        prometheus: 'Prometheus : API monitorée',
        grafana: 'Grafana : dashboards actifs',
        nodeexporter: 'Node Exporter : métriques système',
        cadvisor: 'cAdvisor : métriques Docker',
        sentry: 'Sentry : erreur capturée',
        terraform: 'Terraform : init + validate réussis',
      } as Record<string, string>,
    },
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
      title: 'Ce que je surveille une fois déployé',
      rows: [
        { k: 'HTTP', v: 'Nombre de requêtes, durée, codes 4xx et 5xx' },
        { k: 'Hôte', v: 'CPU et mémoire, via Node Exporter' },
        { k: 'Conteneurs', v: 'CPU et mémoire par conteneur, via cAdvisor' },
        { k: 'Réseau', v: 'Trafic Docker entrant et sortant' },
        { k: 'Erreurs', v: 'Exceptions applicatives centralisées dans Sentry' },
      ],
      note:
        'Prometheus collecte, Grafana dessine, Sentry explique. Une métrique dit que le taux d’erreur monte ; Sentry dit quelle ligne de code en est responsable.',
    },
    status: {
      title: 'État réel du projet',
      done: 'Validé en local : pipeline Jenkins complet, Quality Gate, scan Trivy, dashboards Grafana, événement Sentry reçu, Terraform initialisé et validé.',
      next: 'Prochaine phase : provisionner deux VPS avec Terraform, réseau et accès SSH, puis y porter la chaîne complète.',
      doneLabel: 'Fait',
      nextLabel: 'En cours',
    },
    repo: 'Voir le dépôt sur GitHub',
  },

  arsenal: {
    kicker: 'Outils que j’ai réellement exécutés',
    heading: 'Chaque outil ci-dessous tourne dans un projet que vous pouvez ouvrir sur GitHub.',
    note:
      'Les compétences DevOps viennent du laboratoire que j’ai construit et exécuté, pas d’une liste de lecture.',
    groups: {
      cicd: 'CI/CD',
      containers: 'Conteneurs',
      devsecops: 'DevSecOps',
      monitoring: 'Monitoring & observabilité',
      infra: 'Infrastructure',
      networks: 'Réseaux',
      security: 'Cybersécurité',
      backend: 'Développement',
      data: 'Bases de données',
      office: 'Bureautique',
    } as Record<string, string>,
  },

  certifications: {
    kicker: 'Cisco Networking Academy · FORCE-N',
    heading: 'Huit certifications, dont cinq en réseaux et sécurité.',
    note:
      'Aucune date n’est indiquée pour le CCNA 2 : la formation est terminée, mais je préfère ne rien afficher que je ne puisse justifier.',
    completed: 'Terminé',
    featuredLabel: 'À retenir',
    count: 'certifications',
  },

  parcours: {
    kicker: 'Formation et expérience',
    heading: 'Un virage en 2023, et rien d’effacé avant.',
    studiesTitle: 'Formation',
    workTitle: 'Expérience professionnelle',
    entries: {
      master2: 'Master 2 — Économie de l’environnement et du développement durable',
      master1: 'Master 1 — Économie de l’environnement et du développement durable',
      l2cyber: 'Licence 2 — Cyber Security',
      l1cyber: 'Licence 1 — Cyber Security',
      l3eco: 'Licence 3 — Économie Appliquée',
      stage: 'Chargé de clientèle',
      l2aes: 'Licence 2 — Administration Économique et Sociale',
      l1aes: 'Licence 1 — Administration Économique et Sociale',
      bac: 'Baccalauréat — sciences humaines et sociales',
    } as Record<string, string>,
    kinds: { study: 'Formation', cert: 'Certification', work: 'Expérience' } as Record<string, string>,
  },

  projets: {
    kicker: `github.com/${IDENTITY.githubHandle}`,
    heading: 'Cinq projets, tous conteneurisés, testés et livrés par une chaîne automatisée.',
    open: 'Voir le dépôt',
    noRepo: 'Projet académique — dépôt non publié',
    featuredLabel: 'Projet principal',
    all: 'Voir tous mes projets GitHub',
    devopsLab: {
      summary:
        'Laboratoire DevOps complet permettant d’automatiser le build, les tests, l’analyse qualité, la sécurité, le déploiement, le monitoring et l’observabilité d’une API Node.js/PostgreSQL.',
      highlights: {
        stages: 'Pipeline Jenkins de neuf étapes, du checkout au health check',
        gate: 'Quality Gate SonarQube et scan Trivy tous deux bloquants',
        observability: 'Prometheus, Grafana, Node Exporter, cAdvisor et Sentry',
        secrets: 'Secrets injectés par credential Jenkins, jamais commités',
      } as Record<string, string>,
    },
    oncc: {
      summary:
        'Observatoire National sur les Changements Climatiques du Sénégal : une plateforme Laravel de collecte, d’analyse et de visualisation des données climatiques et économiques des quatorze régions du pays. C’est le projet où mon Master en économie de l’environnement et mon travail technique se rejoignent.',
      highlights: {
        roles: 'Quatre rôles — administrateur, chercheur, collectivité, public — dont les droits sont appliqués côté serveur, pas seulement masqués dans les vues',
        data: 'Saisie des données climatiques et économiques, puis validation par un administrateur ; cartographie Leaflet et graphiques Chart.js',
        infra: 'Image Docker complète : nginx, php-fpm et supervisord orchestrés dans le conteneur',
        ci: 'Trois workflows GitHub Actions — intégration, build d’image et déploiement — et 26 fichiers de test',
      } as Record<string, string>,
    },
    tekkiProSaas: {
      summary:
        'Version SaaS de TekkiPro : un monorepo réunissant trois applications — une API Node.js/Express avec Prisma, un client web React et un client mobile React Native. Pensé pour les marchés africains, en francs CFA.',
      highlights: {
        monorepo: 'Trois applications dans un dépôt : backend, frontend et mobile',
        api: 'API Express avec Prisma sur PostgreSQL, logique métier découpée par domaine',
        mobile: 'Client mobile React Native / Expo partageant le même contrat d’API',
        ci: 'CI GitHub Actions sur chaque push et pull request ; 21 fichiers de test',
      } as Record<string, string>,
    },
    senRecrutement: {
      summary:
        'Site de recrutement en ligne développé avec Laravel, né d’un projet académique de mon cursus en cybersécurité et poussé jusqu’à une chaîne de livraison conteneurisée.',
      highlights: {
        scope: 'Application Laravel complète, avec suite de tests PHPUnit',
        container: 'Dockerfile et docker-compose pour un environnement reproductible',
        deploy: 'Workflow GitHub Actions d’intégration et de déploiement, configuration Render',
      } as Record<string, string>,
    },
    tekkiPro: {
      summary:
        'La première version de TekkiPro : un logiciel de gestion de boutique en Java 21 et JavaFX, avec base SQLite locale, livré en version portable Windows qui se lance sans installation.',
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
    heading:
      'Vous souhaitez échanger sur un projet ou une opportunité ? Contactez-moi.',
    body:
      'DevOps, DevSecOps, cloud, infrastructure ou administration système — à Dakar ou à distance. Si vous voulez voir le laboratoire tourner en direct, je peux en faire la démonstration en une vingtaine de minutes.',
    labels: {
      email: 'E-mail',
      phone: 'Téléphone',
      whatsapp: 'WhatsApp',
      location: 'Localisation',
      github: 'GitHub',
      linkedin: 'LinkedIn',
    },
    whatsappCta: 'Me contacter sur WhatsApp',
    cv: 'Télécharger mon CV',
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
    nodes: 'Sections',
    back: 'Back to overview',
    backShort: 'Overview',
    escape: 'Esc to go back',
    drag: 'Drag to rotate · Click a node to open',
    lang: 'Français',
    langLabel: 'Switch the site to French',
    close: 'Close panel',
  },
  hero: {
    role: 'Junior DevOps / DevSecOps Engineer',
    keywords: 'CI/CD · Docker · Linux · Cybersecurity · Monitoring · Terraform',
    tagline:
      'I build practical DevOps environments around CI/CD, security, monitoring and automation.',
  },
  nodes: {
    whoami: { title: 'About', legend: 'whoami' },
    arsenal: { title: 'Skills', legend: 'skills' },
    certifications: { title: 'Certifications', legend: 'certs' },
    projets: { title: 'Projects', legend: 'projects' },
    pipeline: { title: 'DevOps Lab', legend: 'devops-lab' },
    parcours: { title: 'Background', legend: 'background' },
    contact: { title: 'Contact', legend: 'contact' },
  },

  whoami: {
    kicker: 'Junior DevOps / DevSecOps · Dakar',
    heading: 'I came from economics. It left me with the habit of understanding a system before touching it.',
    photoAlt: 'Ibrahima Diallo, professional portrait',
    body: [
      'I am a second-year Master’s student in Environmental Economics and Sustainable Development, after two years of undergraduate study in cybersecurity. That path looks scattered but it has a logic: three years analysing organisations taught me to look for why a system breaks. Since 2023 the systems I analyse have been technical ones.',
      'I am building skills in DevOps, DevSecOps, automation, containers, CI/CD, monitoring and Infrastructure as Code through practical projects and technical labs. I do not learn tools in the abstract: I run them on my own projects until they hold.',
      'My DevOps lab covers the full chain — build, tests, quality analysis, security gates, deployment, monitoring and observability. My second project is management software shipped as an installable application for shopkeepers.',
      'I am looking for an apprenticeship or internship in DevOps, DevSecOps, cloud, infrastructure or systems administration, in Dakar or remote.',
    ],
    facts: [
      { label: 'Target role', value: 'Junior DevOps / DevSecOps' },
      { label: 'Education', value: 'MSc year 2, Environmental Economics · Cyber Security years 1 & 2' },
      { label: 'Based in', value: 'Sangalkam, Dakar' },
      { label: 'Languages', value: 'French, English' },
    ],
    path: {
      title: 'A progression, not a hesitation',
      steps: ['Economics', 'Cybersecurity', 'Networks', 'Development', 'DevOps', 'DevSecOps / Cloud'],
      note:
        'Each step left something behind: economics the analysis of systems, cybersecurity the instinct for threat, networks the foundations, development the practice of code. DevOps is where all of it is useful at once.',
    },
  },

  pipeline: {
    kicker: 'Main project · devops-lap',
    heading: 'Nine stages between a commit and production. Two of them are allowed to stop everything.',
    intro:
      'A complete DevOps lab automating the build, tests, quality analysis, security, deployment, monitoring and observability of a Node.js/PostgreSQL API. Scroll to travel the chain, stage by stage.',
    gateNote:
      'Trivy scans the image after it is built, with --severity CRITICAL --exit-code 1. A critical vulnerability fails the build: nothing reaches production.',
    stageDetail: {
      checkout: {
        title: 'Checkout',
        body: 'The code is pulled automatically from GitHub. The Jenkinsfile is versioned with the application, so the pipeline evolves alongside it.',
      },
      install: {
        title: 'Install',
        body: 'npm ci rather than npm install: the install follows package-lock.json exactly and starts from an empty node_modules. Two builds of the same commit produce the same dependency tree.',
      },
      test: {
        title: 'Test',
        body: 'Jest tests run before any delivery. Five tests cover /health, the root route, /db-health, reading products and creating one. A failing test stops the pipeline before quality analysis.',
      },
      sonar: {
        title: 'SonarQube Analysis',
        body: 'Quality and technical debt analysis: bugs, code smells, duplication. SonarQube runs as a container in the project compose.yml, under the key DevOps-Lab-API.',
      },
      gate: {
        title: 'Quality Gate',
        body: 'The quality gate, in blocking mode (abortPipeline). If the code falls below the threshold, the pipeline stops here. That is the difference between measuring quality and enforcing it.',
      },
      build: {
        title: 'Docker Build',
        body: 'The application image is built from app/Dockerfile. From here on, what moves through the pipeline is an artifact, not source code.',
      },
      trivy: {
        title: 'Trivy Security Scan',
        body: 'Vulnerability scan of the Docker image. The JSON report is archived in Jenkins, then a second pass on CRITICAL findings with --exit-code 1 turns the report into a block: the flaw cannot reach production.',
      },
      deploy: {
        title: 'Deploy',
        body: 'Deployment with Docker Compose. The Sentry DSN is injected at this moment by withCredentials, never written into a file in the repository.',
      },
      health: {
        title: 'Health Check',
        body: 'The API and PostgreSQL are checked by curl on /health and /db-health. The pipeline does not call itself successful because it finished, but because the application answers.',
      },
    },
    architecture: {
      title: 'Chain architecture',
      note: 'From the repository through to the dashboards, each piece hands off to the next.',
      groups: {
        source: 'Source',
        ci: 'Integration',
        quality: 'Quality',
        build: 'Artifact',
        security: 'Security',
        deploy: 'Delivery',
        observe: 'Observability',
      },
    },
    proofs: {
      title: 'Results obtained',
      note: 'What was actually run and verified locally.',
      items: {
        jenkins: 'Jenkins pipeline: SUCCESS',
        tests: 'Jest tests: 5/5 passing',
        sonar: 'SonarQube: Quality Gate passed',
        trivy: 'Trivy: CRITICAL security gate active',
        docker: 'Docker: image built',
        prometheus: 'Prometheus: API monitored',
        grafana: 'Grafana: dashboards live',
        nodeexporter: 'Node Exporter: host metrics',
        cadvisor: 'cAdvisor: Docker metrics',
        sentry: 'Sentry: error captured',
        terraform: 'Terraform: init + validate successful',
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
    repo: 'View the repository on GitHub',
  },

  arsenal: {
    kicker: 'Tools I have actually run',
    heading: 'Every tool below runs in a project you can open on GitHub.',
    note: 'The DevOps skills come from the lab I built and ran, not from a reading list.',
    groups: {
      cicd: 'CI/CD',
      containers: 'Containers',
      devsecops: 'DevSecOps',
      monitoring: 'Monitoring & observability',
      infra: 'Infrastructure',
      networks: 'Networking',
      security: 'Cybersecurity',
      backend: 'Development',
      data: 'Databases',
      office: 'Office',
    },
  },

  certifications: {
    kicker: 'Cisco Networking Academy · FORCE-N',
    heading: 'Eight certifications, five of them in networking and security.',
    note:
      'No date is shown for CCNA 2: the course is complete, but I would rather show nothing than something I cannot evidence.',
    completed: 'Completed',
    featuredLabel: 'Key ones',
    count: 'certifications',
  },

  parcours: {
    kicker: 'Studies and experience',
    heading: 'A turn in 2023, and nothing erased before it.',
    studiesTitle: 'Studies',
    workTitle: 'Professional experience',
    entries: {
      master2: 'MSc year 2 — Environmental Economics and Sustainable Development',
      master1: 'MSc year 1 — Environmental Economics and Sustainable Development',
      l2cyber: 'Year 2 — Cyber Security',
      l1cyber: 'Year 1 — Cyber Security',
      l3eco: 'Year 3 — Applied Economics',
      stage: 'Account handler',
      l2aes: 'Year 2 — Economic and Social Administration',
      l1aes: 'Year 1 — Economic and Social Administration',
      bac: 'Baccalaureate — humanities and social sciences',
    },
    kinds: { study: 'Studies', cert: 'Certification', work: 'Experience' },
  },

  projets: {
    kicker: `github.com/${IDENTITY.githubHandle}`,
    heading: 'Five projects, all containerised, tested and shipped by an automated chain.',
    open: 'View repository',
    noRepo: 'Academic project — repository not published',
    featuredLabel: 'Main project',
    all: 'See all my GitHub projects',
    devopsLab: {
      summary:
        'A complete DevOps lab automating the build, tests, quality analysis, security, deployment, monitoring and observability of a Node.js/PostgreSQL API.',
      highlights: {
        stages: 'Nine-stage Jenkins pipeline, checkout through health check',
        gate: 'SonarQube Quality Gate and Trivy scan, both blocking',
        observability: 'Prometheus, Grafana, Node Exporter, cAdvisor and Sentry',
        secrets: 'Secrets injected by Jenkins credential, never committed',
      },
    },
    oncc: {
      summary:
        'Senegal’s National Observatory on Climate Change: a Laravel platform for collecting, analysing and visualising climate and economic data across the country’s fourteen regions. This is where my Master’s in environmental economics and my technical work meet.',
      highlights: {
        roles: 'Four roles — administrator, researcher, local authority, public — whose permissions are enforced server-side, not merely hidden in the views',
        data: 'Climate and economic data entry, then administrator validation; Leaflet mapping and Chart.js graphs',
        infra: 'Complete Docker image: nginx, php-fpm and supervisord orchestrated inside the container',
        ci: 'Three GitHub Actions workflows — integration, image build and deployment — and 26 test files',
      },
    },
    tekkiProSaas: {
      summary:
        'The SaaS version of TekkiPro: a monorepo holding three applications — a Node.js/Express API with Prisma, a React web client and a React Native mobile client. Built for African markets, in CFA francs.',
      highlights: {
        monorepo: 'Three applications in one repository: backend, frontend and mobile',
        api: 'Express API with Prisma on PostgreSQL, business logic split by domain',
        mobile: 'React Native / Expo mobile client sharing the same API contract',
        ci: 'GitHub Actions CI on every push and pull request; 21 test files',
      },
    },
    senRecrutement: {
      summary:
        'An online recruitment site built with Laravel, which began as an academic project in my cybersecurity coursework and was taken through to a containerised delivery chain.',
      highlights: {
        scope: 'Full Laravel application, with a PHPUnit test suite',
        container: 'Dockerfile and docker-compose for a reproducible environment',
        deploy: 'GitHub Actions integration and deployment workflow, Render configuration',
      },
    },
    tekkiPro: {
      summary:
        'The first version of TekkiPro: shop management software in Java 21 and JavaFX with a local SQLite database, shipped as a portable Windows build that runs without installation.',
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
    heading: 'Want to talk about a project or an opportunity? Get in touch.',
    body:
      'DevOps, DevSecOps, cloud, infrastructure or systems administration — in Dakar or remote. If you want to see the lab running live, I can walk through it in about twenty minutes.',
    labels: {
      email: 'Email',
      phone: 'Phone',
      whatsapp: 'WhatsApp',
      location: 'Location',
      github: 'GitHub',
      linkedin: 'LinkedIn',
    },
    whatsappCta: 'Message me on WhatsApp',
    cv: 'Download my CV',
    copy: 'Copy',
    copied: 'Copied',
  },

  fallback: {
    title: 'Simplified view',
    body: 'Your device or your preferences limit animation. All the content stays available below.',
  },
}

export const CONTENT: Record<Lang, Content> = { fr, en }

/** Month labels for certification dates, resolved per language. */
const MONTHS: Record<Lang, string[]> = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

/** `2025-08` → `août 2025`. Returns null when no date is claimed. */
export function formatCertDate(date: string | null, lang: Lang): string | null {
  if (!date) return null
  const [year, month] = date.split('-')
  const label = MONTHS[lang][Number(month) - 1]
  return label ? `${label} ${year}` : year
}
