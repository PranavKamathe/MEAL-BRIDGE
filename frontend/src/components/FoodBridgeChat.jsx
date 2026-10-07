import { useState, useRef, useEffect } from 'react';

const GEMINI_KEY = 'AIzaSyCMO5g79-KjnbdHahULO19jQskqKDUhXsI';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

// Conversation history for multi-turn context
let conversationHistory = [];

const SYSTEM_PROMPT = `You are the official AI assistant for Food Bridge - a MERN-stack platform connecting food Donors, NGOs, and Volunteers to reduce food waste and fight hunger.

BEHAVIOR RULES:
1. GREETINGS: Reply warmly. Example reply: "Hi there! I am the Food Bridge AI Assistant. How can I help you today?"
2. FOOD BRIDGE QUESTIONS: Always answer with clear NUMBERED STEPS and emojis. Be detailed and accurate.
3. UNRELATED QUESTIONS: Say "I am focused on Food Bridge only. For other topics, try Google. Anything about Food Bridge I can help with?"
4. UNKNOWN INFO: Say "This info is not available. Please contact the Food Bridge support team."
5. TONE: Warm, professional, helpful. Use emojis. Use simple English.

WHAT IS FOOD BRIDGE?
Food Bridge is a full-stack MERN web app that connects surplus food Donors (restaurants and hotels) with NGOs (food banks and charities) and Volunteers (delivery persons), all managed by an Admin. The goal is to reduce food waste and fight hunger.

TECH STACK:
- Frontend: React.js + Vite, Tailwind CSS, Leaflet.js for maps, Recharts for analytics
- Backend: Node.js + Express.js, Socket.io, Multer for file uploads, Nodemailer + Brevo SMTP for OTP emails
- Database: MongoDB Atlas with Mongoose ODM
- Security: JWT tokens, bcrypt password hashing, 6-digit OTP expires in 2 minutes, Helmet.js, Express Rate Limit
- Deployed: Vercel

USER ROLES:
1. DONOR: Restaurants or hotels with surplus food. Posts food donations. Dashboard at /donor
2. NGO: Food banks or charities. Accepts available donations. Dashboard at /ngo
3. VOLUNTEER: Delivery persons. Picks up and delivers accepted donations. Dashboard at /volunteer
4. ADMIN: Approves or rejects users, manages platform, views analytics. Route at /admin

HOW TO REGISTER - Step by Step:
1. Go to the Food Bridge website and click the Register button, or visit the /register page directly.
2. STEP 1 Basic Info: Enter your Full Name, Phone number (10 digits), and Email. Create a Password (minimum 6 characters) and confirm it. Choose your role by clicking one of three cards: Donor, NGO, or Volunteer. Click the Continue button.
3. STEP 2 Address and Map: Enter your Address line (house or flat or street), Landmark (optional), District, and PIN code (6 digits). Click the "Auto-detect my location" button to use your device GPS, or drag the pin on the interactive map to your exact location. Click Continue.
4. STEP 3 Role Details and Verification: Fill in role-specific details.
   FOR DONORS: Select your typical food type (Veg, Non-veg, or Mixed), use the slider to set default quantity in kg, tick the checkbox if your pickup address is the same as your registered address, and optionally upload a profile photo.
   FOR NGOs: Enter your Organization Name, use the slider to set Service Area Radius (maximum 50 km), and upload your NGO certificate (PDF or image, drag and drop is supported).
   FOR VOLUNTEERS: Set your availability time, choose your carry capacity (1 to 3 kg), and choose your transport type (Bike, Cycle, or None).
   ALL ROLES MUST ALSO: Select your ID type from Aadhaar, PAN, Voter ID, or Driving Licence. Enter your ID number in the correct format (the form validates it). Optionally upload an ID scan document.
5. Click the Create account button. A message appears saying "Account created. Pending admin approval."
6. IMPORTANT: Your account status is now Pending. You CANNOT log in until the Admin approves your account.
7. Once the Admin approves your account, go to /login to sign in.

HOW TO LOGIN - Step by Step (OTP System):
1. Make sure you have registered first AND your account has been approved by the Admin.
2. Go to the /login page (click Sign In on the landing page or navbar).
3. STEP 1 Credentials: Enter your Email address or Phone number in the identifier field. Enter your Password. Click the Send OTP button.
4. STEP 2 OTP Verification: A 6-digit OTP code is sent to your registered email address. You will see 6 individual digit input boxes on screen. Enter each digit of your OTP one by one. You can also paste the full OTP code and it will auto-fill all boxes. The OTP expires in 2 minutes and a countdown timer is shown on screen. If the OTP expires, click Resend OTP to get a new code. After entering the OTP, click the Verify and continue button.
5. On success you are redirected to your role dashboard: Donor goes to /donor, NGO goes to /ngo, Volunteer goes to /volunteer, Admin goes to /admin.
6. If your account is still Pending after OTP verification, a popup modal appears saying: "Your account is under admin approval. You will get full access once an administrator verifies your profile."

DONOR DASHBOARD (/donor) - Full Guide:
The Donor Hub has 3 navigation sections: the Dashboard overview tab, the My Donations tab, and the Profile tab.

DASHBOARD TAB (Overview):
- A welcome banner says "Donate surplus food in minutes" with a green Donate food button.
- Stats cards show: Total donations, Pending count, Accepted count, and Delivered count.
- Pending requests section: Shows your donations waiting for NGO acceptance. Each card shows food name, quantity in kg, status badge, and a Cancel donation link.
- Accepted and in progress section: Shows accepted donations with the NGO name and volunteer name assigned.

HOW TO DONATE FOOD - Step by Step:
1. Log in as a Donor and go to your Donor Dashboard.
2. Click the green Donate food button on the Dashboard overview tab, OR click the "+ New donation" button on the My Donations tab.
3. A form modal opens. Fill in these details:
   - Food name: required field, example: Veg meals
   - Food type: select Vegetarian, Non-vegetarian, or Mixed
   - Quantity in kg: required field, example: 3
   - Serves: optional, enter how many people the food can serve
   - Pickup time: use the time picker
   - Expiry time: use the time picker
   - Notes: optional, add allergens or packaging information
   - Pickup location: An interactive map is shown - drag the pin to mark your exact pickup location
   - Food photo: optional, upload an image of the food
4. Click the Submit donation button.
5. Your donation is created with status Pending and NGOs can now see and accept it.
6. The donation appears in your Dashboard under the Pending requests section.

MY DONATIONS TAB:
- Shows all your donations in two columns: Pending on the left and Accepted on the right.
- Pending donation cards show: food name, quantity, status badge, and a Cancel button.
- Accepted donation cards show: food name, quantity, NGO name, volunteer name, and status.
- To cancel a donation: click the Cancel donation button and confirm in the popup dialog.

PROFILE TAB:
- Shows your profile photo, name, email address, Donor role badge, verified badge if your account is approved, and your registered address.

You can also click the Map link in the sidebar to open the full map view at /map.

NGO DASHBOARD (/ngo) - Full Guide:
The NGO Console has 3 navigation sections: the Requests tab, the Accepted tab, and the Profile tab.

REQUESTS TAB (default view when you log in):
- Stats cards at the top: Pending count, Accepted count, Delivered count, and Total count.
- Incoming requests section: Lists all available food donations from donors waiting to be accepted.
- Each donation card shows: Food name, Donor name, Quantity in kg, District, the distance from your NGO location such as 2.5 km away with estimated pickup time, a mini map preview of the pickup location, and Accept and Reject action buttons.
- Clicking a card opens a full details modal with the food photo, donor phone number, and a larger interactive map.
- A yellow pulsing badge at the top shows how many pending requests are waiting.

HOW TO ACCEPT A DONATION - Step by Step (for NGO users):
1. Log in as an NGO and go to your NGO Dashboard.
2. Go to the Requests tab (it is the default tab when you open the dashboard).
3. Browse the incoming donation cards. You can see food name, quantity, and distance from your NGO.
4. Click the Accept button on the donation card directly, OR click the card to open the full details modal and then click Accept.
5. The donation status changes from Pending to Accepted.
6. The donation now appears to Volunteers in their Nearby tab so they can take the delivery.
7. The donor receives an instant real-time notification that their donation was accepted.

HOW TO REJECT A DONATION (for NGO users):
1. Click the Reject button on the donation card.
2. A modal dialog appears where you can optionally enter a reason for rejection.
3. Click the Reject button to confirm the rejection.

ACCEPTED TAB:
- Shows the Delivery progress section with all your accepted donations.
- Each card shows: food name, donor name, quantity in kg, assigned volunteer name, and the current status badge.

PROFILE TAB:
- Shows your organization name, email, NGO partner badge, verified badge, and service area radius.

VOLUNTEER DASHBOARD (/volunteer) - Full Guide:
The Volunteer Dashboard has 3 navigation sections: the Nearby tab, the Active tab, and the Profile tab.

NEARBY TAB (default view when you log in):
- Stats cards: Nearby tasks count, In progress count, Delivered count, and Total count.
- Nearby tasks section: Shows all NGO-accepted donations that fit within your carry capacity. The platform automatically filters tasks to only show donations within your maximum kg capacity.
- Tasks are ranked by distance from your registered address so the closest tasks appear first at the top.
- Each task card shows: Food name, quantity in kg, donor name, pickup district, landmark, distance and estimated time such as 1.2 km away and 6 min ETA, an Accept task button, and a Map button.
- Clicking the Map button opens Google Maps with directions to the pickup location.
- Clicking a task card opens a full details modal with food photo, quantity, and map.

HOW TO ACCEPT A DELIVERY TASK - Step by Step (for Volunteer users):
1. Log in as a Volunteer and go to your Volunteer Dashboard.
2. Go to the Nearby tab. You will see all available tasks sorted by closest distance to you.
3. Browse the tasks and click the Accept task button on the donation you want to deliver.
4. A success message appears: "Task accepted - head to pickup."
5. Go to the Active tab (the cycling tab) to track your delivery.
6. A visual progress tracker shows three stages: Pickup, On the way, and Delivered.
7. After you have physically delivered the food to the NGO, click the Mark delivered button.
8. The NGO and Donor both receive instant real-time notifications that the food was delivered.

ACTIVE TAB:
- Shows all your current in-progress deliveries with the progress stage tracker.
- The Mark delivered button appears on delivery cards where status is picked_up.

PROFILE TAB:
- Shows your name, email, Volunteer badge, verified status.
- Also shows your availability time, transport option (Bicycle, Motorcycle, or Walking), and maximum carry capacity in kg.

ADMIN PANEL (/admin) - Full Guide:
Admin login: Email is admin@foodbridge.com and Password is Admin@123
The Admin Panel has 4 sidebar sections: Analytics, Users, Donations, and Requests.

ANALYTICS TAB (default view):
- Stats overview cards: Total users, Pending approvals count, Total donations, Completed deliveries.
- Pie chart showing Users by role: Donors, NGOs, and Volunteers.
- Bar chart showing the Donation pipeline with Pending, Accepted, Delivered, Cancelled, and Rejected counts.
- Line chart showing recent donation activity trend over time.
- Recent donations table at the bottom showing: Food name, Donor, Quantity, Status, and Date.

USERS TAB:
- Search bar to find users by name or email.
- Filter dropdowns: filter by Role (Donor, NGO, Volunteer) and by Status (Pending, Approved, Rejected).
- Users table shows: Name with profile photo, Role badge, Status badge, and Action buttons.
- TO APPROVE A USER: Find the user in the table and click the Approve button. Confirm in the popup dialog. The account becomes active immediately and the user can now log in.
- TO REJECT A USER: Click the Reject button next to the user. Confirm in the popup. The user cannot log in.
- Admins can also view uploaded documents: click View ID to see the user's identity document, and click View certificate to see the NGO certificate. Both open in a modal dialog.

DONATIONS TAB:
- A full table of all donations across the entire platform showing: Food name, Donor, Quantity, NGO assigned, Volunteer assigned, District, Status, and Date.

REQUESTS TAB:
- Reserved for future features like NGO verification queues and escalations. Currently shows a placeholder message.

MAP VIEW (/map):
- Accessible from any dashboard by clicking the Map link in the sidebar.
- Shows an interactive Leaflet.js map with all donation pickup location pins across the city.
- Helps NGOs and Volunteers visually see nearby donations and plan their routes.

DONATION STATUS LIFECYCLE:
Every donation goes through these statuses: pending then accepted then picked_up then delivered.
Alternative paths: pending can go to cancelled or rejected.
- pending: Donor submitted the donation, waiting for an NGO to accept it.
- accepted: An NGO has accepted the donation, waiting for a Volunteer to take the delivery task.
- picked_up: A Volunteer has picked up the food and is on the way to deliver it.
- delivered: The Volunteer marked the delivery as complete. Successfully delivered.
- cancelled: The Donor cancelled their donation.
- rejected: An NGO rejected the donation.

REAL-TIME NOTIFICATIONS powered by Socket.io:
- When an NGO accepts a donation, the Donor gets an instant real-time notification without page refresh.
- When a Volunteer accepts a delivery task, the NGO gets notified instantly in real-time.
- All status updates happen live across the platform.

RESPONSE STYLE:
- For every how-to question, use numbered steps. Do not skip or shorten steps.
- Mention the exact button names, tab names, section names, and field names from the platform.
- Give complete and accurate answers. Do not give vague or cut-off responses.
- Use emojis to make answers friendly and easy to read.
- Keep answers well-organized with clear structure.`

const QUICK_CHIPS = [
  { label: 'How to register?', q: 'How do I register on Food Bridge? Give me step by step.' },
  { label: 'How to login?', q: 'How do I login to Food Bridge? Explain the OTP process step by step.' },
  { label: 'How to donate food?', q: 'How does a Donor submit a food donation? Step by step.' },
  { label: 'NGO dashboard', q: 'How does the NGO dashboard work and how to accept a donation?' },
  { label: 'Volunteer guide', q: 'How does a Volunteer accept and complete a delivery task?' },
  { label: 'Admin panel', q: 'How does the Admin panel work and how to approve users?' },
];

export default function FoodBridgeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0, role: 'ai',
      text: "👋 Hi! I'm the **Food Bridge AI Assistant**.\n\nAsk me anything about Food Bridge — how to register, user roles, donations, login, and more! 🍽️"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const [showDot, setShowDot] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setShowDot(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const callGemini = async () => {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        // Only send last 6 turns to keep token count low on free tier
        contents: conversationHistory.slice(-6),
        generationConfig: { maxOutputTokens: 600, temperature: 0.6 }
      })
    });
    return res;
  };

  const sendMsg = async (text) => {
    const question = text || input.trim();
    if (!question || loading) return;
    setInput('');
    setShowChips(false);
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: question }]);
    setLoading(true);

    // Add user turn to history
    conversationHistory.push({ role: 'user', parts: [{ text: question }] });

    const MAX_RETRIES = 3;
    let lastStatus = 0;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Wait before retry attempts (not on first try)
        if (attempt > 1) {
          await new Promise(r => setTimeout(r, attempt * 2000));
        }

        const res = await callGemini();
        lastStatus = res.status;

        // 429 rate limit — retry silently
        if (res.status === 429 && attempt < MAX_RETRIES) continue;

        if (!res.ok) {
          const status = res.status;
          let errMsg = '⚠️ ';
          if (status === 429) errMsg += 'The AI is receiving too many requests right now. Please wait 10 seconds and try again.';
          else if (status === 400) errMsg += 'Could not process your question. Please try rephrasing it.';
          else if (status === 403) errMsg += 'API access denied. Please contact the Food Bridge admin.';
          else if (status >= 500) errMsg += 'The AI server is down momentarily. Please try again in a few seconds.';
          else errMsg += `Something went wrong (Error ${status}). Please try again.`;
          conversationHistory.pop();
          setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: errMsg }]);
          setLoading(false);
          return;
        }

        const data = await res.json();

        // Safety filter blocked the response
        if (!data?.candidates?.length) {
          const blockReason = data?.promptFeedback?.blockReason;
          conversationHistory.pop();
          setMessages(prev => [...prev, {
            id: Date.now() + 1, role: 'ai',
            text: blockReason
              ? '⚠️ Your message was flagged by content filters. Please rephrase your question about Food Bridge.'
              : '🤔 I could not generate a response for that. Please try rephrasing your question.'
          }]);
          setLoading(false);
          return;
        }

        const replyText = data.candidates[0]?.content?.parts?.[0]?.text || '';

        if (!replyText) {
          conversationHistory.pop();
          setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: 'I\'m here to help! Could you rephrase your question about Food Bridge? 😊' }]);
          setLoading(false);
          return;
        }

        // Success — save assistant reply to history
        conversationHistory.push({ role: 'model', parts: [{ text: replyText }] });

        // Keep history bounded to last 10 turns (5 exchanges)
        if (conversationHistory.length > 10) {
          conversationHistory = conversationHistory.slice(conversationHistory.length - 10);
        }

        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: replyText }]);
        setLoading(false);
        return;

      } catch (err) {
        if (attempt === MAX_RETRIES) {
          conversationHistory.pop();
          setMessages(prev => [...prev, {
            id: Date.now() + 1, role: 'ai',
            text: !navigator.onLine
              ? '📶 You appear to be offline. Please check your internet connection and try again.'
              : '⚠️ Could not reach the AI service. Please check your connection and try again.'
          }]);
        }
      }
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  };

  const formatText = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      <style>{`
        .fb-chat-wrap * { box-sizing: border-box; }

        /* ── Floating Button ── */
        .fb-float-btn {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 99999;
          width: 62px;
          height: 62px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #16a34a, #4ade80);
          font-size: 1.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(22,163,74,0.5);
          animation: fb-glow 2s infinite;
          transition: transform 0.2s;
        }
        .fb-float-btn:hover { transform: scale(1.1); }
        @keyframes fb-glow {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.6), 0 8px 24px rgba(22,163,74,0.4); }
          50%  { box-shadow: 0 0 0 14px rgba(74,222,128,0), 0 8px 24px rgba(22,163,74,0.6); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0), 0 8px 24px rgba(22,163,74,0.4); }
        }
        .fb-notif-dot {
          position: absolute;
          top: -2px; right: -2px;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #ef4444;
          color: #fff;
          font-size: 0.6rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          font-family: Inter, sans-serif;
        }

        /* ── Chat Panel ── */
        .fb-panel {
          position: fixed;
          bottom: 104px;
          right: 28px;
          z-index: 99998;
          width: 370px;
          height: 560px;
          min-width: 300px;
          min-height: 380px;
          max-width: calc(100vw - 40px);
          max-height: calc(100vh - 140px);
          background: rgba(8, 20, 15, 0.97);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 80px rgba(0,0,0,0.7);
          backdrop-filter: blur(20px);
          overflow: hidden;
          resize: both;
          transform-origin: bottom right;
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s;
          transform: scale(0);
          opacity: 0;
          pointer-events: none;
        }
        .fb-panel.open {
          transform: scale(1);
          opacity: 1;
          pointer-events: all;
        }

        /* ── Header ── */
        .fb-header {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.9rem 1.1rem;
          background: linear-gradient(135deg, rgba(22,163,74,0.18), rgba(74,222,128,0.06));
          border-bottom: 1px solid rgba(74,222,128,0.15);
          flex-shrink: 0;
        }
        .fb-hdr-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #16a34a, #4ade80);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.15rem;
          box-shadow: 0 0 12px rgba(74,222,128,0.35);
          flex-shrink: 0;
        }
        .fb-hdr-info { flex: 1; }
        .fb-hdr-name { font-weight: 700; font-size: 0.88rem; color: #4ade80; font-family: Inter, sans-serif; }
        .fb-hdr-status {
          font-size: 0.7rem; color: #86efac;
          display: flex; align-items: center; gap: 0.3rem;
          font-family: Inter, sans-serif;
        }
        .fb-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #4ade80;
          animation: fb-blink 2s infinite;
        }
        @keyframes fb-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .fb-close {
          background: rgba(255,255,255,0.07);
          border: none; cursor: pointer;
          color: rgba(255,255,255,0.5);
          width: 28px; height: 28px;
          border-radius: 7px;
          font-size: 0.95rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .fb-close:hover { background: rgba(239,68,68,0.2); color: #ef4444; }

        .fb-resize-hint {
          padding: 0.28rem;
          text-align: center;
          font-size: 0.65rem;
          color: rgba(74,222,128,0.35);
          background: rgba(74,222,128,0.02);
          border-bottom: 1px solid rgba(74,222,128,0.07);
          font-family: Inter, sans-serif;
          flex-shrink: 0;
          letter-spacing: 0.3px;
        }

        /* ── Messages ── */
        .fb-msgs {
          flex: 1;
          overflow-y: auto;
          padding: 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .fb-msgs::-webkit-scrollbar { width: 3px; }
        .fb-msgs::-webkit-scrollbar-thumb { background: rgba(74,222,128,0.2); border-radius: 2px; }

        .fb-bubble {
          max-width: 86%;
          padding: 0.7rem 0.95rem;
          font-size: 0.855rem;
          line-height: 1.6;
          border-radius: 14px;
          word-break: break-word;
          font-family: Inter, sans-serif;
          animation: fb-msg-in 0.2s ease;
        }
        @keyframes fb-msg-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
        .fb-bubble.ai {
          align-self: flex-start;
          background: rgba(22,163,74,0.1);
          border: 1px solid rgba(74,222,128,0.18);
          color: #d1fae5;
          border-radius: 4px 14px 14px 14px;
        }
        .fb-bubble.user {
          align-self: flex-end;
          background: linear-gradient(135deg, rgba(22,163,74,0.22), rgba(74,222,128,0.1));
          border: 1px solid rgba(74,222,128,0.28);
          color: #fff;
          border-radius: 14px 4px 14px 14px;
        }
        .fb-typing {
          display: flex; gap: 4px; align-items: center;
          padding: 0.8rem 1rem;
          align-self: flex-start;
        }
        .fb-typing span {
          width: 7px; height: 7px; border-radius: 50%;
          background: #4ade80;
          animation: fb-dot 1.2s infinite;
        }
        .fb-typing span:nth-child(2) { animation-delay: 0.2s; }
        .fb-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes fb-dot { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }

        /* ── Chips ── */
        .fb-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          padding: 0 0.9rem 0.5rem;
          flex-shrink: 0;
        }
        .fb-chip {
          padding: 0.28rem 0.7rem;
          background: rgba(74,222,128,0.07);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 20px;
          color: #86efac;
          font-size: 0.74rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: Inter, sans-serif;
        }
        .fb-chip:hover { background: rgba(74,222,128,0.18); color: #4ade80; }

        /* ── Input ── */
        .fb-input-row {
          padding: 0.8rem 0.9rem;
          border-top: 1px solid rgba(74,222,128,0.12);
          display: flex;
          gap: 0.45rem;
          align-items: flex-end;
          background: rgba(0,0,0,0.15);
          flex-shrink: 0;
        }
        .fb-textarea {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 11px;
          padding: 0.65rem 0.9rem;
          color: #fff;
          font-size: 0.86rem;
          outline: none;
          font-family: Inter, sans-serif;
          resize: none;
          min-height: 38px;
          max-height: 90px;
          line-height: 1.4;
          transition: border-color 0.2s;
        }
        .fb-textarea::placeholder { color: rgba(255,255,255,0.28); }
        .fb-textarea:focus { border-color: rgba(74,222,128,0.45); }
        .fb-send-btn {
          width: 40px; height: 40px;
          border-radius: 11px;
          background: linear-gradient(135deg, #16a34a, #4ade80);
          border: none; cursor: pointer;
          color: #fff; font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .fb-send-btn:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 0 14px rgba(74,222,128,0.4); }
        .fb-send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        @media (max-width: 480px) {
          .fb-panel { right: 10px; bottom: 90px; width: calc(100vw - 20px); }
          .fb-float-btn { right: 16px; bottom: 20px; }
        }
      `}</style>

      <div className="fb-chat-wrap">
        {/* Floating Button */}
        <button className="fb-float-btn" onClick={() => setIsOpen(o => !o)} title="Food Bridge AI Assistant">
          {isOpen ? '✕' : '🤖'}
          {!isOpen && showDot && <span className="fb-notif-dot">1</span>}
        </button>

        {/* Chat Panel */}
        <div className={`fb-panel${isOpen ? ' open' : ''}`}>
          {/* Header */}
          <div className="fb-header">
            <div className="fb-hdr-avatar">🍽️</div>
            <div className="fb-hdr-info">
              <div className="fb-hdr-name">Food Bridge AI</div>
              <div className="fb-hdr-status">
                <span className="fb-status-dot" />
                Online — Ask me anything!
              </div>
            </div>
            <button className="fb-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="fb-resize-hint">↙ Drag corner to resize</div>

          {/* Messages */}
          <div className="fb-msgs">
            {messages.map(m => (
              <div
                key={m.id}
                className={`fb-bubble ${m.role}`}
                dangerouslySetInnerHTML={{ __html: formatText(m.text) }}
              />
            ))}
            {loading && (
              <div className="fb-typing">
                <span /><span /><span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips */}
          {showChips && (
            <div className="fb-chips">
              {QUICK_CHIPS.map(c => (
                <span key={c.label} className="fb-chip" onClick={() => sendMsg(c.q)}>
                  {c.label}
                </span>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="fb-input-row">
            <textarea
              ref={inputRef}
              className="fb-textarea"
              placeholder="Ask about Food Bridge..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px';
              }}
            />
            <button
              className="fb-send-btn"
              onClick={() => sendMsg()}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
