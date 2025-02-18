
const FORM_IDS = {
    DEPLOY: 'deployForm',
    ON_DEMAND: 'onDemandForm'
};
let debounceTimer;
const debouncedFetchBranches = debounce(fetchBranches, 300);
const projects = [
    { name: "monorepoBranch", apiName: "MONOREPO_BRANCH", projectId: "61381477",dataListId: 'monorepoSuggestions', branchName: '' },
    { name: "dashboardBranch", apiName: "DASHBOARD_BRANCH", projectId: "61381520",dataListId: 'dashboardSuggestions', branchName: '' }

];
const elements = {
    monorepo: {
        checkbox:document.getElementById('monorepoCheckbox'),
        inputContainer: document.getElementById('monorepoInputLine'),
        inputLine: document.getElementById('monorepoBranch')
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
    const singleBranchCheckbox = document.getElementById('singleBranch')
    const copyDocsContainer = document.getElementById('copyDocsContainer')
    const singleBranchContainer = document.getElementById('singleBranchContainer')
    const deployMasterContainer = document.getElementById('deployMasterContainer')
    const deploySubmitButton = document.getElementById('deployForm')
    const onDemandSubmitButton = document.getElementById('onDemandForm')
    const environmentInputField = document.getElementById('environment');
    const triggerElement = document.querySelector(".tanuki-shape");
    const clearTrigger = document.querySelector(".tanuki-shape.chin");
    const tabButtons = document.querySelectorAll(".tab-button");
    let clickCount = 0;
    let clearClickCount = 0;



    elements.monorepo.checkbox.addEventListener('change', function () {
        toggleInput(elements.monorepo.checkbox, elements.monorepo.inputContainer,elements.monorepo.inputLine)
    });
    elements.dashboard.checkbox.addEventListener('change', function () {
        toggleInput(elements.dashboard.checkbox, elements.dashboard.inputContainer,elements.dashboard.inputLine)
    });

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            environmentInputField.required = button.dataset.tab !== 'tab2';

            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });
    triggerElement.addEventListener('click',function () {
        clickCount++;

        if (clickCount === 3) {
            tabButtons.forEach(button => {
                if (button.style.display === "none" || button.style.display === "") {
                    button.style.display = "inline-block"; // Show tabs
                } else {
                    button.style.display = "none"; // Hide tabs
                }
            });
        }
    });
    clearTrigger.addEventListener("click", function () {
        clearClickCount++;

        if (clearClickCount === 2) {
            clearClickCount = 0;
            chrome.runtime.sendMessage({ action: "clearStorage" });
        }
    });
    copyDocsContainer.addEventListener('click',function () {
        copyDocsCheckbox.checked = !copyDocsCheckbox.checked;

    });
    deployMasterContainer.addEventListener('click',function () {
        if(singleBranchCheckbox.checked){
            singleBranchCheckbox.checked = false;
        }
        deployMasterCheckbox.checked = !deployMasterCheckbox.checked;

    });
    singleBranchContainer.addEventListener('click',function () {
        if(deployMasterCheckbox.checked){
            deployMasterCheckbox.checked = false;
        }
        singleBranchCheckbox.checked = !singleBranchCheckbox.checked;

    });
    singleBranchCheckbox.addEventListener('change', function () {

        if(deployMasterCheckbox.checked){
            deployMasterCheckbox.checked = false;
        }
    });
    deployMasterCheckbox.addEventListener('change', function () {
        if(singleBranchCheckbox.checked){
            singleBranchCheckbox.checked = false;
        }
    });
    deploySubmitButton.addEventListener('keypress',function (event){
        if(event.key==='Enter'){
            event.preventDefault()
        }
    })
    deploySubmitButton.addEventListener("submit", async (event) => {
        const envNameValue = document.getElementById('environment').value;
        const copyDocsValue = document.getElementById('copyDocs').checked;

        event.preventDefault();
        if(copyDocsValue && (envNameValue === 'tictuk-tests' || envNameValue === 'staging'))
        {
            await showModalWithLinks('It’s not possible to copy documents to staging or tictuk-tests! \nThe branches will deploy without copying the testing chain.')
        }
        await formToggle(true , FORM_IDS.DEPLOY)
        await sendDeployDataToBackground()

    });
    onDemandSubmitButton.addEventListener("submit", async (event) => {
        event.preventDefault();
        await formToggle(true , FORM_IDS.ON_DEMAND)
        await sendOnDemandDataToBackground()
    });
});
function toggleInput(checkbox, inputContainer, inputLine){
    if (checkbox.checked) {
        inputContainer.classList.remove('hidden');
        inputLine.focus()
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

function formToggle(disable, formId) {
    const form = document.getElementById(formId)
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

async function sendDeployDataToBackground() {
    const envName = document.getElementById('environment').value;
    const copyDocsValue = document.getElementById('copyDocs').checked;
    const deployMasterValue = document.getElementById('deployMaster').checked;
    const singleBranchValue = document.getElementById('singleBranch').checked;
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
        singleBranchValue: singleBranchValue,
        accessToken: gitlabToken
    }, (response) => {
        endDeployProcess(response.finalMessage, FORM_IDS.DEPLOY)
    });
}
async function sendOnDemandDataToBackground() {
    const checkboxes = collectSelectedPipelines()
    const gitlabToken = await getKeyFromLocalStorage()

    chrome.runtime.sendMessage({
        action: 'onDemandSuite',
        selectedPipelines: checkboxes,
        accessToken: gitlabToken
    }, (response) => {
        endDeployProcess(response.finalMessage, FORM_IDS.ON_DEMAND)
    });
}

async function endDeployProcess(finalMessage, formId){
    const form = document.getElementById(formId)

    await showModalWithLinks(finalMessage)
    form.reset()
    formToggle(false, formId)
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

function collectSelectedPipelines() {
    const selectedPipelines = [];

    const checkboxes = document.querySelectorAll('.checkbox-wrapper-26 input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const pipelineNumber = checkbox.dataset.pipeline;
            const suiteName = checkbox.id;
            selectedPipelines.push({
                pipelineId: pipelineNumber,
                name: suiteName
            });
        }
    });

    return selectedPipelines;
}






