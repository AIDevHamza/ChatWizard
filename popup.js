document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const saveButton = document.getElementById("c-form_button");
  const userPromptInput = document.getElementById("userPromptInput");
  const enhanceButton = document.getElementById("enhanceButtonp");
  const suggestionsElement = document.getElementById("suggestions");

  // Call the function to display chat history when the popup is loaded
  getandUpdateChatHistory();

  // Function to update suggestions UI with a limit
  function updateSuggestionsUIWithLimit(suggestions) {
    suggestionsElement.innerHTML = ""; // Clear previous suggestions

    // Display the newly generated suggestion (if available)
    if (suggestions.length > 0) {
      const newSuggestion = suggestions[suggestions.length - 1];
      const newSuggestionItem = createSuggestionElement(newSuggestion, true);
      suggestionsElement.appendChild(newSuggestionItem);
    }

    // Display the rest of the suggestions
    const maxPreviousSuggestions = 3;
    const startIndex = Math.max(
      suggestions.length - maxPreviousSuggestions - 1,
      0
    );

    for (let i = startIndex; i < suggestions.length - 1; i++) {
      const suggestionItem = createSuggestionElement(suggestions[i], false);
      suggestionsElement.appendChild(suggestionItem);
    }
  }

  // Add event listeners
  saveButton.addEventListener("click", () => {
    // Save API token
    
    const form = document.querySelector(".c-form");
    const input = form.querySelector(".c-form__input");
    const value = input.value;
    const apiToken = value;
    chrome.storage.local.set({ 'apiToken': apiToken });
    console.log("api set done")
    console.log(apiToken)
    input.value = "thank ya"
    
  });

  userPromptInput.addEventListener("input", () => {
    // Show/hide enhanceButton based on user input
    enhanceButton.style.display =
      userPromptInput.value.trim() !== "" ? "block" : "none";
  });

  enhanceButton.addEventListener("click", async () => {
    // Enhance the prompt and update UI
    const userInput = userPromptInput.value;
    enhanceButton.textContent = "";
    enhanceButton.classList.remove("button-29");
    enhanceButton.classList.add("promptloadbutton");
    userPromptInput.classList.add("promptload");
    const enhancedSuggestion = await enhancedprompt1(userInput);
    userPromptInput.classList.remove("promptload");
    enhanceButton.classList.remove("promptloadbutton");
    enhanceButton.classList.add("button-29");
    enhanceButton.textContent = "Prompt Magic";
  });

  // Retrieve chat history from Chrome Storage and update suggestions UI
  function getandUpdateChatHistory() {
    chrome.storage.local.get({ chatHistory: [] }, (result) => {
      const chatHistory = result.chatHistory;
      updateSuggestionsUIWithLimit(chatHistory);
    });
  }

  // Create a suggestion element
  function createSuggestionElement(suggestion, isNewSuggestion) {
    const suggestionItem = document.createElement("div");
    suggestionItem.className = "suggestion-item";

    const suggestionText = document.createElement("span");
    suggestionText.className = "suggestion-text";
    suggestionText.textContent = suggestion;
    suggestionItem.appendChild(suggestionText);

    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy";
    copyButton.classList.add("button-29");
    copyButton.addEventListener("click", () => {
      copyToClipboard(suggestion);
    });
    suggestionItem.appendChild(copyButton);

    // Apply different styles for new vs historical suggestions
    if (isNewSuggestion) {
      suggestionItem.classList.add("new-suggestion"); // Apply your custom style class
      suggestionText.classList.add("new-suggestion-text")
      copyButton.classList.add("new-suggestion-button");

    }

    return suggestionItem;
  }

  function copyToClipboard(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }


async function enhancedprompt1(userInput) {
  const apikeyData = await chrome.storage.local.get("apiToken");
  const apikey = apikeyData.apiToken.toString();
  console.log(apikey);

  const api = apikey.replace(/"/g, "");

  const sysprompt = `Transform the following basic prompt into a well-crafted one using the provided formula: [Role]. With [Experience]. [Task]. The output should convey [Desired Output]. Here's an example: 'You possess the skills of a skilled Copywriter. With 2 years of experience, create a blog post centered on data science. The intended output comprises 1 main heading, 2 subheadings, and well-structured bullet points. Make sure the generated prompt is enhanced and refined`;

  console.log("User input:", userInput);

  // Initialize the OpenAI API endpoint URL
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  // Create the payload for the chat completion
  const payload = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: sysprompt },
      { role: "user", content: userInput },
    ],
  };

  try {
    // Call the OpenAI API to get enhanced suggestions
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const enhancedSuggestion = data.choices[0].message.content;
      // After receiving enhancedSuggestion
      chrome.storage.local.get({ chatHistory: [] }, (result) => {
        const chatHistory = result.chatHistory;
        chatHistory.push(enhancedSuggestion);

        console.log("New chat history:", chatHistory); // Debugging line

        chrome.storage.local.set({ chatHistory: chatHistory }, () => {
          updateSuggestionsUIWithLimit(chatHistory)

          console.log("Chat history stored."); // Debugging line
        });
      });

      return enhancedSuggestion;
    } else {
      console.error("Error calling OpenAI API:", response.statusText);
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
  }
}

// Add event listener to the export button
const exportButton = document.getElementById("exportButton");
exportButton.addEventListener("click", exportChatHistory);

// Function to export chat history
function exportChatHistory() {
  chrome.storage.local.get({ chatHistory: [] }, (result) => {
    const chatHistory = result.chatHistory;
    const chatHistoryText = chatHistory.join("\n\n"); // Join prompts with double line breaks
    const blob = new Blob([chatHistoryText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat_history.txt";
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
  });
}




});