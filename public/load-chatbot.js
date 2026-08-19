fetch("chatbot.html")
  .then(res => res.text())
  .then(html => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Add styles
    doc.querySelectorAll("style").forEach(style => {
      document.head.appendChild(style.cloneNode(true));
    });

    // Add HTML
    doc.body.childNodes.forEach(node => {
      if (node.nodeName !== "SCRIPT") {
        document.body.appendChild(node.cloneNode(true));
      }
    });

    // Execute scripts
    doc.querySelectorAll("script").forEach(oldScript => {
      const script = document.createElement("script");

      if (oldScript.src) {
        script.src = oldScript.src;
      } else {
        script.textContent = oldScript.textContent;
      }

      document.body.appendChild(script);
    });
  })
  .catch(console.error);