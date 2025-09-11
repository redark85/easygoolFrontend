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
  TEAM_REMOVE_ENDPOINT
};
