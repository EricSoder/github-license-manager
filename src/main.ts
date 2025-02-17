import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  CostCenter,
  CostCentersResponse,
  Resource,
  TeamMember,
  CostCenterUsers
} from './types.js'

const github_token: string = core.getInput('github_token')
const octokit = github.getOctokit(github_token)

export async function run(): Promise<void> {
  try {
    const cost_center: string = core.getInput('cost_center')
    const team_name: string = core.getInput('team_name')

    //Get all cost centers
    const costCentersResponse = await octokit.request(
      `GET /enterprises/${github.context.payload.enterprise?.name}/settings/billing/cost-centers`,
      {
        enterprise: github.context.payload.enterprise?.name,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    const costCenterUsers = new CostCenterUsers()
    const costCenters: CostCentersResponse = costCentersResponse.data.properties

    //Extract the cost center id and users for the specified cost center
    costCenters.costCenters.forEach((costCenter: CostCenter) => {
      if (costCenter.items.properties.name == cost_center) {
        costCenterUsers.costCenterId = costCenter.items.properties.id
        costCenter.items.resources.forEach((resource: Resource) => {
          if (resource.items.properties.type === 'User') {
            costCenterUsers.users.push(resource.items.properties.name)
            core.info(`User name: ${resource.items.properties.name}`)
          }
        })
      }
    })

    //Get all team members for the specified team, e.g "Copilot-Team, GHAS-Team"
    const teamMembers = await octokit.request(
      `GET /orgs/${github.context.payload.repository?.owner}/teams/${team_name}/members`,
      {
        org: github.context.payload.repository?.owner,
        team_slug: team_name
      }
    )

    const teamMemberList: string[] = []
    // Generate a list of team members
    teamMembers.data.forEach((member: TeamMember) => {
      teamMemberList.push(member.login)
      core.info(`Team member name: ${member.login}`)
    })

    // Generate a list of users not in the cost center
    const usersNotInCostCenter = teamMemberList.filter(
      (member: string) => !costCenterUsers.users.includes(member)
    )

    //Add the users that are not in the cost center
    for (const user of usersNotInCostCenter) {
      await octokit.request(
        `PUT /enterprises/${github.context.payload.enterprise?.name}/settings/billing/cost-centers/${costCenterUsers.costCenterId}/resources`,
        {
          enterprise: github.context.payload.enterprise?.name,
          cost_center: costCenterUsers.costCenterId,
          resource: user,
          resource_type: 'User',
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      )
    }

    // Generate a list of users not in the team
    const usersNotInTeam = costCenterUsers.users.filter(
      (member: string) => !teamMemberList.includes(member)
    )

    //Remove the users from the cost center that are not in the team
    for (const user of usersNotInTeam) {
      await octokit.request(
        `DELETE /enterprises/${github.context.payload.enterprise?.name}/settings/billing/cost-centers/${costCenterUsers.costCenterId}/resources`,
        {
          enterprise: github.context.payload.enterprise?.name,
          cost_center: cost_center,
          resource: user,
          resource_type: 'User',
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        }
      )
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
