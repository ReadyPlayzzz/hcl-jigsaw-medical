# CareSphere

CareSphere is a school health dashboard demo made with Next.js, React and TypeScript.

## Start the demo

1. Install Node.js on the computer.
2. Open a terminal in this folder.
3. Run `npm install` once.
4. Run `npm run dev`.
5. Open `http://localhost:3000` in a browser.

## How the demo works

- `src/app/page.tsx` contains the screen, sample students, search and pop-up messages.
- `src/app/globals.css` contains the colours, spacing and phone-friendly layout.
- `src/app/layout.tsx` contains the browser tab name and the shared page setup.
- The student list is a small array near the top of `page.tsx`. Search checks the student's name, class and health note.
- The buttons open simple pop-up messages. The search and health-alert tabs work with the sample list.

## Before using this at a school

This is only a front-end demonstration. It uses made-up student names and does not save information. Google sign-in, a protected database, school access rules, real emergency contacts and the AI helper have not been connected. Do not enter real student health information into this demo.

Google sign-in should only allow accounts approved by the school. The AI helper should share general information and help find care; it should never diagnose or tell students what medicine to take. In an emergency, follow the school's response plan and contact local emergency services.

## Easy way to explain the code

“The student details are stored in a short list. The search box checks that list and shows matching students. Buttons open small messages. The colours and layout are kept in a separate style file. Right now it is a safe demo with pretend information; the school login and private storage come later.”
