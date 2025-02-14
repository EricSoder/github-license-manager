import * as core from '@actions/core'
import * as github from '@actions/github'
const github_token: string = core.getInput('github_token')
const octokit = github.getOctokit(github_token)

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const cost_center: string = core.getInput('cost_center')
    const team_name: string = core.getInput('team_name')

    const costCenters = await octokit.request(
      `GET /enterprises/${github.context.payload.enterprise?.name}/settings/billing/cost-centers`,
      {
        enterprise: github.context.payload.enterprise?.name,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    )

    const costCenterUserList: string[] = []

    costCenters.data.costCenters.forEach((costCenter: any) => {
      costCenter.resources.forEach((resource: any) => {
        if (resource.type === 'User') {
          costCenterUserList.push(resource.name)
          core.info(`User name: ${resource.name}`)
        }
      })
    })

    const teamMembers = await octokit.request(
      `GET /orgs/${github.context.payload.repository?.owner}/teams/${team_name}/members`,
      {
        org: github.context.payload.repository?.owner,
        team_slug: team_name
      }
    )

    const teamMemberList: string[] = []

    teamMembers.data.forEach((member: any) => {
      if (member.login) {
        teamMemberList.push(member.login)
        core.info(`Team member name: ${member.title}`)
      }
    })

    const usersNotInCostCenter = teamMemberList.filter(
      (member: string) => !costCenterUserList.includes(member)
    )

    //add users to cost center
    for (const user of usersNotInCostCenter) {
      await octokit.request(
        `PUT /enterprises/${github.context.payload.enterprise?.name}/settings/billing/cost-centers/${cost_center}/resources`,
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

    const usersNotInTeam = costCenterUserList.filter(
      (member: string) => !teamMemberList.includes(member)
    )

    //remove users from cost center
    for (const user of usersNotInTeam) {
      await octokit.request(
        `DELETE /enterprises/${github.context.payload.enterprise?.name}/settings/billing/cost-centers/${cost_center}/resources`,
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
