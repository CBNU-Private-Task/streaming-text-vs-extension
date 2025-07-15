import * as vscode from "vscode";

export const sendRequest = async (userMessage?: string, onChunk?: (chunk: string) => void) => {
  try {
    const url = "http://ollama.ksga.info/api/chat";
    const body = {
      model: "llama3-backup:latest",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: userMessage || "What is cambodia?",
        },
      ],
      stream: true,
      temperature: 0.7,
    };
    
    const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
    });

    if (!res.body) {
      throw new Error("No response body");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.trim() === '') {
          continue;
        }
        
        try {
          const data = JSON.parse(line);
          const content = data?.message?.content || "";
          
          if (content) {
            fullContent += content;
            if (onChunk) {
              onChunk(content);
            }
          }
        } catch (parseError) {
          continue;
        }
      }
    }
    
    return fullContent;
    
  } catch (error) {
    vscode.window.showErrorMessage("Error in sendRequest: " + (error as Error).message);
    return null;
  }
};
