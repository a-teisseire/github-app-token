import * as core from '@actions/core'
import {App} from '@octokit/app'
import * as github from '@actions/github'
import {request} from '@octokit/request'

async function run(): Promise<void> {
  try {
    const appId: number = +core.getInput('appId')
    const appKey: string = Buffer.from(
      core.getInput('appKey'),
      'base64'
    ).toString()

    const app: App = new App({id: appId, privateKey: appKey})
    const jwt = app.getSignedJsonWebToken()

    const withOrganization: string = core.getInput('withOrganization', {
      required: false
    })
    let organization: string = core.getInput('organization', {required: false})

    if (withOrganization === 'true') {
      if (organization !== '') {
        core.setFailed(
          'Both withOrganization or organization cannot be set at once!'
        )
        return
      }

      organization = github.context.repo.owner
    }

    if (organization !== '') {
      const {data} = await request('GET /orgs/:org/installation', {
        org: organization,
        headers: {
          authorization: `Bearer ${jwt}`,
          accept: 'application/vnd.github.machine-man-preview+json'
        }
      })

      const token = await app.getInstallationAccessToken({
        installationId: data.id
      })
      core.setOutput('token', token)
      return
    }

    const withRepository: string = core.getInput('withRepository', {
      required: false
    })
    let repository: string = core.getInput('repository', {required: false})

    if (withRepository === 'true') {
      if (repository !== '') {
        core.setFailed(
          'Both withRepository or repository cannot be set at once!'
        )
        return
      }

      repository = `${github.context.repo.owner}/${github.context.repo.repo}`
    }

    if (repository !== '') {
      const {data} = await request('GET /repos/:repo/installation', {
        repo: repository,
        headers: {
          authorization: `Bearer ${jwt}`,
          accept: 'application/vnd.github.machine-man-preview+json'
        }
      })

      const token = await app.getInstallationAccessToken({
        installationId: data.id
      })
      core.setOutput('token', token)
      return
    }

    core.setFailed('No parameter specified!')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
