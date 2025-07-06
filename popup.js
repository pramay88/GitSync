//popup.js
document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connect-btn');
    const tokenInput = document.getElementById('github-token');
    const authStatus = document.getElementById('auth-status');

    const saveBtn = document.getElementById('save-settings-btn');
    const repoInput = document.getElementById('repo-name');
    const commitMsgInput = document.getElementById('commit-message');
    const autoSyncCheckbox = document.getElementById('auto-sync');
    const messageContainer = document.getElementById('message-container');

    // Check saved auth on load
    chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
        if (response.success && response.authenticated) {
            authStatus.classList.remove('disconnected');
            authStatus.classList.add('connected');
            authStatus.innerHTML = `
                <div class="status-dot"></div>
                <span>Connected as ${response.username}</span>
            `;
        }
    });

    // Handle connect to GitHub
    connectBtn.addEventListener('click', () => {
        const token = tokenInput.value.trim();

        if (!token.startsWith('ghp_') && token.length < 40) {
            alert('Please enter a valid GitHub personal access token');
            return;
        }

        chrome.runtime.sendMessage({
            action: 'authenticate',
            data: { token }
        }, (response) => {
            if (response.success) {
                authStatus.classList.remove('disconnected');
                authStatus.classList.add('connected');
                authStatus.innerHTML = `
                    <div class="status-dot"></div>
                    <span>Connected as ${response.username}</span>
                `;
                showMessage('Connected to GitHub!', 'success');
            } else {
                alert('Authentication failed: ' + response.error);
            }
        });
    });

    // Handle saving sync settings
    saveBtn.addEventListener('click', () => {
        const config = {
            repoName: repoInput.value.trim(),
            defaultCommitMessage: commitMsgInput.value.trim(),
            autoCommit: autoSyncCheckbox.checked,
        };

        chrome.runtime.sendMessage({
            action: 'saveConfig',
            data: config
        }, (response) => {
            if (response.success) {
                showMessage('Settings saved successfully', 'success');
            } else {
                showMessage('Failed to save settings: ' + response.error, 'error');
            }
        });
    });

    // Display message
    function showMessage(text, type) {
        messageContainer.innerHTML = `
            <div class="message ${type}">${text}</div>
        `;
        setTimeout(() => messageContainer.innerHTML = '', 4000);
    }
});

const totalSyncedEl = document.getElementById("total-synced");
const easyCountEl = document.getElementById("easy-count");
const mediumCountEl = document.getElementById("medium-count");
const hardCountEl = document.getElementById("hard-count");

chrome.storage.local.get(["syncedSolutions"], (result) => {
  const history = result.syncedSolutions || [];

  const counts = { easy: 0, medium: 0, hard: 0 };
  const uniqueProblems = new Map(); // Map<problemNumber, difficulty>

  history.forEach(item => {
    const title = item.title?.trim();

    const difficulty = item.difficulty?.toLowerCase(); // normalize to lowercase

    if (!title || !difficulty) return;

    const match = title.match(/^(\d+)\.\s+/); // extract "1" from "1. Two Sum"
    if (!match) return;

    const problemNumber = match[1];

    // If not already added, count it
    if (!uniqueProblems.has(problemNumber)) {
      uniqueProblems.set(problemNumber, difficulty);
      if (counts[difficulty] !== undefined) {
        counts[difficulty]++;
      }
    }
  });

  totalSyncedEl.textContent = uniqueProblems.size;
  easyCountEl.textContent = counts.easy;
  mediumCountEl.textContent = counts.medium;
  hardCountEl.textContent = counts.hard;
});

document.querySelectorAll(".tab-button").forEach(button => {
  button.addEventListener("click", () => {
    const tab = button.getAttribute("data-tab");

    // Toggle active tab button
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    // Toggle content
    document.querySelectorAll(".tab-content").forEach(content => {
      content.classList.remove("active");
      if (content.getAttribute("data-tab") === tab) {
        content.classList.add("active");
      }
    });
  });
});
