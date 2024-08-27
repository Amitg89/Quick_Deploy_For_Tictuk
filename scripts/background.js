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
        deployToEnv(request.projects, request.envName, request.deployDevValue, request.skipTests, request.accessToken).then(finalMessage => {
            sendResponse({ finalMessage });
        });
        return true; // Required to indicate async response
    }
});

async function deployToEnv(projects, envName, deployDevValue, skipTests, accessToken) {
    let finalMessage = "";

    if (deployDevValue) {
        for (const project of projects) {
            if (project.branchName !== "") {
                finalMessage += await postProcess(project.projectId, project.branchName, skipTests, envName, accessToken);
            } else {
                finalMessage += await postProcess(project.projectId, "dev", skipTests, envName, accessToken);
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
        {name: "Core:", projectId: "5743"},
        {name: "Monorepo:", projectId: "12530"},
        {name: "Core-Services:", projectId: "11954"},
        {name: "Api-Gateway:", projectId: "5745"},
        {name: "Dashboard:", projectId: "5744"},

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

    if (projectId === "12530" && skipTests) {
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
                    "Job URL: " + json.web_url + "\n";
            } else {
                return getProjectName(projectId) + "❌ Request failed: " + JSON.stringify(json.message) + " ❌\n";
            }
        })
        .catch((error) => {
            return getProjectName(projectId) + "❌ Error during request: " + error.message + " ❌\n";
        });

}