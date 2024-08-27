document.getElementById("saveButton").addEventListener("click", function() {
    const gitlabToken = document.getElementById("gitlabToken").value;

    // Save the user input to local storage
    chrome.storage.local.set({ gitlabToken: gitlabToken }, function() {
        console.log("Input saved successfully!");

        // Set the popup to index.html and handle the promise
        chrome.action.setPopup({ popup: "index.html" })
            .then(() => {
                console.log("Popup changed to index.html successfully.");
                window.close(); // Close the popup after saving
            })
            .catch((error) => {
                console.error("Error setting popup to index.html:", error);
            });
    });
});