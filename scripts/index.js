
let debounceTimer;
const debouncedFetchBranches = debounce(fetchBranches, 300);
const projects = [
    { name: "coreBranch", projectId: "61381988",dataListId: 'coreBranchSuggestions', branchName: document.getElementById('coreBranch').value },
    { name: "monorepoBranch", projectId: "61381477",dataListId: 'monorepoBranchSuggestions', branchName: document.getElementById('monorepoBranch').value },
    { name: "coreServicesBranch", projectId: "61381858",dataListId: 'coreServicesBranchSuggestions', branchName: document.getElementById('coreServicesBranch').value },
    { name: "apiGatewayBranch", projectId: "61381918",dataListId: 'apiGatewayBranchSuggestions', branchName: document.getElementById('apiGatewayBranch').value },
    { name: "dashboardBranch", projectId: "61381520",dataListId: 'dashboardBranchSuggestions', branchName: document.getElementById('dashboardBranch').value }
];

projects.forEach(function(project) {
    document.getElementById(project.name).addEventListener('input', function() {
        debouncedFetchBranches(project.name, project.projectId, project.dataListId);
    });
});



function showModalWithLinks(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customModal');
        const modalMessage = document.getElementById('modalMessage');
        const closeBtn = document.querySelector('.close-btn');

        modalMessage.innerHTML = message;
        modal.style.display = 'block';


        const closeModal = () => {
            modal.style.display = 'none';
            resolve();
        };

        closeBtn.onclick = closeModal;

        window.onclick = function (event) {
            if (event.target === modal) {
                closeModal();
            }
        };
    });
}
function toggleCoreInput() {
    const inputLine = document.getElementById('coreInputLine');
    const checkbox = document.getElementById('coreCheckbox')
    if (checkbox.checked) {
        inputLine.classList.remove('hidden');
    } else {
        inputLine.classList.add('hidden');
    }
}

function toggleMonorepoInput() {
    const inputLine = document.getElementById('monorepoInputLine');
    const checkbox = document.getElementById('monorepoCheckbox')
    if (checkbox.checked) {
        inputLine.classList.remove('hidden');
    } else {
        inputLine.classList.add('hidden');
    }
}

function toggleCoreServicesInput() {
    const inputLine = document.getElementById('coreServicesInputLine');
    const checkbox = document.getElementById('coreServicesCheckbox')
    if (checkbox.checked) {
        inputLine.classList.remove('hidden');
    } else {
        inputLine.classList.add('hidden');
    }
}

function toggleApiGatewayInput() {
    const inputLine = document.getElementById('apiGatewayInputLine');
    const checkbox = document.getElementById('apiGatewayCheckbox')
    if (checkbox.checked) {
        inputLine.classList.remove('hidden');
    } else {
        inputLine.classList.add('hidden');
    }
}

function toggleDashboardInput() {
    const inputLine = document.getElementById('dashboardInputLine');
    const checkbox = document.getElementById('dashboardCheckbox')
    if (checkbox.checked) {
        inputLine.classList.remove('hidden');
    } else {
        inputLine.classList.add('hidden');
    }
}

const getKeyFromLocalStorage = () => {
    return chrome.storage.local.get('gitlabToken').then(({ gitlabToken }) => {
        console.log("Value is " + gitlabToken);
        return gitlabToken
    });
}

function formToggle(disable) {
    const form = document.getElementById("form")
    const loader = document.getElementById("loader")
    const formElements = form.elements
    for (let i = 0, len = formElements.length; i < len; ++i) {
        if (disable) {
            formElements[i].disabled = true;
            loader.style.display = 'block'

        } else {
            formElements[i].disabled = false;
            loader.style.display = 'none'
        }
    }
}
async function sendDataToBackground() {

    const envName = document.getElementById('environment').value;
    const deployDevValue = document.getElementById('deployDev').checked;
    const deployMasterValue = document.getElementById('deployMaster').checked;
    const skipTests = document.getElementById('monorepoSkipTests').checked;
    const gitlabToken = await getKeyFromLocalStorage()

    chrome.runtime.sendMessage({
        action: 'deployToEnv',
        projects: projects,
        envName: envName,
        deployDevValue: deployDevValue,
        deployMasterValue: deployMasterValue,
        skipTests: skipTests,
        accessToken: gitlabToken
    }, (response) => {
        endDeployProcess(response.finalMessage)
    });
}

async function endDeployProcess(finalMessage){
    const form = document.getElementById('form')

    await showModalWithLinks(finalMessage)
    form.reset()
    formToggle(false)
    window.close()

}

document.addEventListener('DOMContentLoaded', function () {
    const coreCheckbox = document.getElementById('coreCheckbox')
    const monorepoCheckbox = document.getElementById('monorepoCheckbox')
    const coreServicesCheckbox = document.getElementById('coreServicesCheckbox')
    const apiGatewayCheckbox = document.getElementById('apiGatewayCheckbox')
    const dashboardCheckbox = document.getElementById('dashboardCheckbox')
    const deployDevCheckbox = document.getElementById('deployDev')
    const deployMasterCheckbox = document.getElementById('deployMaster')
    const deployDevContainer = document.getElementById('deployDevContainer')
    const deployMasterContainer = document.getElementById('deployMasterContainer')

    const submitButton = document.getElementById('form')

    monorepoCheckbox.addEventListener('change', function () {
        toggleMonorepoInput();
    });

    coreCheckbox.addEventListener('change', function () {
        toggleCoreInput();
    });
    coreServicesCheckbox.addEventListener('change', function () {
        toggleCoreServicesInput();
    });
    apiGatewayCheckbox.addEventListener('change', function () {
        toggleApiGatewayInput();
    });
    dashboardCheckbox.addEventListener('change', function () {
        toggleDashboardInput();
    });
    deployDevCheckbox.addEventListener('change', function () {
        if(deployMasterCheckbox.checked){
            deployMasterCheckbox.checked = false;
        }
    });
    deployMasterCheckbox.addEventListener('change', function () {
        if(deployDevCheckbox.checked){
            deployDevCheckbox.checked = false;
        }
    });
    deployDevContainer.addEventListener('click',function () {
        if(deployMasterCheckbox.checked){
            deployMasterCheckbox.checked = false;
        }
        deployDevCheckbox.checked = !deployDevCheckbox.checked;

    });
    deployMasterContainer.addEventListener('click',function () {
        if(deployDevCheckbox.checked){
            deployDevCheckbox.checked = false;
        }
        deployMasterCheckbox.checked = !deployMasterCheckbox.checked;

    });

    submitButton.addEventListener("submit", async (event) => {
        event.preventDefault();
        await formToggle(true)
        await sendDataToBackground()

    });
});

async function fetchBranches(inputId, projectId, dataListId) {
    const branchInput = document.getElementById(inputId);
    const query = branchInput.value.trim();

    // Only fetch branches if the input is at least 3 characters long
    if (query.length < 3) {
        return;
    }

    const accessToken = await getKeyFromLocalStorage(); // Assuming you have a function to get token

    const response = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/repository/branches?search=${query}`, {
        headers: {
            'PRIVATE-TOKEN': accessToken
        }
    });

    const branches = await response.json();
    updateDatalist(branches, dataListId);
}

function debounce(fn, delay) {
    return function (...args) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => fn.apply(this, args), delay);
    };
}




// Update the datalist with fetched branch suggestions
function updateDatalist(branches, dataListId) {
    const datalist = document.getElementById(dataListId);

    // Clear existing options
    datalist.innerHTML = '';

    // Add new options from the fetched branches
    branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch.name; // Set the value as branch name
        datalist.appendChild(option);
    });
}




