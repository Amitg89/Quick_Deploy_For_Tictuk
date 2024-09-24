
let debounceTimer;
const debouncedFetchBranches = debounce(fetchBranches, 300);
const projects = [
    { name: "coreBranch", projectId: "61381988",dataListId: 'coreBranchSuggestions', branchName: '' },
    { name: "monorepoBranch", projectId: "61381477",dataListId: 'monorepoBranchSuggestions', branchName: '' },
    { name: "coreServicesBranch", projectId: "61381858",dataListId: 'coreServicesBranchSuggestions', branchName: '' },
    { name: "apiGatewayBranch", projectId: "61381918",dataListId: 'apiGatewayBranchSuggestions', branchName: '' },
    { name: "dashboardBranch", projectId: "61381520",dataListId: 'dashboardBranchSuggestions', branchName: '' }
];
const elements = {
    monorepo: {
        checkbox:document.getElementById('monorepoCheckbox'),
        inputContainer: document.getElementById('monorepoInputLine'),
        inputLine: document.getElementById('monorepoBranch')
    },
    core: {
        checkbox: document.getElementById('coreCheckbox'),
        inputContainer: document.getElementById('coreInputLine'),
        inputLine: document.getElementById('coreBranch')
    },
    coreServices: {
        checkbox: document.getElementById('coreServicesCheckbox'),
        inputContainer: document.getElementById('coreServicesInputLine'),
        inputLine: document.getElementById('coreServicesBranch')
    },
    apiGateway: {
        checkbox: document.getElementById('apiGatewayCheckbox'),
        inputContainer: document.getElementById('apiGatewayInputLine'),
        inputLine: document.getElementById('apiGatewayBranch')
    },
    dashboard: {
        checkbox: document.getElementById('dashboardCheckbox'),
        inputContainer: document.getElementById('dashboardInputLine'),
        inputLine: document.getElementById('dashboardBranch')
    },
}
document.addEventListener('DOMContentLoaded', function() {
    projects.forEach(function (project) {
        document.getElementById(project.name).addEventListener('input', function () {
            debouncedFetchBranches(project.name, project.projectId, project.dataListId);
        });
    });
    const deployDevCheckbox = document.getElementById('deployDev')
    const deployMasterCheckbox = document.getElementById('deployMaster')
    const deployDevContainer = document.getElementById('deployDevContainer')
    const deployMasterContainer = document.getElementById('deployMasterContainer')
    const submitButton = document.getElementById('form')

    elements.monorepo.checkbox.addEventListener('change', function () {
        toggleInput(elements.monorepo.checkbox, elements.monorepo.inputContainer,elements.monorepo.inputLine)
    });

    elements.core.checkbox.addEventListener('change', function () {
        toggleInput(elements.core.checkbox, elements.core.inputContainer,elements.core.inputLine)
    });
    elements.coreServices.checkbox.addEventListener('change', function () {
        toggleInput(elements.coreServices.checkbox, elements.coreServices.inputContainer,elements.coreServices.inputLine)
    });
    elements.apiGateway.checkbox.addEventListener('change', function () {
        toggleInput(elements.apiGateway.checkbox, elements.apiGateway.inputContainer,elements.apiGateway.inputLine)
    });
    elements.dashboard.checkbox.addEventListener('change', function () {
        toggleInput(elements.dashboard.checkbox, elements.dashboard.inputContainer,elements.dashboard.inputLine)
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

    function toggleInput(checkbox, inputContainer, inputLine){
        if (checkbox.checked) {
            inputContainer.classList.remove('hidden');
        } else {
            inputContainer.classList.add('hidden');
            inputLine.value="";
        }
    }

    submitButton.addEventListener("submit", async (event) => {
        event.preventDefault();
        await formToggle(true)
        await sendDataToBackground()

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
            loader.style.display = 'flex'

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
    for (const project of projects) {
        project.branchName = await document.getElementById(project.name).value
    }
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
        option.innerHTML = branch.name; // Set the value as branch name
        datalist.appendChild(option);
    });
}





