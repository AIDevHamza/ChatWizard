
function addButtonOverlayWithIcons() {
  const textareaElement = document.getElementById("prompt-textarea");

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("button-container");

  const enhanceButton = document.createElement("button");
  enhanceButton.classList.add("enhance-button");
  const enhanceIcon = document.createElement("img");
  enhanceIcon.src = "https://icons.iconarchive.com/icons/microsoft/fluentui-emoji-3d/48/Magic-Wand-3d-icon.png";
  enhanceIcon.style.width = "24px";
  enhanceIcon.style.height = "24px";
  enhanceButton.appendChild(enhanceIcon);
  buttonContainer.appendChild(enhanceButton);

  textareaElement.parentNode.insertBefore(buttonContainer, textareaElement);


  // Inside the addButtonOverlayWithIcons() function
  enhanceButton.addEventListener("click", async (event) => {
    event.preventDefault(); // Prevent the default behavior

    const userInput = textareaElement.value;
    // Add the wiggle animation class
    enhanceIcon.classList.add("wiggle");
    textareaElement.classList.add("textanimate")

    
    const enhancedSuggestion = await enhancedprompt(userInput);

    // Remove the "wiggle" animation class
    enhanceIcon.classList.remove("wiggle");
    textareaElement.classList.remove("textanimate")


    textareaElement.value = enhancedSuggestion; // Update the input box with enhanced suggestion
  });

  // Add input event listener to the textarea for real-time checking
  textareaElement.addEventListener("input", () => {
    if (textareaElement.value.trim() !== "") {

      buttonContainer.classList.add("textarea-has-text");
    } else {
      buttonContainer.classList.remove("textarea-has-text");
    }
  });
}



// Call the function to add the button overlay with icons
addButtonOverlayWithIcons();



async function enhancedprompt(userInput) {

  const apikey1 = await chrome.storage.local.get('apiToken');
  const apikey = apikey1.apiToken.toString()
  

  const api = apikey.replace(/"/g, '');
  
  const sysprompt = `Transform the following basic prompt into a well-crafted one using the provided formula: [Role]. With [Experience]. [Task]. The output should convey [Desired Output]. Here's an example: 'You possess the skills of a skilled Copywriter. With 2 years of experience, create a blog post centered on data science. The intended output comprises 1 main heading, 2 subheadings, and well-structured bullet points. Make sure the generated prompt is enhanced and refined`;

  console.log("User input:", userInput);

  // Initialize the OpenAI API endpoint URL
  const apiUrl = "https://api.openai.com/v1/chat/completions";



  // Create the payload for the chat completion
  const payload = {
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: sysprompt },
      { role: "user", content: userInput }
    ],

  };

  try {
    // Call the OpenAI API to get enhanced suggestions
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api}`
      },
      body: JSON.stringify(payload)
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



