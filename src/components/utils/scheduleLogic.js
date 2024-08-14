// src/utils/scheduleLogic.js

class Schedule {
  constructor(teams, gamesPerTeam, teamsPerGame, gameDuration, gameDurationBetween, startDateTime) {
    this.teams = teams;
    this.gamesPerTeam = gamesPerTeam;
    this.teamsPerGame = teamsPerGame;
    this.gameDuration = gameDuration;
    this.gameDurationBetween = gameDurationBetween;
    this.startDateTime = new Date(startDateTime);
    this.schedule = [];
  }

  generateSchedule() {
    const allGames = this.generateAllPossibleGames();
    const shuffledGames = this.shuffleArray(allGames);
    const teamGamesPlayed = {};
    this.teams.forEach(team => teamGamesPlayed[team] = 0);

    let currentDateTime = new Date(this.startDateTime);

    while (shuffledGames.length > 0 && !this.allTeamsPlayedEnoughGames(teamGamesPlayed)) {
      const game = shuffledGames.pop();
      if (this.canAddGame(game, teamGamesPlayed)) {
        const endDateTime = new Date(currentDateTime.getTime() + this.gameDuration * 60000);
        this.schedule.push({
          startTime: currentDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          teams: game
        });
        game.forEach(team => teamGamesPlayed[team]++);
        currentDateTime = new Date(endDateTime.getTime() + this.gameDurationBetween * 60000);
      }
    }

    return this.schedule;
  }

  generateAllPossibleGames() {
    const allGames = [];
    const generateCombinations = (arr, k, start = 0, current = []) => {
      if (current.length === k) {
        allGames.push([...current]);
        return;
      }
      for (let i = start; i < arr.length; i++) {
        current.push(arr[i]);
        generateCombinations(arr, k, i + 1, current);
        current.pop();
      }
    };
    generateCombinations(this.teams, this.teamsPerGame);
    return allGames;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  canAddGame(game, teamGamesPlayed) {
    return game.every(team => teamGamesPlayed[team] < this.gamesPerTeam);
  }

  allTeamsPlayedEnoughGames(teamGamesPlayed) {
    return Object.values(teamGamesPlayed).every(games => games >= this.gamesPerTeam);
  }
}

export function generateSchedule(formData) {
  const teams = formData.teamList.split(',').map(team => team.trim());
  const schedule = new Schedule(
    teams,
    parseInt(formData.teamGames),
    parseInt(formData.teamsPerGame),
    parseInt(formData.gameDurationMin),
    parseInt(formData.gameDurationBetweenMin),
    formData.gameStartDatetime
  );
  return schedule.generateSchedule();
}