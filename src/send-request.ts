import * as vscode from "vscode";

export const sendRequest = async (userMessage?: string, onChunk?: (chunk: string) => void) => {
  try {
    const url = "http://ollama.ksga.info/api/chat";
    const enhanced_system_prompt = 
      `You are a JavaScript code generator. Follow these rules strictly:
      1. ONLY return executable JavaScript code
      2. NO explanations, NO descriptions, NO markdown formatting
      3. NO code blocks (\`\`\`), NO backticks
      4. Use proper JavaScript syntax with semicolons
      5. Use // for single-line comments, /* */ for multi-line comments
      6. If you need to explain something, use JavaScript comments only
      7. Each statement should be on its own line
      8. Ensure all code is valid and executable JavaScript
      9. Start writing code immediately, no preamble

      Example of correct format:
      // This function adds two numbers
      function addNumbers(a, b) {
          return a + b;
      }

      // Usage example
      console.log(addNumbers(5, 3));`;


    const body = {
      model: "llama3-backup:latest",
      messages: [
        {
          "role": "system",
          "content": enhanced_system_prompt,
      },
      {
          "role": "user", 
          "content": `Generate JavaScript code for: ${userMessage}. Remember: ONLY JavaScript code with proper syntax, use comments for any explanations.`,
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
