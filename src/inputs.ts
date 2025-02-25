import { getInput } from '@actions/core'

export const GITHUB_TOKEN = getInput('github_token')
export const COST_CENTER = getInput('cost_center')
export const TEAM_NAME = getInput('team_name')
