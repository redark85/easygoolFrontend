// Endpoints de la aplicación
export const AUTH_LOGIN_ENDPOINT = '/api/Auth/Login';
export const AUTH_REGISTER_ENDPOINT = '/api/Auth/RegisterUser';
export const AUTH_VERIFY_OTP_ENDPOINT = '/api/Auth/VerifyOTP';
export const AUTH_RESEND_OTP_ENDPOINT = '/api/Auth/ResendOTP';

// Tournament Endpoints
export const TOURNAMENT_CREATE_ENDPOINT = '/api/Tournament/CreateTournament';
export const TOURNAMENT_GET_ALL_BY_USER_ENDPOINT = '/api/Tournament/GetAllByUser';
export const TOURNAMENT_GET_BY_ID_ENDPOINT = '/api/Tournament/GetById';
export const TOURNAMENT_UPDATE_ENDPOINT = '/api/Tournament/UpdateTournament';
export const TOURNAMENT_UPDATE_STATUS_ENDPOINT = '/api/Tournament/UpdateStatus';
export const TOURNAMENT_CHANGE_STATUS_ENDPOINT = '/api/Tournament/ChangeStatus';
export const TOURNAMENT_DELETE_ENDPOINT = '/api/Tournament/DeleteTournament';
export const TOURNAMENT_ALLOW_REGISTER_TEAM_ENDPOINT = '/api/Tournament/AllowRegisterTeam';
export const TOURNAMENT_GET_BY_TOKEN_ENDPOINT = '/api/Tournament/GetByToken';

// Phase Endpoints
export const PHASE_CREATE_ENDPOINT = '/api/Phase/CreatePhase';
export const PHASE_GET_BY_TOURNAMENT_ENDPOINT = '/api/Phase/GetAllPhases';
export const PHASE_UPDATE_ENDPOINT = '/api/Phase/UpdatePhase';
export const PHASE_DELETE_ENDPOINT = '/api/Phase/DeletePhase';

// Group Endpoints
export const GROUP_CREATE_ENDPOINT = '/api/Group/CreateGroup';
export const GROUP_UPDATE_ENDPOINT = '/api/Group/UpdateGroup';
export const GROUP_DELETE_ENDPOINT = '/api/Group/DeleteGroup';

// Team Endpoints
export const TEAM_GET_ALL_TEAMS_ENDPOINT = '/api/Team/GetAllTeams';
export const TEAM_GET_BY_TOURNAMENT_ENDPOINT = '/api/Team/GetByTournament';
export const TEAM_CREATE_ENDPOINT = '/api/Team/CreateTeam';
export const TEAM_UPDATE_ENDPOINT = '/api/Team/UpdateTeam';
export const TEAM_DELETE_ENDPOINT = '/api/Team/RemovePhaseTeam';
export const TEAM_ASSIGN_TO_GROUP_ENDPOINT = '/api/Team/AsignTeamGroup';
export const TEAM_REMOVE_FROM_GROUP_ENDPOINT = '/api/Team/RemoveFromGroup';
export const TEAM_DISQUALIFY_ENDPOINT = '/api/Team/DisqualifyTeam';
export const TEAM_GET_WITHOUT_PHASE_ENDPOINT = '/api/Team/GetAllTeamsWithoutPhase';
export const TEAM_REMOVE_ENDPOINT = '/api/Team/RemoveTeam';
export const TEAM_ALLOW_PLAYER_REGISTRATION_ENDPOINT = '/api/Team/AllowPlayerRegistration';
export const TEAM_ASSIGN_RANDOM_REAMS = '/api/Team/AssignRandomTeams';

// Player Endpoints
export const PLAYER_CREATE_ENDPOINT = '/api/Player/CreatePlayer';
export const PLAYER_GET_BY_TEAM_ENDPOINT = '/api/Player/GetByTeam';
export const PLAYER_UPDATE_ENDPOINT = '/api/Player/UpdatePlayer';
export const PLAYER_DELETE_ENDPOINT = '/api/Player/DeletePlayer';

// Match Endpoints
export const MATCH_GET_ALL_BY_GROUP_ENDPOINT = '/api/Match/GetAllMatchesByGroup';
export const MATCH_GET_ALL_BY_PHASE_ENDPOINT = '/api/Match/GetAllMatchesByPhase';
export const MATCH_GET_FREE_MATCHDAY_TEAMS_ENDPOINT = '/api/Team/FreeMatchDayTeams';
export const MATCH_CREATE_ENDPOINT = '/api/Match/CreateMatch';
export const MATCH_CREATE_MATCHDAY_ENDPOINT = '/api/Match/CreateMatchDay';
export const MATCH_CREATE_RANDOM_ENDPOINT = '/api/Match/CreateRandomMatches';
export const MATCH_CREATE_RANDOM_FOR_MATCHDAY_ENDPOINT = '/api/Match/GenerateMatchesForMatchDay';
export const MATCH_DELETE_ENDPOINT = '/api/Match/DeleteMatch';
export const MATCH_DELETE_MATCHDAY_ENDPOINT = '/api/Match/DeleteMatchDay';

// Vocalia Endpoints
export const VOCALIA_GET_MATCH_ENDPOINT = '/api/Vocalia/GetMatch';
export const VOCALIA_GET_AVAILABLE_PLAYERS_ENDPOINT = '/api/Vocalia/GetAvailablePlayers';
export const VOCALIA_REGISTER_MATCH_EVENT_ENDPOINT = '/api/Vocalia/RegisterMatchEvent';
export const VOCALIA_FINISH_MATCH_ENDPOINT = '/api/Vocalia/FinishMatch';

// Manager Endpoints
export const MANAGER_GET_TEAMS_ENDPOINT = '/api/Manager/ManagerTeams';
export const MANAGER_TOKEN_VALIDATION_ENDPOINT = '/api/Manager/TokenValidation';
export const MANAGER_GET_ALL_TEAMS_ENDPOINT = '/api/Manager/GetAllTeams';
export const MANAGER_REGISTER_TOURNAMENT_TEAM_ENDPOINT = '/api/Manager/RegisterTournamentTeam';

// Configuración de endpoints
export const EndpointsConfig = {
  // Auth
  AUTH_LOGIN_ENDPOINT,
  AUTH_REGISTER_ENDPOINT,

  // Tournament
  TOURNAMENT_CREATE_ENDPOINT,
  TOURNAMENT_GET_ALL_BY_USER_ENDPOINT,
  TOURNAMENT_GET_BY_ID_ENDPOINT,
  TOURNAMENT_UPDATE_ENDPOINT,
  TOURNAMENT_UPDATE_STATUS_ENDPOINT,
  TOURNAMENT_CHANGE_STATUS_ENDPOINT,
  TOURNAMENT_DELETE_ENDPOINT,
  TOURNAMENT_ALLOW_REGISTER_TEAM_ENDPOINT,

  // Phase
  PHASE_CREATE_ENDPOINT,
  PHASE_GET_BY_TOURNAMENT_ENDPOINT,
  PHASE_UPDATE_ENDPOINT,
  PHASE_DELETE_ENDPOINT,

  // Group
  GROUP_CREATE_ENDPOINT,
  GROUP_UPDATE_ENDPOINT,
  GROUP_DELETE_ENDPOINT,

  // Team
  TEAM_GET_ALL_TEAMS_ENDPOINT,
  TEAM_GET_BY_TOURNAMENT_ENDPOINT,
  TEAM_CREATE_ENDPOINT,
  TEAM_UPDATE_ENDPOINT,
  TEAM_DELETE_ENDPOINT,
  TEAM_ASSIGN_TO_GROUP_ENDPOINT,
  TEAM_REMOVE_FROM_GROUP_ENDPOINT,
  TEAM_DISQUALIFY_ENDPOINT,
  TEAM_GET_WITHOUT_PHASE_ENDPOINT,
  TEAM_REMOVE_ENDPOINT,
  TEAM_ALLOW_PLAYER_REGISTRATION_ENDPOINT,

  // Player
  PLAYER_CREATE_ENDPOINT,
  PLAYER_GET_BY_TEAM_ENDPOINT,
  PLAYER_UPDATE_ENDPOINT,
  PLAYER_DELETE_ENDPOINT,

  // Match
  MATCH_GET_ALL_BY_GROUP_ENDPOINT,
  MATCH_GET_ALL_BY_PHASE_ENDPOINT,
  MATCH_GET_FREE_MATCHDAY_TEAMS_ENDPOINT,
  MATCH_CREATE_ENDPOINT,
  MATCH_CREATE_MATCHDAY_ENDPOINT,
  MATCH_CREATE_RANDOM_ENDPOINT,
  MATCH_CREATE_RANDOM_FOR_MATCHDAY_ENDPOINT,
  MATCH_DELETE_ENDPOINT,
  MATCH_DELETE_MATCHDAY_ENDPOINT,

  // Vocalia
  VOCALIA_GET_MATCH_ENDPOINT,
  VOCALIA_GET_AVAILABLE_PLAYERS_ENDPOINT,
  VOCALIA_REGISTER_MATCH_EVENT_ENDPOINT,
  VOCALIA_FINISH_MATCH_ENDPOINT,

  // Manager
  MANAGER_GET_TEAMS_ENDPOINT
};
