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