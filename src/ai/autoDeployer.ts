import { runAutoTests } from './autoTester';
import { calculateSystemHealthScore, logAgentActivity } from './agent';
import {
  triggerGitHubCommitAndPush,
  deployToHuggingFace,
  saveDeploymentLog,
  DeploymentLog,
  rollbackDeployment
} from '../utils/deploymentAPI';

export interface DeploymentJobResult {
  success: boolean;
  logId?: string;
  stepReports: {
    testsPassed: boolean;
    commitHash?: string;
    hfStatus?: string;
  };
  error?: string;
}

/**
 * Executes a full autonomous pre-deployment, packaging, committing, 
 * and multi-destination deployment pipeline to GitHub and Hugging Face.
 */
export async function executeAutonomousDeploymentPipeline(config: {
  repoOwner: string;
  repoName: string;
  branch: string;
  huggingFaceSpace: string;
  gitHubToken?: string;
  huggingFaceToken?: string;
}): Promise<DeploymentJobResult> {
  const { repoOwner, repoName, branch, huggingFaceSpace, gitHubToken, huggingFaceToken } = config;
  
  logAgentActivity('info', 'Autonomous Deployment Command Issued. Initiating Pre-Deployment Phase...', 'Deployment Pipeline');

  // STEP 1: Pre-deployment health & test checks
  const testResponse = await runAutoTests();
  if (testResponse.overallStatus === 'failed') {
    logAgentActivity(
      'error',
      'Pre-deploy validation check failed: Critical anomalies or failed test suites found in the system. Deployment rejected for safety.',
      'Deployment Pipeline'
    );
    return {
      success: false,
      stepReports: { testsPassed: false },
      error: 'Pre-deployment validation suite failed.'
    };
  }

  logAgentActivity('success', '✔ Pre-deployment validation tests passed. Preparing code contents...', 'Deployment Pipeline');

  // STEP 2: Package active files content for Git & HF Spaces
  // In a simulated or actual client setup, we gather current configuration structures to push
  const filesToCommit = [
    {
      path: 'package.json',
      content: JSON.stringify({
        name: 'autonomous-vault',
        version: '1.2.0',
        private: true,
        dependencies: {
          'react': '^19.0.1',
          'typescript': '~5.8.2'
        }
      }, null, 2)
    },
    {
      path: 'README.md',
      content: `# 🤖 Autonomous Cloud Vault & Secure Keyring\n\nAutomated and self-healing keys management dashboard configured securely.`
    }
  ];

  // STEP 3: Trigger GitHub commit and branch push
  logAgentActivity('info', 'Pushing code updates to GitHub repository remote branch...', 'Deployment Pipeline');
  const gitHubResult = await triggerGitHubCommitAndPush({
    repoOwner,
    repoName,
    branch,
    commitMessage: '🤖 autonomous-deploy: continuous deployment and self-healing build update',
    files: filesToCommit,
    token: gitHubToken
  });

  if (!gitHubResult.success) {
    const errorMsg = gitHubResult.error || 'Failed to submit modifications to GitHub.';
    logAgentActivity('error', `Deployment halted: GitHub commit failure. Reason: ${errorMsg}`, 'Deployment Pipeline');
    
    await saveDeploymentLog({
      status: 'failed',
      platform: 'github',
      repository: `${repoOwner}/${repoName}`,
      triggered_by: '🤖 AIAgent (Autonomous Deployer)',
      error_message: errorMsg
    });

    return {
      success: false,
      stepReports: { testsPassed: true },
      error: `GitHub deploy check failed: ${errorMsg}`
    };
  }

  logAgentActivity(
    'success',
    `✔ Branch pushed to GitHub successfully. commit SHA: ${gitHubResult.commitHash?.substring(0, 8)}`,
    'Deployment Pipeline'
  );

  // Save successful git log
  await saveDeploymentLog({
    status: 'success',
    platform: 'github',
    repository: `${repoOwner}/${repoName}`,
    commit_hash: gitHubResult.commitHash,
    triggered_by: '🤖 AIAgent (Autonomous Deployer)'
  });

  // STEP 4: Trigger Hugging Face Space synchronization
  logAgentActivity('info', `Deploying bundle changes to Hugging Face Spaces repository: ${huggingFaceSpace}...`, 'Deployment Pipeline');
  
  const hfResult = await deployToHuggingFace({
    spaceName: huggingFaceSpace,
    sdk: 'static',
    token: huggingFaceToken,
    files: filesToCommit
  });

  if (!hfResult.success) {
    const errorMsg = hfResult.error || 'Space sync failed.';
    logAgentActivity('error', `Hugging Face deployment failed. Reason: ${errorMsg}`, 'Deployment Pipeline');
    
    const failedHFLog = await saveDeploymentLog({
      status: 'failed',
      platform: 'hugging_face',
      repository: huggingFaceSpace,
      triggered_by: '🤖 AIAgent (Autonomous Deployer)',
      error_message: errorMsg
    });

    // Auto-trigger automatic self-healing rollback loop
    logAgentActivity('warning', 'Autonomous safety policy triggered: Initiating immediate roll-back to the latest verified commit...', 'Deployment Pipeline');
    const rollbackRes = await rollbackDeployment(failedHFLog.id);
    
    if (rollbackRes.success) {
      logAgentActivity('success', `✔ Automated rollback completed successfully. Rolled back to: ${rollbackRes.rolledBackToLog}`, 'Deployment Pipeline');
    } else {
      logAgentActivity('error', `✖ Critical Failure during automatic rollback sequence: ${rollbackRes.error}`, 'Deployment Pipeline');
    }

    return {
      success: false,
      stepReports: {
        testsPassed: true,
        commitHash: gitHubResult.commitHash
      },
      error: `Hugging Face deploy failed. Automatic rollback initiated.`
    };
  }

  logAgentActivity('success', '✔ Hugging Face Spaces deployment successfully uploaded and verified online.', 'Deployment Pipeline');

  const finalHFLog = await saveDeploymentLog({
    status: 'success',
    platform: 'hugging_face',
    repository: huggingFaceSpace,
    triggered_by: '🤖 AIAgent (Autonomous Deployer)'
  });

  return {
    success: true,
    logId: finalHFLog.id,
    stepReports: {
      testsPassed: true,
      commitHash: gitHubResult.commitHash,
      hfStatus: 'running'
    }
  };
}
