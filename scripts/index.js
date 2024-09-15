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
    const projects = [
        { name: "coreBranch", projectId: "61381988", branchName: document.getElementById('coreBranch').value },
        { name: "monorepoBranch", projectId: "61381477", branchName: document.getElementById('monorepoBranch').value },
        { name: "coreServicesBranch", projectId: "61381858", branchName: document.getElementById('coreServicesBranch').value },
        { name: "apiGatewayBranch", projectId: "61381918", branchName: document.getElementById('apiGatewayBranch').value },
        { name: "dashboardBranch", projectId: "61381520", branchName: document.getElementById('dashboardBranch').value }
    ];
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

    submitButton.addEventListener("submit", async (event) => {
        event.preventDefault();
        await formToggle(true)
        await sendDataToBackground()

    });
});

