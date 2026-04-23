const mongoose = require("mongoose");

const ballSchema = new mongoose.Schema({
  overNumber: Number,
  ballNumber: Number, // 1 to 6 (can be >6 for extras)
  bowler: String,
  batsman: String,
  runs: Number, // runs scored by bat
  extras: {
    type: {
      type: String,
      enum: ["wide", "noBall", "bye", "legBye"],
      default: null,
    },
    runs: {
      type: Number,
      default: 0,
    },
  },
  wicket: {
    isWicket: { type: Boolean, default: false },

    type: {
      type: String,
      enum: ["bowled", "caught", "run-out", "lbw", "stumped"],
      default: null,
    },

    playerDismissed: { type: String, default: null },
    assistedBy: { type: String, default: null },
  },
});

const teamScoreSchema = new mongoose.Schema({
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  overs: { type: Number, default: 0 }, // e.g. 4.2
  balls: { type: Number, default: 0 }, // total legal balls
});

const playerStatSchema = new mongoose.Schema({
  name: String,
  // Batting
  runsScored: { type: Number, default: 0 },
  ballsFaced: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  isStriker: { type: Boolean, default: false },
  isNonStriker: { type: Boolean, default: false },
  isDismissed: { type: Boolean, default: false },
  dismissalInfo: String,
  // Bowling
  oversBowled: { type: Number, default: 0 }, // float e.g., 1.2
  ballsBowled: { type: Number, default: 0 }, // total legal balls
  runsConceded: { type: Number, default: 0 },
  wicketsTaken: { type: Number, default: 0 },
  isBowling: { type: Boolean, default: false },
});

const matchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    totalOvers: { type: Number, default: 20 },
    target: { type: Number, default: null },
    teamA: {
      name: String,
      players: [playerStatSchema],
    },
    teamB: {
      name: String,
      players: [playerStatSchema],
    },
    toss: {
      wonBy: String,
      decision: String, // 'bat' or 'bowl'
    },
    status: {
      type: String,
      enum: ["upcoming", "live", "completed"],
      default: "upcoming",
    },
    battingTeam: String, // name of team
    bowlingTeam: String, // name of team
    currentInnings: { type: Number, default: 1 }, // 1 or 2
    score: {
      teamA: { type: teamScoreSchema, default: () => ({}) },
      teamB: { type: teamScoreSchema, default: () => ({}) },
    },
    balls: [ballSchema],
    result: String,
    winner: String,
    loser: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Match", matchSchema);
