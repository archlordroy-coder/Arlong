const axios = require('axios');

class GitHubService {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.owner = 'tchindadjomo';
    this.repo = 'MboaDrive';
    this.baseUrl = 'https://api.github.com';
  }

  async getCommits() {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${this.owner}/${this.repo}/commits`, {
        headers: {
          Authorization: this.token ? `token ${this.token}` : undefined,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      // Enrich with check runs info
      const enrichedCommits = await Promise.all(response.data.map(async (commit) => {
        try {
          const checkRuns = await this.getCheckRuns(commit.sha);
          return { ...commit, check_runs: checkRuns };
        } catch (e) {
          return { ...commit, check_runs: null };
        }
      }));

      return enrichedCommits;
    } catch (error) {
      console.error('Error fetching GitHub commits:', error.response?.data || error.message);
      throw new Error('Impossible de récupérer les commits GitHub');
    }
  }

  async getCheckRuns(ref) {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${this.owner}/${this.repo}/commits/${ref}/check-runs`, {
        headers: {
          Authorization: this.token ? `token ${this.token}` : undefined,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      return response.data;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new GitHubService();
