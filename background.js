// Enhanced Background service worker for the GitSync🚀 extension
class BackgroundService {
    constructor() {
        this.fileExtensions = {
            'javascript': 'js',
            'typescript': 'ts',
            'python': 'py',
            'python3': 'py',
            'java': 'java',
            'cpp': 'cpp',
            'c++': 'cpp',
            'csharp': 'cs',
            'c#': 'cs',
            'go': 'go',
            'golang': 'go',
            'rust': 'rs',
            'kotlin': 'kt',
            'swift': 'swift',
            'ruby': 'rb',
            'php': 'php',
            'scala': 'scala',
            'mysql': 'sql',
            'mssql': 'sql',
            'oraclesql': 'sql'
        };
        this.init();
    }

    init() {
        // Listen for messages from content scripts and popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep the message channel open for async responses
        });

        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            this.handleInstallation(details);
        });

        console.log('GitSync🚀: Background service initialized');
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'pushSolution':
                    await this.handlePushSolution(request.data, sendResponse);
                    break;
                case 'authenticate':
                    await this.handleAuthentication(request.data, sendResponse);
                    break;
                case 'checkAuth':
                    await this.checkAuthStatus(sendResponse);
                    break;
                case 'getConfig':
                    await this.getConfiguration(sendResponse);
                    break;
                case 'saveConfig':
                    await this.saveConfiguration(request.data, sendResponse);
                    break;
                case 'testConnection':
                    await this.testGitHubConnection(sendResponse);
                    break;
                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('❌Background service error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async handleInstallation(details) {
        if (details.reason === 'install') {
            // Set default configuration
            await chrome.storage.sync.set({
                repoName: 'leetcode-solutions',
                folderPath: 'solutions/',
                autoCommit: true,
                includeConstraints: true,
                includeComplexity: true,
                privateRepo: false
            });

            // Open welcome page
            chrome.tabs.create({
                url: chrome.runtime.getURL('welcome.html')
            });
        }
    }

    async handlePushSolution(solutionData, sendResponse) {
        try {
            // Validate solution data
            if (!solutionData || !solutionData.problemTitle || !solutionData.code) {
                throw new Error('Invalid solution data. Please ensure you have a valid accepted solution.');
            }

            // Get authentication and configuration
            const config = await chrome.storage.sync.get([
                'githubToken', 
                'githubUser', 
                'repoName', 
                'folderPath',
                'includeConstraints',
                'includeComplexity',
                'privateRepo'
            ]);

            if (!config.githubToken || !config.githubUser) {
                throw new Error('GitHub authentication required. Please set up your GitHub token in the extension popup.');
            }

            if (!config.repoName) {
                throw new Error('Repository name not configured. Please set it in the extension popup.');
            }

            // Validate GitHub token format
            if (!this.isValidGitHubToken(config.githubToken)) {
                throw new Error('Invalid GitHub token format. Please check your token and try again.');
            }

            // Generate markdown content
            const markdownContent = this.generateMarkdown(solutionData, config);
            
            // Create filename from problem title
            const langExt = this.fileExtensions[solutionData.language.toLowerCase()] || solutionData.language.toLowerCase();
            
            const fileName = `${this.createFileName(solutionData.problemTitle)}_${langExt}.md`;



            const filePath = config.folderPath ? `${config.folderPath}${fileName}` : fileName;

            // Ensure repository exists
            await this.ensureRepository(config.githubToken, config.githubUser, config.repoName, config.privateRepo);

            // Push to GitHub
            const result = await this.pushToGitHub(
                config.githubToken,
                config.githubUser,
                config.repoName,
                filePath,
                markdownContent,
                solutionData.problemTitle
            );

            // Update statistics
            await this.updateStatistics(solutionData.difficulty);

            sendResponse({ 
                success: true, 
                url: result.content.html_url,
                message: 'Solution pushed successfully!',
                fileName: fileName
            });

        } catch (error) {
            console.error('Push solution error:', error);
            sendResponse({ 
                success: false, 
                error: error.message 
            });
        }
    }

    isValidGitHubToken(token) {
        // GitHub tokens start with 'ghp_', 'gho_', 'ghu_', or 'ghs_' and are typically 40+ characters
        const tokenPattern = /^(ghp_|gho_|ghu_|ghs_)[a-zA-Z0-9]{36,}$/;
        return tokenPattern.test(token) || token.length >= 40; // Fallback for older token formats
    }

    generateMarkdown(solutionData, config) {
        const { 
            problemTitle, 
            difficulty, 
            code, 
            language, 
            runtime, 
            memory, 
            url,
            complexity
        } = solutionData;
        
        const fileExtensions = {
            'javascript': 'js',
            'typescript': 'ts',
            'python': 'py',
            'python3': 'py',
            'java': 'java',
            'cpp': 'cpp',
            'c++': 'cpp',
            'csharp': 'cs',
            'c#': 'cs',
            'go': 'go',
            'golang': 'go',
            'rust': 'rs',
            'kotlin': 'kt',
            'swift': 'swift',
            'ruby': 'rb',
            'php': 'php',
            'scala': 'scala',
            'mysql': 'sql',
            'mssql': 'sql',
            'oraclesql': 'sql'
        };
        
        const langExt = fileExtensions[language.toLowerCase()] || language.toLowerCase();
        function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
       

        // Build markdown content
        let markdownContent = `# ${problemTitle}

**Difficulty:** ${difficulty}  
**Language:** ${capitalize(language)}  

#### *Problem Link*: [${problemTitle}](${url.split("/submissions")[0] + "/"})

## Performance
- **Runtime:** ${runtime}
- **Memory:** ${memory}

## Solution
\`\`\`${langExt}
${code}
\`\`\`
`;

        // Add optional sections based on configuration
        if (config.includeComplexity) {
            markdownContent += `
## Complexity Analysis

${complexity?.result || "- **Time Complexity:** O(?)\n- **Space Complexity:** O(?)"}

${complexity?.result ? (
  complexity?.source === 'fallback'
    ? '> ⚠️ _This complexity was estimated locally. Review advised._'
    : complexity?.source
      ? `>  _Complexity estimated using AI (${complexity.source})._`
      : '>  _Complexity analysis source not available._'
) : ''}
`;
        }

        markdownContent += `

`;

        // Add footer
        markdownContent += `
---
*Solution automatically synced by [GitSync](https://github.com/pramay88/GitSync) 🚀*
`;

        return markdownContent;
    }

    createFileName(problemTitle) {
        return problemTitle
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .trim();
    }

    async ensureRepository(token, username, repoName, isPrivate = false) {
        try {
            // Check if repository exists
            const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'LeetCode-Git-Pusher-Extension'
                }
            });

            if (response.ok) {
                return; // Repository exists
            }

            if (response.status === 404) {
                // Repository doesn't exist, create it
                console.log(`Creating repository: ${repoName}`);
                
                const createResponse = await fetch('https://api.github.com/user/repos', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                        'User-Agent': 'LeetCode-Git-Pusher-Extension'
                    },
                    body: JSON.stringify({
                        name: repoName,
                        description: '🚀 My LeetCode solutions automatically synced using GitSync🚀 browser extension',
                        private: isPrivate,
                        auto_init: true,
                        gitignore_template: null,
                        license_template: null
                    })
                });

                if (!createResponse.ok) {
                    const errorData = await createResponse.json();
                    throw new Error(`Failed to create repository: ${errorData.message || 'Unknown error'}`);
                }

                // Wait a moment for the repository to be fully created
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                // Create initial README
                await this.createInitialReadme(token, username, repoName);
                
                console.log(`Repository ${repoName} created successfully`);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to check repository: ${errorData.message || `HTTP ${response.status}`}`);
            }
        } catch (error) {
            console.error('Error ensuring repository:', error);
            throw error;
        }
    }

    async createInitialReadme(token, username, repoName) {
        const readmeContent = `# 🚀 LeetCode Solutions

This repository contains my LeetCode solutions, automatically synced using the **GitSync🚀** browser extension.

## 📊 Problem Solving Stats
- **Total Problems Solved:** Updating automatically...
- **Easy:** 🟢 
- **Medium:** 🟡  
- **Hard:** 🔴 

## 🛠️ Languages Used
- JavaScript/TypeScript
- Python
- Java
- C++
- Go
- Rust
- And more...

## 📁 Repository Structure
\`\`\`
solutions/
├── two-sum.md
├── add-two-numbers.md
├── longest-substring-without-repeating-characters.md
├── median-of-two-sorted-arrays.md
└── ...
\`\`\`

## ✨ Features
Each solution includes:
- 📝 Clean, readable code
- 🎯 Problem difficulty and link
- ⚡ Runtime and memory performance
- 🧠 Approach explanation section
- 📊 Complexity analysis template
- 🔑 Key insights section

## 🔧 How It Works
This repository is automatically maintained using the [GitSync🚀](https://github.com) browser extension, which:
- ✅ Detects when you solve a LeetCode problem
- 📤 Extracts your solution code and problem details
- 📋 Formats everything in a clean, consistent markdown template
- 🚀 Commits and pushes to this repository automatically
- 📈 Tracks your solving progress

## 🎯 Goals
- Maintain a comprehensive record of problem-solving journey
- Build a personal reference for coding patterns and techniques
- Track progress and improvement over time
- Share knowledge with the coding community

---
⭐ **Happy Coding!** ⭐  
*Automatically generated by GitSync🚀 Extension*
`;

        try {
            const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/README.md`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'LeetCode-Git-Pusher-Extension'
                },
                body: JSON.stringify({
                    message: '📝 Initialize repository with README',
                    content: btoa(unescape(encodeURIComponent(readmeContent))),
                    committer: {
                        name: 'GitSync🚀',
                        email: 'leetcode-git-pusher@extension.local'
                    }
                })
            });

            if (!response.ok) {
                console.warn('Failed to create README, but continuing...');
            }
        } catch (error) {
            console.warn('Error creating README:', error);
            // Don't throw here, as this is not critical
        }
    }

    async pushToGitHub(token, username, repoName, filePath, content, problemTitle) {
        try {
            // Check if file already exists to get SHA for update
            let sha = null;
            let isUpdate = false;

            const existingFileResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'LeetCode-Git-Pusher-Extension'
                }
            });

            if (existingFileResponse.ok) {
                const fileData = await existingFileResponse.json();
                sha = fileData.sha;
                isUpdate = true;
            }

            // Prepare commit message
            const commitMessage = isUpdate 
                ? `📝 Update solution: ${problemTitle}`
                : `✨ Add solution: ${problemTitle}`;

            // Create or update file
            const requestBody = {
                message: commitMessage,
                content: btoa(unescape(encodeURIComponent(content))),
                committer: {
                    name: 'GitSync🚀',
                    email: 'leetcode-git-pusher@extension.local'
                }
            };

            if (sha) {
                requestBody.sha = sha;
            }

            const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'LeetCode-Git-Pusher-Extension'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`GitHub API error: ${errorData.message || `HTTP ${response.status}`}`);
            }

            const result = await response.json();
            console.log(`Successfully ${isUpdate ? 'updated' : 'created'} file: ${filePath}`);
            
            return result;

        } catch (error) {
            console.error('Error pushing to GitHub:', error);
            throw error;
        }
    }

    async checkAuthStatus(sendResponse) {
        try {
            const result = await chrome.storage.sync.get(['githubToken', 'githubUser']);
            sendResponse({
                success: true,
                authenticated: !!(result.githubToken && result.githubUser),
                username: result.githubUser || null
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: error.message,
                authenticated: false
            });
        }
    }

    async getConfiguration(sendResponse) {
        try {
            const config = await chrome.storage.sync.get([
                'githubToken',
                'githubUser',
                'repoName',
                'folderPath',
                'autoCommit',
                'includeConstraints',
                'includeComplexity',
                'privateRepo'
            ]);
            
            sendResponse({
                success: true,
                config: config
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    async saveConfiguration(configData, sendResponse) {
        try {
            await chrome.storage.sync.set(configData);
            sendResponse({
                success: true,
                message: 'Configuration saved successfully'
            });
        } catch (error) {
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    async testGitHubConnection(sendResponse) {
        try {
            const config = await chrome.storage.sync.get(['githubToken', 'githubUser']);
            
            if (!config.githubToken) {
                throw new Error('GitHub token not configured');
            }

            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${config.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'LeetCode-Git-Pusher-Extension'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`GitHub API error: ${errorData.message || `HTTP ${response.status}`}`);
            }

            const userData = await response.json();
            
            // Update stored username if it's different
            if (userData.login !== config.githubUser) {
                await chrome.storage.sync.set({ githubUser: userData.login });
            }

            sendResponse({
                success: true,
                message: 'GitHub connection successful',
                username: userData.login,
                avatarUrl: userData.avatar_url
            });

        } catch (error) {
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }

    async updateStatistics(difficulty) {
        try {
            const stats = await chrome.storage.sync.get(['problemStats']);
            const currentStats = stats.problemStats || {
                total: 0,
                easy: 0,
                medium: 0,
                hard: 0,
                lastUpdated: new Date().toISOString()
            };

            currentStats.total++;
            if (difficulty.toLowerCase() === 'easy') currentStats.easy++;
            else if (difficulty.toLowerCase() === 'medium') currentStats.medium++;
            else if (difficulty.toLowerCase() === 'hard') currentStats.hard++;
            
            currentStats.lastUpdated = new Date().toISOString();

            await chrome.storage.sync.set({ problemStats: currentStats });
        } catch (error) {
            console.warn('Failed to update statistics:', error);
        }
    }

    async handleAuthentication(authData, sendResponse) {
        try {
            const { token } = authData;
            
            if (!token) {
                throw new Error('GitHub token is required');
            }

            if (!this.isValidGitHubToken(token)) {
                throw new Error('Invalid GitHub token format');
            }

            // Test the token by making a request to GitHub API
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'LeetCode-Git-Pusher-Extension'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Authentication failed: ${errorData.message || 'Invalid token'}`);
            }

            const userData = await response.json();

            // Store the authentication data
            await chrome.storage.sync.set({
                githubToken: token,
                githubUser: userData.login
            });

            sendResponse({
                success: true,
                message: 'Authentication successful',
                username: userData.login
            });

        } catch (error) {
            console.error('Authentication error:', error);
            sendResponse({
                success: false,
                error: error.message
            });
        }
    }
}

// Initialize the background service
new BackgroundService();