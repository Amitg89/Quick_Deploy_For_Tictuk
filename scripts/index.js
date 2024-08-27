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
function toggleKioskInput() {
    const inputLine = document.getElementById('kioskInputLine');
    const checkbox = document.getElementById('kioskCheckbox')
    if (checkbox.checked) {
        inputLine.classList.remove('hidden');
    } else {
        inputLine.classList.add('hidden');
    }
}

async function deployToEnv() {
    await formToggle(true)
    const projects = [
        {name: "coreBranch", projectId: "5743", branchName: document.getElementById('coreBranch').value},
        {name: "monorepoBranch", projectId: "12530", branchName: document.getElementById('monorepoBranch').value},
        {
            name: "coreServicesBranch",
            projectId: "11954",
            branchName: document.getElementById('coreServicesBranch').value
        },
        {name: "apiGatewayBranch", projectId: "5745", branchName: document.getElementById('apiGatewayBranch').value},
        {name: "dashboardBranch", projectId: "5744", branchName: document.getElementById('dashboardBranch').value},

    ]
    const envName = document.getElementById('environment').value
    const deployDevValue = document.getElementById('deployDev').checked
    const skipTests = document.getElementById('monorepoSkipTests').checked
    const form = document.getElementById('form')
    let finalMessage = "";

    if (deployDevValue) {
        for(const project of projects) {
            if (project.branchName !== "") {
                finalMessage += await postProcess(project.projectId, project.branchName, skipTests, envName)
            } else {
                finalMessage += await postProcess(project.projectId, "dev", skipTests, envName)
            }
        }
    } else {
        for(const project of projects) {
            if (project.branchName !== "") {
                finalMessage += await postProcess(project.projectId, project.branchName, skipTests, envName)
            }
        }

    }

    await endDeployProcess(finalMessage);


}

async function postProcess(projectId, branchName, skipTests, envName) {
    const accessToken = await getKeyFromLocalStorage()

    if (!accessToken) {
        alert("Access token is missing. Please provide a valid token.");
        return; // Exit the function if no access token is available
    }


    const body = {
        ref: branchName,
        variables: [
            {
                "variable_type": "env_var",
                "key": "PERSONAL_NAMESPACE",
                "value": envName
            }
        ]
    };

    if (projectId === "12530" && skipTests === true) {
        body.variables.push({
            "variable_type": "env_var",
            "key": "FORCE_SKIP_TESTS",
            "value": "true"
        });
    }

    return fetch("https://gitlab.yum.com/api/v4/projects/" + projectId + "/pipeline", {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
            "Content-type": "application/json; charset=UTF-8",
            "PRIVATE-TOKEN": accessToken
        }
    })
        .then((response) => response.json())
        .then((json) => {
            if (json.status === "created") {
                return getProjectName(projectId) + "✅ Request successful: Pipeline created successfully. ✅ \n" +
                    "Job URL: " + json.web_url + "\n"
            } else {
                //alert("❌❌ Request failed: " + JSON.stringify(json.message));
                return getProjectName(projectId) + "❌ Request failed: " + JSON.stringify(json.message) + " ❌\n"
            }
        })
        .catch((error) => {
            return getProjectName(projectId) + "❌ Error during request: " + error.message + " ❌\n"
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
            loader.style.display = 'block'

        } else {
            formElements[i].disabled = false;
            loader.style.display = 'none'
        }
    }
}
function getProjectName(projectId){
    const projects = [
        {name: "Core:", projectId: "5743"},
        {name: "Monorepo:", projectId: "12530"},
        {name: "Core-Services:", projectId: "11954"},
        {name: "Api-Gateway:", projectId: "5745"},
        {name: "Dashboard:", projectId: "5744"},

    ]
    const project = projects.find((p) => p.projectId === projectId);
    return project ? project.name : null;

}
function endDeployProcess(finalMessage){
    const form = document.getElementById('form')

    window.alert(finalMessage)
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

    submitButton.addEventListener("submit", async (event) => {
        event.preventDefault();
        await deployToEnv();
    });
});

