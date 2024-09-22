chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get("gitlabToken")
        .then((result) => {
            if (!result.gitlabToken) {
                return chrome.action.setPopup({ popup: "tokenPopup.html" });
            } else {
                return chrome.action.setPopup({ popup: "index.html" });
            }
        })
        .then(() => {
            console.log("Popup set successfully.");
        })
        .catch((error) => {
            console.error("Error setting popup:", error);
        });
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'deployToEnv') {
        deployToEnv(request.projects, request.envName, request.deployDevValue, request.deployMasterValue, request.skipTests, request.accessToken).then(finalMessage => {
            sendResponse({ finalMessage });
        });
        return true;
    }
});

async function deployToEnv(projects, envName, deployDevValue, deployMasterValue, skipTests, accessToken) {
    let finalMessage = "";

    if (deployDevValue) {
        for (const project of projects) {
            if (project.branchName !== "") {
                finalMessage += await postProcess(project.projectId, project.branchName, skipTests, envName, accessToken);
            } else {
                finalMessage += await postProcess(project.projectId, "dev", skipTests, envName, accessToken);
            }
        }
    } else if(deployMasterValue){
        for (const project of projects) {
            if (project.branchName !== "") {
                finalMessage += await postProcess(project.projectId, project.branchName, skipTests, envName, accessToken);
            } else {
                finalMessage += await postProcess(project.projectId, "master", skipTests, envName, accessToken);
            }
        }
    } else {
        for (const project of projects) {
            if (project.branchName !== "") {
                finalMessage += await postProcess(project.projectId, project.branchName, skipTests, envName, accessToken);
            }
        }
    }

    return finalMessage;
}
function getProjectName(projectId){
    const projects = [
        {name: "Core:", projectId: "61381988"},
        {name: "Monorepo:", projectId: "61381477"},
        {name: "Core-Services:", projectId: "61381858"},
        {name: "Api-Gateway:", projectId: "61381918"},
        {name: "Dashboard:", projectId: "61381520"},

    ]
    const project = projects.find((p) => p.projectId === projectId);
    return project ? project.name : null;

}
async function postProcess(projectId, branchName, skipTests, envName, accessToken) {

    if (!accessToken) {
        return "Access token is missing. Please provide a valid token.\n";
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

    if (projectId === "61381477" && skipTests) {
        body.variables.push({
            "variable_type": "env_var",
            "key": "FORCE_SKIP_TESTS",
            "value": "true"
        });
    }

    return fetch("https://gitlab.com/api/v4/projects/" + projectId + "/pipeline", {
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
                const clickableLink = `<a href="${json.web_url}" target="_blank">Go to pipeline page</a>`;
                return getProjectName(projectId) + "✅ Pipeline created successfully. \n" +
                    "Job URL: " + clickableLink + " ✅\n";
            } else {
                return getProjectName(projectId) + "❌ Request failed: " + JSON.stringify(json.message) + " ❌\n";
            }
        })
        .catch((error) => {
            return getProjectName(projectId) + "❌ Error during request: " + error.message + " ❌\n";
        });

}
