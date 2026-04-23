const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const auth = require('../middleware/auth');

// @route   GET api/matches
// @desc    Get all matches
// @access  Public
router.get('/', async (req, res) => {
  try {
    const matches = await Match.find().sort({ createdAt: -1 });
    res.json(matches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/matches/:id
// @desc    Get match by id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ msg: 'Match not found' });
    res.json(match);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Match not found' });
    res.status(500).send('Server Error');
  }
});

const Team = require('../models/Team');

// @route   POST api/matches
// @desc    Create a match
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, teamA, teamB, totalOvers } = req.body;
  try {
    const tA = await Team.findOne({ name: teamA });
    const tB = await Team.findOne({ name: teamB });
    
    if(!tA || !tB) return res.status(400).json({ msg: 'One or both teams not found in database' });

    const newMatch = new Match({
      name,
      totalOvers: totalOvers || 20,
      teamA: { name: teamA, players: tA.players.map(p => ({ name: p })) },
      teamB: { name: teamB, players: tB.players.map(p => ({ name: p })) }
    });
    const match = await newMatch.save();
    
    req.app.get('io').emit('matchCreated', match);
    res.json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/matches/:id/start
// @desc    Start a match
// @access  Private
router.put('/:id/start', auth, async (req, res) => {
  const { tossWonBy, tossDecision, battingTeam, bowlingTeam, striker, nonStriker, bowler } = req.body;
  try {
    let match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ msg: 'Match not found' });

    match.toss = { wonBy: tossWonBy, decision: tossDecision };
    match.battingTeam = battingTeam;
    match.bowlingTeam = bowlingTeam;
    match.status = 'live';

    // Set initial players status
    const batTeam = match.battingTeam === match.teamA.name ? match.teamA : match.teamB;
    const bowlTeam = match.bowlingTeam === match.teamA.name ? match.teamA : match.teamB;

    let s = batTeam.players.find(p => p.name === striker);
    if(s) s.isStriker = true;
    let ns = batTeam.players.find(p => p.name === nonStriker);
    if(ns) ns.isNonStriker = true;

    let b = bowlTeam.players.find(p => p.name === bowler);
    if(b) b.isBowling = true;

    await match.save();
    req.app.get('io').emit('matchUpdated', match);
    res.json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/matches/:id/ball
// @desc    Add ball data
// @access  Private
router.put('/:id/ball', auth, async (req, res) => {
  try {
    let match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ msg: 'Match not found' });

    const { runs, extras, wicket, striker, nonStriker, bowler } = req.body;
    
    let batTeamKey = match.battingTeam === match.teamA.name ? 'teamA' : 'teamB';
    let bowlTeamKey = match.bowlingTeam === match.teamA.name ? 'teamA' : 'teamB';
    let batTeam = match[batTeamKey];
    let bowlTeam = match[bowlTeamKey];
    
    let isLegal = true;
    let runsAdded = runs || 0;
    
    if (extras && (extras.type === 'wide' || extras.type === 'noBall')) {
      isLegal = false;
      runsAdded += 1; // 1 extra run for wide/nb
      runsAdded += extras.runs || 0;
    } else if (extras && (extras.type === 'bye' || extras.type === 'legBye')) {
      runsAdded += extras.runs || 0;
    }

    match.score[batTeamKey].runs += runsAdded;

    let s = batTeam.players.find(p => p.name === striker);
    let ns = batTeam.players.find(p => p.name === nonStriker);
    let b = bowlTeam.players.find(p => p.name === bowler);

    // Update striker stats
    if (s) {
      if (!extras || (extras.type !== 'wide' && extras.type !== 'bye' && extras.type !== 'legBye')) {
        s.runsScored += runs || 0;
        if (runs === 4) s.fours += 1;
        if (runs === 6) s.sixes += 1;
      }
      if (!extras || extras.type !== 'wide') {
        s.ballsFaced += 1;
      }
    }

    // Update bowler stats
    if (b) {
      b.runsConceded += runsAdded;
      if (isLegal) {
        b.ballsBowled += 1;
        let o = Math.floor(b.ballsBowled / 6);
        let bl = b.ballsBowled % 6;
        b.oversBowled = parseFloat(`${o}.${bl}`);
      }
    }

    // Update team score for wickets
    if (wicket && wicket.isWicket) {
      match.score[batTeamKey].wickets += 1;
      let outPlayer = batTeam.players.find(p => p.name === wicket.playerDismissed);
      if (outPlayer) {
        outPlayer.isDismissed = true;
        outPlayer.dismissalInfo = wicket.type;
      }
      if (b && wicket.type !== 'run-out') {
        b.wicketsTaken += 1;
      }
    }

    // --- STRIKE ROTATION LOGIC FOR NEXT BALL ---
    let nextS = striker;
    let nextNS = nonStriker;

    // 1. Runs-based strike change
    if ((runs || 0) % 2 !== 0) {
      let temp = nextS;
      nextS = nextNS;
      nextNS = temp;
    }

    // 2. Wickets
    if (wicket && wicket.isWicket) {
      const outName = wicket.playerDismissed;
      if (wicket.type === 'run-out') {
        if (outName === striker) {
          nextS = nonStriker;
          nextNS = null;
        } else if (outName === nonStriker) {
          nextS = striker;
          nextNS = null;
        }
      } else {
        // Bowled, Caught, LBW, Stumped: New batsman comes on strike
        nextS = null;
        nextNS = outName === striker ? nonStriker : striker;
      }
    }

    // 3. End of over calculation & edge case
    let isEndOfOver = false;
    if (isLegal) {
      match.score[batTeamKey].balls += 1;
      let overs = Math.floor(match.score[batTeamKey].balls / 6);
      let balls = match.score[batTeamKey].balls % 6;
      match.score[batTeamKey].overs = parseFloat(`${overs}.${balls}`);

      if (match.score[batTeamKey].balls > 0 && match.score[batTeamKey].balls % 6 === 0) {
        isEndOfOver = true;
      }
    }

    if (isEndOfOver) {
      let temp = nextS;
      nextS = nextNS;
      nextNS = temp;
    }

    // 4. Update DB statuses
    batTeam.players.forEach(p => { p.isStriker = false; p.isNonStriker = false; });
    bowlTeam.players.forEach(p => { p.isBowling = false; });

    if (nextS) {
      let p = batTeam.players.find(x => x.name === nextS);
      if (p) p.isStriker = true;
    }
    if (nextNS) {
      let p = batTeam.players.find(x => x.name === nextNS);
      if (p) p.isNonStriker = true;
    }
    if (b && !isEndOfOver) {
      b.isBowling = true; // Bowler continues if over isn't finished
    }

    match.balls.push(req.body);

    // Auto complete innings/match if 10 wickets or overs complete
    const isAllOut = match.score[batTeamKey].wickets >= 10;
    const isOversFinished = Math.floor(match.score[batTeamKey].balls / 6) >= match.totalOvers;
    
    if (match.currentInnings === 2 && match.target && match.score[batTeamKey].runs >= match.target) {
      match.status = 'completed';
      match.result = `${match.battingTeam} won by ${10 - match.score[batTeamKey].wickets} wickets`;
      match.winner = match.battingTeam;
      match.loser = match.bowlingTeam;
    } else if (isAllOut || isOversFinished) {
      if (match.currentInnings === 1) {
        match.target = match.score[batTeamKey].runs + 1;
        match.currentInnings = 2;
        // Swap batting and bowling teams
        const newBatting = match.bowlingTeam;
        match.bowlingTeam = match.battingTeam;
        match.battingTeam = newBatting;
      } else {
        match.status = 'completed';
        const team1Runs = match.score[match.teamA.name === match.battingTeam ? 'teamB' : 'teamA'].runs;
        const team2Runs = match.score[batTeamKey].runs;
        if (team1Runs > team2Runs) {
          match.result = `${match.bowlingTeam} won by ${team1Runs - team2Runs} runs`;
          match.winner = match.bowlingTeam;
          match.loser = match.battingTeam;
        } else if (team1Runs < team2Runs) {
          match.result = `${match.battingTeam} won by ${10 - match.score[batTeamKey].wickets} wickets`;
          match.winner = match.battingTeam;
          match.loser = match.bowlingTeam;
        } else {
          match.result = 'Match Tied';
          match.winner = 'Tie';
          match.loser = 'Tie';
        }
      }
    }

    await match.save();
    req.app.get('io').emit('matchUpdated', match);
    res.json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/matches/:id/end
// @desc    Manually end a match
// @access  Private
router.put('/:id/end', auth, async (req, res) => {
  try {
    let match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ msg: 'Match not found' });

    match.status = 'completed';
    match.result = req.body.result || 'Match manually ended';
    match.winner = req.body.winner || null;
    match.loser = req.body.loser || null;

    await match.save();
    req.app.get('io').emit('matchUpdated', match);
    res.json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
