// lib/grading/prompts/subject-prompts.ts – subject-specific grading instructions

export interface SubjectPromptConfig {
  fach: string
  bewertungsDimensionen: string[]
  besonderheiten: string[]
  beispielKriterien: string[]
}

const SUBJECT_CONFIGS: Record<string, SubjectPromptConfig> = {
  Deutsch: {
    fach: 'Deutsch',
    bewertungsDimensionen: [
      'Inhalt und Themenerfassung',
      'Argumentation und Gedankenführung',
      'Textaufbau und Struktur',
      'Sprachlicher Ausdruck und Stil',
      'Grammatik und Syntax',
      'Rechtschreibung',
      'Zeichensetzung',
    ],
    besonderheiten: [
      'Inhaltliche Kernaussagen sind wichtiger als sprachliche Perfektion in unteren Klassen',
      'Kreativität und eigenständiges Denken positiv bewerten',
      'Bei Aufsätzen: Einleitung, Hauptteil, Schluss bewerten',
      'Zitate korrekt bewerten',
    ],
    beispielKriterien: [
      'Hat der Schüler das Thema vollständig erfasst?',
      'Ist die Argumentation logisch aufgebaut?',
      'Werden Beispiele sinnvoll eingesetzt?',
      'Ist der Ausdruck altersgemäß differenziert?',
    ],
  },
  Mathematik: {
    fach: 'Mathematik',
    bewertungsDimensionen: [
      'Korrektheit des Ergebnisses',
      'Rechenweg und Herleitung',
      'Anwendung der richtigen Formel/Methode',
      'Darstellung und Lesbarkeit',
      'Einheiten (falls zutreffend)',
    ],
    besonderheiten: [
      'WICHTIG: Rechenweg kann Punkte bringen, auch wenn Ergebnis falsch',
      'Alternative Lösungswege akzeptieren, wenn mathematisch korrekt',
      'Folgefehler: Wenn durch Rechenfehler falsche Zwischenergebnis weiterverwendet, nicht doppelt bestrafen',
      'Schreibfehler (z.B. vergessene Einheit) weniger stark bestrafen als Denkfehler',
    ],
    beispielKriterien: [
      'Wurde die richtige Formel angewendet?',
      'Ist der Rechenweg nachvollziehbar?',
      'Sind Zwischenergebnisse korrekt?',
      'Stimmt das Endergebnis?',
      'Sind Einheiten richtig angegeben?',
    ],
  },
  Englisch: {
    fach: 'Englisch',
    bewertungsDimensionen: [
      'Inhalt und Aufgabenerfüllung',
      'Grammatik (Korrektheit)',
      'Wortschatz (Vielfalt und Angemessenheit)',
      'Textfluss und Kohäsion',
      'Ausdruck und Stil',
      'Rechtschreibung',
    ],
    besonderheiten: [
      'Britisches und amerikanisches Englisch beide akzeptieren',
      'Kreative Ausdrucksweise positiv bewerten',
      'Systematische Fehler (z.B. immer falsches Tempus) weniger hart bestrafen',
      'Kommunikative Kompetenz über formale Korrektheit stellen in unteren Klassen',
    ],
    beispielKriterien: [
      'Wurde die Aufgabe vollständig beantwortet?',
      'Ist die Grammatik altersgemäß korrekt?',
      'Wird ein vielfältiger Wortschatz eingesetzt?',
      'Ist der Text flüssig und kohärent?',
    ],
  },
  Französisch: {
    fach: 'Französisch',
    bewertungsDimensionen: [
      'Inhalt und Aufgabenerfüllung',
      'Grammatik',
      'Wortschatz',
      'Orthographie',
      'Ausdruck und Stil',
    ],
    besonderheiten: [
      'Akzente (é, è, ê etc.) bei Bewertung berücksichtigen',
      'Verbkonjugation besonders prüfen',
    ],
    beispielKriterien: [],
  },
  Latein: {
    fach: 'Latein',
    bewertungsDimensionen: [
      'Übersetzungsgenauigkeit',
      'Sinngemäße Wiedergabe',
      'Grammatikkenntnisse',
      'Stilistik der Übersetzung',
    ],
    besonderheiten: [
      'Wörtliche Übersetzung vs. sinngemäße Übersetzung unterscheiden',
      'Grammatische Fehler nach Schwere gewichten',
    ],
    beispielKriterien: [],
  },
  Physik: {
    fach: 'Physik',
    bewertungsDimensionen: [
      'Fachwissen und Konzeptverständnis',
      'Rechenwege und Formeln',
      'Einheiten und Dimensionsanalyse',
      'Diagramme und Darstellungen',
      'Begründungen und Erklärungen',
    ],
    besonderheiten: [
      'Physikalische Einheiten sind Pflicht – Fehlen kostet Punkte',
      'Vorzeichen bei Vektoren prüfen',
      'Signifikante Stellen beachten',
      'Alltagsbeispiele positiv bewerten',
    ],
    beispielKriterien: [
      'Ist die richtige Formel angewendet?',
      'Sind Einheiten durchgehend korrekt?',
      'Ist die Begründung physikalisch korrekt?',
      'Sind Diagramme beschriftet?',
    ],
  },
  Chemie: {
    fach: 'Chemie',
    bewertungsDimensionen: [
      'Fachwissen',
      'Reaktionsgleichungen',
      'Stöchiometrie',
      'Sicherheitsbewusstsein',
      'Versuchsbeschreibungen',
    ],
    besonderheiten: [
      'Chemische Formeln und Gleichgewichtszeichen prüfen',
      'Zustände (fest, flüssig, gasförmig) beachten',
      'Aggregatzustände als Indizes korrekt darstellen',
    ],
    beispielKriterien: [],
  },
  Biologie: {
    fach: 'Biologie',
    bewertungsDimensionen: [
      'Fachwissen und Fachbegriffe',
      'Beschriftungen und Zeichnungen',
      'Erklärungen von Zusammenhängen',
      'Anwendung auf neue Situationen',
    ],
    besonderheiten: [
      'Fachbegriffe müssen korrekt verwendet werden',
      'Zeichnungen und Beschriftungen sind Teil der Bewertung',
    ],
    beispielKriterien: [],
  },
  Geschichte: {
    fach: 'Geschichte',
    bewertungsDimensionen: [
      'Faktenwissen',
      'Historisches Einordnungsvermögen',
      'Quellenkritik',
      'Argumentation',
      'Zeitlicher Kontext',
    ],
    besonderheiten: [
      'Unterschiedliche Perspektiven positiv bewerten',
      'Datumsfehler nach Schwere gewichten',
    ],
    beispielKriterien: [],
  },
  Geographie: {
    fach: 'Geographie',
    bewertungsDimensionen: [
      'Räumliche Orientierung',
      'Fachwissen',
      'Kartenarbeit',
      'Zusammenhänge und Erklärungen',
    ],
    besonderheiten: [],
    beispielKriterien: [],
  },
}

// Default for unknown subjects
const DEFAULT_CONFIG: SubjectPromptConfig = {
  fach: 'Allgemein',
  bewertungsDimensionen: [
    'Fachliches Wissen und Verständnis',
    'Aufgabenerfüllung und Vollständigkeit',
    'Korrektheit der Antworten',
    'Begründungen und Erklärungen',
    'Darstellung und Ausdruck',
  ],
  besonderheiten: [
    'Teilpunkte für unvollständige, aber richtige Ansätze vergeben',
    'Alternative richtige Lösungen akzeptieren',
  ],
  beispielKriterien: [],
}

export function getSubjectConfig(fach: string): SubjectPromptConfig {
  // Try exact match first, then partial
  return (
    SUBJECT_CONFIGS[fach] ||
    Object.values(SUBJECT_CONFIGS).find((c) =>
      fach.toLowerCase().includes(c.fach.toLowerCase())
    ) ||
    DEFAULT_CONFIG
  )
}

export function buildSubjectSection(fach: string, schwerpunkte: string[]): string {
  const config = getSubjectConfig(fach)

  const dimensionen = [
    ...config.bewertungsDimensionen,
    ...schwerpunkte.filter((s) => !config.bewertungsDimensionen.includes(s)),
  ]

  let section = `## Fachspezifische Bewertungsdimensionen für ${fach}:\n`
  dimensionen.forEach((d, i) => {
    section += `${i + 1}. ${d}\n`
  })

  if (config.besonderheiten.length > 0) {
    section += `\n## Besonderheiten für ${fach}:\n`
    config.besonderheiten.forEach((b) => {
      section += `- ${b}\n`
    })
  }

  return section
}
