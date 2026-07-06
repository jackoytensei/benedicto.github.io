// Hernane Benedicto Jr. — portfolio site behavior

document.addEventListener('DOMContentLoaded', () => {

  /* ---- AI chat widget ---- */
  const CHAT = {
    // Prefer same-origin API when the page is served over http(s).
    apiEndpoint: (window.location.protocol === 'http:' || window.location.protocol === 'https:') ? `${window.location.origin}/api/chat` : 'http://localhost:3000/api/chat',
    maxChars: 1200
  };

  const chatFab = document.querySelector('.chat-fab');
  const chatPanel = document.querySelector('.chat-panel');
  const chatClose = document.querySelector('.chat-close');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const chatTyping = document.getElementById('chat-typing');

  const scrollChatToBottom = () => {
    if (!chatMessages) return;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const renderMessage = (text, role) => {
    if (!chatMessages) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble is-${role}`;

    const roleEl = document.createElement('span');
    roleEl.className = 'role';
    roleEl.textContent = role === 'user' ? 'You' : 'Assistant';

    const msgEl = document.createElement('div');
    msgEl.textContent = text;

    bubble.appendChild(roleEl);
    bubble.appendChild(msgEl);
    chatMessages.appendChild(bubble);
    scrollChatToBottom();
  };

  const setTyping = (visible) => {
    if (!chatTyping) return;
    chatTyping.classList.toggle('is-visible', !!visible);
  };

  const openChat = () => {
    if (!chatPanel) return;
    chatPanel.classList.add('is-open');
    chatPanel.setAttribute('aria-hidden', 'false');
    if (chatFab) chatFab.setAttribute('aria-expanded', 'true');
    if (chatInput) setTimeout(() => chatInput.focus(), 50);
  };

  const closeChat = () => {
    if (!chatPanel) return;
    chatPanel.classList.remove('is-open');
    chatPanel.setAttribute('aria-hidden', 'true');
    if (chatFab) chatFab.setAttribute('aria-expanded', 'false');
  };

  if (chatFab) chatFab.addEventListener('click', openChat);
  if (chatClose) chatClose.addEventListener('click', closeChat);

  // optional: preload a welcome message
  if (chatMessages) {
    renderMessage('Hi! I can help draft IT tickets or suggest troubleshooting steps for networks, security, and web systems.', 'assistant');
  }

  const stubAssistant = async (userText) => {
    const t = userText.toLowerCase();

    const preface = 'Jack perspective: '; // persona preface for stub mode



    if (t.includes('slow') && t.includes('wifi')) {
      return 'For slow Wi‑Fi, check these in order:\n1) Confirm signal level (close to AP vs at edge)\n2) Verify channel congestion (try a quieter channel)\n3) Check for duplex/PHY issues on switches/routers\n4) Run a speed test per device\n5) Review bandwidth-heavy clients (downloads/streams)\n\nIf you share your router model + where the slowdown happens, I’ll tailor the steps.';
    }

    if (t.includes('ticket') || t.includes('draft')) {
      return 'Here’s a clean ticket draft you can copy/paste:\n\nSubject: [System] Issue — [Brief summary]\n\nMessage: \nHi, we need assistance with a problem in the [system/location].\n\nWhat happened:\n- ...\n\nImpact / urgency:\n- ...\n\nWhen it started:\n- ...\n\nSteps to reproduce / observed behavior:\n- ...\n\nScreenshots / logs (if available):\n- ...\n\nThanks.';
    }

    return preface + 'Understood. I can help with:\n- Networking troubleshooting (LAN/WAN, Wi‑Fi, routing/switching)\n- Cybersecurity basics (policies, endpoint protection, backups)\n- Web/helpdesk workflows (drafting ticket text, incident summaries)\n\nReply with: (1) what you’re working on, (2) what’s failing, and (3) any error message or timeframe.';
  };


  const callApiAssistant = async (userText) => {
    // If apiEndpoint is not configured, fall back to stub.
    if (!CHAT.apiEndpoint) return stubAssistant(userText);

    try {
      const res = await fetch(CHAT.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      if (!res.ok) {
        console.warn('[chat] backend returned non-2xx:', res.status);
        return stubAssistant(userText);
      }

      const data = await res.json().catch(() => null);

      // Expecting { reply: '...' } but support { message: '...' }
      const reply = data?.reply || data?.message;
      if (reply && String(reply).trim()) return reply;

      console.warn('[chat] backend returned unexpected JSON shape:', data);
      return stubAssistant(userText);
    } catch (err) {
      // Covers network errors + CORS failures + backend down.
      console.warn('[chat] backend fetch failed, falling back to stub:', err);
      return stubAssistant(userText);
    }
  };

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const userText = chatInput.value.trim();
      if (!userText) return;
      if (userText.length > CHAT.maxChars) return;

      renderMessage(userText, 'user');
      chatInput.value = '';
      setTyping(true);

      try {
        const reply = await callApiAssistant(userText);
        renderMessage(reply, 'assistant');
      } catch (err) {
        console.error('[chat] unexpected error in submit handler:', err);
        renderMessage('Sorry—something went wrong while generating the response. (Check console for details.)', 'assistant');
      } finally {
        setTyping(false);
      }
    });

    // Enter-to-send is handled by form submit; allow Shift+Enter if you ever change to textarea.
  }

  /* ---- mobile nav toggle ---- */

  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav-links a').forEach(a => {
      a.addEventListener('click', () => nav.classList.remove('is-open'));
    });
  }

  /* ---- scroll reveal ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---- career map route draw ---- */
  const routePath = document.querySelector('.route-path');
  if (routePath && 'IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          routePath.classList.add('is-drawn');
          io2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    io2.observe(routePath);
  } else if (routePath) {
    routePath.classList.add('is-drawn');
  }

  /* ---- contact / ticket form ---- */
  const form = document.getElementById('ticket-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = form.querySelector('#f-name').value.trim();
      const email = form.querySelector('#f-email').value.trim();
      const type = form.querySelector('#f-type').value;
      const message = form.querySelector('#f-message').value.trim();

      if (!name || !email || !message) return;

      const ticketId = 'HB-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(100 + Math.random() * 900);

      const subject = encodeURIComponent(`[${type}] Message from ${name}`);
      const bodyText = `${message}\n\n—\nFrom: ${name}\nReply to: ${email}\nTicket ref: ${ticketId}`;
      const body = encodeURIComponent(bodyText);
      const mailto = `mailto:benedictojack2@gmail.com?subject=${subject}&body=${body}`;

      const confirmBox = document.getElementById('ticket-confirm');

      // Try sending to server endpoint first. If SMTP is not configured on server,
      // the server will respond with 501 and we fallback to opening the user's mail client.
      try {
        const res = await fetch('/api/ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, type, message })
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (confirmBox) {
            confirmBox.querySelector('.confirm-id').textContent = `Ticket #${data.ticketId || ticketId} — sent`;
            confirmBox.classList.add('is-visible');
          }
          return;
        }

        // If server indicates SMTP not configured, fallback to mailto
        if (res.status === 501) {
          if (confirmBox) {
            confirmBox.querySelector('.confirm-id').textContent = `Ticket #${ticketId} — ready to send`;
            confirmBox.classList.add('is-visible');
          }
          window.location.assign(mailto);
          return;
        }

        // Other failures -> fallback to mailto
        if (confirmBox) {
          confirmBox.querySelector('.confirm-id').textContent = `Ticket #${ticketId} — ready to send`;
          confirmBox.classList.add('is-visible');
        }
        window.location.assign(mailto);
      } catch (err) {
        // Network/CORS/etc -> fallback to mailto so the user can still send
        if (confirmBox) {
          confirmBox.querySelector('.confirm-id').textContent = `Ticket #${ticketId} — ready to send`;
          confirmBox.classList.add('is-visible');
        }
        window.location.assign(mailto);
      }

    });
  }

});
