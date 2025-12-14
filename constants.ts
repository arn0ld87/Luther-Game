import { Question } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Matthäus 7,21: 'Nicht alle, die Herr, Herr sagen, kommen ins Himmelreich...'",
    erasmusArgument: "Erasmus sagt: 'Du musst dich anstrengen! Der freie Wille entscheidet sich für das Gute. Gute Werke sind die Bedingung!'",
    correctAnswer: "Der Glaube an Jesus Christus ist das einzige Werk, das Gott fordert.",
    options: [
      { text: "Ich muss mehr gute Taten vollbringen, um Gott zu beeindrucken.", isLuther: false },
      { text: "Ich vertraue allein auf Christus. Gute Werke folgen daraus wie Früchte am Baum.", isLuther: true },
      { text: "Glaube und Werke sind beide gleich wichtig für die Rettung.", isLuther: false }
    ]
  },
  {
    id: 2,
    text: "Wie verhält es sich mit dem 'guten Baum' (Mt 7,17)?",
    erasmusArgument: "Erasmus meint: 'Durch das Tun des Guten wirst du ein guter Baum.'",
    correctAnswer: "Der Mensch muss erst durch Gnade gut gemacht werden, bevor er Gutes tun kann.",
    options: [
      { text: "Der Baum muss erst gut sein, bevor er gute Früchte bringen kann. Gnade kommt zuerst.", isLuther: true },
      { text: "Wenn ich genug gute Früchte produziere, werde ich irgendwann ein guter Baum.", isLuther: false },
      { text: "Es ist ein Synergismus: Ich helfe Gott dabei, mich gut zu machen.", isLuther: false }
    ]
  },
  {
    id: 3,
    text: "Was bedeutet 'Den Willen des Vaters tun'?",
    erasmusArgument: "Es bedeutet, die Gebote moralisch perfekt zu halten.",
    correctAnswer: "Es ist ein soteriologischer Indikativ, kein ethischer Imperativ.",
    options: [
      { text: "Es ist eine moralische Checkliste, die ich abarbeiten muss.", isLuther: false },
      { text: "Es bedeutet primär: Ja zu Jesus sagen (Johannes 6,40).", isLuther: true },
      { text: "Es ist der Versuch, durch Disziplin heilig zu werden.", isLuther: false }
    ]
  }
];

export const COLORS = {
  sky: "#87CEEB",
  ground: "#2d3436",
  path: "#636e72",
  lutherPath: "#fdcb6e", // Gold/Grace
  erasmusPath: "#d63031", // Red/Effort/Blood
  player: "#0984e3",
  obstacle: "#2d3436"
};