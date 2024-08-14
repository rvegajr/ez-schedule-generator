import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { generateSchedule } from './utils/scheduleLogic';
import ProjectInfo from './ProjectInfo';

const ScheduleGenerator = () => {
  const defaultTeams = "Team Alpha, Team Beta, Team Omega, Team Smegma, Mung, Yeast Lovers, Intestinal Parasites, Ovarian Sistas, Kind Gore, Evangelical Imps, Scrotes";

  const initialFormData = useRef({
    teamList: '',
    teamGames: '6',
    teamsPerGame: '3',
    gameDurationMin: '10',
    gameDurationBetweenMin: '4',
    gameStartDatetime: '',
  });

  const [formData, setFormData] = useState(initialFormData.current);
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSavedFormData = () => {
      const savedFormData = Object.keys(initialFormData.current).reduce((acc, key) => {
        const savedValue = Cookies.get(key);
        if (savedValue) acc[key] = savedValue;
        return acc;
      }, {});

      if (!savedFormData.teamList) {
        savedFormData.teamList = defaultTeams;
      }

      if (!savedFormData.gameStartDatetime) {
        savedFormData.gameStartDatetime = new Date().toISOString().slice(0, 16);
      }

      setFormData(prevData => ({ ...prevData, ...savedFormData }));
      setIsLoaded(true);
    };

    loadSavedFormData();
  }, []);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    Cookies.set(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    try {
      const generatedSchedule = generateSchedule(formData);
      setSchedule(generatedSchedule);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportCSV = () => {
    if (!schedule) return;

    const csvContent = [
      ['Game', 'Start Time', 'End Time', 'Teams'],
      ...schedule.map((game, index) => [
        index + 1,
        new Date(game.startTime).toLocaleString(),
        new Date(game.endTime).toLocaleString(),
        game.teams.join(' vs ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'schedule.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">EZ Schedule Generator</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Team List (Comma Delimited.. 30 max)"
          name="teamList"
          value={formData.teamList}
          onChange={handleInputChange}
          type="textarea"
        />
        <FormField
          label="Number of Games each team will play (1-30)"
          name="teamGames"
          value={formData.teamGames}
          onChange={handleInputChange}
          type="number"
          min="1"
          max="30"
        />
        <FormField
          label="Number of teams in each game (2-4)"
          name="teamsPerGame"
          value={formData.teamsPerGame}
          onChange={handleInputChange}
          type="number"
          min="2"
          max="4"
        />
        <FormField
          label="Game Duration (Min)"
          name="gameDurationMin"
          value={formData.gameDurationMin}
          onChange={handleInputChange}
          type="number"
          min="1"
        />
        <FormField
          label="Duration Between Games (Min)"
          name="gameDurationBetweenMin"
          value={formData.gameDurationBetweenMin}
          onChange={handleInputChange}
          type="number"
          min="0"
        />
        <FormField
          label="Start Date/Time"
          name="gameStartDatetime"
          value={formData.gameStartDatetime}
          onChange={handleInputChange}
          type="datetime-local"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Generate the Schedule
        </button>
      </form>
      {error && <div className="text-red-500 mt-4">{error}</div>}
      {schedule && (
        <div className="mt-4">
          <ScheduleDisplay schedule={schedule} onExportCSV={handleExportCSV}/>
        </div>
      )}
      <ProjectInfo />
    </div>
  );
};

const FormField = ({ label, name, value, onChange, type, ...props }) => (
  <div>
    <label htmlFor={name} className="block mb-1">
      {label}
    </label>
    {type === 'textarea' ? (
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border rounded"
        rows="4"
        {...props}
      />
    ) : (
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 border rounded"
        {...props}
      />
    )}
  </div>
);

const ScheduleDisplay = ({ schedule, onExportCSV }) => {
    const teamColors = ['bg-red-100', 'bg-green-100', 'bg-blue-100', 'bg-purple-100'];
  
    // Calculate total games for each team
    const teamTotalGames = schedule.reduce((acc, game) => {
      game.teams.forEach(team => {
        acc[team] = (acc[team] || 0) + 1;
      });
      return acc;
    }, {});
  
    const teamCurrentGame = {};
  
    return (
      <div className="mt-8 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Generated Schedule</h2>
          <button 
            onClick={onExportCSV}
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
            title="Export to Excel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm1 0v14h12V3H4zm2 2a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1V5zm1 0v2h6V5H7zm-1 4a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1V9zm1 0v2h6V9H7zm-1 4a1 1 0 011-1h6a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1v-2zm1 0v2h6v-2H7z" clipRule="evenodd" />
            </svg>
            Export
          </button>
        </div>
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b">Game</th>
              <th className="py-2 px-4 border-b">Start Time</th>
              <th className="py-2 px-4 border-b">End Time</th>
              <th className="py-2 px-4 border-b" colSpan={4}>Teams</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((game, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-2 px-4 border-b text-center">{index + 1}</td>
                <td className="py-2 px-4 border-b">{new Date(game.startTime).toLocaleString()}</td>
                <td className="py-2 px-4 border-b">{new Date(game.endTime).toLocaleString()}</td>
                {game.teams.map((team, teamIndex) => {
                  teamCurrentGame[team] = (teamCurrentGame[team] || 0) + 1;
                  return (
                    <td key={teamIndex} className={`py-2 px-4 border-b ${teamColors[teamIndex]} relative`}>
                      <span className="ml-2">{team}</span>
                      <span className="text-xs text-gray-500 opacity-50 ml-1">
                        ({teamCurrentGame[team]}/{teamTotalGames[team]})
                      </span>
                    </td>
                  );
                })}
                {/* Add empty cells if there are fewer than 4 teams */}
                {[...Array(4 - game.teams.length)].map((_, i) => (
                  <td key={`empty-${i}`} className="py-2 px-4 border-b"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default ScheduleGenerator;
