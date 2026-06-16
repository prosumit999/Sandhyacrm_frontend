import axiosInstance from './axios'

export const getAllTeamsApi      = ()             => axiosInstance.get('/teams')
export const createTeamApi       = (data)         => axiosInstance.post('/teams', data)
export const updateTeamApi       = (id, data)     => axiosInstance.put(`/teams/${id}`, data)
export const deleteTeamApi       = (id)           => axiosInstance.delete(`/teams/${id}`)
export const addTeamMemberApi    = (id, userId)   => axiosInstance.post(`/teams/${id}/members`, { userId })
export const removeTeamMemberApi = (id, userId)   => axiosInstance.delete(`/teams/${id}/members/${userId}`)
