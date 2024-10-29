
let debounceTimer;
const debouncedFetchBranches = debounce(fetchBranches, 300);
const projects = [
    { name: "coreBranch", apiName: "CORE_BRANCH", projectId: "61381988",dataListId: 'coreSuggestions', branchName: '' },
    { name: "monorepoBranch", apiName: "MONOREPO_BRANCH", projectId: "61381477",dataListId: 'monorepoSuggestions', branchName: '' },
    { name: "coreServicesBranch", apiName: "CORE_SERVICES_BRANCH", projectId: "61381858",dataListId: 'coreServicesSuggestions', branchName: '' },
    { name: "apiGatewayBranch", apiName: "API_GATEWAY_BRANCH", projectId: "61381918",dataListId: 'apiGatewaySuggestions', branchName: '' },
    { name: "dashboardBranch", apiName: "DASHBOARD_BRANCH", projectId: "61381520",dataListId: 'dashboardSuggestions', branchName: '' }
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
    const copyDocsCheckbox = document.getElementById('copyDocs')
    const deployMasterCheckbox = document.getElementById('deployMaster')
    const copyDocsContainer = document.getElementById('copyDocsContainer')
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
    copyDocsContainer.addEventListener('click',function () {
        copyDocsCheckbox.checked = !copyDocsCheckbox.checked;

    });
    deployMasterContainer.addEventListener('click',function () {
        deployMasterCheckbox.checked = !deployMasterCheckbox.checked;

    });
    submitButton.addEventListener('keypress',function (event){
        if(event.key==='Enter'){
            event.preventDefault()
        }

    })
    submitButton.addEventListener("submit", async (event) => {
        event.preventDefault();
        await formToggle(true)
        await sendDataToBackground()

    });
});
function toggleInput(checkbox, inputContainer, inputLine){
    if (checkbox.checked) {
        inputContainer.classList.remove('hidden');
    } else {
        inputContainer.classList.add('hidden');
        inputLine.value="";
    }
}

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
    const copyDocsValue = document.getElementById('copyDocs').checked;
    const deployMasterValue = document.getElementById('deployMaster').checked;
    const gitlabToken = await getKeyFromLocalStorage()
    for (const project of projects) {
        project.branchName = await document.getElementById(project.name).value
    }
    chrome.runtime.sendMessage({
        action: 'deployToEnv',
        projects: projects,
        envName: envName,
        copyDocsValue: copyDocsValue,
        deployMasterValue: deployMasterValue,
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

function updateDatalist(branches, dataListId) {
    const datalist = document.getElementById(dataListId);

    datalist.innerHTML = '';

    branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch.name; // Set the value as branch name
        datalist.appendChild(option);
    });
}





