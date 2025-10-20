export class Bot {
  name: string;
  profilePicture: string;
  strongestMatchChance: number; // 0-1, chance per second to submit a 3-point word
  strongMatchChance: number; // 0-1, chance per second to submit a 2-point word
  weakMatchChance: number; // 0-1, chance per second to submit a 1-point word
  voiceLines: string[];
  voiceLineChance: number; // 0-1, chance per second to show a voice line
  description: string;
  defeatMessage: string;
  victoryMessage: string;

  constructor(config: {
    name: string;
    profilePicture: string;
    strongestMatchChance: number;
    strongMatchChance: number;
    weakMatchChance: number;
    voiceLines: string[];
    voiceLineChance: number;
    description: string;
    defeatMessage: string;
    victoryMessage: string;
  }) {
    this.name = config.name;
    this.profilePicture = config.profilePicture;
    this.strongestMatchChance = config.strongestMatchChance;
    this.strongMatchChance = config.strongMatchChance;
    this.weakMatchChance = config.weakMatchChance;
    this.voiceLines = config.voiceLines;
    this.voiceLineChance = config.voiceLineChance;
    this.description = config.description;
    this.defeatMessage = config.defeatMessage;
    this.victoryMessage = config.victoryMessage;
  }

  getRandomVoiceLine(): string | null {
    if (Math.random() < this.voiceLineChance && this.voiceLines.length > 0) {
      return this.voiceLines[
        Math.floor(Math.random() * this.voiceLines.length)
      ];
    }
    return null;
  }

  // Simulate bot attempting to submit words each second
  simulateSecond(): { submitted: boolean; pointValue: number } | null {
    // Check from highest to lowest point value
    if (Math.random() < this.strongestMatchChance) {
      return { submitted: true, pointValue: 3 };
    }
    if (Math.random() < this.strongMatchChance) {
      return { submitted: true, pointValue: 2 };
    }
    if (Math.random() < this.weakMatchChance) {
      return { submitted: true, pointValue: 1 };
    }
    return null;
  }
}

export const BOTS = {
    LINKIN_BORROWS: new Bot({
        name: "Linkin Borrows",
        profilePicture: "/bots/lincoln_burrows.png",
        strongestMatchChance: 0.01,
        strongMatchChance: 0.02,
        weakMatchChance: 0.04,
        voiceLines: [
            "Where's my son?",
            "I swear I'm innocent.",
            "Quiet, I'm thinking.",
            "Hmm...",
            "Damn, this one's tough.",
        ],
        voiceLineChance: 0.1,
        description: "A hard-headed strategist who definitely did not kill the vice president's brother.",
        defeatMessage: "Damn, that sucks. But still better than the electric chair, I guess.",
        victoryMessage: "Yes! We did it! Freedom is mine!",
    }),
    MICHAEL_SCOFIELD: new Bot({
        name: "Michael Scofield",
        profilePicture: "/bots/michael_scofield.png",
        strongestMatchChance: 0.02,
        strongMatchChance: 0.05,
        weakMatchChance: 0.04,
        voiceLines: [
            "Looks like I'm going to have to improvise...",
            "Looks like you're the fish, now.",
            "This is my territory.",
            "You better watch your back.",
            "I always come out on top.",
        ],
        voiceLineChance: 0.1,
        description: "A tough and cunning player who never backs down.",
        defeatMessage: "You got lucky this time. I'll be back.",
        victoryMessage: "That's how it's done! Nobody beats me!",
    }),
    THEODORE_BAGWELL: new Bot({
        name: "Theodore Bagwell",
        profilePicture: "/bots/theodore_bagwell.png",
        strongestMatchChance: 0.1,
        strongMatchChance: 0.08,
        weakMatchChance: 0.06,
        voiceLines: [
            "This has been a long time coming, pretty.",
            "You better stay outta my way, fish.",
            "This is my territory.",
            "You better watch your back.",
            "I always come out on top.",
        ],
        voiceLineChance: 0.1,
        description: "A tough and cunning player who never backs down.",
        defeatMessage: "You got lucky this time. I'll be back.",
        victoryMessage: "That's how it's done! Nobody beats me!",
    }),
}