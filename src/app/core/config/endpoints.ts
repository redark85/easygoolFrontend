// Endpoints de la aplicación
export const AUTH_LOGIN_ENDPOINT = '/api/Auth/Login';
export const AUTH_REGISTER_ENDPOINT = '/api/Auth/Register';

// Tournament Endpoints
export const TOURNAMENT_CREATE_ENDPOINT = '/api/Tournament/CreateTournament';
export const TOURNAMENT_GET_ALL_BY_USER_ENDPOINT = '/api/Tournament/GetAllByUser';
export const TOURNAMENT_GET_BY_ID_ENDPOINT = '/api/Tournament/GetById';
export const TOURNAMENT_UPDATE_ENDPOINT = '/api/Tournament/UpdateTournament';
export const TOURNAMENT_UPDATE_STATUS_ENDPOINT = '/api/Tournament/UpdateStatus';
export const TOURNAMENT_CHANGE_STATUS_ENDPOINT = '/api/Tournament/ChangeStatus';
export const TOURNAMENT_DELETE_ENDPOINT = '/api/Tournament/DeleteTournament';

// Phase Endpoints
export const PHASE_CREATE_ENDPOINT = '/api/Phase/CreatePhase';
export const PHASE_GET_BY_TOURNAMENT_ENDPOINT = '/api/Phase/GetAllPhases';

// Group Endpoints
export const GROUP_CREATE_ENDPOINT = '/api/Tournament/CreateTournamentGroup';

// Team Endpoints
export const TEAM_GET_ALL_TEAMS_ENDPOINT = '/api/Team/GetAllTeams';
export const TEAM_GET_BY_TOURNAMENT_ENDPOINT = '/api/Team/GetByTournament';
export const TEAM_CREATE_ENDPOINT = '/api/Team/CreateTeam';
export const TEAM_UPDATE_ENDPOINT = '/api/Team/UpdateTeam';
export const TEAM_DELETE_ENDPOINT = '/api/Team/DeleteTeam';
export const TEAM_ASSIGN_TO_GROUP_ENDPOINT = '/api/Team/AssignToGroup';
export const TEAM_REMOVE_FROM_GROUP_ENDPOINT = '/api/Team/RemoveFromGroup';

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
  
  // Phase
  PHASE_CREATE_ENDPOINT,
  PHASE_GET_BY_TOURNAMENT_ENDPOINT,
  
  // Group
  GROUP_CREATE_ENDPOINT,
  
  // Team
  TEAM_GET_ALL_TEAMS_ENDPOINT,
  TEAM_GET_BY_TOURNAMENT_ENDPOINT,
  TEAM_CREATE_ENDPOINT,
  TEAM_UPDATE_ENDPOINT,
  TEAM_DELETE_ENDPOINT,
  TEAM_ASSIGN_TO_GROUP_ENDPOINT,
  TEAM_REMOVE_FROM_GROUP_ENDPOINT
};
