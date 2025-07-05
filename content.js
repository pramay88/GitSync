// Enhanced Content script for GitSync🚀
class LeetCodeGitPusher {
    constructor() {
        this.button = null;
        this.solutionData = null;
        this.isProcessing = false;
        this.observers = [];
        this.debugMode = false;
        this.init();
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[GitSync🚀] ${message}`, data || '');
        }
    }

    error(message, error = null) {
        console.error(`[GitSync🚀 ERROR] ${message}`, error || '');
    }

    init() {
        this.log('Initializing GitSync🚀...');
        this.log('Current URL:', window.location.href);
        this.log('Page readyState:', document.readyState);
        
        this.waitForPageLoad();
        this.observeUrlChanges();
    }

    observeUrlChanges() {
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
            const currentUrl = location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                this.log('URL changed to:', currentUrl);
                this.cleanup();
                setTimeout(() => this.startMonitoring(), 2000);
            }
        });
        
        observer.observe(document, { subtree: true, childList: true });
        this.observers.push(observer);
    }

    waitForPageLoad() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.log('DOM loaded, starting monitoring...');
                this.startMonitoring();
            });
        } else {
            this.log('DOM already loaded, starting monitoring...');
            this.startMonitoring();
        }
    }

    startMonitoring() {
        this.log('Starting to monitor for successful submissions...');
        
        // Check immediately
        this.checkForSuccessfulSubmission();
        
        // Set up continuous monitoring
        this.observeSubmissionResults();
        
        // Also check periodically
        setInterval(() => {
            this.checkForSuccessfulSubmission();
        }, 3000);
    }

    observeSubmissionResults() {
        const targetNode = document.body;
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldCheck = true;
                }
            });
            
            if (shouldCheck) {
                setTimeout(() => this.checkForSuccessfulSubmission(), 500);
            }
        });

        observer.observe(targetNode, {
            childList: true,
            subtree: true
        });

        this.observers.push(observer);
    }

    checkForSuccessfulSubmission() {
        // Multiple strategies to detect successful submission
        const strategies = [
            this.checkForAcceptedStatus.bind(this),
            this.checkForSuccessElements.bind(this),
            this.checkForRuntimeMemoryStats.bind(this),
            this.checkForSubmissionUrl.bind(this)
        ];

        for (const strategy of strategies) {
            if (strategy()) {
                this.log('Successful submission detected!');
                this.handleSuccessfulSubmission();
                return;
            }
        }
    }

    checkForAcceptedStatus() {
        const acceptedSelectors = [
            '[data-e2e-locator="submission-result"]',
            '.submission-result',
            '[class*="accepted"]',
            '[class*="success"]'
        ];

        for (const selector of acceptedSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                const text = element.textContent.toLowerCase();
                if (text.includes('accepted')) {
                    this.log('Found accepted status in:', selector);
                    return true;
                }
            }
        }
        return false;
    }

    checkForSuccessElements() {
        const successTexts = ['accepted', 'success', 'correct'];
        const allElements = document.querySelectorAll('*');
        
        for (const element of allElements) {
            const text = element.textContent.toLowerCase();
            for (const successText of successTexts) {
                if (text.includes(successText) && 
                    (text.includes('runtime') || text.includes('memory') || text.includes('ms') || text.includes('mb'))) {
                    this.log('Found success indicator with performance metrics');
                    return true;
                }
            }
        }
        return false;
    }

    checkForRuntimeMemoryStats() {
        const text = document.body.textContent.toLowerCase();
        const hasRuntime = /runtime[:\s]*\d+\s*ms/i.test(text);
        const hasMemory = /memory[:\s]*\d+\.?\d*\s*mb/i.test(text);
        
        if (hasRuntime && hasMemory) {
            this.log('Found runtime and memory stats, likely successful submission');
            return true;
        }
        return false;
    }

    checkForSubmissionUrl() {
        const url = window.location.href;
        const isSubmissionPage = /\/problems\/[^\/]+\/submissions\/\d+/.test(url);
        
        if (isSubmissionPage) {
            this.log('On submission page, checking for accepted status...');
            // Additional check for accepted on submission page
            setTimeout(() => {
                const pageText = document.body.textContent.toLowerCase();
                if (pageText.includes('accepted')) {
                    this.log('Found accepted status on submission page');
                    this.handleSuccessfulSubmission();
                }
            }, 2000);
        }
        
        return false;
    }

    async handleSuccessfulSubmission() {
    if (this.button && document.body.contains(this.button)) {
        this.log('Button already exists in DOM, skipping...');
        return;
    }

    this.log('Creating (or re-creating) push button...');
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.solutionData = await this.extractSolutionData();
        if (this.solutionData) {
            this.log('Solution data extracted successfully:', this.solutionData);
            this.createPushButton();
        } else {
            this.error('Failed to extract solution data');
        }
    } catch (error) {
        this.error('Error handling successful submission:', error);
    }
}


    async extractSolutionData() {
        this.log('Extracting solution data...');
        
        try {
            // Get problem title
            const problemTitle = this.extractProblemTitle();
            this.log('Problem title:', problemTitle);
            
            if (!problemTitle) {
                throw new Error('Could not extract problem title');
            }

            // Get difficulty
            const difficulty = await this.extractDifficulty();
this.log('Difficulty:', difficulty);

        

            // Get code from editor
            const code = this.extractCode();
            this.log('Code length:', code ? code.length : 'null');
            
            if (!code) {
                throw new Error('Could not extract solution code');
            }

            // Get language
            const language = this.extractLanguage();
            this.log('Language:', language);

            // Get performance metrics
            const { runtime, memory } = this.extractPerformanceMetrics();
            this.log('Performance:', { runtime, memory });

            // Get problem URL
            const url = window.location.href;

            // const complexity = await this.getComplexity(code);
            const complexity = "N/A"; // Placeholder, uncomment if you implement complexity analysis

            const solutionData = {
                problemTitle,
                difficulty: difficulty || 'Unknown',
                code: code.trim(),
                language: language || 'Unknown',
                runtime: runtime || 'N/A',
                memory: memory || 'N/A',
                url,
                complexity: complexity || 'N/A'
            };

            this.log('Complete solution data:', solutionData);
            return solutionData;

        } catch (error) {
            this.error('Error extracting solution data:', error);
            return null;
        }
    }

    extractProblemTitle() {
    const titleSelectors = [
        '[data-cy="question-title"]',
        '.css-v3d350',
        'h1[class*="title"]',
        'h1',
        '.question-title',
        '[class*="title"]'
    ];

    for (const selector of titleSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
            const text = element.textContent.trim();
            if (text && text.length > 0 && text.length < 200) {
                // Filter out obviously wrong titles
                if (!text.toLowerCase().includes('solution') &&
                    !text.toLowerCase().includes('submit') &&
                    !text.toLowerCase().includes('accepted')) {

                    // ✨ Try to prepend problem number from URL
                    const match = window.location.href.match(/problems\/(\d+)-/);
                    if (match) {
                        return `${match[1]}. ${text}`;
                    }
                    return text;
                }
            }
        }
    }

    // Fallback from slug
    const urlParts = window.location.pathname.split('/');
    const problemSlug = urlParts.find(part => part.includes('-') && part.length > 3);
    if (problemSlug) {
        const match = window.location.href.match(/problems\/(\d+)-/);
        const title = problemSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return match ? `${match[1]}. ${title}` : title;
    }

    return null;
}


    async  fetchDifficultyFromAPI(problemSlug) {
    try {
        const res = await fetch(`https://leetcode.com/graphql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operationName: "getQuestionDetail",
                query: `query getQuestionDetail($titleSlug: String!) {
                    question(titleSlug: $titleSlug) {
                        difficulty
                    }
                }`,
                variables: { titleSlug: problemSlug }
            })
        });

        const json = await res.json();
        console.log('➡️LeetCode API raw response for difficulty:', json);
        return json.data?.question?.difficulty || 'Unknown';
    } catch (e) {
        console.error('Failed to fetch difficulty from API:', e);
        return 'Unknown';
    }
}



    async extractDifficulty() {
    const slugMatch = window.location.pathname.match(/problems\/([\w-]+)(?=\/|$)/);
    const problemSlug = slugMatch?.[1];
    if (problemSlug) {
        const difficulty = await this.fetchDifficultyFromAPI(problemSlug);
        this.log('Fetched difficulty from API:', difficulty);
        return difficulty;
    }
    return 'Unknown';
}



//     extractCode() {
//         // Try Monaco
//     try {
//         if (typeof monaco !== 'undefined' && monaco.editor) {
//     const editors = monaco.editor.getModels();
//     if (editors.length > 0) {
//         const code = editors[0].getValue();
//         if (code?.trim()) {
//             return code;
//         }
//     }
// }

//     } catch (err) {
//         this.log('Monaco error:', err);
//     }
//     try {
//         const codeBlocks = document.querySelectorAll('pre code[class^="language-"]');
//         for (const codeEl of codeBlocks) {
//             const code = codeEl.textContent;
//             if (code && code.trim().length > 20) {
//                 this.log('✅ Code extracted from <pre><code>');
//                 return code;
//             }
//         }

//         this.log('❌ No code found in <pre><code> blocks.');
//     } catch (error) {
//         this.log('HTML code extraction error:', error);
//     }

//     // Try CodeMirror
//     this.log('Trying CodeMirror...');
//     try {
//         const editor = document.querySelector('.CodeMirror')?.CodeMirror;
//         if (editor) {
//             const code = editor.getValue();
//             if (code?.trim()) {
//                 this.log('✅ CodeMirror: code extracted.');
//                 return code;
//             }
//         }
//     } catch (err) {
//         this.log('CodeMirror error:', err);
//     }

//     // Try <textarea>
//     this.log('Trying textarea...');
//     for (const textarea of document.querySelectorAll('textarea')) {
//         if (textarea.value?.trim().length > 10) {
//             this.log('✅ Textarea: code extracted.');
//             return textarea.value;
//         }
//     }

//     // Try fallback pre/code
//     this.log('Trying pre/code...');
//     for (const el of document.querySelectorAll('pre code, .code-content, [class*="code"]')) {
//         const code = el.textContent;
//         if (code?.trim().length > 10) {
//             this.log('✅ pre/code: code extracted.');
//             return code;
//         }
//     }

//     // Heuristic fallback
//     this.log('Trying heuristic...');
//     for (const el of document.querySelectorAll('*')) {
//         const text = el.textContent;
//         if (text?.includes('{') && text.includes('}') && text.length > 20) {
//             if (/function|class|def |public |private |return/.test(text)) {
//                 this.log('✅ Heuristic: code extracted.');
//                 return text;
//             }
//         }
//     }

//     this.log('❌ No code found in any method.');
//     return null;
// }

 isValidSubmissionPage() {
    return /^https:\/\/leetcode\.com\/problems\/[^/]+\/submissions\/\d+\/?$/.test(window.location.href);
  }

extractCode() {
  if (!this.isValidSubmissionPage()) {
    console.warn('❌ Not a valid submission page. Code extraction skipped.');
    return null;
  }

  const codeElement = document.querySelector('.px-4.py-3 pre code');
  if (!codeElement) {
    console.warn('⚠️ Code block not found.');
    return null;
  }

  // Instead of extracting all spans (which may include visual tokens / duplicates),
  // just take the textContent of the code block itself.
  let code = codeElement.textContent || '';

  // Normalize line endings and trim extra spaces
  code = code.replace(/\r\n/g, '\n').replace(/\n{2,}/g, '\n').trim();

  return code;
}



    extractLanguage() {
  // Your existing fallback language extractor
  const languageSelectors = [
    '[data-mode]',
    '.lang-selector',
    '.language-selector',
    '[class*="language"]',
    '[class*="lang"]'
  ];

  for (const selector of languageSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const dataMode = element.getAttribute('data-mode');
      if (dataMode) return dataMode.toLowerCase();

      const text = element.textContent?.toLowerCase();
      const languages = ['javascript', 'python', 'java', 'cpp', 'c++', 'c#', 'go', 'rust', 'typescript'];
      for (const lang of languages) {
        if (text?.includes(lang)) {
          return lang === 'cpp' ? 'c++' : lang;
        }
      }
    }
  }

  const buttons = document.querySelectorAll('button, select, option');
  for (const button of buttons) {
    const text = button.textContent?.toLowerCase();
    if (text.includes('javascript') || text.includes('js')) return 'javascript';
    if (text.includes('python')) return 'python';
    if (text.includes('java') && !text.includes('javascript')) return 'java';
    if (text.includes('c++') || text.includes('cpp')) return 'c++';
    if (text.includes('c#')) return 'c#';
    if (text.includes('go')) return 'go';
    if (text.includes('rust')) return 'rust';
  }

  return 'unknown';
}

    extractPerformanceMetrics() {
    const text = document.body.textContent.toLowerCase();
    let runtime = null;
    let memory = null;

    const runtimeMatch = text.match(/runtime[:\s]*([\d.]+)\s*ms.*?beats\s*([\d.]+)%/i);
    const memoryMatch = text.match(/memory[:\s]*([\d.]+)\s*mb.*?beats\s*([\d.]+)%/i);

    if (runtimeMatch) {
        runtime = `${runtimeMatch[1]} ms (beats ${runtimeMatch[2]}%)`;
    }

    if (memoryMatch) {
        memory = `${memoryMatch[1]} MB (beats ${memoryMatch[2]}%)`;
    }

    return { runtime, memory };
}
    
    async getComplexity(code) {
    // 👇 Only extract if not passed
    if (!code) {
        code = await this.extractCode();
    }

    if (!code) {
        console.error('❌No code found to analyze complexity');
        return null;
    }

    console.log('Code sent to API:', code.slice(0, 100)); // log first 100 chars

    try {
        // ✅ Ensure code is a string and not empty
        const codeString = String(code).trim();
        if (!codeString) {
            console.error('❌Code is empty after trimming');
            return null;
        }

        const requestBody = {
            code: codeString
        };

        console.log('📤 Sending request body:', {
            code: codeString.slice(0, 100) + '...',
            codeLength: codeString.length,
            codeType: typeof codeString
        });

        const res = await fetch('https://code-analyzer-six.vercel.app/api/analyze', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
        });

        console.log('📥 Response status:', res.status);
        console.log('📥 Response headers:', [...res.headers.entries()]);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Server error response:', errorText);
            throw new Error(`Server error: ${res.status} - ${errorText}`);
        }

        const complexityData = await res.json();
        console.log('📊 Full response data:', complexityData);

        if (complexityData?.result) {
            console.log('➡️Complexity:', complexityData.result);
            return complexityData.result;
        } else {
            console.error('❌No result in complexityData', complexityData);
            return null;
        }

    } catch (error) {
        console.error('[GitSync🚀 ERROR] Error fetching complexity:', error);
        return null;
    }
}







    createPushButton() {
    this.log('Creating push button...');

    // Remove existing button if present
    const existingBtn = document.getElementById('leetcode-git-pusher-btn');
    if (existingBtn) {
        existingBtn.remove();
    }

    // Check if it's a submission page
    const isSubmissionPage = /\/problems\/[^/]+\/submissions\/\d+\/?$/.test(window.location.pathname);

    // Create button
    this.button = document.createElement('button');
    this.button.id = 'leetcode-git-pusher-btn';
    this.button.className = 'leetcode-git-pusher-btn';
    this.button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
        Push to GitHub
    `;

    this.button.title = 'Push your solution to GitHub repository';

    // Set functional behavior based on page
    if (isSubmissionPage) {
        this.button.disabled = false;
        this.button.style.opacity = '1';
        this.button.style.cursor = 'pointer';
        this.button.addEventListener('click', () => this.handleButtonClick());
    } else {
        this.button.disabled = true;
        this.button.style.opacity = '0.5';
        this.button.style.cursor = 'not-allowed';
        this.button.title = 'Please submit your solution before pushing to GitHub.';

    }

    // Create container
    const container = document.createElement('div');
    container.className = 'leetcode-git-pusher-container';
    container.appendChild(this.button);

    // Insert into DOM
    this.insertButton(container);
}


    insertButton(container) {
    // Prevent duplicate insertion
    if (document.getElementById('leetcode-git-pusher-btn')) {
        this.log('⚠️ Button already inserted. Skipping.');
        return;
    }

    container.id = 'leetcode-git-pusher-btn';

    // Strategy 1: Near submission result
    const resultSelectors = [
        '[data-e2e-locator="submission-result"]',
        '.submission-result',
        '.result-container'
    ];

    for (const selector of resultSelectors) {
        const element = document.querySelector(selector);
        if (element && element.parentNode instanceof HTMLElement) {
            element.parentNode.insertBefore(container, element.nextSibling);
            this.log('✅ Button inserted near submission result');
            return;
        }
    }

    // Strategy 2: Near performance metrics
    const performanceElements = document.querySelectorAll('*');
    for (const element of performanceElements) {
        const text = element.textContent?.toLowerCase() || '';
        if (text.includes('runtime') && text.includes('memory') && text.includes('ms')) {
            if (element.parentNode instanceof HTMLElement) {
                element.parentNode.insertBefore(container, element.nextSibling);
                this.log('✅ Button inserted near performance metrics');
                return;
            }
        }
    }

    // Strategy 3: Top of the page
    const topBarSelectors = [
        '.flex.justify-between.items-center',
        '.submission-header',
        '.problem-header'
    ];

    for (const selector of topBarSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            element.appendChild(container);
            container.classList.add('in-result-area');
            this.log('✅ Button inserted in top bar');
            return;
        }
    }

    // Strategy 4: Fallback - append to body
    if (document.body) {
        document.body.appendChild(container);
        this.log('✅ Button inserted at bottom of page (fallback)');
    } else {
        this.error('❌ Failed to insert button: No valid parent node found.');
    }
}


    async handleButtonClick() {
        if (this.isProcessing) {
            this.log('Already processing, ignoring click');
            return;
        }

        this.log('Button clicked, starting push process...');
        this.isProcessing = true;
        this.updateButtonState('processing');

        try {
            // Check authentication first
            const authStatus = await this.checkAuthentication();
            this.log('Auth status:', authStatus);
            
            if (!authStatus.authenticated) {
                this.showAuthenticationRequired();
                return;
            }

            // Push solution to GitHub
            this.log('Pushing solution to GitHub...');
            const response = await this.pushSolutionToGitHub();
            this.log('Push response:', response);
            
            if (response.success) {
                this.updateButtonState('success');
                this.showSuccessMessage(response.url, response.fileName);
            } else {
                throw new Error(response.error || 'Failed to push solution');
            }

        } catch (error) {
            this.error('Error pushing solution:', error);
            this.updateButtonState('error');
            this.showErrorMessage(error.message);
        } finally {
            this.isProcessing = false;
            setTimeout(() => this.updateButtonState('default'), 5000);
        }
    }

    updateButtonState(state) {
    if (!this.button) return;

    const states = {
        default: {
            text: 'Push to GitHub',
            className: 'leetcode-git-pusher-btn',
            disabled: false
        },
        processing: {
            text: '<div class="leetcode-loading-spinner"></div> Pushing...',
            className: 'leetcode-git-pusher-btn processing',
            disabled: true
        },
        success: {
            text: 'Pushed Successfully! ✅',
            className: 'leetcode-git-pusher-btn success',
            disabled: true
        },
        error: {
            text: 'Push Failed ❌',
            className: 'leetcode-git-pusher-btn error',
            disabled: false
        }
    };

    const current = states[state] || states.default;
    this.button.innerHTML = current.text;
    this.button.className = current.className;
    this.button.disabled = current.disabled;
}

showAuthenticationRequired() {
    alert("GitHub authentication is required. Please connect from the extension popup.");
}

showSuccessMessage(url, fileName) {
    alert(`Solution successfully pushed to GitHub!\n\nFile: ${fileName}\nURL: ${url}`);
}

showErrorMessage(message) {
    alert(`Error pushing solution: ${message}`);
}

checkAuthentication() {
    return new Promise((resolve) => {
        if (!chrome?.runtime?.sendMessage) {
            this.error('chrome.runtime.sendMessage is not available');
            return resolve({ authenticated: false });
        }

        chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
            resolve(response || { authenticated: false });
        });
    });
}

pushSolutionToGitHub() {
    return new Promise((resolve) => {
        if (!chrome?.runtime?.sendMessage) {
            this.error('chrome.runtime.sendMessage is not available');
            return resolve({ success: false, error: 'Extension runtime not available.' });
        }

        chrome.runtime.sendMessage(
            {
                action: 'pushSolution',
                data: this.solutionData
            },
            (response) => {
                resolve(response || { success: false, error: 'No response from background script.' });
            }
        );
    });
}

cleanup() {
    this.log('Cleaning up previous observers and button');
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    if (this.button) {
        this.button.remove();
        this.button = null;
    }
  }
}

// Initialize on matching LeetCode pages
if (window.location.hostname.includes('leetcode.com')) {
    window.leetGitPusher = new LeetCodeGitPusher();
}
