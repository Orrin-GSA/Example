import { Octokit } from "@octokit/rest";
import { isDevelopment, useLocalData } from '../../../src_shared/AppConfig';

// The GitHub token will be injected at build time from environment variables
// NEVER hardcode the actual token here
const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN || '';
const REPO_OWNER = process.env.REACT_APP_GITHUB_OWNER || 'your-github-username';
const REPO_NAME = process.env.REACT_APP_GITHUB_REPO || 'feedback-repo';

// Create Octokit instance
const octokit = new Octokit({
  auth: GITHUB_TOKEN
});

const GitHubService = {
  /**
   * Submit feedback as a GitHub issue
   * @param feedbackType Type of feedback (suggestion, bug, feature, other)
   * @param feedbackText The feedback content
   * @param userInfo User information
   * @returns Promise that resolves when the issue is created
   */
  async submitFeedback(
    feedbackType: string,
    feedbackText: string,
    userInfo: { name: string; email: string }
  ): Promise<boolean> {
    try {
      if (!GITHUB_TOKEN) {
        console.error('GitHub token not configured');
        if (isDevelopment) {
          console.log('In development mode - logging feedback to console instead:');
          console.log({
            type: feedbackType, 
            text: feedbackText,
            user: userInfo
          });
          return true; // Return success in dev environment
        }
        return false;
      }

      const response = await octokit.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: `[${feedbackType.toUpperCase()}] Feedback from ${userInfo.name}`,
        body: `
## Feedback Details
- **From:** ${userInfo.name}
- **Email:** ${userInfo.email}
- **Type:** ${feedbackType}
- **Date:** ${new Date().toISOString()}

## Content
${feedbackText}

---
*Submitted via Project Monitor Feedback System*
        `,
        labels: [feedbackType.toLowerCase()]
      });

      return response.status === 201;
    } catch (error) {
      console.error('Error submitting feedback to GitHub:', error);
      return false;
    }
  },

  /**
   * Log feedback locally when GitHub submission is not available
   * @param feedbackType Type of feedback
   * @param feedbackText Feedback content
   * @param userInfo User information
   */
  logFeedbackLocally(
    feedbackType: string,
    feedbackText: string,
    userInfo: { name: string; email: string }
  ): void {
    const feedbackLog = {
      timestamp: new Date().toISOString(),
      type: feedbackType,
      user: userInfo,
      content: feedbackText
    };
    
    console.log('FEEDBACK:', feedbackLog);
    
    // Could also store in localStorage as a fallback
    try {
      const existingLogs = JSON.parse(localStorage.getItem('feedbackLogs') || '[]');
      existingLogs.push(feedbackLog);
      localStorage.setItem('feedbackLogs', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Failed to save feedback to localStorage:', e);
    }
  }
};

export default GitHubService;