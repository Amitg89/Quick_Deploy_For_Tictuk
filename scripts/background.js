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
        deployToEnv(request.projects, request.envName, request.copyDocsValue, request.deployMasterValue, request.singleBranchValue, request.accessToken).then(finalMessage => {
            sendResponse({ finalMessage });
        });
        return true;
    } else if (request.action === 'onDemandSuite') {
        runOnDemandPipeline(request.selectedPipelines, request.accessToken).then(finalMessage => {
            sendResponse({ finalMessage });
        });
        return true;
    } else if (request.action === 'clearStorage') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: clearLocalStorageAndCookies
                });
            }
        });
    }
});
async function runOnDemandPipeline(selectedPipelines, accessToken) {
    let finalMessage = "";

    for (const pipeline of selectedPipelines) {
        finalMessage = await postProcess(null, accessToken, pipeline.pipelineId);
    }
    return finalMessage;
}

async function deployToEnv(projects, envName, copyDocsValue, deployMasterValue, singleBranchValue, accessToken) {
    let finalMessage = "";
    const body = {
        ref: "not-protected-main",
        variables: [
            {
                "variable_type": "env_var",
                "key": "PERSONAL_NAMESPACE",
                "value": envName
            },
            {
                "variable_type": "env_var",
                "key": "COPY_DOCUMENTS",
                "value": copyDocsValue
            }
        ]
    };

    if(singleBranchValue){
        for (const project of projects) {
            if (project.branchName === "") {
                body.variables.push({
                    "variable_type": "env_var",
                    "key": project.apiName,
                    "value": ""
                });
            }
        }
    }else if(deployMasterValue){
        for (const project of projects) {
            if (project.branchName === "") {
                project.branchName= "master";
            }
        }
    }
    for (const project of projects) {
        if (project.branchName !== "") {
            body.variables.push({
                "variable_type": "env_var",
                "key": project.apiName,
                "value": project.branchName
            });
        }
    }
    finalMessage += await postProcess(body, accessToken);

    return finalMessage;
}

async function postProcess(body , accessToken, pipelineId = null) {
    if (!accessToken) {
        return "Access token is missing. Please provide a valid token.\n";
    }

    let url, requestBody;

    if (pipelineId !== null) {
        url = `https://gitlab.com/api/v4/projects/61381477/pipeline_schedules/${pipelineId}/play`;
        requestBody = {};
    } else {
        url = "https://gitlab.com/api/v4/projects/62414226/pipeline";
        requestBody = body;
    }

    return fetch(url, {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
            "Content-type": "application/json; charset=UTF-8",
            "PRIVATE-TOKEN": accessToken
        }
    })
        .then((response) => response.json())
        .then((json) => {
            if (pipelineId !== null) {
                // Handle schedule trigger response
                if (json.message === "201 Created") {
                    const clickableLink = '<a href="https://gitlab.com/yumbrands/tictuk/monorepo/-/pipelines" target="_blank">Go to pipelines page</a>';
                    return "✅ Pipeline schedule triggered successfully. \n" +
                         clickableLink + " ✅\n";
                } else {
                    return "❌ Pipeline schedule trigger failed: " + JSON.stringify(json.message || 'Unknown error') + " ❌\n";
                }
            } else {
                // Handle normal pipeline creation response
                if (json.status === "created") {
                    const clickableLink = `<a href="${json.web_url}" target="_blank">Go to pipeline page</a>`;
                    return "✅ MultiDeploy pipeline created successfully. \n" +
                        "Job URL: " + clickableLink + " ✅\n";
                } else {
                    return "❌ MultiDeploy request failed: " + JSON.stringify(json.message) + " ❌\n";
                }
            }
        })
        .catch((error) => {
            return "❌ Error during request: " + error.message + " ❌\n";
        });
}
function clearLocalStorageAndCookies() {
    localStorage.clear();
    sessionStorage.clear();

    document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie =
            name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    });

    window.location.reload();
}